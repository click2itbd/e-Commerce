import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

export interface EmailLog {
  id?: string;
  orderId: string;
  customerEmail: string;
  subject: string;
  content: string;
  sentAt: string;
  status: 'sent' | 'failed';
}

/**
 * MOCK EMAIL SERVICE
 * When ready, replace the console.log below with actual EmailJS or Resend API calls.
 */
const simulateEmailSend = async (to: string, subject: string, body: string) => {
  console.log(`[EMAIL MOCK] Sending email to: ${to}`);
  console.log(`[EMAIL MOCK] Subject: ${subject}`);
  console.log(`[EMAIL MOCK] Body:`, body);
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  return true;
};

export const sendServiceActivationEmail = async (
  orderId: string, 
  customerEmail: string, 
  serviceDetails: { domain?: string; serverIp?: string; controlPanelUrl?: string }
) => {
  const subject = `Your Service is Active! - ${serviceDetails.domain || 'Hosting'}`;
  
  const content = `
Hello,

Great news! Your service for ${serviceDetails.domain || 'your recent order'} has been activated.

Here are your service details:
- Server IP: ${serviceDetails.serverIp || 'N/A'}
- Control Panel: ${serviceDetails.controlPanelUrl || 'N/A'}

Thank you for choosing us!
  `.trim();

  try {
    const success = await simulateEmailSend(customerEmail, subject, content);
    
    if (success) {
      // Log to Firestore
      await addDoc(collection(db, 'emailLogs'), {
        orderId,
        customerEmail,
        subject,
        content,
        sentAt: new Date().toISOString(),
        status: 'sent'
      });
      return true;
    }
  } catch (err) {
    console.error('Failed to send email:', err);
    return false;
  }
};

export const getEmailLogsForOrder = async (orderId: string): Promise<EmailLog[]> => {
  try {
    const q = query(
      collection(db, 'emailLogs'),
      where('orderId', '==', orderId)
    );
    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmailLog));
    return logs.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  } catch (err) {
    console.error('Failed to fetch email logs:', err);
    return [];
  }
};
