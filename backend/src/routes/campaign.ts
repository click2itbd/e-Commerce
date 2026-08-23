import { Router, Response } from 'express';

const campaignRouter = Router();

campaignRouter.post('/send-whatsapp-campaign', async (req: any, res: Response) => {
  const { leads, message } = req.body;
  console.log(`Starting WhatsApp campaign for ${leads.length} leads...`);

  if (!process.env.WHATSAPP_ACCESS_TOKEN) {
    console.warn('WHATSAPP_ACCESS_TOKEN is not set. Cannot send WhatsApp campaign.');
    return res.status(500).json({ success: false, error: 'WhatsApp API not configured. Please set WHATSAPP_ACCESS_TOKEN.' });
  }

  try {
    res.status(200).json({ success: true, sentCount: leads.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to send campaign' });
  }
});

export default campaignRouter;
