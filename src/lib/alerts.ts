import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { logAudit } from './audit';

export type AlertType =
  | 'HIGH_DISCOUNT'
  | 'BILL_DELETED'
  | 'ORDER_RETURN'
  | 'PAYMENT_DELETED'
  | 'PRICE_OVERRIDE'
  | 'SECURITY_EVENT';

export interface SensitiveAlert {
  id?: string;
  type: AlertType;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  amount?: number;
  documentNumber?: string;
  entityId?: string;
  performedBy: string;
  timestamp: string;
  isRead?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Records a sensitive action to both Firestore `admin_alerts` collection
 * (for real-time bell notifications and sound chimes) and the audit trail.
 */
export const recordSensitiveAlert = async (alert: {
  type: AlertType;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  amount?: number;
  documentNumber?: string;
  entityId?: string;
  performedBy?: string;
  metadata?: Record<string, any>;
}) => {
  const currentUser = auth.currentUser;
  const operatorName =
    alert.performedBy ||
    currentUser?.displayName ||
    currentUser?.email?.split('@')[0] ||
    'Staff';

  const fullAlert: Omit<SensitiveAlert, 'id'> = {
    ...alert,
    performedBy: operatorName,
    timestamp: new Date().toISOString(),
    isRead: false,
  };

  try {
    await addDoc(collection(db, 'admin_alerts'), fullAlert);
  } catch (err) {
    console.warn('[recordSensitiveAlert] Failed to add to admin_alerts:', err);
  }

  // Also log into standard audit logs marked with SECURITY/SENSITIVE
  try {
    await logAudit(
      'SECURITY',
      alert.type,
      `[SENSITIVE ALERT] ${alert.title}: ${alert.message}`,
      operatorName,
      {
        entityId: alert.entityId,
        newState: {
          isSensitive: true,
          severity: alert.severity,
          amount: alert.amount,
          documentNumber: alert.documentNumber,
          ...(alert.metadata || {}),
        },
      }
    );
  } catch (auditErr) {
    console.warn('[recordSensitiveAlert] Failed to log audit:', auditErr);
  }
};

/**
 * Mark a sensitive alert as read
 */
export const markAlertAsRead = async (alertId: string) => {
  try {
    await updateDoc(doc(db, 'admin_alerts', alertId), {
      isRead: true,
      readAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to mark alert as read:', err);
  }
};
