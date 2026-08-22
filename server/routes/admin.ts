import { Router, Response } from 'express';
import { getAdminDocument, setAdminDocument, isUserAdmin } from '../admin';

const adminRouter = Router();

adminRouter.get('/api-config', async (req: any, res: Response) => {
  try {
    const isAdmin = await isUserAdmin(req.user.uid);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await getAdminDocument('settings', 'api_keys');
    const data = result.data || {};

    const secretFields = [
      'dynadotApiKey',
      'resendApiKey',
      'bkashAppKey',
      'bkashAppSecret',
      'bkashUsername',
      'bkashPassword',
      'sandbox_bkashAppKey',
      'sandbox_bkashAppSecret',
      'sandbox_bkashUsername',
      'sandbox_bkashPassword',
      'production_bkashAppKey',
      'production_bkashAppSecret',
      'production_bkashUsername',
      'production_bkashPassword',
      'smtpPassword',
      'smsApiKey',
      'whatsappAccessToken',
    ];

    const whmOnlyFields = [
      'hostingApiKey',
      'whmApiToken',
      'clnSecretKey',
    ];

    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (whmOnlyFields.includes(key)) {
        continue;
      }
      if (secretFields.includes(key)) {
        if (typeof value === 'string' && value.length > 0) {
          sanitized[key] = '••••••••••••••••' + value.slice(-4);
        }
      } else {
        sanitized[key] = value;
      }
    }

    return res.json({ success: true, data: sanitized });
  } catch (error: any) {
    console.error('Failed to load sanitized API config:', error);
    return res.status(500).json({ error: 'Failed to load API configuration' });
  }
});

adminRouter.post('/api-config', async (req: any, res: Response) => {
  try {
    const isAdmin = await isUserAdmin(req.user.uid);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await getAdminDocument('settings', 'api_keys');
    const existing = result.data || {};

    const secretFields = [
      'dynadotApiKey',
      'resendApiKey',
      'bkashAppKey',
      'bkashAppSecret',
      'bkashUsername',
      'bkashPassword',
      'sandbox_bkashAppKey',
      'sandbox_bkashAppSecret',
      'sandbox_bkashUsername',
      'sandbox_bkashPassword',
      'production_bkashAppKey',
      'production_bkashAppSecret',
      'production_bkashUsername',
      'production_bkashPassword',
      'smtpPassword',
      'smsApiKey',
      'whatsappAccessToken',
    ];

    const whmOnlyFields = [
      'hostingApiKey',
      'whmApiToken',
      'clnSecretKey',
    ];

    const payload: Record<string, any> = { ...existing };
    for (const [key, value] of Object.entries(req.body)) {
      if (whmOnlyFields.includes(key)) {
        continue;
      }
      if (secretFields.includes(key)) {
        if (typeof value === 'string' && value.trim().length > 0) {
          payload[key] = value.trim();
        }
      } else {
        payload[key] = value;
      }
    }

    await setAdminDocument('settings', 'api_keys', payload);
    return res.json({ success: true, message: 'API configuration saved successfully' });
  } catch (error: any) {
    console.error('Failed to save API config:', error);
    return res.status(500).json({ error: 'Failed to save API configuration' });
  }
});

export default adminRouter;
