import { Customer, Order, Transaction, TransactionType, WorkOrder } from '../types';

export const CASH_INFLOW_TX_TYPES: readonly TransactionType[] = [
  'sale',
  'payment_received',
  'money_receipt',
  'income',
  'purchase_return',
  'deposit',
  'transfer_in',
];

export const CASH_OUTFLOW_TX_TYPES: readonly TransactionType[] = [
  'purchase',
  'payment_made',
  'expense',
  'salary',
  'advance_salary',
  'conveyance',
  'sale_return',
  'advance_refund',
  'withdrawal',
  'transfer_out',
];

export const ACCRUAL_ONLY_TX_TYPES: readonly TransactionType[] = [
  'sale',
  'purchase',
  'opening_balance',
  'sale_return',
  'purchase_return',
];

export interface ProjectWorkOrderScope {
  workOrderNumber?: string;
  projectName?: string;
}

export interface CustomerAccountPosition {
  totalDebits: number;
  totalCredits: number;
  /** totalDebits - totalCredits. Positive = Customer Due (Receivable), Negative = Customer Advance (Liability). */
  netBalance: number;
  /** Accounts Receivable asset portion: Math.max(0, netBalance) */
  dueBalance: number;
  /** Customer Advance Credit liability portion: Math.max(0, -netBalance) */
  advanceBalance: number;
}

export interface CalculateCustomerPositionOptions {
  excludeFn?: (tx: Partial<Transaction> | any) => boolean;
  scope?: ProjectWorkOrderScope;
  orders?: Partial<Order>[];
}

const normalizeTag = (val: unknown): string => String(val || '').trim().toLowerCase();

export const hasActiveProjectOrWorkOrderScope = (
  scope?: ProjectWorkOrderScope | null
): boolean => {
  return Boolean(normalizeTag(scope?.workOrderNumber) || normalizeTag(scope?.projectName));
};

/**
 * Matches a transaction strictly against a Work Order # and/or Project / Branch name.
 * When `workOrderNumber` is provided, transactions carrying a DIFFERENT `workOrderNumber`
 * never bleed in even if they share the same `projectName`.
 */
export function doesTxMatchProjectOrWorkOrder(
  tx: Partial<Transaction> | any,
  scope?: ProjectWorkOrderScope | null,
  orderScopeLookup?: Map<string, { workOrderNumber: string; projectName: string }>
): boolean {
  const targetWO = normalizeTag(scope?.workOrderNumber);
  const targetProj = normalizeTag(scope?.projectName);

  if (!targetWO && !targetProj) return true;
  if (!tx) return false;

  const refOrder =
    (tx.referenceId && orderScopeLookup?.get(String(tx.referenceId))) ||
    (tx.documentNumber && orderScopeLookup?.get(String(tx.documentNumber)));

  const txWO = normalizeTag(tx.workOrderNumber || refOrder?.workOrderNumber);
  const txProj = normalizeTag(tx.projectName || tx.branchName || refOrder?.projectName);

  if (targetWO && targetProj) {
    if (txWO) return txWO === targetWO;
    if (txProj) return txProj === targetProj;
    const desc = normalizeTag(tx.description);
    return desc.includes(targetWO);
  }

  if (targetWO) {
    if (txWO) return txWO === targetWO;
    const desc = normalizeTag(tx.description);
    return desc.includes(targetWO);
  }

  if (targetProj) {
    if (txProj) return txProj === targetProj;
    const desc = normalizeTag(tx.description);
    return desc.includes(targetProj);
  }

  return false;
}

export function buildOrderScopeLookup(
  orders?: Partial<Order>[] | null
): Map<string, { workOrderNumber: string; projectName: string }> {
  const map = new Map<string, { workOrderNumber: string; projectName: string }>();
  for (const o of orders || []) {
    if (!o) continue;
    const wo = String(o.workOrderNumber || '').trim();
    const proj = String(o.projectName || o.branchName || '').trim();
    if (!wo && !proj) continue;
    const entry = { workOrderNumber: wo, projectName: proj };
    if (o.id) map.set(String(o.id), entry);
    if (o.documentNumber) map.set(String(o.documentNumber), entry);
    if (o.invoiceNumber) map.set(String(o.invoiceNumber), entry);
  }
  return map;
}

/**
 * Matches a transaction to a customer record safely without pulling in vendor transactions.
 */
export function doesTxBelongToCustomer(
  tx: Partial<Transaction> | any,
  customer: Pick<Customer, 'id' | 'name'>
): boolean {
  if (!tx || !customer) return false;
  if (tx.entityType && tx.entityType !== 'customer') return false;
  if (tx.entityId) {
    return tx.entityId === customer.id;
  }
  const txName = normalizeTag(tx.entityName);
  const custName = normalizeTag(customer.name);
  return Boolean(txName && custName && txName === custName);
}

/**
 * Returns whether a single customer-scoped transaction increases customer receivable (debit)
 * or increases customer credit/advance (credit).
 */
export function classifyCustomerTransaction(tx: Partial<Transaction> | any): {
  isDebit: boolean;
  isCredit: boolean;
} {
  if (!tx) return { isDebit: false, isCredit: false };
  const type = String(tx.type || '');

  if (type === 'sale' || type === 'opening_balance' || type === 'advance_refund') {
    return { isDebit: true, isCredit: false };
  }

  if (type === 'payment_received' || type === 'money_receipt') {
    return { isDebit: false, isCredit: true };
  }

  if (type === 'deposit' && tx.entityType === 'customer' && tx.isAdvance) {
    return { isDebit: false, isCredit: true };
  }

  if (type === 'sale_return' || type === 'return') {
    const pm = normalizeTag(tx.paymentMethod);
    // Cash/bank/mfs immediate refund does not add store credit; store_credit/credit/blank adds credit.
    const addsCredit = !pm || pm === 'store_credit' || pm === 'credit' || pm === 'advance';
    return { isDebit: false, isCredit: addsCredit };
  }

  return { isDebit: false, isCredit: false };
}

/**
 * Computes debits, credits, net balance, receivable due, and advance credit from a set of transactions.
 */
export function calculateCustomerPositionFromTransactions(
  customerTransactions: (Partial<Transaction> | any)[],
  options?: CalculateCustomerPositionOptions
): CustomerAccountPosition {
  let totalDebits = 0;
  let totalCredits = 0;

  const hasScope = hasActiveProjectOrWorkOrderScope(options?.scope);
  const lookup = hasScope ? buildOrderScopeLookup(options?.orders) : undefined;

  for (const tx of customerTransactions || []) {
    if (!tx) continue;
    if (options?.excludeFn && options.excludeFn(tx)) continue;
    if (hasScope && !doesTxMatchProjectOrWorkOrder(tx, options?.scope, lookup)) continue;

    const amount = Number(tx.amount) || 0;
    if (amount <= 0) continue;

    const { isDebit, isCredit } = classifyCustomerTransaction(tx);
    if (isDebit) totalDebits += amount;
    if (isCredit) totalCredits += amount;
  }

  const netBalance = totalDebits - totalCredits;
  return {
    totalDebits,
    totalCredits,
    netBalance,
    dueBalance: netBalance > 0.005 ? netBalance : 0,
    advanceBalance: netBalance < -0.005 ? Math.abs(netBalance) : 0,
  };
}

/**
 * Computes a specific customer's live ledger position (due vs advance) across all transactions
 * or scoped strictly to a specific Work Order # and/or Project / Branch name.
 */
export function calculateCustomerAccountPosition(
  transactions: (Partial<Transaction> | any)[] | undefined | null,
  customer: Pick<Customer, 'id' | 'name'> | string | null | undefined,
  options?: CalculateCustomerPositionOptions
): CustomerAccountPosition {
  if (!transactions || !customer) {
    return { totalDebits: 0, totalCredits: 0, netBalance: 0, dueBalance: 0, advanceBalance: 0 };
  }

  const targetCustomer = typeof customer === 'string' ? { id: customer, name: '' } : customer;
  if (!targetCustomer.id && !targetCustomer.name) {
    return { totalDebits: 0, totalCredits: 0, netBalance: 0, dueBalance: 0, advanceBalance: 0 };
  }

  const matched = transactions.filter(tx => {
    if (typeof customer === 'string') {
      return tx?.entityId === customer && (!tx?.entityType || tx.entityType === 'customer');
    }
    return doesTxBelongToCustomer(tx, targetCustomer);
  });

  return calculateCustomerPositionFromTransactions(matched, options);
}

export interface CustomerSummaryPosition extends CustomerAccountPosition {
  customer: Customer;
}

/**
 * Computes aggregate customer receivables (assets) and customer advances (current liabilities)
 * cleanly for AccountBalance, BalanceSheet, and TrialBalance without flattening negative balances to 0.
 */
export function computeAllCustomerPositions(
  customers: Customer[],
  transactions: (Partial<Transaction> | any)[]
): {
  positions: CustomerSummaryPosition[];
  withDue: CustomerSummaryPosition[];
  withAdvance: CustomerSummaryPosition[];
  totalReceivables: number;
  totalCustomerAdvances: number;
} {
  const positions: CustomerSummaryPosition[] = (customers || []).map(c => ({
    customer: c,
    ...calculateCustomerAccountPosition(transactions, c),
  }));

  const withDue = positions.filter(p => p.dueBalance > 0.01);
  const withAdvance = positions.filter(p => p.advanceBalance > 0.01);

  return {
    positions,
    withDue,
    withAdvance,
    totalReceivables: withDue.reduce((sum, p) => sum + p.dueBalance, 0),
    totalCustomerAdvances: withAdvance.reduce((sum, p) => sum + p.advanceBalance, 0),
  };
}

export interface CustomerScopeSummary extends CustomerAccountPosition {
  key: string;
  workOrderNumber?: string;
  projectName?: string;
  label: string;
}

/**
 * Lists every Project / Work Order scope associated with a customer and its individual live Due / Advance balance.
 */
export function listCustomerProjectWorkOrderScopes(
  customer: Pick<Customer, 'id' | 'name' | 'branchName' | 'branches'> | null | undefined,
  transactions: (Partial<Transaction> | any)[],
  orders: Partial<Order>[] = [],
  workOrders: Partial<WorkOrder>[] = []
): CustomerScopeSummary[] {
  if (!customer) return [];

  const scopeMap = new Map<string, { workOrderNumber?: string; projectName?: string }>();
  const addScope = (wo?: string, proj?: string) => {
    const cleanWO = String(wo || '').trim();
    const cleanProj = String(proj || '').trim();
    if (!cleanWO && !cleanProj) return;
    const key = cleanWO ? `wo:${cleanWO.toLowerCase()}` : `proj:${cleanProj.toLowerCase()}`;
    const prev = scopeMap.get(key);
    scopeMap.set(key, {
      workOrderNumber: cleanWO || prev?.workOrderNumber,
      projectName: cleanProj || prev?.projectName,
    });
  };

  if (customer.branchName) addScope(undefined, customer.branchName);
  (customer.branches || []).forEach(b => addScope(undefined, b));

  const custNameLow = normalizeTag(customer.name);
  orders.forEach(o => {
    if (
      o.customerId === customer.id ||
      (custNameLow && normalizeTag(o.customerName) === custNameLow)
    ) {
      addScope(o.workOrderNumber, o.projectName || o.branchName);
    }
  });

  transactions.forEach(tx => {
    if (doesTxBelongToCustomer(tx, customer)) {
      addScope(tx.workOrderNumber, tx.projectName || tx.branchName);
    }
  });

  workOrders.forEach(wo => {
    if (custNameLow && normalizeTag(wo.clientName) === custNameLow) {
      addScope(wo.orderNumber, wo.branchName);
    }
  });

  const results: CustomerScopeSummary[] = [];
  for (const [key, sc] of scopeMap.entries()) {
    const pos = calculateCustomerAccountPosition(transactions, customer, { scope: sc, orders });
    const label = sc.workOrderNumber && sc.projectName
      ? `${sc.workOrderNumber} (${sc.projectName})`
      : sc.workOrderNumber || sc.projectName || key;
    results.push({
      key,
      workOrderNumber: sc.workOrderNumber,
      projectName: sc.projectName,
      label,
      ...pos,
    });
  }

  return results.sort((a, b) => (b.advanceBalance + b.dueBalance) - (a.advanceBalance + a.dueBalance));
}

export interface WorkOrderFinancialSummary {
  advancesReceived: number;
  advancesRefunded: number;
  netAdvanceDeposits: number;
  advanceAppliedOnSales: number;
  remainingCustomerAdvance: number;
  customerDue: number;
  totalPurchasesCost: number;
  totalVendorPaid: number;
  totalVendorPayable: number;
  totalSalesInvoiced: number;
  totalCashCollectedOnSales: number;
  grossProfit: number;
  netCashFlow: number;
}

/**
 * Computes end-to-end financial reconciliation for a single Work Order and/or Project:
 * Customer Advances Received -> Vendor Purchases Cost -> Final Invoiced Sales -> Net Profit & Cash Flow.
 */
export function computeWorkOrderFinancials(input: {
  workOrderNumber?: string;
  projectName?: string;
  transactions: (Partial<Transaction> | any)[];
  orders?: Partial<Order>[];
  purchases?: any[];
}): WorkOrderFinancialSummary {
  const scope: ProjectWorkOrderScope = {
    workOrderNumber: input.workOrderNumber,
    projectName: input.projectName,
  };
  const lookup = buildOrderScopeLookup(input.orders);

  const scopedTxs = (input.transactions || []).filter(tx =>
    doesTxMatchProjectOrWorkOrder(tx, scope, lookup)
  );

  let advancesReceived = 0;
  let advancesRefunded = 0;
  let totalSalesFromTx = 0;
  let totalCashCollectedOnSales = 0;
  let totalPurchasesFromTx = 0;
  let totalVendorPaid = 0;
  let netCashFlow = 0;

  let customerDebits = 0;
  let customerCredits = 0;

  for (const tx of scopedTxs) {
    const amt = Number(tx.amount) || 0;
    if (amt <= 0) continue;

    if (tx.entityType === 'customer' || tx.type === 'sale' || tx.type === 'payment_received' || tx.type === 'money_receipt' || tx.type === 'advance_refund') {
      const { isDebit, isCredit } = classifyCustomerTransaction(tx);
      if (isDebit) customerDebits += amt;
      if (isCredit) customerCredits += amt;
    }

    const isAdvTx = Boolean(tx.isAdvance) || tx.category === 'Customer Advance';

    if ((tx.type === 'payment_received' || tx.type === 'money_receipt') && isAdvTx) {
      advancesReceived += amt;
    } else if (tx.type === 'payment_received' || tx.type === 'money_receipt') {
      totalCashCollectedOnSales += amt;
    } else if (tx.type === 'advance_refund') {
      advancesRefunded += amt;
    } else if (tx.type === 'sale') {
      totalSalesFromTx += amt;
    } else if (tx.type === 'purchase') {
      totalPurchasesFromTx += amt;
    } else if (tx.type === 'payment_made') {
      totalVendorPaid += amt;
    }

    if (tx.paymentAccountId) {
      if ((CASH_INFLOW_TX_TYPES as readonly string[]).includes(String(tx.type))) {
        netCashFlow += amt;
      } else if ((CASH_OUTFLOW_TX_TYPES as readonly string[]).includes(String(tx.type))) {
        netCashFlow -= amt;
      }
    }
  }

  const scopedOrders = (input.orders || []).filter(o => {
    if (!o || o.status === 'cancelled' || o.type === 'quotation') return false;
    return doesTxMatchProjectOrWorkOrder(o, scope);
  });

  const scopedPurchases = (input.purchases || []).filter(p =>
    doesTxMatchProjectOrWorkOrder(p, scope)
  );

  const totalSalesInvoiced =
    scopedOrders.length > 0
      ? scopedOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
      : totalSalesFromTx;

  const advanceAppliedOnSales =
    scopedOrders.length > 0
      ? scopedOrders.reduce((sum, o) => sum + (Number((o as any).advanceApplied) || 0), 0)
      : scopedTxs
          .filter(tx => tx.type === 'sale')
          .reduce((sum, tx) => sum + (Number(tx.advanceApplied) || 0), 0);

  const totalPurchasesCost =
    scopedPurchases.length > 0
      ? scopedPurchases.reduce((sum, p) => sum + (Number(p.total) || 0), 0)
      : totalPurchasesFromTx;

  const netAdvanceDeposits = Math.max(0, advancesReceived - advancesRefunded);
  const netCustomerBal = customerDebits - customerCredits;

  return {
    advancesReceived,
    advancesRefunded,
    netAdvanceDeposits,
    advanceAppliedOnSales,
    remainingCustomerAdvance: netCustomerBal < -0.005 ? Math.abs(netCustomerBal) : 0,
    customerDue: netCustomerBal > 0.005 ? netCustomerBal : 0,
    totalPurchasesCost,
    totalVendorPaid,
    totalVendorPayable: Math.max(0, totalPurchasesCost - totalVendorPaid),
    totalSalesInvoiced,
    totalCashCollectedOnSales,
    grossProfit: totalSalesInvoiced - totalPurchasesCost,
    netCashFlow,
  };
}

export interface SaleAdvanceSplitInput {
  netTotal: number;
  previousDue: number;
  availableAdvance: number;
  applyAdvance: boolean;
  requestedAdvanceAmount?: number;
  cashPaidNow: number;
}

export interface SaleAdvanceSplitResult {
  advanceApplied: number;
  cashPaidNow: number;
  totalPaidOnInvoice: number;
  invoiceDueAfterSettlement: number;
  remainingAdvanceAfterSale: number;
  netCustomerDueAfterSale: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
}

/**
 * Splits invoice settlement cleanly between prior Customer Advance credit and newly collected cash/bank.
 * Prevents duplicate `payment_received` ledger writes for previously recorded customer advances.
 */
export function splitSalePaymentWithAdvance(input: SaleAdvanceSplitInput): SaleAdvanceSplitResult {
  const safeTotal = Math.max(0, Number(input.netTotal) || 0);
  const safePrevDue = Math.max(0, Number(input.previousDue) || 0);
  const safeAvailAdvance = Math.max(0, Number(input.availableAdvance) || 0);
  const safeCashPaid = Math.max(0, Number(input.cashPaidNow) || 0);

  let advanceApplied = 0;
  if (input.applyAdvance && safeAvailAdvance > 0 && safeTotal > 0) {
    const requested =
      input.requestedAdvanceAmount === undefined
        ? safeTotal
        : Math.max(0, Number(input.requestedAdvanceAmount) || 0);
    advanceApplied = Math.min(safeAvailAdvance, safeTotal, requested);
  }

  const totalPaidOnInvoice = advanceApplied + safeCashPaid;
  const invoiceDueAfterSettlement = Math.max(0, safeTotal - totalPaidOnInvoice);
  const remainingAdvanceAfterSale = Math.max(0, safeAvailAdvance - advanceApplied);
  const netCustomerDueAfterSale = Math.max(
    0,
    safePrevDue + safeTotal - safeAvailAdvance - safeCashPaid
  );

  let paymentStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid';
  if (safeTotal <= 0 || totalPaidOnInvoice >= safeTotal - 0.01) {
    paymentStatus = 'paid';
  } else if (totalPaidOnInvoice > 0) {
    paymentStatus = 'partial';
  }

  return {
    advanceApplied,
    cashPaidNow: safeCashPaid,
    totalPaidOnInvoice,
    invoiceDueAfterSettlement,
    remainingAdvanceAfterSale,
    netCustomerDueAfterSale,
    paymentStatus,
  };
}

/**
 * Determines whether a transaction hit the physical Cash Drawer in DayBook.
 * Accrual-only entries (`sale`, `purchase`, `opening_balance`, etc.) intentionally omit
 * `paymentAccountId`/`paymentMethod` and settle via their linked payment rows.
 */
export function isCashRegisterMovement(tx: Partial<Transaction> | any): boolean {
  if (!tx) return false;
  const method = String(tx.paymentMethod || '').toLowerCase();
  const accId = String(tx.paymentAccountId || '').toLowerCase();

  if (method.includes('cash') || accId.includes('cash')) {
    return true;
  }

  if (!method && !accId) {
    return !(ACCRUAL_ONLY_TX_TYPES as readonly string[]).includes(String(tx.type || ''));
  }

  return false;
}
