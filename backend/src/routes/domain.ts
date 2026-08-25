import { Router, Response } from 'express';
import { getAdminDb } from '../firebase/admin';
import { getDomainProvider } from '../providers/providerFactory';
import { DomainAvailabilityResult, DomainRegistrationRequest, DomainRegistrationResult, WhoisResult, DomainTransferResult } from '../providers/domain/IDomainProvider';
import { sendEmail } from '../services/email';
import { getAdminDocument, isUserAdmin } from '../firebase/admin';
import { getDomainPricingSettings, calculateCustomerPriceBdt } from '../services/domainPricing';
import { ProviderError } from '../providers/domain/DynadotDomainProvider';
import { requireFirebaseAuth } from '../middleware/firebaseAuth';
import { config } from '../config';

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
  const dynadotApiKey = process.env.DYNADOT_API_KEY || config.secrets.dynadotApiKey;
  return {
    domainApiType: dynadotApiKey ? 'dynadot' : 'dummy',
    domainApiKey: dynadotApiKey || ''
  };
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
    const pricingSettings = await getDomainPricingSettings();
    const results: DomainAvailabilityResult[] = await provider.checkAvailability(domains);

    const enriched = results.map(r => {
      const priceBdt = r.price && r.price > 0 ? calculateCustomerPriceBdt(r.price, pricingSettings) : undefined;
      return {
        ...r,
        price: priceBdt || r.price,
        priceBdt: priceBdt,
      };
    });

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
    const provider = getDomainProvider({ domainApiType: config.domainApiType || 'dummy', domainApiKey: config.domainApiKey });
    const pricingSettings = await getDomainPricingSettings();

    let supplierPriceUsd = 0;
    try {
      const tld = request.domain.split('.').pop() || '';
      const tldPricing = await provider.getTldPricing?.(tld);
      if (tldPricing) {
        supplierPriceUsd = tldPricing.registrationPrice;
      }
    } catch (e) {
      console.warn('Failed to get supplier price for registration:', e);
    }

    const customerPriceBdt = supplierPriceUsd > 0 ? calculateCustomerPriceBdt(supplierPriceUsd, pricingSettings) : 0;

    const orderRef = db.collection('domainOrders').doc();
    await orderRef.set({
      domain: request.domain,
      years: request.years || 1,
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
        years: request.years || 1,
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
    const db = getAdminDb();
    const snap = await db.collection('domainPricing').orderBy('tld', 'asc').get();
    if (!snap.empty) {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as DomainPricing[];
      return res.json({ success: true, data });
    }
  } catch (error: any) {
    // Firestore query failed or not configured — fall back to dynamic default table
  }

  try {
    const pricingSettings = await getDomainPricingSettings();
    const defaultPrices: Record<string, { register: number; renew: number; transfer: number }> = {
      com: { register: 10.99, renew: 11.99, transfer: 10.99 },
      net: { register: 12.99, renew: 13.99, transfer: 12.99 },
      org: { register: 11.99, renew: 12.99, transfer: 11.99 },
      info: { register: 4.99, renew: 19.99, transfer: 19.99 },
      biz: { register: 5.99, renew: 18.99, transfer: 18.99 },
      co: { register: 27.99, renew: 27.99, transfer: 27.99 },
      xyz: { register: 2.99, renew: 12.99, transfer: 12.99 },
      store: { register: 3.99, renew: 29.99, transfer: 29.99 },
      online: { register: 3.99, renew: 34.99, transfer: 34.99 },
      site: { register: 3.99, renew: 31.99, transfer: 31.99 },
      me: { register: 14.99, renew: 18.99, transfer: 18.99 },
      club: { register: 12.99, renew: 15.99, transfer: 15.99 },
      top: { register: 2.99, renew: 6.99, transfer: 6.99 },
      io: { register: 39.99, renew: 49.99, transfer: 49.99 },
      dev: { register: 14.99, renew: 16.99, transfer: 16.99 },
      tech: { register: 4.99, renew: 24.99, transfer: 24.99 },
      bd: { register: 25.00, renew: 25.00, transfer: 25.00 },
      'com.bd': { register: 25.00, renew: 25.00, transfer: 25.00 },
    };

    const fallbackPricingList = Object.entries(defaultPrices).map(([tld, p]) => ({
      id: tld,
      tld,
      registerPrice: calculateCustomerPriceBdt(p.register, pricingSettings),
      renewPrice: calculateCustomerPriceBdt(p.renew, pricingSettings),
      transferPrice: calculateCustomerPriceBdt(p.transfer, pricingSettings),
      currency: 'BDT',
      isActive: true,
    }));

    return res.json({ success: true, data: fallbackPricingList });
  } catch (err: any) {
    return res.json({ success: true, data: [] });
  }
});

domainRouter.post('/renew', async (req: any, res: Response) => {
  try {
    const { domain, years } = req.body;
    if (!domain) return res.json({ success: false, error: 'domain is required' });

    const config = await getDomainConfig();
    const provider = getDomainProvider({ domainApiType: config.domainApiType || 'dummy', domainApiKey: config.domainApiKey });
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

domainRouter.post('/tld-pricing', async (req: any, res: Response) => {
  try {
    const { tld } = req.body;
    if (!tld) return res.json({ success: false, error: 'tld is required' });

    const config = await getDomainConfig();
    const provider = getDomainProvider({ domainApiType: config.domainApiType || 'dummy', domainApiKey: config.domainApiKey });
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
    const provider = getDomainProvider({ domainApiType: config.domainApiType || 'dummy', domainApiKey: config.domainApiKey });
    const result = await (provider as any).getBatchTldPricing?.(tlds);
    if (!result) {
      return res.json({ success: false, error: 'Batch TLD pricing not available for this provider' });
    }

    const pricingSettings = await getDomainPricingSettings();
    const pricing = result.pricing.map((item: any) => ({
      tld: item.tld,
      customerPriceBdt: calculateCustomerPriceBdt(item.customerPriceBdt, pricingSettings),
      currency: 'BDT',
    }));

    return res.json({ success: true, data: { pricing } });
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
    const provider = getDomainProvider({ domainApiType: config.domainApiType || 'dummy', domainApiKey: config.domainApiKey });
    const result = await (provider as any).getRenewalPrice?.(domain);
    if (!result) {
      return res.json({ success: false, error: 'Renewal price not available for this provider' });
    }

    const pricingSettings = await getDomainPricingSettings();
    const customerPriceBdt = calculateCustomerPriceBdt(result.renewalPriceBdt, pricingSettings);

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
    const provider = getDomainProvider({ domainApiType: config.domainApiType || 'dummy', domainApiKey: config.domainApiKey });
    const result = await (provider as any).getRenewalPriceBreakdown?.(domain);
    if (!result) {
      return res.json({ success: false, error: 'Renewal price breakdown not available for this provider' });
    }

    const pricingSettings = await getDomainPricingSettings();
    const customerPriceBdt = calculateCustomerPriceBdt(result.supplierPriceUsd, pricingSettings);
    const retailUsd = result.supplierPriceUsd * (1 + pricingSettings.markupPercent / 100);

    return res.json({ 
      success: true, 
      data: { 
        ...result,
        sellingPriceBdt: customerPriceBdt,
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
    const provider = getDomainProvider({ domainApiType: config.domainApiType || 'dummy', domainApiKey: config.domainApiKey });
    const pricingSettings = await getDomainPricingSettings();

    let supplierPriceUsd = 0;
    try {
      const renewalPriceResult = await (provider as any).getRenewalPrice?.(params.domain);
      if (renewalPriceResult) {
        // Use the USD supplier price, not the BDT price, to avoid double conversion
        supplierPriceUsd = renewalPriceResult.supplierPriceUsd || renewalPriceResult.sellingPriceUsd || 0;
      }
    } catch (e) {
      console.warn('[Domain] Failed to get supplier price for renewal:', e);
    }

    const customerPriceBdt = supplierPriceUsd > 0 ? calculateCustomerPriceBdt(supplierPriceUsd, pricingSettings) : params.totalBdt || 0;

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
    const provider = getDomainProvider({ domainApiType: config.domainApiType || 'dummy', domainApiKey: config.domainApiKey });
    const pricingSettings = await getDomainPricingSettings();

    let supplierPriceUsd = 0;
    try {
      const tld = domain.split('.').pop() || '';
      const tldPricing = await (provider as any).getTldPricing?.(tld);
      if (tldPricing) {
        supplierPriceUsd = tldPricing.transferPrice;
      }
    } catch (e) {
      console.warn('Failed to get supplier price for transfer:', e);
    }

    const customerPriceBdt = supplierPriceUsd > 0 ? calculateCustomerPriceBdt(supplierPriceUsd, pricingSettings) : 0;

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
    const provider = getDomainProvider({ domainApiType: config.domainApiType || 'dummy', domainApiKey: config.domainApiKey });

    let eligible = false;
    let reason = 'Domain provider not configured';

    if (config.domainApiType === 'dynadot' && (provider as any).checkAvailability) {
      const results = await (provider as any).checkAvailability([domain]);
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

    if (orderData.status !== 'payment_verified' && orderData.status !== 'pending_fulfillment') {
      return res.json({ success: false, error: `Order status '${orderData.status}' is not eligible for fulfillment` });
    }

    const config = await getDomainConfig();
    const provider = getDomainProvider({ domainApiType: config.domainApiType || 'dummy', domainApiKey: config.domainApiKey });

    let result;
    let fulfillmentType = orderType;

    try {
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

    return res.json({ success: isSuccess, data: result, status: newStatus });
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

    const batch = db.batch();

    for (const codeData of authCodes) {
      const { domain, authCode } = codeData;
      if (!domain || !authCode) continue;
      
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
    const provider = getDomainProvider({ domainApiType: config.domainApiType || 'dummy', domainApiKey: config.domainApiKey });
    
    if (command === 'set_ns') {
      const result = await (provider as any).setNameservers(domain, extraParams?.ns0, extraParams?.ns1);
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

export default domainRouter;
