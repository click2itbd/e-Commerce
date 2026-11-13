import { Customer, Transaction, TransactionType } from '../types';

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
  const txName = String(tx.entityName || '').trim().toLowerCase();
  const custName = String(customer.name || '').trim().toLowerCase();
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
    const pm = String(tx.paymentMethod || '').toLowerCase();
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

  for (const tx of customerTransactions || []) {
    if (!tx) continue;
    if (options?.excludeFn && options.excludeFn(tx)) continue;

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
 * Computes a specific customer's live ledger position (due vs advance) across all transactions.
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
