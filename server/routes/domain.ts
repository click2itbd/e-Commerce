import { Router, Response } from 'express';
import { db } from '../../src/firebase';
import { doc, getDoc, setDoc, collection, addDoc, updateDoc, serverTimestamp, getDocs, query, where, orderBy } from 'firebase/firestore';
import { getDomainProvider } from '../providers/providerFactory';
import { DomainAvailabilityResult, DomainRegistrationRequest, DomainRegistrationResult, WhoisResult } from '../providers/domain/IDomainProvider';
import { sendEmail } from '../utils/email';

interface DomainPricing {
  id?: string;
  tld: string;
  registerPrice: number;
  renewPrice: number;
  transferPrice: number;
  currency: string;
  isActive: boolean;
}

const domainRouter = Router();

async function getDomainConfig() {
  const snap = await getDoc(doc(db, 'settings', 'domainApiConfig'));
  if (snap.exists()) return snap.data() as { domainApiType?: string; domainApiKey?: string };
  return { domainApiType: 'dummy' };
}

domainRouter.get('/check', async (req: any, res: Response) => {
  try {
    const domains = Array.isArray(req.body.domains) ? req.body.domains : [];
    if (!domains.length) return res.json({ success: false, error: 'domains array is required' });

    const config = await getDomainConfig();
    const provider = getDomainProvider({ domainApiType: config.domainApiType || 'dummy', domainApiKey: config.domainApiKey });
    const results: DomainAvailabilityResult[] = await provider.checkAvailability(domains);
    return res.json({ success: true, data: results });
  } catch (error: any) {
    console.error('Domain check error:', error);
    return res.json({ success: false, error: error?.message || 'Internal server error' });
  }
});

domainRouter.post('/check', async (req: any, res: Response) => {
  try {
    const domains = Array.isArray(req.body.domains) ? req.body.domains : [];
    if (!domains.length) return res.json({ success: false, error: 'domains array is required' });

    const config = await getDomainConfig();
    const provider = getDomainProvider({ domainApiType: config.domainApiType || 'dummy', domainApiKey: config.domainApiKey });
    const results: DomainAvailabilityResult[] = await provider.checkAvailability(domains);
    return res.json({ success: true, data: results });
  } catch (error: any) {
    console.error('Domain check error:', error);
    return res.json({ success: false, error: error?.message || 'Internal server error' });
  }
});

domainRouter.post('/suggestions', async (req: any, res: Response) => {
  try {
    const { domain } = req.body;
    if (!domain) return res.json({ success: false, error: 'domain is required' });

    const config = await getDomainConfig();
    const provider = getDomainProvider({ domainApiType: config.domainApiType || 'dummy', domainApiKey: config.domainApiKey });
    const suggestions = await provider.getSuggestions(domain);
    return res.json({ success: true, data: suggestions });
  } catch (error: any) {
    console.error('Domain suggestions error:', error);
    return res.json({ success: false, error: error?.message || 'Internal server error' });
  }
});

domainRouter.post('/register', async (req: any, res: Response) => {
  try {
    const request: DomainRegistrationRequest = req.body;
    if (!request?.domain) return res.json({ success: false, error: 'domain is required' });

    const config = await getDomainConfig();
    const provider = getDomainProvider({ domainApiType: config.domainApiType || 'dummy', domainApiKey: config.domainApiKey });

    const orderRef = await addDoc(collection(db, 'domainOrders'), {
      domain: request.domain,
      years: request.years || 1,
      status: 'pending',
      contactId: request.contactId || null,
      nameServers: request.nameServers || [],
      autoRenew: request.autoRenew || false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

      try {
        const result: DomainRegistrationResult = await provider.registerDomain(request);
        await updateDoc(orderRef, {
          status: result.success ? 'registered' : 'failed',
          registrationId: result.registrationId || null,
          expiresAt: result.expiresAt || null,
          error: result.error || null,
          updatedAt: serverTimestamp(),
        });

        if (result.success && request.contactId) {
          const userSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', request.contactId)));
          const userDoc = userSnap.docs[0];
          if (userDoc) {
            const user = userDoc.data();
            const html = `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #EF4444;">Domain Registration Confirmed</h2>
                <p>Hi ${user.displayName || 'Customer'},</p>
                <p>Your domain <strong>${request.domain}</strong> has been successfully registered.</p>
                <p><strong>Registration ID:</strong> ${result.registrationId}</p>
                <p><strong>Expires At:</strong> ${result.expiresAt ? new Date(result.expiresAt).toLocaleDateString() : 'N/A'}</p>
                <p style="color: #888; font-size: 0.9em;">Thank you for choosing Click2IT.</p>
              </div>
            `;
            await sendEmail(user.email, `Domain Registered: ${request.domain}`, html);
          }
        }

        return res.json({ success: result.success, data: { orderId: orderRef.id, ...result }, error: result.error });
      } catch (providerError: any) {
        await updateDoc(orderRef, {
          status: 'failed',
          error: providerError?.message || 'Provider error',
          updatedAt: serverTimestamp(),
        });

        const settingsSnap = await getDoc(doc(db, 'settings', 'site'));
        const adminEmail = settingsSnap.exists() ? (settingsSnap.data() as any).contactEmail : null;
        if (adminEmail) {
          await sendEmail(adminEmail, `Domain Registration Failed: ${request.domain}`, `<p>Domain registration for <strong>${request.domain}</strong> failed: ${providerError?.message || 'Unknown error'}</p>`);
        }

        throw providerError;
      }
  } catch (error: any) {
    console.error('Domain register error:', error);
    return res.json({ success: false, error: error?.message || 'Internal server error' });
  }
});

domainRouter.post('/whois', async (req: any, res: Response) => {
  try {
    const { domain } = req.body;
    if (!domain) return res.json({ success: false, error: 'domain is required' });

    const config = await getDomainConfig();
    const provider = getDomainProvider({ domainApiType: config.domainApiType || 'dummy', domainApiKey: config.domainApiKey });
    const result: WhoisResult = await provider.getWhois(domain);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Domain whois error:', error);
    return res.json({ success: false, error: error?.message || 'Internal server error' });
  }
});

domainRouter.get('/pricing', async (req: any, res: Response) => {
  try {
    const snap = await getDocs(query(collection(db, 'domainPricing'), orderBy('tld', 'asc')));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as DomainPricing[];
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error('Domain pricing error:', error);
    return res.json({ success: false, error: error?.message || 'Internal server error' });
  }
});

domainRouter.post('/renew', async (req: any, res: Response) => {
  try {
    const { domain, years } = req.body;
    if (!domain) return res.json({ success: false, error: 'domain is required' });

    const config = await getDomainConfig();
    const provider = getDomainProvider({ domainApiType: config.domainApiType || 'dummy', domainApiKey: config.domainApiKey });
    const result = await provider.renewDomain(domain, years || 1);

    const domainSnap = await getDocs(query(collection(db, 'domainOrders'), where('domain', '==', domain)));
    domainSnap.forEach(async (docSnap) => {
      await updateDoc(doc(db, 'domainOrders', docSnap.id), {
        status: result.success ? 'renewing' : 'failed',
        expiresAt: result.newExpiryDate || null,
        updatedAt: serverTimestamp(),
      });
    });

    return res.json({ success: result.success, data: result, error: result.error });
  } catch (error: any) {
    console.error('Domain renew error:', error);
    return res.json({ success: false, error: error?.message || 'Internal server error' });
  }
});

domainRouter.post('/test-connection', async (req: any, res: Response) => {
  try {
    const config = await getDomainConfig();
    const provider = getDomainProvider({ domainApiType: config.domainApiType || 'dummy', domainApiKey: config.domainApiKey });
    const results = await provider.checkAvailability(['test-click2itbd.com']);
    const success = results.length > 0 && !results[0].error;
    return res.json({
      success,
      providerType: config.domainApiType || 'dummy',
      message: success ? 'Connection test successful' : 'Connection test failed',
      data: results,
    });
  } catch (error: any) {
    console.error('Domain test connection error:', error);
    return res.json({ success: false, providerType: 'dummy', message: error?.message || 'Internal server error' });
  }
});

export default domainRouter;
