import { addDoc, collection } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { apiPost } from '../services/apiClient';

export type AuditAction =
  | 'CREATE'
  | 'EDIT'
  | 'DELETE'
  | 'PRICE_CHANGE'
  | 'ROLE_CHANGE'
  | 'PERMISSION_CHANGE'
  | 'STATUS_CHANGE'
  | 'RESTORE'
  | 'SETTINGS'
  | 'SECURITY';

export interface AuditLogItem {
  id?: string;
  action: AuditAction | string;
  entityType: string;
  details: string;
  performedBy: string;
  adminUid?: string;
  adminEmail?: string;
  timestamp: string;
  entityId?: string;
  previousState?: any;
  newState?: any;
  ipAddress?: string;
  userAgent?: string;
  immutable?: boolean;
}

export const logAudit = async (
  action: AuditAction | string,
  entityType: string,
  details: string,
  performedBy: string,
  extraMetadata?: {
    entityId?: string;
    previousState?: any;
    newState?: any;
    ipAddress?: string;
    userAgent?: string;
  }
) => {
  const userAgent = extraMetadata?.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  const currentUser = auth.currentUser;

  // 1. Primary: Record via backend API so the server captures the true client IP address and verified Admin UID
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken();
      const res = await apiPost(
        '/api/admin/audit-log',
        {
          action,
          entityType,
          details,
          performedBy: performedBy || currentUser.displayName || currentUser.email || 'Admin',
          entityId: extraMetadata?.entityId,
          previousState: extraMetadata?.previousState,
          newState: extraMetadata?.newState,
        },
        token
      );
      if (res?.success) {
        return;
      }
    } catch (apiErr) {
      console.warn('[logAudit] Backend audit API unreachable, falling back to direct Firestore append:', apiErr);
    }
  }

  // 2. Fallback: Append-only Firestore write if backend API is temporarily unreachable
  try {
    await addDoc(collection(db, 'audit_logs'), {
      action,
      entityType,
      details,
      performedBy: performedBy || currentUser?.displayName || currentUser?.email || 'Admin',
      adminUid: currentUser?.uid || '',
      adminEmail: currentUser?.email || '',
      ipAddress: extraMetadata?.ipAddress || 'client-direct',
      userAgent,
      immutable: true,
      timestamp: new Date().toISOString(),
      ...(extraMetadata || {}),
    });
  } catch (error) {
    console.error('Failed to log audit action', error);
  }
};

