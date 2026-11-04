import { Router, Response } from 'express';
import crypto from 'crypto';

const webhookRouter = Router();

webhookRouter.get('/whatsapp', (req: any, res: Response) => {
  const verify_token = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!verify_token) {
    return res.sendStatus(403);
  }
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === verify_token) {
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(403);
  }
});

webhookRouter.post('/whatsapp', async (req: any, res: Response) => {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  const signature = String(req.headers['x-hub-signature-256'] || '');

  // Meta App Secret configured থাকলে সিগনেচার যাচাই করা আবশ্যক
  if (appSecret) {
    if (!signature.startsWith('sha256=')) {
      return res.status(401).json({ error: 'Missing or invalid signature header' });
    }

    const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const expectedHash = 'sha256=' + crypto.createHmac('sha256', appSecret).update(payload).digest('hex');

    const sigBuffer = Buffer.from(signature);
    const expBuffer = Buffer.from(expectedHash);

    if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
      return res.status(403).json({ error: 'Invalid webhook signature' });
    }
  }

  const body = req.body;

  if (!body.object) {
    return res.sendStatus(404);
  }

  if (
    body.entry &&
    body.entry[0].changes &&
    body.entry[0].changes[0] &&
    body.entry[0].changes[0].value.messages &&
    body.entry[0].changes[0].value.messages[0]
  ) {
    const phoneNumber = body.entry[0].changes[0].value.contacts[0].wa_id;
    const msgBody = body.entry[0].changes[0].value.messages[0].text.body;

    console.log(`Received WhatsApp message from ${phoneNumber}`);
  }

  res.sendStatus(200);
});

export default webhookRouter;
