import { describe, it, expect } from 'vitest';
import type { Customer, Order, Transaction, WorkOrder } from '../../../src/types';
import {
  CASH_INFLOW_TX_TYPES,
  CASH_OUTFLOW_TX_TYPES,
  buildOrderScopeLookup,
  calculateCustomerAccountPosition,
  calculateCustomerPositionFromTransactions,
  classifyCustomerTransaction,
  computeAllCustomerPositions,
  computeWorkOrderFinancials,
  doesTxBelongToCustomer,
  doesTxMatchProjectOrWorkOrder,
  isCashRegisterMovement,
  listCustomerProjectWorkOrderScopes,
  splitSalePaymentWithAdvance,
} from '../../../src/utils/customerAdvanceAccounting';

const makeCustomer = (id: string, name: string): Customer => ({
  id,
  name,
  phone: '01700000000',
  email: `${id}@example.com`,
  address: 'Dhaka',
  createdAt: '2026-11-01T00:00:00.000Z',
});

describe('customerAdvanceAccounting', () => {
  it('models 100% customer advance -> vendor purchase -> final invoice settlement cleanly across every stage', () => {
    const rahim = makeCustomer('cust-rahim', 'Rahim Traders');
    const txs: Partial<Transaction>[] = [];

    // Stage 1: Customer deposits 100% advance (50,000 BDT) for a pre-ordered laptop
    txs.push({
      id: 'tx-adv-1',
      type: 'payment_received',
      entityId: rahim.id,
      entityName: rahim.name,
      entityType: 'customer',
      amount: 50000,
      paymentAccountId: 'acc-cash',
      paymentMethod: 'cash',
      category: 'Customer Advance',
      isAdvance: true,
      date: '2026-11-01',
    });

    const stage1 = calculateCustomerAccountPosition(txs, rahim);
    expect(stage1.dueBalance).toBe(0);
    expect(stage1.advanceBalance).toBe(50000);
    expect(stage1.netBalance).toBe(-50000);

    // Stage 1 Balance Sheet check: Cash (+50k) - Customer Advance Liability (50k) = 0 Equity
    const cashAfterStage1 = 50000;
    const summaryStage1 = computeAllCustomerPositions([rahim], txs);
    expect(summaryStage1.totalReceivables).toBe(0);
    expect(summaryStage1.totalCustomerAdvances).toBe(50000);
    expect(cashAfterStage1 + summaryStage1.totalReceivables - summaryStage1.totalCustomerAdvances).toBe(0);

    // Stage 2: Shop buys the laptop from a Vendor for 42,000 BDT using the advance cash
    txs.push(
      {
        id: 'tx-pur-1',
        type: 'purchase',
        entityId: 'vendor-star',
        entityName: 'Star Supplier',
        entityType: 'vendor',
        amount: 42000,
        date: '2026-11-02',
      },
      {
        id: 'tx-pay-1',
        type: 'payment_made',
        entityId: 'vendor-star',
        entityName: 'Star Supplier',
        entityType: 'vendor',
        amount: 42000,
        paymentAccountId: 'acc-cash',
        paymentMethod: 'cash',
        date: '2026-11-02',
      }
    );

    // Vendor transactions must never pollute Rahim's customer position
    const stage2 = calculateCustomerAccountPosition(txs, rahim);
    expect(stage2.dueBalance).toBe(0);
    expect(stage2.advanceBalance).toBe(50000);

    // Stage 3: Final Sale Invoice for 50,000 BDT settled 100% by Customer Advance (cashPaidNow = 0)
    const split = splitSalePaymentWithAdvance({
      netTotal: 50000,
      previousDue: stage2.dueBalance,
      availableAdvance: stage2.advanceBalance,
      applyAdvance: true,
      cashPaidNow: 0,
    });

    expect(split.advanceApplied).toBe(50000);
    expect(split.cashPaidNow).toBe(0);
    expect(split.totalPaidOnInvoice).toBe(50000);
    expect(split.invoiceDueAfterSettlement).toBe(0);
    expect(split.remainingAdvanceAfterSale).toBe(0);
    expect(split.netCustomerDueAfterSale).toBe(0);
    expect(split.paymentStatus).toBe('paid');

    // Only write the 'sale' accrual debit row (NO duplicate payment_received row!)
    txs.push({
      id: 'tx-sale-1',
      type: 'sale',
      entityId: rahim.id,
      entityName: rahim.name,
      entityType: 'customer',
      amount: 50000,
      advanceApplied: split.advanceApplied,
      cashPaidAmount: split.cashPaidNow,
      date: '2026-11-03',
    });

    const stage3 = calculateCustomerAccountPosition(txs, rahim);
    expect(stage3.dueBalance).toBe(0);
    expect(stage3.advanceBalance).toBe(0);
    expect(stage3.netBalance).toBe(0);

    // Cash = 50,000 - 42,000 = +8,000 (exact profit), Receivables = 0, Advances = 0
    const cashAfterStage3 = txs
      .filter(tx => tx.paymentAccountId === 'acc-cash')
      .reduce((acc, tx) => {
        if ((CASH_INFLOW_TX_TYPES as readonly string[]).includes(String(tx.type))) return acc + Number(tx.amount || 0);
        if ((CASH_OUTFLOW_TX_TYPES as readonly string[]).includes(String(tx.type))) return acc - Number(tx.amount || 0);
        return acc;
      }, 0);
    expect(cashAfterStage3).toBe(8000);
  });

  it('handles partial advance + additional cash payment at invoice delivery', () => {
    const karim = makeCustomer('cust-karim', 'Karim Enterprise');
    const txs: Partial<Transaction>[] = [
      {
        id: 'tx-adv-k1',
        type: 'payment_received',
        entityId: karim.id,
        entityName: karim.name,
        entityType: 'customer',
        amount: 20000,
        paymentAccountId: 'acc-bkash',
        paymentMethod: 'bkash',
        isAdvance: true,
        category: 'Customer Advance',
      },
    ];

    const posBeforeSale = calculateCustomerAccountPosition(txs, karim);
    expect(posBeforeSale.advanceBalance).toBe(20000);

    // Invoice is 50,000 -> 20,000 from advance, remaining 30,000 collected in cash
    const split = splitSalePaymentWithAdvance({
      netTotal: 50000,
      previousDue: posBeforeSale.dueBalance,
      availableAdvance: posBeforeSale.advanceBalance,
      applyAdvance: true,
      cashPaidNow: 30000,
    });

    expect(split.advanceApplied).toBe(20000);
    expect(split.cashPaidNow).toBe(30000);
    expect(split.totalPaidOnInvoice).toBe(50000);
    expect(split.invoiceDueAfterSettlement).toBe(0);
    expect(split.paymentStatus).toBe('paid');

    // Only cashPaidNow (30,000) is emitted as a new payment_received
    txs.push(
      {
        id: 'tx-sale-k1',
        type: 'sale',
        entityId: karim.id,
        entityName: karim.name,
        entityType: 'customer',
        amount: 50000,
      },
      {
        id: 'tx-pay-k1',
        type: 'payment_received',
        entityId: karim.id,
        entityName: karim.name,
        entityType: 'customer',
        amount: 30000,
        paymentAccountId: 'acc-cash',
        paymentMethod: 'cash',
      }
    );

    const posAfterFullPay = calculateCustomerAccountPosition(txs, karim);
    expect(posAfterFullPay.dueBalance).toBe(0);
    expect(posAfterFullPay.advanceBalance).toBe(0);

    // What if customer paid only 10,000 cash instead of 30,000?
    const partialSplit = splitSalePaymentWithAdvance({
      netTotal: 50000,
      previousDue: 0,
      availableAdvance: 20000,
      applyAdvance: true,
      cashPaidNow: 10000,
    });
    expect(partialSplit.paymentStatus).toBe('partial');
    expect(partialSplit.invoiceDueAfterSettlement).toBe(20000);
    expect(partialSplit.netCustomerDueAfterSale).toBe(20000);
  });

  it('deducts sequentially across multiple invoices when advance exceeds one invoice', () => {
    const salma = makeCustomer('cust-salma', 'Salma Corp');
    const txs: Partial<Transaction>[] = [
      {
        id: 'tx-adv-s1',
        type: 'payment_received',
        entityId: salma.id,
        entityName: salma.name,
        entityType: 'customer',
        amount: 80000,
        paymentAccountId: 'acc-bank',
        paymentMethod: 'bank',
        isAdvance: true,
      },
    ];

    // Invoice 1: 30,000 BDT
    const inv1 = splitSalePaymentWithAdvance({
      netTotal: 30000,
      previousDue: 0,
      availableAdvance: calculateCustomerAccountPosition(txs, salma).advanceBalance,
      applyAdvance: true,
      cashPaidNow: 0,
    });
    expect(inv1.advanceApplied).toBe(30000);
    expect(inv1.remainingAdvanceAfterSale).toBe(50000);
    expect(inv1.paymentStatus).toBe('paid');

    txs.push({
      id: 'tx-sale-s1',
      type: 'sale',
      entityId: salma.id,
      entityName: salma.name,
      entityType: 'customer',
      amount: 30000,
    });

    expect(calculateCustomerAccountPosition(txs, salma).advanceBalance).toBe(50000);

    // Invoice 2: 65,000 BDT -> consumes remaining 50,000 advance, leaves 15,000 unpaid/due
    const inv2 = splitSalePaymentWithAdvance({
      netTotal: 65000,
      previousDue: 0,
      availableAdvance: calculateCustomerAccountPosition(txs, salma).advanceBalance,
      applyAdvance: true,
      cashPaidNow: 0,
    });
    expect(inv2.advanceApplied).toBe(50000);
    expect(inv2.remainingAdvanceAfterSale).toBe(0);
    expect(inv2.invoiceDueAfterSettlement).toBe(15000);
    expect(inv2.netCustomerDueAfterSale).toBe(15000);
    expect(inv2.paymentStatus).toBe('partial');

    txs.push({
      id: 'tx-sale-s2',
      type: 'sale',
      entityId: salma.id,
      entityName: salma.name,
      entityType: 'customer',
      amount: 65000,
    });

    const finalPos = calculateCustomerAccountPosition(txs, salma);
    expect(finalPos.advanceBalance).toBe(0);
    expect(finalPos.dueBalance).toBe(15000);
  });

  it('processes customer advance refunds cleanly and includes advance_refund in outflows', () => {
    const nadia = makeCustomer('cust-nadia', 'Nadia Studio');
    const txs: Partial<Transaction>[] = [
      {
        id: 'tx-adv-n1',
        type: 'payment_received',
        entityId: nadia.id,
        entityName: nadia.name,
        entityType: 'customer',
        amount: 25000,
        paymentAccountId: 'acc-cash',
        paymentMethod: 'cash',
        isAdvance: true,
        category: 'Customer Advance',
      },
      {
        id: 'tx-ref-n1',
        type: 'advance_refund',
        entityId: nadia.id,
        entityName: nadia.name,
        entityType: 'customer',
        amount: 10000,
        paymentAccountId: 'acc-cash',
        paymentMethod: 'cash',
        category: 'Customer Advance Refund',
      },
    ];

    expect(classifyCustomerTransaction({ type: 'advance_refund' })).toEqual({ isDebit: true, isCredit: false });
    expect((CASH_OUTFLOW_TX_TYPES as readonly string[]).includes('advance_refund')).toBe(true);

    const pos = calculateCustomerAccountPosition(txs, nadia);
    expect(pos.advanceBalance).toBe(15000);
    expect(pos.dueBalance).toBe(0);

    // Refunding the remaining 15,000 zeros out customer advance balance completely
    txs.push({
      id: 'tx-ref-n2',
      type: 'advance_refund',
      entityId: nadia.id,
      entityName: nadia.name,
      entityType: 'customer',
      amount: 15000,
      paymentAccountId: 'acc-cash',
      paymentMethod: 'cash',
    });

    const cleared = calculateCustomerAccountPosition(txs, nadia);
    expect(cleared.advanceBalance).toBe(0);
    expect(cleared.dueBalance).toBe(0);
    expect(cleared.netBalance).toBe(0);
  });

  it('respects excludeFn when editing an invoice, manual advance cap, and sale_return paymentMethod rules', () => {
    const editedTxs: Partial<Transaction>[] = [
      { id: 'adv-1', type: 'payment_received', entityId: 'c1', amount: 12000 },
      { id: 'sale-edit', type: 'sale', entityId: 'c1', amount: 10000, referenceId: 'ORD-1' },
    ];

    const excludedPos = calculateCustomerPositionFromTransactions(editedTxs, {
      excludeFn: tx => tx.id === 'sale-edit' || tx.referenceId === 'ORD-1',
    });
    expect(excludedPos.advanceBalance).toBe(12000);

    // Partial manual request smaller than available advance
    const cappedSplit = splitSalePaymentWithAdvance({
      netTotal: 10000,
      previousDue: 0,
      availableAdvance: 12000,
      applyAdvance: true,
      requestedAdvanceAmount: 4000,
      cashPaidNow: 6000,
    });
    expect(cappedSplit.advanceApplied).toBe(4000);
    expect(cappedSplit.remainingAdvanceAfterSale).toBe(8000);
    expect(cappedSplit.paymentStatus).toBe('paid');

    // Disabled advance application
    const skippedSplit = splitSalePaymentWithAdvance({
      netTotal: 10000,
      previousDue: 0,
      availableAdvance: 12000,
      applyAdvance: false,
      cashPaidNow: 10000,
    });
    expect(skippedSplit.advanceApplied).toBe(0);
    expect(skippedSplit.remainingAdvanceAfterSale).toBe(12000);

    // Sale return only creates credit when store_credit / credit / advance / blank, not immediate cash refund
    expect(classifyCustomerTransaction({ type: 'sale_return', paymentMethod: 'store_credit' }).isCredit).toBe(true);
    expect(classifyCustomerTransaction({ type: 'sale_return', paymentMethod: 'cash' }).isCredit).toBe(false);
  });

  it('matches customer identities strictly and classifies DayBook cash register movements accurately', () => {
    const alice = makeCustomer('cust-alice', 'Alice Tech');
    expect(doesTxBelongToCustomer({ entityId: 'cust-alice', entityType: 'customer' }, alice)).toBe(true);
    expect(doesTxBelongToCustomer({ entityId: 'cust-alice', entityType: 'vendor' }, alice)).toBe(false);
    expect(doesTxBelongToCustomer({ entityName: ' alice tech ' }, alice)).toBe(true);
    expect(doesTxBelongToCustomer({ entityId: 'cust-other', entityName: 'Alice Tech' }, alice)).toBe(false);

    // Accrual-only blank-account entries must NEVER enter physical cash drawer
    expect(isCashRegisterMovement({ type: 'sale', amount: 50000 })).toBe(false);
    expect(isCashRegisterMovement({ type: 'purchase', amount: 42000 })).toBe(false);
    expect(isCashRegisterMovement({ type: 'opening_balance', amount: 1000 })).toBe(false);

    // Explicit cash movements enter physical cash drawer
    expect(isCashRegisterMovement({ type: 'payment_received', paymentMethod: 'cash', amount: 50000 })).toBe(true);
    expect(isCashRegisterMovement({ type: 'advance_refund', paymentMethod: 'cash', amount: 5000 })).toBe(true);
    expect(isCashRegisterMovement({ type: 'expense', amount: 250 })).toBe(true);

    // Non-cash bank/bKash movements stay out of physical cash drawer
    expect(isCashRegisterMovement({ type: 'payment_received', paymentMethod: 'bkash', paymentAccountId: 'acc-bkash', amount: 50000 })).toBe(false);
  });

  it('isolates advances and dues strictly per Work Order and Project for the same customer', () => {
    const corp: Customer = {
      ...makeCustomer('cust-spacezero', 'SpaceZero'),
      branchName: 'Project Alpha',
      branches: ['Project Alpha', 'Project Beta'],
    };

    const legacyOrders: Partial<Order>[] = [
      {
        id: 'ord-wo2-1',
        documentNumber: 'INV-WO2-001',
        customerId: corp.id,
        customerName: corp.name,
        workOrderNumber: 'WO-2026-002',
        projectName: 'Project Alpha',
        branchName: 'Project Alpha',
        total: 25000,
        status: 'delivered',
        type: 'invoice',
      },
      {
        id: 'ord-beta-1',
        documentNumber: 'INV-BETA-001',
        customerId: corp.id,
        customerName: corp.name,
        projectName: 'Project Beta',
        branchName: 'Project Beta',
        total: 15000,
        status: 'delivered',
        type: 'invoice',
      },
    ];

    const txs: Partial<Transaction>[] = [
      // WO-2026-001 under Project Alpha: 50,000 unused advance
      {
        id: 'tx-wo1-adv',
        type: 'payment_received',
        entityId: corp.id,
        entityName: corp.name,
        entityType: 'customer',
        amount: 50000,
        isAdvance: true,
        category: 'Customer Advance',
        workOrderNumber: 'WO-2026-001',
        projectName: 'Project Alpha',
        branchName: 'Project Alpha',
        paymentAccountId: 'acc-bank',
        date: '2026-11-01',
      },
      // WO-2026-002 under Project Alpha: 20,000 advance - 25,000 invoice = 5,000 due
      {
        id: 'tx-wo2-adv',
        type: 'payment_received',
        entityId: corp.id,
        entityName: corp.name,
        entityType: 'customer',
        amount: 20000,
        isAdvance: true,
        category: 'Customer Advance',
        workOrderNumber: 'WO-2026-002',
        projectName: 'Project Alpha',
        branchName: 'Project Alpha',
        paymentAccountId: 'acc-bank',
        date: '2026-11-02',
      },
      // Legacy sale tx without workOrderNumber/branchName directly on tx, resolved via Order lookup
      {
        id: 'tx-wo2-sale',
        type: 'sale',
        entityId: corp.id,
        entityName: corp.name,
        entityType: 'customer',
        referenceId: 'ord-wo2-1',
        documentNumber: 'INV-WO2-001',
        amount: 25000,
        date: '2026-11-03',
      },
      // Project Beta: 15,000 due (unpaid)
      {
        id: 'tx-beta-sale',
        type: 'sale',
        entityId: corp.id,
        entityName: corp.name,
        entityType: 'customer',
        referenceId: 'ord-beta-1',
        documentNumber: 'INV-BETA-001',
        amount: 15000,
        date: '2026-11-04',
      },
    ];

    // Strict WO-1 isolation (no bleed from WO-2 under the same Project Alpha, nor Project Beta)
    const wo1Pos = calculateCustomerAccountPosition(txs, corp, {
      scope: { workOrderNumber: 'WO-2026-001', projectName: 'Project Alpha' },
      orders: legacyOrders,
    });
    expect(wo1Pos.advanceBalance).toBe(50000);
    expect(wo1Pos.dueBalance).toBe(0);

    // Strict WO-2 isolation: 20k credit - 25k sale = 5k due
    const wo2Pos = calculateCustomerAccountPosition(txs, corp, {
      scope: { workOrderNumber: 'WO-2026-002', projectName: 'Project Alpha' },
      orders: legacyOrders,
    });
    expect(wo2Pos.dueBalance).toBe(5000);
    expect(wo2Pos.advanceBalance).toBe(0);

    // Project Alpha aggregate (50k + 20k - 25k = 45k advance), still isolated from Project Beta (-15k)
    const projAlphaPos = calculateCustomerAccountPosition(txs, corp, {
      scope: { projectName: 'Project Alpha' },
      orders: legacyOrders,
    });
    expect(projAlphaPos.advanceBalance).toBe(45000);
    expect(projAlphaPos.dueBalance).toBe(0);

    const projBetaPos = calculateCustomerAccountPosition(txs, corp, {
      scope: { projectName: 'Project Beta' },
      orders: legacyOrders,
    });
    expect(projBetaPos.dueBalance).toBe(15000);
    expect(projBetaPos.advanceBalance).toBe(0);

    // Order scope lookup helper directly validates strict non-bleed
    const lookup = buildOrderScopeLookup(legacyOrders);
    expect(doesTxMatchProjectOrWorkOrder(txs[2], { workOrderNumber: 'WO-2026-002' }, lookup)).toBe(true);
    expect(doesTxMatchProjectOrWorkOrder(txs[2], { workOrderNumber: 'WO-2026-001' }, lookup)).toBe(false);

    // Scope listing helper returns all customer scopes with individual balances
    const wos: Partial<WorkOrder>[] = [
      { id: 'wo1', orderNumber: 'WO-2026-001', clientName: 'SpaceZero', branchName: 'Project Alpha' },
      { id: 'wo2', orderNumber: 'WO-2026-002', clientName: 'SpaceZero', branchName: 'Project Alpha' },
    ];
    const scopeList = listCustomerProjectWorkOrderScopes(corp, txs, legacyOrders, wos);
    expect(scopeList.find(s => s.workOrderNumber === 'WO-2026-001')?.advanceBalance).toBe(50000);
    expect(scopeList.find(s => s.workOrderNumber === 'WO-2026-002')?.dueBalance).toBe(5000);
    expect(scopeList.find(s => s.projectName === 'Project Beta' && !s.workOrderNumber)?.dueBalance).toBe(15000);
  });

  it('reconciles end-to-end Work Order financials: advance -> purchase -> sale -> profit & cash flow', () => {
    const orders: Partial<Order>[] = [
      {
        id: 'ord-wo1-sale',
        documentNumber: 'INV-101',
        workOrderNumber: 'WO-2026-001',
        branchName: 'Mirpur Office Setup',
        total: 100000,
        advanceApplied: 100000,
        paidAmount: 100000,
        status: 'delivered',
        type: 'invoice',
      } as any,
      {
        id: 'ord-other',
        documentNumber: 'INV-999',
        workOrderNumber: 'WO-OTHER',
        total: 40000,
        status: 'delivered',
        type: 'invoice',
      },
    ];

    const purchases = [
      {
        id: 'pur-wo1',
        documentNumber: 'PUR-01',
        workOrderNumber: 'WO-2026-001',
        projectName: 'Mirpur Office Setup',
        total: 72000,
        paidAmount: 50000,
      },
      {
        id: 'pur-other',
        documentNumber: 'PUR-02',
        workOrderNumber: 'WO-OTHER',
        total: 30000,
        paidAmount: 30000,
      },
    ];

    const txs: Partial<Transaction>[] = [
      // 1. 100,000 advance received into Bank for WO-2026-001
      {
        id: 'tx-1',
        type: 'payment_received',
        entityId: 'cust-1',
        entityType: 'customer',
        amount: 100000,
        isAdvance: true,
        category: 'Customer Advance',
        workOrderNumber: 'WO-2026-001',
        projectName: 'Mirpur Office Setup',
        paymentAccountId: 'acc-bank',
      },
      // 2. Vendor purchase bill (72,000 accrual) + partial payment (50,000 cash out) for WO-2026-001
      {
        id: 'tx-2',
        type: 'purchase',
        entityId: 'ven-1',
        entityType: 'vendor',
        amount: 72000,
        workOrderNumber: 'WO-2026-001',
        projectName: 'Mirpur Office Setup',
      },
      {
        id: 'tx-3',
        type: 'payment_made',
        entityId: 'ven-1',
        entityType: 'vendor',
        amount: 50000,
        workOrderNumber: 'WO-2026-001',
        projectName: 'Mirpur Office Setup',
        paymentAccountId: 'acc-bank',
      },
      // 3. Final Sale Invoice (100,000) settled completely from Customer Advance (0 new cash)
      {
        id: 'tx-4',
        type: 'sale',
        entityId: 'cust-1',
        entityType: 'customer',
        referenceId: 'ord-wo1-sale',
        documentNumber: 'INV-101',
        workOrderNumber: 'WO-2026-001',
        projectName: 'Mirpur Office Setup',
        amount: 100000,
        advanceApplied: 100000,
      },
      // Noise from WO-OTHER that must be completely excluded
      {
        id: 'tx-noise',
        type: 'payment_received',
        entityId: 'cust-1',
        entityType: 'customer',
        amount: 40000,
        isAdvance: true,
        workOrderNumber: 'WO-OTHER',
        paymentAccountId: 'acc-bank',
      },
    ];

    const summary = computeWorkOrderFinancials({
      workOrderNumber: 'WO-2026-001',
      transactions: txs,
      orders,
      purchases,
    });

    expect(summary.advancesReceived).toBe(100000);
    expect(summary.advancesRefunded).toBe(0);
    expect(summary.netAdvanceDeposits).toBe(100000);
    expect(summary.advanceAppliedOnSales).toBe(100000);
    expect(summary.remainingCustomerAdvance).toBe(0);
    expect(summary.customerDue).toBe(0);
    expect(summary.totalPurchasesCost).toBe(72000);
    expect(summary.totalVendorPaid).toBe(50000);
    expect(summary.totalVendorPayable).toBe(22000);
    expect(summary.totalSalesInvoiced).toBe(100000);
    expect(summary.totalCashCollectedOnSales).toBe(0);
    expect(summary.grossProfit).toBe(28000);
    expect(summary.netCashFlow).toBe(50000); // +100k advance in - 50k vendor paid out
  });
});
