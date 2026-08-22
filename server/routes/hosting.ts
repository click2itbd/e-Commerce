import { Router, Response } from 'express';
import { db } from '../../src/firebase';
import { doc, getDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { getHostingProvider } from '../providers/providerFactory';
import { HostingProvisionRequest, HostingUsageStats } from '../providers/hosting/IHostingProvider';
import { sendEmail } from '../utils/email';
import { requireAdmin } from '../middleware/firebaseAuth';
import { getAdminDocument } from '../admin';

const hostingRouter = Router();

function getWhmConfigFromEnv() {
  const apiType = process.env.WHM_API_TYPE || 'cpanel';
  const apiUrl = process.env.WHM_API_URL || '';
  const apiToken = process.env.WHM_API_TOKEN || process.env.WHM_API_KEY || '';
  const apiUsername = process.env.WHM_USERNAME || 'root';

  console.log({ WHM_API_TOKEN_EXISTS: Boolean(process.env.WHM_API_TOKEN || process.env.WHM_API_KEY) });

  if (!apiUrl) {
    throw new Error('WHM_API_URL environment variable is required.');
  }

  if (!apiToken) {
    throw new Error('WHM_API_TOKEN environment variable is required.');
  }

  return {
    hostingApiType: apiType,
    hostingApiKey: apiToken,
    hostingApiUrl: apiUrl,
    hostingApiUsername: apiUsername,
    bundleDiscountPercent: 0,
  };
}

hostingRouter.get('/health', requireAdmin, async (req: any, res: Response) => {
  try {
    const config = getWhmConfigFromEnv();
    const provider = getHostingProvider({
      hostingApiType: config.hostingApiType,
      hostingApiKey: config.hostingApiKey,
      hostingApiUrl: config.hostingApiUrl,
      hostingApiUsername: config.hostingApiUsername,
    });

    const result = await provider.testConnection?.();
    return res.json({
      success: result?.success ?? false,
      provider: config.hostingApiType,
      server: config.hostingApiUrl,
      message: result?.message || 'Health check completed',
      code: result?.code,
    });
  } catch (error: any) {
    const message = error?.message || 'WHM health check failed';
    const code = message.includes('WHM_API_URL') || message.includes('WHM_API_TOKEN')
      ? 'WHM_CONFIG_MISSING'
      : 'WHM_UNKNOWN_ERROR';
    return res.status(500).json({
      success: false,
      provider: 'unknown',
      server: process.env.WHM_API_URL || '',
      message,
      code,
    });
  }
});

hostingRouter.post('/provision', requireAdmin, async (req: any, res: Response) => {
  try {
    const { domain, contactEmail, billingCycle, planCode } = req.body;
    if (!domain || !contactEmail || !billingCycle) {
      return res.json({ success: false, error: 'domain, contactEmail, and billingCycle are required' });
    }

    const config = getWhmConfigFromEnv();
    const provider = getHostingProvider({ hostingApiType: config.hostingApiType || 'dummy', hostingApiKey: config.hostingApiKey, hostingApiUrl: config.hostingApiUrl, hostingApiUsername: config.hostingApiUsername });
    const request: HostingProvisionRequest = { domain, contactEmail, billingCycle, planCode };
    let result: HostingProvisionResult;
    try {
      result = await provider.provisionAccount(request);
    } catch (providerError: any) {
      console.error('Hosting provider error:', providerError);
      return res.json({ success: false, error: providerError.message || 'Hosting provider failed' });
    }

    if (result.success) {
      let fromName = 'Click2IT';
      try {
        const siteResult = await getAdminDocument('settings', 'site');
        if (siteResult.exists && siteResult.data) {
          fromName = (siteResult.data as any).siteName || 'Click2IT';
        }
      } catch (error) {
        console.error('Failed to read site settings:', error);
      }

      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #EF4444;">Hosting Account Provisioned</h2>
          <p>Hi,</p>
          <p>Your hosting account for <strong>${domain}</strong> has been successfully provisioned.</p>
          ${result.cPanelUrl ? `<p><strong>Control Panel:</strong> <a href="${result.cPanelUrl}">${result.cPanelUrl}</a></p>` : ''}
          ${result.nameservers?.length ? `<p><strong>Nameservers:</strong> ${result.nameservers.join(', ')}</p>` : ''}
          <p><strong>Billing Cycle:</strong> ${billingCycle}</p>
          <p style="color: #888; font-size: 0.9em;">Thank you for choosing ${fromName}.</p>
        </div>
      `;
      await sendEmail(contactEmail, `Hosting Ready: ${domain}`, html);
    } else {
      let adminEmail: string | null = null;
      try {
        const siteResult = await getAdminDocument('settings', 'site');
        if (siteResult.exists && siteResult.data) {
          adminEmail = (siteResult.data as any).contactEmail || null;
        }
      } catch (error) {
        console.error('Failed to read site settings:', error);
      }
      if (adminEmail) {
        await sendEmail(adminEmail, `Hosting Provision Failed: ${domain}`, `<p>Hosting provisioning for <strong>${domain}</strong> failed: ${result.error || 'Unknown error'}</p>`);
      }
    }

    return res.json({ success: result.success, data: result, error: result.error });
  } catch (error: any) {
    console.error('Hosting provision error:', error);
    return res.json({ success: false, error: error?.message || 'Internal server error' });
  }
});

hostingRouter.post('/suspend', requireAdmin, async (req: any, res: Response) => {
  try {
    const { providerAccountId } = req.body;
    if (!providerAccountId) return res.json({ success: false, error: 'providerAccountId is required' });

    const config = getWhmConfigFromEnv();
    const provider = getHostingProvider({ hostingApiType: config.hostingApiType || 'dummy', hostingApiKey: config.hostingApiKey, hostingApiUrl: config.hostingApiUrl, hostingApiUsername: config.hostingApiUsername });
    await provider.suspendAccount(providerAccountId);
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Hosting suspend error:', error);
    return res.json({ success: false, error: error?.message || 'Internal server error' });
  }
});

hostingRouter.post('/unsuspend', requireAdmin, async (req: any, res: Response) => {
  try {
    const { providerAccountId } = req.body;
    if (!providerAccountId) return res.json({ success: false, error: 'providerAccountId is required' });

    const config = getWhmConfigFromEnv();
    const provider = getHostingProvider({ hostingApiType: config.hostingApiType || 'dummy', hostingApiKey: config.hostingApiKey, hostingApiUrl: config.hostingApiUrl, hostingApiUsername: config.hostingApiUsername });
    await provider.unsuspendAccount(providerAccountId);
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Hosting unsuspend error:', error);
    return res.json({ success: false, error: error?.message || 'Internal server error' });
  }
});

hostingRouter.post('/terminate', requireAdmin, async (req: any, res: Response) => {
  try {
    const { providerAccountId } = req.body;
    if (!providerAccountId) return res.json({ success: false, error: 'providerAccountId is required' });

    const config = getWhmConfigFromEnv();
    const provider = getHostingProvider({ hostingApiType: config.hostingApiType || 'dummy', hostingApiKey: config.hostingApiKey, hostingApiUrl: config.hostingApiUrl, hostingApiUsername: config.hostingApiUsername });
    await provider.terminateAccount(providerAccountId);
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Hosting terminate error:', error);
    return res.json({ success: false, error: error?.message || 'Internal server error' });
  }
});

hostingRouter.post('/usage', requireAdmin, async (req: any, res: Response) => {
  try {
    const { providerAccountId } = req.body;
    if (!providerAccountId) return res.json({ success: false, error: 'providerAccountId is required' });

    const config = getWhmConfigFromEnv();
    const provider = getHostingProvider({ hostingApiType: config.hostingApiType || 'dummy', hostingApiKey: config.hostingApiKey, hostingApiUrl: config.hostingApiUrl, hostingApiUsername: config.hostingApiUsername });
    const usage: HostingUsageStats = await provider.getUsage(providerAccountId);
    return res.json({ success: true, data: usage });
  } catch (error: any) {
    console.error('Hosting usage error:', error);
    return res.json({ success: false, error: error?.message || 'Internal server error' });
  }
});

hostingRouter.post('/change-plan', requireAdmin, async (req: any, res: Response) => {
  try {
    const { providerAccountId, newPlanCode } = req.body;
    if (!providerAccountId || !newPlanCode) {
      return res.json({ success: false, error: 'providerAccountId and newPlanCode are required' });
    }

    const config = getWhmConfigFromEnv();
    const provider = getHostingProvider({ hostingApiType: config.hostingApiType || 'dummy', hostingApiKey: config.hostingApiKey, hostingApiUrl: config.hostingApiUrl, hostingApiUsername: config.hostingApiUsername });
    await provider.changePlan(providerAccountId, newPlanCode);
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Hosting change plan error:', error);
    return res.json({ success: false, error: error?.message || 'Internal server error' });
  }
});

hostingRouter.post('/test-connection', requireAdmin, async (req: any, res: Response) => {
  try {
    const config = getWhmConfigFromEnv();

    if (!config.hostingApiType || config.hostingApiType === 'dummy') {
      return res.status(400).json({
        success: false,
        code: 'WHM_CONFIG_MISSING',
        providerType: config.hostingApiType || 'dummy',
        message: 'Hosting provider not configured. Please set WHM_API_TYPE, WHM_API_URL, and WHM_API_TOKEN environment variables.',
      });
    }

    if (!config.hostingApiKey) {
      return res.status(400).json({
        success: false,
        code: 'WHM_CONFIG_MISSING',
        providerType: config.hostingApiType,
        message: 'WHM API token is not configured.',
      });
    }

    if (!config.hostingApiUrl) {
      return res.status(400).json({
        success: false,
        code: 'WHM_CONFIG_MISSING',
        providerType: config.hostingApiType,
        message: 'WHM API URL is not configured.',
      });
    }

    const provider = getHostingProvider({
      hostingApiType: config.hostingApiType,
      hostingApiKey: config.hostingApiKey,
      hostingApiUrl: config.hostingApiUrl,
      hostingApiUsername: config.hostingApiUsername,
    });

    if (typeof provider.testConnection !== 'function') {
      return res.status(400).json({
        success: false,
        code: 'WHM_UNSUPPORTED',
        providerType: config.hostingApiType,
        message: 'Connection test is not supported for the selected provider.',
      });
    }

    const result = await provider.testConnection();
    return res.json({
      success: result.success,
      code: result.success ? 'WHM_OK' : result.code || 'WHM_UNKNOWN_ERROR',
      providerType: config.hostingApiType,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Hosting test connection error:', error);
    const message = error?.message || 'WHM connection test failed';
    const code = message.includes('WHM_API_URL') || message.includes('WHM_API_TOKEN')
      ? 'WHM_CONFIG_MISSING'
      : 'WHM_UNKNOWN_ERROR';
    return res.status(500).json({
      success: false,
      code,
      providerType: 'dummy',
      message,
    });
  }
});

export default hostingRouter;
