import { Router, Response } from 'express';
import { getAdminDocument, setAdminDocument, isUserAdmin } from '../firebase/admin';
import { CpanelHostingProvider } from '../providers/hosting/CpanelHostingProvider';
import { DynadotDomainProvider } from '../providers/domain/DynadotDomainProvider';
import { getCloudLinuxProvider } from '../providers/cloudlinux/CloudLinuxProvider';
import { verifySmtpConnection } from '../services/email';
import { requireFirebaseAuth } from '../middleware/firebaseAuth';

const adminRouter = Router();
adminRouter.use(requireFirebaseAuth);

const FORBIDDEN_SECRET_FIELDS = new Set([
  'dynadotApiKey',
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
  'hostingApiKey',
  'hostingApiUrl',
  'hostingApiUsername',
  'whmUrl',
  'whmApiUrl',
  'whmApiToken',
  'whmApiKey',
  'whmUsername',
  'clnSecretKey',
]);

adminRouter.get('/api-config', async (req: any, res: Response) => {
  try {
    const isAdmin = await isUserAdmin(req.user.uid);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await getAdminDocument('settings', 'api_keys');
    const data = result.data || {};

    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (FORBIDDEN_SECRET_FIELDS.has(key)) {
        sanitized[key] = typeof value === 'string' && value.length > 0;
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

adminRouter.get('/hosting-config', async (req: any, res: Response) => {
  try {
    const isAdmin = await isUserAdmin(req.user.uid);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await getAdminDocument('settings', 'hostingApiConfig');
    const data = result.data || {};

    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (FORBIDDEN_SECRET_FIELDS.has(key)) {
        continue;
      }
      sanitized[key] = value;
    }

    return res.json({ success: true, data: sanitized });
  } catch (error: any) {
    console.error('Failed to load hosting config:', error);
    return res.status(500).json({ error: 'Failed to load hosting configuration' });
  }
});

adminRouter.post('/hosting-config', async (req: any, res: Response) => {
  try {
    const isAdmin = await isUserAdmin(req.user.uid);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await getAdminDocument('settings', 'hostingApiConfig');
    const existing = result.data || {};

    const payload: Record<string, any> = { ...existing };
    for (const [key, value] of Object.entries(req.body)) {
      if (FORBIDDEN_SECRET_FIELDS.has(key)) {
        continue;
      }
      if (typeof value !== 'undefined') {
        payload[key] = value;
      }
    }

    await setAdminDocument('settings', 'hostingApiConfig', payload);
    return res.json({ success: true, message: 'Hosting configuration saved successfully' });
  } catch (error: any) {
    console.error('Failed to save hosting config:', error);
    return res.status(500).json({ error: 'Failed to save hosting configuration' });
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

    const payload: Record<string, any> = { ...existing };
    for (const [key, value] of Object.entries(req.body)) {
      if (FORBIDDEN_SECRET_FIELDS.has(key)) {
        continue;
      }
      if (typeof value !== 'undefined') {
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

adminRouter.post('/hosting/test-connection', async (req: any, res: Response) => {
  try {
    const isAdmin = await isUserAdmin(req.user.uid);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const provider = new CpanelHostingProvider(
      process.env.WHM_API_TOKEN || process.env.WHM_API_KEY || '',
      process.env.WHM_URL || process.env.WHM_API_URL,
      process.env.WHM_USERNAME || 'root',
      parseInt(process.env.WHM_TIMEOUT_MS || '15000', 10)
    );

    const result = await provider.testConnection();
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, code: 'UNKNOWN_ERROR', message: 'WHM connection test failed' });
  }
});

adminRouter.post('/domain/test-connection', async (req: any, res: Response) => {
  try {
    const isAdmin = await isUserAdmin(req.user.uid);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const apiKey = process.env.DYNADOT_API_KEY;
    if (!apiKey) {
      return res.json({ success: false, code: 'NOT_CONFIGURED', message: 'Dynadot API key is not configured on the server.' });
    }

    const provider = new DynadotDomainProvider(apiKey, false, 15000);
    const result = await provider.testConnection();
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, code: 'UNKNOWN_ERROR', message: 'Dynadot connection test failed' });
  }
});

adminRouter.post('/hosting/cloudlinux/test-connection', async (req: any, res: Response) => {
  try {
    const isAdmin = await isUserAdmin(req.user.uid);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const provider = getCloudLinuxProvider();
    const result = await provider.testConnection();
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, code: 'UNKNOWN_ERROR', message: 'CloudLinux connection test failed' });
  }
});

adminRouter.post('/email/test-connection', async (req: any, res: Response) => {
  try {
    const isAdmin = await isUserAdmin(req.user.uid);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await verifySmtpConnection();
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, code: 'UNKNOWN_ERROR', message: 'SMTP connection test failed' });
  }
});

export default adminRouter;
