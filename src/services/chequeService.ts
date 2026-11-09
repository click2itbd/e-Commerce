import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { ChequeRecord, ChequeStatus } from '../types';
import { logAudit } from '../lib/audit';

export interface IssueChequeParams {
  chequeNumber: string;
  type?: ChequeRecord['type'];
  amount: number;
  issueDate: string;
  clearingDate: string;
  bankAccountId: string;
  bankAccountName: string;
  bankName?: string;
  vendorId?: string;
  vendorName?: string;
  purchaseId?: string;
  purchaseNumber?: string;
  payeeName?: string;
  notes?: string;
  attachmentUrl?: string;
  user: string;
}

/**
 * Creates and registers a new Cheque in Firestore
 */
export async function issueCheque(params: IssueChequeParams): Promise<string> {
  const cleanData: Record<string, any> = {
    chequeNumber: (params.chequeNumber || '').trim().toUpperCase(),
    type: params.type || 'purchase_payment',
    status: 'pending' as ChequeStatus,
    amount: Math.max(0, Number(params.amount) || 0),
    issueDate: params.issueDate || new Date().toISOString().split('T')[0],
    clearingDate: params.clearingDate || params.issueDate || new Date().toISOString().split('T')[0],
    bankAccountId: params.bankAccountId || '',
    bankAccountName: params.bankAccountName || '',
    bankName: params.bankName || params.bankAccountName || '',
    vendorId: params.vendorId || '',
    vendorName: params.vendorName || '',
    purchaseId: params.purchaseId || '',
    purchaseNumber: params.purchaseNumber || '',
    payeeName: params.payeeName || params.vendorName || '',
    notes: params.notes || '',
    attachmentUrl: params.attachmentUrl || '',
    createdAt: new Date().toISOString(),
    createdBy: params.user || 'Admin',
    updatedAt: new Date().toISOString(),
  };

  // Remove undefined values
  Object.keys(cleanData).forEach(key => {
    if (cleanData[key] === undefined) delete cleanData[key];
  });

  const ref = await addDoc(collection(db, 'cheques'), cleanData);

  try {
    await logAudit(
      'CREATE',
      'purchases',
      `Issued Bank Cheque #${cleanData.chequeNumber} of ৳${cleanData.amount.toLocaleString()} to ${cleanData.payeeName} (Clearing Date: ${cleanData.clearingDate})`,
      cleanData,
      params.user
    );
  } catch (err) {
    console.warn('Failed to log audit for cheque issuance:', err);
  }

  return ref.id;
}

/**
 * Marks a pending cheque as Cleared / Paid.
 * Creates the actual bank debit transaction and settles vendor account.
 */
export async function markChequeAsCleared(params: {
  cheque: ChequeRecord;
  clearingDate?: string;
  user: string;
  note?: string;
}): Promise<void> {
  const { cheque, clearingDate, user, note } = params;
  const actualDate = clearingDate || new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  // 1. Create Outflow Payment Transaction in `transactions`
  const txData: Record<string, any> = {
    type: 'payment_made',
    amount: cheque.amount,
    date: new Date(actualDate).toISOString(),
    description: `Cheque Cleared: #${cheque.chequeNumber} for ${cheque.payeeName || cheque.vendorName || 'Vendor'}${cheque.purchaseNumber ? ` (Purchase #${cheque.purchaseNumber})` : ''}${note ? ` - ${note}` : ''}`,
    entityId: cheque.vendorId || '',
    entityName: cheque.vendorName || cheque.payeeName || '',
    entityType: 'vendor',
    paymentAccountId: cheque.bankAccountId,
    paymentMethod: 'Bank Cheque',
    reference: `Cheque #${cheque.chequeNumber}`,
    referenceId: cheque.purchaseId || cheque.id,
    documentNumber: cheque.purchaseNumber || '',
    createdAt: now,
    createdBy: user || 'Admin',
  };

  const txRef = await addDoc(collection(db, 'transactions'), txData);

  // 2. Update Cheque document
  await updateDoc(doc(db, 'cheques', cheque.id), {
    status: 'cleared',
    clearedAt: now,
    clearedBy: user || 'Admin',
    clearingTransactionId: txRef.id,
    actualClearingDate: actualDate,
    updatedAt: now,
  });

  // 3. If tied to a purchase record, verify & ensure purchase reflects payment
  if (cheque.purchaseId) {
    try {
      const purchaseSnap = await getDoc(doc(db, 'purchases', cheque.purchaseId));
      if (purchaseSnap.exists()) {
        const purData = purchaseSnap.data();
        const newPaid = Number(purData.paidAmount || 0) + Number(cheque.amount || 0);
        const newTotal = Number(purData.total || 0);
        const paymentStatus = newPaid >= newTotal ? 'paid' : newPaid > 0 ? 'partial' : 'due';

        await updateDoc(doc(db, 'purchases', cheque.purchaseId), {
          paidAmount: Math.min(newTotal, newPaid),
          paymentStatus,
          chequeStatus: 'cleared',
          updatedAt: now,
        });
      }
    } catch (err) {
      console.warn('Failed to update purchase document on cheque clearance:', err);
    }
  }

  // 4. Log Audit
  try {
    await logAudit(
      'STATUS_CHANGE',
      'purchases',
      `Cheque #${cheque.chequeNumber} marked as CLEARED (Amount: ৳${cheque.amount.toLocaleString()}, Bank: ${cheque.bankAccountName})`,
      { chequeId: cheque.id, amount: cheque.amount, txId: txRef.id },
      user
    );
  } catch (err) {
    console.warn('Audit error on cheque clearance:', err);
  }
}

/**
 * Marks a cheque as Bounced / Dishonored.
 * Restores vendor due, records bounce details, and optionally posts bank bounce penalty.
 */
export async function markChequeAsBounced(params: {
  cheque: ChequeRecord;
  bounceReason: string;
  bounceFee?: number;
  user: string;
}): Promise<void> {
  const { cheque, bounceReason, bounceFee = 0, user } = params;
  const now = new Date().toISOString();

  // 1. If linked to vendor, post a cheque_bounced transaction to restore due
  if (cheque.vendorId) {
    await addDoc(collection(db, 'transactions'), {
      type: 'cheque_bounced',
      amount: cheque.amount,
      date: now,
      description: `Dishonored Cheque: #${cheque.chequeNumber} bounced (${bounceReason}) - Supplier due restored`,
      entityId: cheque.vendorId,
      entityName: cheque.vendorName || cheque.payeeName || '',
      entityType: 'vendor',
      reference: `Cheque #${cheque.chequeNumber}`,
      referenceId: cheque.purchaseId || cheque.id,
      createdAt: now,
      createdBy: user || 'Admin',
    });
  }

  // 2. If there is a bank bounce fee, deduct as bank expense
  if (bounceFee > 0 && cheque.bankAccountId) {
    await addDoc(collection(db, 'transactions'), {
      type: 'expense',
      amount: bounceFee,
      date: now,
      description: `Bank Cheque Bounce Penalty / Fee for Cheque #${cheque.chequeNumber}`,
      paymentAccountId: cheque.bankAccountId,
      paymentMethod: 'Bank Debit',
      category: 'Bank Charges / Penalties',
      reference: `Cheque #${cheque.chequeNumber}`,
      createdAt: now,
      createdBy: user || 'Admin',
    });
  }

  // 3. Update cheque document in Firestore
  await updateDoc(doc(db, 'cheques', cheque.id), {
    status: 'bounced',
    bouncedAt: now,
    bouncedBy: user || 'Admin',
    bounceReason: bounceReason || 'Insufficient funds / Account balance mismatch',
    bounceFee: bounceFee || 0,
    updatedAt: now,
  });

  // 4. Update linked purchase bill if applicable
  if (cheque.purchaseId) {
    try {
      const purchaseSnap = await getDoc(doc(db, 'purchases', cheque.purchaseId));
      if (purchaseSnap.exists()) {
        const purData = purchaseSnap.data();
        const currentPaid = Number(purData.paidAmount || 0);
        const newPaid = Math.max(0, currentPaid - Number(cheque.amount || 0));
        const total = Number(purData.total || 0);

        await updateDoc(doc(db, 'purchases', cheque.purchaseId), {
          paidAmount: newPaid,
          paymentStatus: newPaid <= 0 ? 'due' : newPaid >= total ? 'paid' : 'partial',
          chequeStatus: 'bounced',
          bouncedReason: bounceReason,
          updatedAt: now,
        });
      }
    } catch (err) {
      console.warn('Failed to update purchase bill on cheque bounce:', err);
    }
  }

  // 5. Log audit
  try {
    await logAudit(
      'STATUS_CHANGE',
      'purchases',
      `Cheque #${cheque.chequeNumber} marked as BOUNCED! Reason: "${bounceReason}". Supplier Due restored (৳${cheque.amount.toLocaleString()})`,
      { chequeId: cheque.id, reason: bounceReason, fee: bounceFee },
      user
    );
  } catch (err) {
    console.warn('Audit error on cheque bounce:', err);
  }
}

/**
 * Cancels / Voids a cheque
 */
export async function cancelCheque(params: {
  cheque: ChequeRecord;
  reason: string;
  user: string;
}): Promise<void> {
  const { cheque, reason, user } = params;
  const now = new Date().toISOString();

  await updateDoc(doc(db, 'cheques', cheque.id), {
    status: 'cancelled',
    cancelledAt: now,
    cancelledBy: user || 'Admin',
    cancelReason: reason || 'Cancelled by user',
    updatedAt: now,
  });

  try {
    await logAudit(
      'STATUS_CHANGE',
      'purchases',
      `Cheque #${cheque.chequeNumber} CANCELLED. Reason: ${reason}`,
      { chequeId: cheque.id },
      user
    );
  } catch (err) {
    console.warn('Audit error on cheque cancel:', err);
  }
}

/**
 * Updates a pending cheque record
 */
export async function updateCheque(params: {
  id: string;
  chequeNumber: string;
  amount: number;
  bankAccountId: string;
  bankAccountName: string;
  bankName?: string;
  vendorId?: string;
  vendorName?: string;
  payeeName?: string;
  issueDate: string;
  clearingDate: string;
  notes?: string;
  attachmentUrl?: string;
  user: string;
}): Promise<void> {
  const now = new Date().toISOString();
  const updateData: Record<string, any> = {
    chequeNumber: (params.chequeNumber || '').trim().toUpperCase(),
    amount: Math.max(0, Number(params.amount) || 0),
    bankAccountId: params.bankAccountId,
    bankAccountName: params.bankAccountName,
    bankName: params.bankName || params.bankAccountName,
    vendorId: params.vendorId || '',
    vendorName: params.vendorName || '',
    payeeName: params.payeeName || params.vendorName || '',
    issueDate: params.issueDate,
    clearingDate: params.clearingDate,
    notes: params.notes || '',
    updatedAt: now,
  };
  if (params.attachmentUrl !== undefined) {
    updateData.attachmentUrl = params.attachmentUrl;
  }

  await updateDoc(doc(db, 'cheques', params.id), updateData);

  try {
    await logAudit(
      'UPDATE',
      'purchases',
      `Updated Bank Cheque #${updateData.chequeNumber} (Amount: ৳${updateData.amount.toLocaleString()}, Maturity: ${updateData.clearingDate})`,
      updateData,
      params.user
    );
  } catch (err) {
    console.warn('Audit error on cheque update:', err);
  }
}

/**
 * Permanently deletes a cheque record (if drafted or created in error)
 */
export async function deleteCheque(id: string, user: string, chequeNumber?: string): Promise<void> {
  await deleteDoc(doc(db, 'cheques', id));
  try {
    await logAudit(
      'DELETE',
      'purchases',
      `Deleted Cheque #${chequeNumber || id}`,
      { chequeId: id },
      user
    );
  } catch (err) {
    console.warn('Audit error on cheque delete:', err);
  }
}

/**
 * Calculates days remaining until clearing date
 * Negative = Overdue
 * 0 = Today
 * 1 = Tomorrow
 */
export function getChequeDaysRemaining(clearingDateStr: string): number {
  if (!clearingDateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(clearingDateStr);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Returns pending cheques that are due within the threshold (e.g., today or next 3 days) or overdue
 */
export function getUpcomingOrOverdueCheques(cheques: ChequeRecord[], daysThreshold = 3): ChequeRecord[] {
  return cheques.filter(ch => {
    if (ch.status !== 'pending') return false;
    const days = getChequeDaysRemaining(ch.clearingDate);
    return days <= daysThreshold;
  });
}
