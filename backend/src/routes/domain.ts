import { Router, Response } from 'express';
import { getAdminDb } from '../firebase/admin';
import { getDomainProvider } from '../providers/providerFactory';
import { DomainAvailabilityResult, DomainRegistrationRequest, DomainRegistrationResult, WhoisResult, DomainTransferResult, TldPricingResult } from '../providers/domain/IDomainProvider';
import { sendEmail } from '../services/email';
import { getAdminDocument, isUserAdmin } from '../firebase/admin';
import { getDomainPricingSettings, calculateCustomerPriceBdt } from '../services/domainPricing';
import { ProviderError } from '../providers/domain/DomainProviderError';
import { BtclDomainProvider, isBdDomain } from '../providers/domain/BtclDomainProvider';
import { resolveDomainProvider, getBtclConfig, saveBtclConfig, maskBtclConfig } from '../services/btclConfig';
import { requireFirebaseAuth } from '../middleware/firebaseAuth';
import { getDomainProviderConfig as getDomainConfig } from '../services/domainProviderConfig';

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
let domainPricingCache: { expiresAt: number; data: DomainPricing[] } | null = null;
const PRICED_TLDS = ['com', 'net', 'org', 'xyz', 'io', 'co', 'dev', 'online', 'info', 'biz', 'store'];

domainRouter.get('/check', async (req: any, res: Response) => {
  try {
    const domains = Array.isArray(req.body.domains) ? req.body.domains : [];
    if (!domains.length) return res.json({ success: false, error: 'domains array is required' });

    const config = await getDomainConfig();
    const provider = getDomainProvider(config);
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
    const provider = getDomainProvider(config);
    const pricingSettings = await getDomainPricingSettings();
    const results: DomainAvailabilityResult[] = await provider.checkAvailability(domains);

    const pricingByTld = new Map<string, Promise<TldPricingResult>>();
    const enriched = await Promise.all(results.map(async r => {
      if (!r.available) return r;

      const separator = r.domain.indexOf('.');
      const tld = separator >= 0 ? r.domain.slice(separator + 1).toLowerCase() : '';
      if (tld && provider.getTldPricing) {
        let pricingPromise = pricingByTld.get(tld);
        if (!pricingPromise) {
          pricingPromise = provider.getTldPricing(tld);
          pricingByTld.set(tld, pricingPromise);
        }

        try {
          const quote = await pricingPromise;
          if (quote.currency !== 'USD' || !Number.isFinite(quote.registrationPrice) || quote.registrationPrice <= 0
            || !Number.isFinite(quote.renewalPrice) || quote.renewalPrice <= 0) {
            return {
              ...r,
              price: undefined,
              priceBdt: undefined,
              renewalPrice: undefined,
              error: 'A valid registration and renewal price is unavailable for this domain.',
            };
          }

          const registrationPriceBdt = calculateCustomerPriceBdt(quote.registrationPrice, pricingSettings);
          return {
            ...r,
            price: registrationPriceBdt,
            priceBdt: registrationPriceBdt,
            renewalPrice: calculateCustomerPriceBdt(quote.renewalPrice, pricingSettings),
            currency: 'BDT',
          };
        } catch (error: any) {
          return {
            ...r,
            price: undefined,
            priceBdt: undefined,
            renewalPrice: undefined,
            error: error?.message || 'Failed to fetch domain pricing.',
          };
        }
      }

      return {
        ...r,
        price: undefined,
        priceBdt: undefined,
        renewalPrice: undefined,
        error: 'Live Openprovider pricing is unavailable for this domain.',
      };
    }));

    return res.json({ success: true, data: enriched });
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
    const provider = getDomainProvider(config);
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

    const db = getAdminDb();
    const idempotencyKey = req.headers['x-idempotency-key']?.toString() || `${request.domain}-${request.years || 1}`;
    
    const existingOrder = await db.collection('domainOrders')
      .where('idempotencyKey', '==', idempotencyKey)
      .where('status', '!=', 'cancelled')
      .limit(1)
      .get();
    
    if (!existingOrder.empty) {
      const existing = existingOrder.docs[0];
      return res.json({ 
        success: true, 
        data: { orderId: existing.id, ...existing.data() }, 
        message: 'Duplicate request detected. Returning existing order.' 
      });
    }

    const config = await getDomainConfig();
    const provider = getDomainProvider(config);
    const pricingSettings = await getDomainPricingSettings();

    let supplierPriceUsd: number;
    try {
      const tld = request.domain.split('.').pop() || '';
      const tldPricing = await provider.getTldPricing?.(tld);
      if (!tldPricing || !Number.isFinite(tldPricing.registrationPrice) || tldPricing.registrationPrice <= 0 || tldPricing.currency !== 'USD') {
        throw new Error('A valid USD registration price is unavailable for this domain.');
      }
      supplierPriceUsd = tldPricing.registrationPrice;
    } catch (error: any) {
      console.error('Failed to get supplier price for registration:', error);
      return res.status(502).json({ success: false, error: error?.message || 'Failed to fetch domain registration price' });
    }

    const years = request.years || 1;
    const customerPriceBdt = calculateCustomerPriceBdt(supplierPriceUsd * years, pricingSettings);

    const orderRef = db.collection('domainOrders').doc();
    await orderRef.set({
      domain: request.domain,
      years,
      status: 'pending_payment',
      contactId: request.contactId || null,
      nameServers: request.nameServers || [],
      autoRenew: request.autoRenew || false,
      type: 'registration',
      idempotencyKey,
      supplierPriceUsd,
      customerPriceBdt,
      pricingSettings,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return res.json({ 
      success: true, 
      data: { 
        orderId: orderRef.id, 
        domain: request.domain, 
        years,
        customerPriceBdt,
        status: 'pending_payment',
        idempotencyKey,
      } 
    });
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
    const provider = getDomainProvider(config);
    const result: WhoisResult = await provider.getWhois(domain);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Domain whois error:', error);
    return res.json({ success: false, error: error?.message || 'Internal server error' });
  }
});

domainRouter.get('/pricing', async (req: any, res: Response) => {
  if (domainPricingCache && domainPricingCache.expiresAt > Date.now()) {
    return res.json({ success: true, data: domainPricingCache.data });
  }

  try {
    const config = await getDomainConfig();
    const provider = getDomainProvider(config);
    if (!provider.getTldPricing) {
      return res.status(503).json({ success: false, error: 'Openprovider TLD pricing is unavailable.' });
    }
    const pricingSettings = await getDomainPricingSettings();
    const data: DomainPricing[] = [];
    const failed: Array<{ tld: string; error: string }> = [];

    for (const tld of PRICED_TLDS) {
      try {
        const quote = await provider.getTldPricing(tld);
        if (quote.currency !== 'USD'
          || !Number.isFinite(quote.registrationPrice) || quote.registrationPrice <= 0
          || !Number.isFinite(quote.renewalPrice) || quote.renewalPrice <= 0
          || !Number.isFinite(quote.transferPrice) || quote.transferPrice <= 0) {
          throw new Error('Openprovider returned an invalid price quote.');
        }
        data.push({
          tld: quote.tld,
          registerPrice: calculateCustomerPriceBdt(quote.registrationPrice, pricingSettings),
          renewPrice: calculateCustomerPriceBdt(quote.renewalPrice, pricingSettings),
          transferPrice: calculateCustomerPriceBdt(quote.transferPrice, pricingSettings),
          currency: 'BDT',
          isActive: true,
        });
      } catch (error: any) {
        failed.push({ tld: `.${tld}`, error: error?.message || 'Failed to fetch TLD pricing.' });
      }
    }

    if (!data.length) {
      return res.status(502).json({
        success: false,
        error: 'Openprovider did not return pricing for any supported TLD.',
        failed,
      });
    }
    domainPricingCache = { expiresAt: Date.now() + 60_000, data };
    return res.json({ success: true, data, failed });
  } catch (error: any) {
    console.error('Failed to fetch live domain pricing from Openprovider:', error);
    return res.status(502).json({ success: false, error: error?.message || 'Failed to fetch domain pricing.' });
  }
});

domainRouter.post('/renew', async (req: any, res: Response) => {
  try {
    const { domain, years } = req.body;
    if (!domain) return res.json({ success: false, error: 'domain is required' });

    const config = await getDomainConfig();
    const provider = getDomainProvider(config);
    const result = await provider.renewDomain(domain, years || 1);

    const db = getAdminDb();
    const domainSnap = await db.collection('domainOrders').where('domain', '==', domain).get();
    domainSnap.forEach(async (docSnap) => {
      await docSnap.ref.update({
        status: result.success ? 'renewing' : 'failed',
        expiresAt: result.newExpiryDate || null,
        updatedAt: new Date(),
      });
    });

    return res.json({ success: result.success, data: result, error: result.error });
  } catch (error: any) {
    console.error('Domain renew error:', error);
    return res.json({ success: false, error: error?.message || 'Internal server error' });
  }
});

domainRouter.post('/test-connection', async (req: any, res: Response) => {
  let providerType = 'dummy';
  try {
    const config = await getDomainConfig();
    providerType = config.domainApiType || 'dummy';
    const provider = getDomainProvider(config);
    if (provider.testConnection) {
      const result = await provider.testConnection();
      return res.json({ ...result, providerType });
    }

    const results = await provider.checkAvailability(['test-click2itbd.com']);
    const success = results.length > 0 && !results[0].error;
    return res.json({
      success,
      providerType,
      message: success ? 'Connection test successful' : 'Connection test failed',
      data: results,
    });
  } catch (error: any) {
    console.error('Domain test connection error:', error);
    return res.json({ success: false, providerType, message: error?.message || 'Internal server error' });
  }
});

domainRouter.post('/tld-pricing', async (req: any, res: Response) => {
  try {
    const { tld } = req.body;
    if (!tld) return res.json({ success: false, error: 'tld is required' });

    const config = await getDomainConfig();
    const provider = getDomainProvider(config);
    const result = await (provider as any).getTldPricing?.(tld);
    if (!result) {
      return res.json({ success: false, error: 'TLD pricing not available for this provider' });
    }

    const pricingSettings = await getDomainPricingSettings();
    const customerPriceBdt = calculateCustomerPriceBdt(result.registrationPrice, pricingSettings);

    return res.json({ 
      success: true, 
      data: { 
        tld: result.tld,
        currency: 'BDT',
        registrationPrice: customerPriceBdt,
        renewalPrice: calculateCustomerPriceBdt(result.renewalPrice, pricingSettings),
        transferPrice: calculateCustomerPriceBdt(result.transferPrice, pricingSettings),
        restorePrice: calculateCustomerPriceBdt(result.restorePrice, pricingSettings),
      } 
    });
  } catch (error: any) {
    console.error('Domain TLD pricing error:', error);
    return res.json({ success: false, error: error?.message || 'Internal server error' });
  }
});

domainRouter.post('/tld-pricing-batch', async (req: any, res: Response) => {
  try {
    const { tlds } = req.body;
    if (!Array.isArray(tlds) || !tlds.length) return res.json({ success: false, error: 'tlds array is required' });

    const config = await getDomainConfig();
    const provider = getDomainProvider(config);
    const result = await (provider as any).getBatchTldPricing?.(tlds);
    if (!result) {
      return res.json({ success: false, error: 'Batch TLD pricing not available for this provider' });
    }
    if (!result.pricing?.length) {
      return res.status(502).json({
        success: false,
        error: 'No TLD prices could be fetched',
        failed: result.failed || [],
      });
    }

    const pricingSettings = await getDomainPricingSettings();
    const pricing = result.pricing.map((item: any) => ({
      tld: item.tld,
      customerPriceBdt: calculateCustomerPriceBdt(item.supplierPriceUsd, pricingSettings),
      renewalPriceBdt: item.supplierRenewalPriceUsd === undefined
        ? undefined
        : calculateCustomerPriceBdt(item.supplierRenewalPriceUsd, pricingSettings),
      transferPriceBdt: item.supplierTransferPriceUsd === undefined
        ? undefined
        : calculateCustomerPriceBdt(item.supplierTransferPriceUsd, pricingSettings),
      currency: 'BDT',
    }));

    return res.json({ success: true, data: { pricing, failed: result.failed || [] } });
  } catch (error: any) {
    console.error('Domain batch TLD pricing error:', error);
    return res.json({ success: false, error: error?.message || 'Internal server error' });
  }
});

domainRouter.post('/renewal-price', async (req: any, res: Response) => {
  try {
    const { domain } = req.body;
    if (!domain) return res.json({ success: false, error: 'domain is required' });

    const config = await getDomainConfig();
    const provider = getDomainProvider(config);
    const result = await (provider as any).getRenewalPrice?.(domain);
    if (!result) {
      return res.json({ success: false, error: 'Renewal price not available for this provider' });
    }

    const pricingSettings = await getDomainPricingSettings();
    if (!result.success || !Number.isFinite(result.supplierPriceUsd) || result.supplierPriceUsd <= 0) {
      return res.status(502).json({ success: false, error: result.error || 'A valid renewal price is unavailable for this domain.' });
    }
    const customerPriceBdt = calculateCustomerPriceBdt(result.supplierPriceUsd, pricingSettings);

    return res.json({ 
      success: true, 
      data: { 
        domain: result.domain,
        tld: result.tld,
        renewalPriceBdt: customerPriceBdt,
        maxDuration: result.maxDuration,
      } 
    });
  } catch (error: any) {
    console.error('Domain renewal price error:', error);
    return res.json({ success: false, error: error?.message || 'Internal server error' });
  }
});

domainRouter.post('/renewal-price-breakdown', async (req: any, res: Response) => {
  try {
    const { domain } = req.body;
    if (!domain) return res.json({ success: false, error: 'domain is required' });

    const config = await getDomainConfig();
    const provider = getDomainProvider(config);
    const result = await (provider as any).getRenewalPriceBreakdown?.(domain);
    if (!result) {
      return res.json({ success: false, error: 'Renewal price breakdown not available for this provider' });
    }
    if (!result.success || !Number.isFinite(result.supplierPriceUsd) || result.supplierPriceUsd <= 0) {
      return res.status(502).json({ success: false, error: result.error || 'A valid renewal price is unavailable for this domain.' });
    }

    const pricingSettings = await getDomainPricingSettings();
    const customerPriceBdt = calculateCustomerPriceBdt(result.supplierPriceUsd, pricingSettings);
    const sellingPriceUsd = result.supplierPriceUsd * (1 + pricingSettings.markupPercent / 100);

    return res.json({ 
      success: true, 
      data: { 
        ...result,
        sellingPriceBdt: customerPriceBdt,
        sellingPriceUsd: Math.round(sellingPriceUsd * 100) / 100,
        markupAmountUsd: Math.round((sellingPriceUsd - result.supplierPriceUsd) * 100) / 100,
        markupPercent: pricingSettings.markupPercent,
        exchangeRate: pricingSettings.usdToBdtRate,
      } 
    });
  } catch (error: any) {
    console.error('Domain renewal price breakdown error:', error);
    return res.json({ success: false, error: error?.message || 'Internal server error' });
  }
});

domainRouter.post('/renewal-order', async (req: any, res: Response) => {
  try {
    const params = req.body;
    if (!params?.domain || !params?.renewalPeriod || !params?.customerName || !params?.customerEmail || !params?.customerPhone) {
      return res.json({ success: false, error: 'Missing required renewal order fields' });
    }

    const db = getAdminDb();
    const idempotencyKey = req.headers['x-idempotency-key']?.toString() || `${params.domain}-renewal-${params.renewalPeriod}`;

    const existingOrder = await db.collection('domain_renewals')
      .where('idempotencyKey', '==', idempotencyKey)
      .where('status', '!=', 'cancelled')
      .limit(1)
      .get();
    
    if (!existingOrder.empty) {
      const existing = existingOrder.docs[0];
      return res.json({ 
        success: true, 
        orderId: existing.id, 
        order: existing.data(),
        message: 'Duplicate request detected. Returning existing order.' 
      });
    }

    const config = await getDomainConfig();
    const provider = getDomainProvider(config);
    const pricingSettings = await getDomainPricingSettings();

    const renewalPeriod = Number(params.renewalPeriod);
    if (!Number.isInteger(renewalPeriod) || renewalPeriod < 1) {
      return res.status(400).json({ success: false, error: 'renewalPeriod must be a positive whole number of years' });
    }

    const renewalPriceResult = await provider.getRenewalPrice?.(params.domain);
    if (!renewalPriceResult?.success || !Number.isFinite(renewalPriceResult.supplierPriceUsd) || renewalPriceResult.supplierPriceUsd <= 0) {
      return res.status(502).json({
        success: false,
        error: renewalPriceResult?.error || 'A valid renewal price is unavailable for this domain.',
      });
    }
    if (renewalPeriod > renewalPriceResult.maxDuration) {
      return res.status(400).json({ success: false, error: `Renewal period cannot exceed ${renewalPriceResult.maxDuration} years` });
    }

    const supplierPriceUsd = renewalPriceResult.supplierPriceUsd * renewalPeriod;
    const customerPriceBdt = calculateCustomerPriceBdt(supplierPriceUsd, pricingSettings);

    const orderData = {
      userId: params.userId || 'guest',
      type: 'domain_renewal',
      documentNumber: `INV-${Date.now()}`,
      domain: params.domain,
      renewalPeriod: params.renewalPeriod,
      totalBdt: customerPriceBdt,
      status: 'pending_payment',
      paymentStatus: 'pending',
      renewalStatus: 'pending',
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      paymentMethod: params.paymentMethod || 'bkash',
      transactionId: params.transactionId || null,
      idempotencyKey,
      supplierPriceUsd,
      customerPriceBdt,
      pricingSettings,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const orderRef = db.collection('domain_renewals').doc();
    await orderRef.set(orderData);

    return res.json({
      success: true,
      orderId: orderRef.id,
      order: orderData,
    });
  } catch (error: any) {
    console.error('Create domain renewal order error:', error);
    return res.json({ success: false, error: error?.message || 'Internal server error' });
  }
});

domainRouter.post('/transfer', async (req: any, res: Response) => {
  try {
    const { domain, authCode, years, customerName, customerEmail, customerPhone } = req.body;
    if (!domain || !authCode) {
      return res.json({ success: false, error: 'domain and authCode are required' });
    }

    const db = getAdminDb();
    const idempotencyKey = req.headers['x-idempotency-key']?.toString() || `${domain}-transfer-${years || 1}`;

    const existingOrder = await db.collection('domain_transfers')
      .where('idempotencyKey', '==', idempotencyKey)
      .where('status', '!=', 'cancelled')
      .limit(1)
      .get();
    
    if (!existingOrder.empty) {
      const existing = existingOrder.docs[0];
      return res.json({ 
        success: true, 
        orderId: existing.id, 
        order: existing.data(),
        message: 'Duplicate request detected. Returning existing order.' 
      });
    }

    const config = await getDomainConfig();
    const provider = getDomainProvider(config);
    const pricingSettings = await getDomainPricingSettings();

    let supplierPriceUsd: number;
    try {
      const tld = domain.split('.').pop() || '';
      const tldPricing = await (provider as any).getTldPricing?.(tld);
      if (!tldPricing || !Number.isFinite(tldPricing.transferPrice) || tldPricing.transferPrice <= 0 || tldPricing.currency !== 'USD') {
        throw new Error('A valid USD transfer price is unavailable for this domain.');
      }
      supplierPriceUsd = tldPricing.transferPrice;
    } catch (error: any) {
      console.error('Failed to get supplier price for transfer:', error);
      return res.status(502).json({ success: false, error: error?.message || 'Failed to fetch domain transfer price' });
    }

    const customerPriceBdt = calculateCustomerPriceBdt(supplierPriceUsd, pricingSettings);

    const orderData = {
      userId: req.user?.uid || 'guest',
      type: 'domain_transfer',
      documentNumber: `TRN-${Date.now()}`,
      domain,
      years: years || 1,
      totalBdt: customerPriceBdt,
      status: 'pending_payment',
      paymentStatus: 'pending',
      transferStatus: 'pending',
      customerName: customerName || '',
      customerEmail: customerEmail || '',
      customerPhone: customerPhone || '',
      paymentMethod: req.body.paymentMethod || 'bkash',
      transactionId: req.body.transactionId || null,
      idempotencyKey,
      supplierPriceUsd,
      customerPriceBdt,
      pricingSettings,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const orderRef = db.collection('domain_transfers').doc();
    await orderRef.set(orderData);

    return res.json({
      success: true,
      orderId: orderRef.id,
      order: orderData,
    });
  } catch (error: any) {
    console.error('Create domain transfer order error:', error);
    return res.json({ success: false, error: error?.message || 'Internal server error' });
  }
});

domainRouter.post('/transfer/check-eligibility', async (req: any, res: Response) => {
  try {
    const { domain } = req.body;
    if (!domain) return res.json({ success: false, error: 'domain is required' });

    const config = await getDomainConfig();
    const provider = getDomainProvider(config);

    let eligible = false;
    let reason = 'Domain provider not configured';

    if (provider.checkAvailability) {
      const results = await provider.checkAvailability([domain]);
      const result = results[0];
      if (result && !result.available && !result.error) {
        eligible = true;
        reason = 'Domain is registered and may be eligible for transfer.';
      } else if (result?.error) {
        reason = result.error;
      } else if (result?.available) {
        reason = 'Domain is available for registration, not transfer.';
      }
    }

    return res.json({ success: true, data: { eligible, reason, domain } });
  } catch (error: any) {
    console.error('Transfer eligibility check error:', error);
    return res.json({ success: false, error: error?.message || 'Internal server error' });
  }
});

domainRouter.post('/fulfill', requireFirebaseAuth, async (req: any, res: Response) => {
  try {
    const { orderId, orderType } = req.body;
    if (!orderId || !orderType) {
      return res.json({ success: false, error: 'orderId and orderType are required' });
    }

    const isAdminUser = await isUserAdmin(req.user?.uid);
    if (!isAdminUser) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const db = getAdminDb();
    const collectionName = orderType === 'renewal' ? 'domain_renewals' : 
                          orderType === 'transfer' ? 'domain_transfers' : 'domainOrders';
    const orderRef = db.collection(collectionName).doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return res.json({ success: false, error: 'Order not found' });
    }

    const orderData = orderSnap.data();
    if (!orderData) {
      return res.json({ success: false, error: 'Order not found' });
    }

    if (orderData.status === 'active' || orderData.status === 'registered') {
      return res.json({ success: true, message: 'Order already fulfilled' });
    }

    const paidRenewal = orderType === 'renewal'
      && ['payment_received', 'verified'].includes(orderData.paymentStatus)
      && ['pending_payment', 'pending'].includes(orderData.status);
    if (!paidRenewal && orderData.status !== 'payment_verified' && orderData.status !== 'pending_fulfillment') {
      return res.json({ success: false, error: `Order status '${orderData.status}' is not eligible for fulfillment` });
    }

    const config = await getDomainConfig();
    const provider = getDomainProvider(config);

    let result;
    let fulfillmentType = orderType;

    try {
      if (orderType === 'renewal') {
        await orderRef.update({
          status: 'processing',
          renewalStatus: 'processing',
          updatedAt: new Date(),
        });
      }

      if (orderType === 'transfer') {
        const authCode = req.body.authCode || orderData.authCode;
        if (!authCode) {
          return res.json({ success: false, error: 'Auth code is required for transfer' });
        }
        result = await (provider as any).transferDomain?.(orderData.domain, authCode, orderData.years || 1);
        fulfillmentType = 'transfer';
      } else if (orderType === 'renewal') {
        result = await provider.renewDomain(orderData.domain, orderData.renewalPeriod || 1);
        fulfillmentType = 'renewal';
      } else {
        result = await provider.registerDomain({
          domain: orderData.domain,
          years: orderData.years || 1,
          contactId: orderData.contactId,
          nameServers: orderData.nameServers,
          autoRenew: orderData.autoRenew,
        });
        fulfillmentType = 'registration';
      }
    } catch (error: any) {
      const isProviderError = error instanceof ProviderError;
      const errorCode = isProviderError ? error.code : 'provider_error';
      const errorMessage = error.message || 'Fulfillment failed';

      const batch = db.batch();
      batch.update(orderRef, {
        status: 'manual_review',
        ...(orderType === 'renewal' ? { renewalStatus: 'failed' } : {}),
        fulfillmentError: errorMessage,
        errorCode,
        retryCount: (orderData.retryCount || 0) + 1,
        lastRetryAt: new Date(),
        updatedAt: new Date(),
      });

      const auditRef = db.collection('domainAuditLog').doc();
      batch.set(auditRef, {
        orderId,
        orderType,
        action: 'fulfillment_failed',
        error: errorMessage,
        errorCode,
        retryCount: (orderData.retryCount || 0) + 1,
        timestamp: new Date(),
        userId: req.user?.uid,
      });

      await batch.commit();

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
        await sendEmail({ 
          to: adminEmail, 
          subject: `Domain ${fulfillmentType} failed: ${orderData.domain}`, 
          html: `<p>Domain ${fulfillmentType} for <strong>${orderData.domain}</strong> failed: ${errorMessage}. Error code: ${errorCode}. Please review manually.</p>` 
        });
      }

      return res.json({ 
        success: false, 
        error: errorMessage, 
        errorCode,
        status: 'manual_review',
        retryCount: (orderData.retryCount || 0) + 1
      });
    }

    const isSuccess = result?.success || false;
    const newStatus = isSuccess ? 'active' : 'failed';

    const batch = db.batch();
    batch.update(orderRef, {
      status: newStatus,
      ...(orderType === 'renewal' ? { renewalStatus: isSuccess ? 'renewed' : 'failed' } : {}),
      registrationId: result?.registrationId || result?.transferId || orderData.registrationId || null,
      expiresAt: result?.expiresAt || orderData.expiresAt || null,
      newExpiryDate: result?.newExpiryDate || null,
      error: result?.error || null,
      providerStatus: result?.status || null,
      updatedAt: new Date(),
    });

    const auditRef = db.collection('domainAuditLog').doc();
    batch.set(auditRef, {
      orderId,
      orderType,
      action: isSuccess ? 'fulfilled' : 'fulfillment_failed',
      result: result,
      timestamp: new Date(),
      userId: req.user?.uid,
    });

    await batch.commit();

    if (isSuccess && orderData.customerEmail) {
      const templateKey = orderType === 'renewal' ? 'domainRenewalSuccess' : 
                         orderType === 'transfer' ? 'domainTransferSuccess' : 'domainRegistered';
      const subject = orderType === 'renewal' ? `Domain Renewed - ${orderData.domain}` :
                     orderType === 'transfer' ? `Domain Transferred - ${orderData.domain}` :
                     `Domain Registered - ${orderData.domain}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #16a34a;">Domain ${fulfillmentType === 'renewal' ? 'Renewed' : fulfillmentType === 'transfer' ? 'Transferred' : 'Registered'} Successfully!</h2>
          <p>Your domain <strong>${orderData.domain}</strong> has been successfully ${fulfillmentType === 'renewal' ? 'renewed' : fulfillmentType === 'transfer' ? 'transferred' : 'registered'}.</p>
          ${result?.expiresAt ? `<p><strong>Expires At:</strong> ${new Date(result.expiresAt).toLocaleDateString()}</p>` : ''}
          <p>Thank you for choosing Click2IT!</p>
        </div>
      `;
      await sendEmail({ to: orderData.customerEmail, subject, html });
    }

    return res.json({
      success: isSuccess,
      data: result,
      status: newStatus,
      error: isSuccess ? undefined : result?.error || 'Domain fulfillment failed',
    });
  } catch (error: any) {
    console.error('Domain fulfill error:', error);
    return res.json({ success: false, error: error?.message || 'Internal server error' });
  }
});

domainRouter.post('/retry', requireFirebaseAuth, async (req: any, res: Response) => {
  try {
    const { orderId, orderType } = req.body;
    if (!orderId || !orderType) {
      return res.json({ success: false, error: 'orderId and orderType are required' });
    }

    const isAdminUser = await isUserAdmin(req.user?.uid);
    if (!isAdminUser) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const db = getAdminDb();
    const collectionName = orderType === 'renewal' ? 'domain_renewals' : 
                          orderType === 'transfer' ? 'domain_transfers' : 'domainOrders';
    const orderRef = db.collection(collectionName).doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return res.json({ success: false, error: 'Order not found' });
    }

    const orderData = orderSnap.data();
    if (!orderData) {
      return res.json({ success: false, error: 'Order not found' });
    }

    if (orderData.status !== 'manual_review' && orderData.status !== 'failed') {
      return res.json({ success: false, error: `Order status '${orderData.status}' is not eligible for retry` });
    }

    const batch = db.batch();
    batch.update(orderRef, {
      status: 'pending_fulfillment',
      fulfillmentError: null,
      errorCode: null,
      updatedAt: new Date(),
    });

    const auditRef = db.collection('domainAuditLog').doc();
    batch.set(auditRef, {
      orderId,
      orderType,
      action: 'retry_initiated',
      timestamp: new Date(),
      userId: req.user?.uid,
    });

    await batch.commit();

    return res.json({ success: true, message: 'Retry initiated. Please call /fulfill to execute.' });
  } catch (error: any) {
    console.error('Domain retry error:', error);
    return res.json({ success: false, error: error?.message || 'Internal server error' });
  }
});

domainRouter.post('/manual-review', requireFirebaseAuth, async (req: any, res: Response) => {
  try {
    const { orderId, orderType, reason } = req.body;
    if (!orderId || !orderType) {
      return res.json({ success: false, error: 'orderId and orderType are required' });
    }

    const isAdminUser = await isUserAdmin(req.user?.uid);
    if (!isAdminUser) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const db = getAdminDb();
    const collectionName = orderType === 'renewal' ? 'domain_renewals' : 
                          orderType === 'transfer' ? 'domain_transfers' : 'domainOrders';
    const orderRef = db.collection(collectionName).doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return res.json({ success: false, error: 'Order not found' });
    }

    const batch = db.batch();
    batch.update(orderRef, {
      status: 'manual_review',
      manualReviewReason: reason || 'Moved to manual review by admin',
      updatedAt: new Date(),
    });

    const auditRef = db.collection('domainAuditLog').doc();
    batch.set(auditRef, {
      orderId,
      orderType,
      action: 'manual_review',
      reason: reason || 'Moved to manual review by admin',
      timestamp: new Date(),
      userId: req.user?.uid,
    });

    await batch.commit();

    return res.json({ success: true, message: 'Order moved to manual review' });
  } catch (error: any) {
    console.error('Domain manual review error:', error);
    return res.json({ success: false, error: error?.message || 'Internal server error' });
  }
});

domainRouter.post('/transfer-auth-codes', requireFirebaseAuth, async (req: any, res: Response) => {
  try {
    const { orderId, authCodes } = req.body;
    const userId = req.user?.uid;

    if (!orderId || !Array.isArray(authCodes) || authCodes.length === 0) {
      return res.status(400).json({ success: false, error: 'orderId and authCodes array are required' });
    }

    // Verify the caller owns this order (or is admin)
    const db = getAdminDb();
    const orderSnap = await db.collection('orders').doc(orderId).get();
    if (!orderSnap.exists) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    const orderData = orderSnap.data();
    const isAdmin = await isUserAdmin(userId).catch(() => false);
    if (!isAdmin && orderData?.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const transferDomains = new Set(
      (Array.isArray(orderData?.items) ? orderData.items : [])
        .filter((item: any) => item.itemType === 'domain_transfer')
        .map((item: any) => String(item.domain || item.id?.replace(/^domain_transfer_/, '') || '').trim().toLowerCase())
        .filter(Boolean)
    );
    const validatedCodes = authCodes.map((entry: any) => ({
      domain: String(entry?.domain || '').trim().toLowerCase(),
      authCode: String(entry?.authCode || '').trim(),
    }));
    if (
      validatedCodes.some((entry: any) => !entry.domain || !transferDomains.has(entry.domain) || entry.authCode.length < 5)
      || validatedCodes.length !== transferDomains.size
      || new Set(validatedCodes.map((entry: any) => entry.domain)).size !== transferDomains.size
    ) {
      return res.status(400).json({ success: false, error: 'Provide a valid Auth/EPP code for every domain transfer in this order.' });
    }

    const batch = db.batch();

    for (const { domain, authCode } of validatedCodes) {
      const docRef = db.collection('transferAuthCodes').doc(`${orderId}_${domain}`);
      batch.set(docRef, {
        orderId,
        domain,
        authCode,
        submittedBy: userId,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
    }
    
    await batch.commit();
    return res.json({ success: true, message: 'Transfer auth codes stored securely' });
  } catch (error: any) {
    console.error('[Domain] Store transfer auth codes error:', error);
    return res.status(500).json({ success: false, error: 'Failed to store transfer auth codes' });
  }
});

domainRouter.post('/manage', requireFirebaseAuth, async (req: any, res: Response) => {
  try {
    const { command, domain, extraParams } = req.body;
    if (!command || !domain) {
      return res.status(400).json({ success: false, error: 'command and domain are required' });
    }

    const allowedCommands = ['set_ns', 'renew'];
    if (!allowedCommands.includes(command)) {
      return res.status(400).json({ success: false, error: 'Invalid command' });
    }

    const config = await getDomainConfig();
    const { provider, viaBtcl } = await resolveDomainProvider(domain, { domainApiType: config.domainApiType || 'dummy', domainApiKey: config.domainApiKey });

    if (isBdDomain(domain) && !viaBtcl) {
      // No BTCL API configured -> client should fall back to the manual admin approval queue
      return res.json({ success: false, manualRequired: true, error: 'BTCL API is not enabled. Request queued for manual update.' });
    }
    
    if (command === 'set_ns') {
      const result = await (provider as any).setNameservers(domain, extraParams?.ns0, extraParams?.ns1, extraParams?.ns2, extraParams?.ns3);
      if (result.success) {
        // Update Firestore
        try {
          const db = getAdminDb();
          const domainsRef = db.collection('domainOrders');
          const snap = await domainsRef.where('domain', '==', domain).where('status', '==', 'active').get();
          
          if (!snap.empty) {
            const doc = snap.docs[0];
            const newNs = [extraParams?.ns0, extraParams?.ns1, extraParams?.ns2, extraParams?.ns3].filter(Boolean);
            await doc.ref.update({ nameServers: newNs, nameservers: newNs, updatedAt: new Date() });
          }
        } catch (dbErr) {
          console.error('Failed to update Firestore after set_ns:', dbErr);
        }
      }
      return res.json({ success: result.success, data: result, error: result.error });
    }
    
    if (command === 'renew') {
      const result = await provider.renewDomain(domain, extraParams?.duration || 1);
      return res.json({ success: result.success, data: result, error: result.error });
    }

    return res.status(400).json({ success: false, error: 'Unsupported command' });
  } catch (error: any) {
    console.error('Domain manage error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
});

domainRouter.get('/balance', requireFirebaseAuth, async (req: any, res: Response) => {
  try {
    const isAdminUser = await isUserAdmin(req.user?.uid);
    if (!isAdminUser) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const config = await getDomainConfig();
    const provider = getDomainProvider(config);
    
    if (provider.getBalance) {
      const result = await provider.getBalance();
      return res.json(result);
    }
    return res.json({ success: false, error: 'Balance check not supported by provider' });
  } catch (error: any) {
    console.error('Domain balance error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
});

domainRouter.post('/sync-pricing', requireFirebaseAuth, async (req: any, res: Response) => {
  try {
    const isAdminUser = await isUserAdmin(req.user?.uid);
    if (!isAdminUser) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const config = await getDomainConfig();
    const provider = getDomainProvider(config);
    
    if (!provider.getTldPricing) {
      return res.json({ success: false, error: 'Pricing sync not supported by provider' });
    }

    const { tlds } = req.body;
    if (!tlds || !Array.isArray(tlds)) {
      return res.json({ success: false, error: 'tlds array required' });
    }

    const synced = [];
    const failed = [];
    const db = getAdminDb();
    const pricingSettings = await getDomainPricingSettings();

    for (const tld of tlds) {
      try {
        const cleanTld = String(tld).trim().replace(/^\./, '').toLowerCase();
        const result = await provider.getTldPricing(cleanTld);
        if (result && result.registrationPrice > 0 && result.currency === 'USD') {
          const cost = result.registrationPrice;
          const registerPriceBdt = calculateCustomerPriceBdt(cost, pricingSettings);
          const renewPriceBdt = calculateCustomerPriceBdt(result.renewalPrice, pricingSettings);
          const transferPriceBdt = calculateCustomerPriceBdt(result.transferPrice, pricingSettings);
          
          const tldStr = `.${cleanTld}`;
          const ref = db.collection('domainPricing').doc(tldStr.replace('.', ''));
          
          await ref.set({
            tld: tldStr,
            registerPrice: registerPriceBdt,
            renewPrice: renewPriceBdt,
            transferPrice: transferPriceBdt,
            currency: 'BDT',
            isActive: true,
            supplierPriceUsd: cost,
            updatedAt: new Date()
          }, { merge: true });

          synced.push({ tld: tldStr, price: registerPriceBdt });
        } else {
          failed.push({ tld, error: 'Provider returned invalid or unsupported pricing data' });
        }
      } catch (e: any) {
        console.warn(`Failed to sync ${tld}:`, e.message);
        failed.push({ tld, error: e.message || 'Failed to fetch TLD pricing' });
      }
    }

    if (synced.length === 0) {
      return res.status(502).json({ success: false, error: 'No TLD prices could be synchronized', synced, failed });
    }
    domainPricingCache = null;
    return res.json({ success: true, synced, failed });
  } catch (error: any) {
    console.error('Domain sync error:', error);
    try { import('fs').then(fs => fs.appendFileSync('sync-error.log', new Date().toISOString() + ' ' + (error?.stack || error?.message || error) + '\n')); } catch (e) {}
    return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
});

async function requireAdmin(req: any, res: Response): Promise<boolean> {
  const ok = await isUserAdmin(req.user?.uid).catch(() => false);
  if (!ok) {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return false;
  }
  return true;
}

domainRouter.get('/btcl/settings', requireFirebaseAuth, async (req: any, res: Response) => {
  if (!(await requireAdmin(req, res))) return;
  try {
    return res.json({ success: true, data: maskBtclConfig(await getBtclConfig()) });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Failed to load BTCL settings' });
  }
});

domainRouter.post('/btcl/settings', requireFirebaseAuth, async (req: any, res: Response) => {
  if (!(await requireAdmin(req, res))) return;
  try {
    const b = req.body || {};
    await saveBtclConfig({
      enabled: !!b.enabled,
      baseUrl: String(b.baseUrl || '').trim(),
      authType: ['bearer', 'basic', 'header'].includes(b.authType) ? b.authType : 'bearer',
      apiKey: b.apiKey ? String(b.apiKey) : undefined,
      username: b.username != null ? String(b.username) : undefined,
      password: b.password ? String(b.password) : undefined,
      apiKeyHeader: b.apiKeyHeader ? String(b.apiKeyHeader) : undefined,
      endpoints: b.endpoints || undefined,
    });
    return res.json({ success: true, data: maskBtclConfig(await getBtclConfig()) });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Failed to save BTCL settings' });
  }
});

domainRouter.post('/btcl/test', requireFirebaseAuth, async (req: any, res: Response) => {
  if (!(await requireAdmin(req, res))) return;
  try {
    const cfg = await getBtclConfig();
    if (!cfg.baseUrl) return res.json({ success: false, message: 'BTCL base URL is not configured' });
    const result = await new BtclDomainProvider(cfg).testConnection();
    return res.json(result);
  } catch (error: any) {
    return res.json({ success: false, message: error?.message || 'BTCL test failed' });
  }
});

export default domainRouter;
