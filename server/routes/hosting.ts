import { Router, Response } from 'express';
import { db } from '../../src/firebase';
import { doc, getDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { getHostingProvider } from '../providers/providerFactory';
import { HostingProvisionRequest, HostingUsageStats } from '../providers/hosting/IHostingProvider';
import { sendEmail } from '../utils/email';

const hostingRouter = Router();

async function getHostingConfig() {
  const snap = await getDoc(doc(db, 'settings', 'hostingApiConfig'));
  if (snap.exists()) return snap.data() as { hostingApiType?: string; hostingApiKey?: string };
  return { hostingApiType: 'dummy' };
}

hostingRouter.post('/provision', async (req: any, res: Response) => {
  try {
    const { domain, contactEmail, billingCycle, planCode } = req.body;
    if (!domain || !contactEmail || !billingCycle) {
      return res.json({ success: false, error: 'domain, contactEmail, and billingCycle are required' });
    }

    const config = await getHostingConfig();
    const provider = getHostingProvider({ hostingApiType: config.hostingApiType || 'dummy', hostingApiKey: config.hostingApiKey });
    const request: HostingProvisionRequest = { domain, contactEmail, billingCycle, planCode };
    const result = await provider.provisionAccount(request);

    if (result.success) {
      const settingsSnap = await getDoc(doc(db, 'settings', 'site'));
      const fromName = settingsSnap.exists() ? (settingsSnap.data() as any).siteName || 'Click2IT' : 'Click2IT';

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
      const settingsSnap = await getDoc(doc(db, 'settings', 'site'));
      const adminEmail = settingsSnap.exists() ? (settingsSnap.data() as any).contactEmail : null;
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

hostingRouter.post('/suspend', async (req: any, res: Response) => {
  try {
    const { providerAccountId } = req.body;
    if (!providerAccountId) return res.json({ success: false, error: 'providerAccountId is required' });

    const config = await getHostingConfig();
    const provider = getHostingProvider({ hostingApiType: config.hostingApiType || 'dummy', hostingApiKey: config.hostingApiKey });
    await provider.suspendAccount(providerAccountId);
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Hosting suspend error:', error);
    return res.json({ success: false, error: error?.message || 'Internal server error' });
  }
});

hostingRouter.post('/unsuspend', async (req: any, res: Response) => {
  try {
    const { providerAccountId } = req.body;
    if (!providerAccountId) return res.json({ success: false, error: 'providerAccountId is required' });

    const config = await getHostingConfig();
    const provider = getHostingProvider({ hostingApiType: config.hostingApiType || 'dummy', hostingApiKey: config.hostingApiKey });
    await provider.unsuspendAccount(providerAccountId);
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Hosting unsuspend error:', error);
    return res.json({ success: false, error: error?.message || 'Internal server error' });
  }
});

hostingRouter.post('/terminate', async (req: any, res: Response) => {
  try {
    const { providerAccountId } = req.body;
    if (!providerAccountId) return res.json({ success: false, error: 'providerAccountId is required' });

    const config = await getHostingConfig();
    const provider = getHostingProvider({ hostingApiType: config.hostingApiType || 'dummy', hostingApiKey: config.hostingApiKey });
    await provider.terminateAccount(providerAccountId);
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Hosting terminate error:', error);
    return res.json({ success: false, error: error?.message || 'Internal server error' });
  }
});

hostingRouter.post('/usage', async (req: any, res: Response) => {
  try {
    const { providerAccountId } = req.body;
    if (!providerAccountId) return res.json({ success: false, error: 'providerAccountId is required' });

    const config = await getHostingConfig();
    const provider = getHostingProvider({ hostingApiType: config.hostingApiType || 'dummy', hostingApiKey: config.hostingApiKey });
    const usage: HostingUsageStats = await provider.getUsage(providerAccountId);
    return res.json({ success: true, data: usage });
  } catch (error: any) {
    console.error('Hosting usage error:', error);
    return res.json({ success: false, error: error?.message || 'Internal server error' });
  }
});

hostingRouter.post('/change-plan', async (req: any, res: Response) => {
  try {
    const { providerAccountId, newPlanCode } = req.body;
    if (!providerAccountId || !newPlanCode) {
      return res.json({ success: false, error: 'providerAccountId and newPlanCode are required' });
    }

    const config = await getHostingConfig();
    const provider = getHostingProvider({ hostingApiType: config.hostingApiType || 'dummy', hostingApiKey: config.hostingApiKey });
    await provider.changePlan(providerAccountId, newPlanCode);
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Hosting change plan error:', error);
    return res.json({ success: false, error: error?.message || 'Internal server error' });
  }
});

hostingRouter.post('/test-connection', async (req: any, res: Response) => {
  try {
    const config = await getHostingConfig();
    const provider = getHostingProvider({ hostingApiType: config.hostingApiType || 'dummy', hostingApiKey: config.hostingApiKey });
    const usage = await provider.getUsage('test-connection-dummy');
    return res.json({
      success: true,
      providerType: config.hostingApiType || 'dummy',
      message: 'Connection test successful',
      data: usage,
    });
  } catch (error: any) {
    console.error('Hosting test connection error:', error);
    return res.json({ success: false, providerType: 'dummy', message: error?.message || 'Internal server error' });
  }
});

export default hostingRouter;
