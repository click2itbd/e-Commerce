import { PaymentAccount, Transaction } from '../types';

/**
 * Calculates live current balance of a payment account from opening balance and transactions.
 * Positive = liquid cash/bank available
 * Zero / Negative = cannot withdraw or pay out
 */
export function calculateAccountBalance(
  account: PaymentAccount | { id: string; openingBalance?: number } | undefined | null,
  transactions: (Transaction | any)[]
): number {
  if (!account || !account.id) return 0;
  const opening = Number(account.openingBalance || 0);
  const accTx = transactions.filter(tx => tx && tx.paymentAccountId === account.id);

  const inflow = accTx
    .filter(tx => ['sale', 'payment_received', 'money_receipt', 'income', 'purchase_return', 'deposit', 'transfer_in'].includes(tx.type))
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  const outflow = accTx
    .filter(tx => ['purchase', 'payment_made', 'expense', 'salary', 'advance_salary', 'conveyance', 'sale_return', 'withdrawal', 'transfer_out'].includes(tx.type))
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  return opening + inflow - outflow;
}

/**
 * Validates whether an account has sufficient balance for a requested payment/outflow.
 * Returns { valid: boolean, currentBalance: number, error?: string }
 */
export function validateSufficientBalance(
  account: PaymentAccount | undefined | null,
  transactions: (Transaction | any)[],
  requiredAmount: number
): { valid: boolean; currentBalance: number; error?: string } {
  if (!account) {
    return { valid: false, currentBalance: 0, error: 'অনুগ্রহ করে একটি পেমেন্ট অ্যাকাউন্ট সিলেক্ট করুন!' };
  }
  const currentBalance = calculateAccountBalance(account, transactions);
  const amount = Number(requiredAmount) || 0;

  if (amount <= 0) {
    return { valid: true, currentBalance };
  }

  if (currentBalance < amount) {
    return {
      valid: false,
      currentBalance,
      error: `অপর্যাপ্ত ব্যালেন্স! "${account.name}" অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই। বর্তমান ব্যালেন্স: ৳${currentBalance.toLocaleString()}, কিন্তু পরিশোধ করতে চাওয়া হয়েছে: ৳${amount.toLocaleString()}। অ্যাকাউন্টে ব্যালেন্স যোগ/ট্রান্সফার করুন অথবা বাকি টাকা ডিউ (Due) হিসেবে রাখুন।`
    };
  }

  return { valid: true, currentBalance };
}
