import { Router, Request, Response } from 'express';
import { requireFirebaseAuth } from '../middleware/firebaseAuth.js';
import { getAdminDb, isUserAdmin } from '../firebase/admin.js';

const courierRouter = Router();

const STEADFAST_BASE_URL = 'https://portal.packzy.com/api/v1';

/**
 * Resolves Steadfast API & Secret keys securely on the server side
 * (checks settings/api_keys -> settings/site -> process.env).
 */
async function resolveSteadfastCredentials(): Promise<{ apiKey: string; secretKey: string }> {
  try {
    const db = getAdminDb();
    const [apiKeysSnap, siteSnap] = await Promise.all([
      db.collection('settings').doc('api_keys').get().catch(() => null),
      db.collection('settings').doc('site').get().catch(() => null),
    ]);

    const apiKeysData = apiKeysSnap?.exists ? apiKeysSnap.data() : {};
    const siteData = siteSnap?.exists ? siteSnap.data() : {};

    const apiKey = String(
      apiKeysData?.steadfastApiKey ||
      siteData?.steadfastApiKey ||
      process.env.STEADFAST_API_KEY ||
      ''
    ).trim();

    const secretKey = String(
      apiKeysData?.steadfastSecretKey ||
      siteData?.steadfastSecretKey ||
      process.env.STEADFAST_SECRET_KEY ||
      ''
    ).trim();

    return { apiKey, secretKey };
  } catch (err) {
    console.warn('[Courier] Failed to load Steadfast credentials from Firestore:', err);
    return {
      apiKey: String(process.env.STEADFAST_API_KEY || '').trim(),
      secretKey: String(process.env.STEADFAST_SECRET_KEY || '').trim(),
    };
  }
}

function normalizeBdPhone(phone: string): string {
  let cleanPhone = String(phone || '').replace(/[^0-9]/g, '');
  if (cleanPhone.length > 11 && cleanPhone.startsWith('88')) {
    cleanPhone = cleanPhone.slice(2);
  }
  if (cleanPhone.length === 10 && cleanPhone.startsWith('1')) {
    cleanPhone = '0' + cleanPhone;
  }
  return cleanPhone;
}

// Handle fraud check: GET /api/courier/fraud_check/:phone or via query
courierRouter.get('/fraud_check/:phone?', requireFirebaseAuth, async (req: Request, res: Response) => {
  try {
    const isAdmin = await isUserAdmin(req.user!.uid, req.user!.email);
    if (!isAdmin) {
      return res.status(403).json({ status: 403, message: 'Forbidden: Admin or staff access required' });
    }

    const phone = req.params.phone || (req.query.phone as string);
    if (!phone) {
      return res.status(400).json({ status: 400, message: 'ফোন নম্বর আবশ্যক' });
    }

    const { apiKey, secretKey } = await resolveSteadfastCredentials();
    if (!apiKey || !secretKey) {
      return res.status(400).json({ status: 400, message: 'Steadfast Api-Key এবং Secret-Key কনফিগার করা নেই। Settings > Courier এ গিয়ে সেট করুন।' });
    }

    const cleanPhone = normalizeBdPhone(phone);

    const steadfastRes = await fetch(`${STEADFAST_BASE_URL}/fraud_check/${encodeURIComponent(cleanPhone)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey,
        'Secret-Key': secretKey,
      },
      signal: AbortSignal.timeout(15000),
    });

    const data = await steadfastRes.json().catch(() => null);

    if (!steadfastRes.ok) {
      return res.status(steadfastRes.status).json(
        data || { status: steadfastRes.status, message: `Steadfast API Error: ${steadfastRes.statusText}` }
      );
    }

    return res.json(data);
  } catch (error: any) {
    console.error('Steadfast fraud_check error:', error);
    return res.status(502).json({ status: 502, message: `Steadfast API সংযোগ ত্রুটি: ${error.message || 'Network Error'}` });
  }
});

// Handle tracking status: GET /api/courier/status/:tracking_code or via query
courierRouter.get('/status/:tracking_code?', requireFirebaseAuth, async (req: Request, res: Response) => {
  try {
    const isAdmin = await isUserAdmin(req.user!.uid, req.user!.email);
    if (!isAdmin) {
      return res.status(403).json({ status: 403, message: 'Forbidden: Admin or staff access required' });
    }

    const trackingCode = req.params.tracking_code || (req.query.tracking_code as string);
    if (!trackingCode) {
      return res.status(400).json({ status: 400, message: 'Tracking code is required' });
    }

    const { apiKey, secretKey } = await resolveSteadfastCredentials();
    if (!apiKey || !secretKey) {
      return res.status(400).json({ status: 400, message: 'Steadfast Api-Key বা Secret-Key কনফিগার করা নেই' });
    }

    const steadfastRes = await fetch(`${STEADFAST_BASE_URL}/status_by_trackingcode/${encodeURIComponent(trackingCode)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey,
        'Secret-Key': secretKey,
      },
      signal: AbortSignal.timeout(15000),
    });

    const data = await steadfastRes.json().catch(() => null);

    if (!steadfastRes.ok) {
      return res.status(steadfastRes.status).json(
        data || { status: steadfastRes.status, message: steadfastRes.statusText }
      );
    }

    return res.json(data);
  } catch (error: any) {
    console.error('Steadfast tracking status error:', error);
    return res.status(502).json({ status: 502, message: `Steadfast API connection failed: ${error.message}` });
  }
});

// Handle order creation: POST /api/courier/create_order
courierRouter.post('/create_order', requireFirebaseAuth, async (req: Request, res: Response) => {
  try {
    const isAdmin = await isUserAdmin(req.user!.uid, req.user!.email);
    if (!isAdmin) {
      return res.status(403).json({ status: 403, message: 'Forbidden: Admin or staff access required' });
    }

    const { apiKey, secretKey } = await resolveSteadfastCredentials();
    if (!apiKey || !secretKey) {
      return res.status(400).json({ status: 400, message: 'Steadfast API keys are missing in Settings!' });
    }

    const steadfastRes = await fetch(`${STEADFAST_BASE_URL}/create_order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey,
        'Secret-Key': secretKey,
      },
      body: JSON.stringify(req.body || {}),
      signal: AbortSignal.timeout(20000),
    });

    const data = await steadfastRes.json().catch(() => null);
    return res.status(steadfastRes.status).json(
      data || { status: steadfastRes.status, message: steadfastRes.statusText }
    );
  } catch (error: any) {
    console.error('Steadfast create_order error:', error);
    return res.status(502).json({ status: 502, message: `Steadfast API connection failed: ${error.message}` });
  }
});

// Legacy / Steadfast.php proxy handler for backward compatibility
courierRouter.all('/steadfast.php', requireFirebaseAuth, async (req: Request, res: Response) => {
  const isAdmin = await isUserAdmin(req.user!.uid, req.user!.email);
  if (!isAdmin) {
    return res.status(403).json({ status: 403, message: 'Forbidden: Admin or staff access required' });
  }

  const action = (req.query.action as string) || 'create_order';
  const phone = (req.query.phone as string) || '';
  const trackingCode = (req.query.tracking_code as string) || '';

  const { apiKey, secretKey } = await resolveSteadfastCredentials();
  if (!apiKey || !secretKey) {
    return res.status(400).json({ status: 400, message: 'Missing Steadfast Api-Key or Secret-Key in server settings' });
  }

  if (action === 'fraud_check') {
    const cleanPhone = normalizeBdPhone(phone);
    try {
      const response = await fetch(`${STEADFAST_BASE_URL}/fraud_check/${encodeURIComponent(cleanPhone)}`, {
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': apiKey,
          'Secret-Key': secretKey,
        },
        signal: AbortSignal.timeout(15000),
      });
      const data = await response.json().catch(() => null);
      return res.status(response.status).json(data || { status: response.status, message: response.statusText });
    } catch (err: any) {
      return res.status(502).json({ status: 502, message: err.message });
    }
  }

  if (action === 'status') {
    try {
      const response = await fetch(`${STEADFAST_BASE_URL}/status_by_trackingcode/${encodeURIComponent(trackingCode)}`, {
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': apiKey,
          'Secret-Key': secretKey,
        },
        signal: AbortSignal.timeout(15000),
      });
      const data = await response.json().catch(() => null);
      return res.status(response.status).json(data || { status: response.status, message: response.statusText });
    } catch (err: any) {
      return res.status(502).json({ status: 502, message: err.message });
    }
  }

  if (action === 'create_order' && req.method === 'POST') {
    try {
      const response = await fetch(`${STEADFAST_BASE_URL}/create_order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': apiKey,
          'Secret-Key': secretKey,
        },
        body: JSON.stringify(req.body || {}),
        signal: AbortSignal.timeout(20000),
      });
      const data = await response.json().catch(() => null);
      return res.status(response.status).json(data || { status: response.status, message: response.statusText });
    } catch (err: any) {
      return res.status(502).json({ status: 502, message: err.message });
    }
  }

  return res.status(400).json({ status: 400, message: 'Invalid action' });
});

export default courierRouter;
