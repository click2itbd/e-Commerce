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
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: customerEmail,
        subject,
        html: content.replace(/\n/g, '<br>')
      })
    });

    const data = await response.json();
    
    await addDoc(collection(db, 'emailLogs'), {
      orderId,
      customerEmail,
      subject,
      content,
      sentAt: new Date().toISOString(),
      status: response.ok ? 'sent' : 'failed'
    });

    return response.ok;
  } catch (err) {
    console.error('Failed to send email:', err);
    await addDoc(collection(db, 'emailLogs'), {
      orderId,
      customerEmail,
      subject,
      content,
      sentAt: new Date().toISOString(),
      status: 'failed'
    });
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
