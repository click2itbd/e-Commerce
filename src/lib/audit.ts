import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';

export const logAudit = async (
  action: 'EDIT' | 'DELETE',
  entityType: string,
  details: string,
  performedBy: string
) => {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      action,
      entityType,
      details,
      performedBy,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Failed to log audit action", error);
  }
};
