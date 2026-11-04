import { Router, Response } from 'express';
import { requireFirebaseAuth } from '../middleware/firebaseAuth.js';
import { isUserAdmin } from '../firebase/admin.js';

const campaignRouter = Router();

campaignRouter.post('/send-sms-campaign', requireFirebaseAuth, async (req: any, res: Response) => {
  const isAdmin = await isUserAdmin(req.user?.uid, req.user?.email);
  if (!isAdmin) {
    return res.status(403).json({ success: false, error: 'Administrator access required to send SMS campaigns.' });
  }

  const { leads, message } = req.body;
  if (!Array.isArray(leads) || leads.length === 0 || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ success: false, error: 'Valid leads array and message are required.' });
  }

  const smsApiKey = process.env.SMS_API_KEY;
  if (!smsApiKey) {
    return res.status(500).json({ success: false, error: 'SMS API is not configured in environment.' });
  }

  try {
    let successCount = 0;
    let failCount = 0;

    for (const lead of leads.slice(0, 500)) {
      if (!lead?.phone) continue;
      try {
        const response = await fetch('https://api.sms-gateway.example/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: smsApiKey,
            number: lead.phone,
            message: message.slice(0, 1000)
          })
        });
        const data: any = await response.json();
        if (data?.success) successCount++;
        else failCount++;
      } catch (err) {
        failCount++;
      }
    }

    res.status(200).json({ success: true, sentCount: successCount, failCount });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to send SMS campaign' });
  }
});

campaignRouter.post('/send-whatsapp-campaign', requireFirebaseAuth, async (req: any, res: Response) => {
  const isAdmin = await isUserAdmin(req.user?.uid, req.user?.email);
  if (!isAdmin) {
    return res.status(403).json({ success: false, error: 'Administrator access required to send WhatsApp campaigns.' });
  }

  const { leads, message } = req.body;
  if (!Array.isArray(leads) || leads.length === 0 || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ success: false, error: 'Valid leads array and message are required.' });
  }

  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (!token || !phoneId) {
    return res.status(500).json({ success: false, error: 'WhatsApp API (Token/Phone ID) not configured.' });
  }

  try {
    let successCount = 0;
    let failCount = 0;

    for (const lead of leads.slice(0, 500)) {
      if (!lead?.phone) continue;
      
      let waNumber = String(lead.phone).replace(/\D/g, '');
      if (waNumber.startsWith('01')) waNumber = '88' + waNumber;

      try {
        const response = await fetch(`https://graph.facebook.com/v17.0/${phoneId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: waNumber,
            type: 'text',
            text: { body: message.slice(0, 2000) }
          })
        });
        const data: any = await response.json();
        if (data?.messages) successCount++;
        else failCount++;
      } catch (err: any) {
        console.error(`WhatsApp send failed to ${waNumber}:`, err.message);
        failCount++;
      }
    }

    res.status(200).json({ success: true, sentCount: successCount, failCount });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to send WhatsApp campaign' });
  }
});

export default campaignRouter;
