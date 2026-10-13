import { Router } from 'express';
import { getAdminDb } from '../firebase/admin.js';
import { getDomainProvider } from '../providers/providerFactory.js';
import { sendEmail } from '../services/email.js';
import { getAdminDocument, isUserAdmin } from '../firebase/admin.js';
import { getDomainPricingSettings, calculateCustomerPriceBdt } from '../services/domainPricing.js';
import { ProviderError } from '../providers/domain/DomainProviderError.js';
import { BtclDomainProvider, isBdDomain } from '../providers/domain/BtclDomainProvider.js';
import { resolveDomainProvider, getBtclConfig, saveBtclConfig, maskBtclConfig } from '../services/btclConfig.js';
import { requireFirebaseAuth } from '../middleware/firebaseAuth.js';
import { getDomainProviderConfig as getDomainConfig } from '../services/domainProviderConfig.js';
const domainRouter = Router();
let domainPricingCache = null;
const PRICED_TLDS = ['com', 'net', 'org', 'xyz', 'io', 'co', 'dev', 'online', 'info', 'biz', 'store'];
export const DEFAULT_CATALOG = [
    { tld: '.com', registerPrice: 1708, renewPrice: 2421, transferPrice: 1708, currency: 'BDT', isActive: true },
    { tld: '.net', registerPrice: 2215, renewPrice: 2851, transferPrice: 2851, currency: 'BDT', isActive: true },
    { tld: '.org', registerPrice: 1211, renewPrice: 2980, transferPrice: 2851, currency: 'BDT', isActive: true },
    { tld: '.xyz', registerPrice: 428, renewPrice: 3151, transferPrice: 3151, currency: 'BDT', isActive: true },
    { tld: '.io', registerPrice: 10692, renewPrice: 12831, transferPrice: 10692, currency: 'BDT', isActive: true },
    { tld: '.co', registerPrice: 1425, renewPrice: 6699, transferPrice: 5701, currency: 'BDT', isActive: true },
    { tld: '.dev', registerPrice: 3420, renewPrice: 3420, transferPrice: 3420, currency: 'BDT', isActive: true },
    { tld: '.online', registerPrice: 712, renewPrice: 4275, transferPrice: 4275, currency: 'BDT', isActive: true },
    { tld: '.biz', registerPrice: 3134, renewPrice: 4133, transferPrice: 3134, currency: 'BDT', isActive: true },
    { tld: '.info', registerPrice: 854, renewPrice: 5701, transferPrice: 3847, currency: 'BDT', isActive: true },
    { tld: '.store', registerPrice: 854, renewPrice: 6699, transferPrice: 6699, currency: 'BDT', isActive: true },
];
export async function getEffectiveDomainPricingList() {
    try {
        const db = getAdminDb();
        const snap = await db.collection('domainPricing').get();
        const map = new Map();
        for (const item of DEFAULT_CATALOG) {
            map.set(item.tld.toLowerCase(), { ...item });
        }
        for (const doc of snap.docs) {
            const data = doc.data();
            if (!data)
                continue;
            const rawTld = String(data.tld || doc.id).trim().toLowerCase();
            const formattedTld = rawTld.startsWith('.') ? rawTld : `.${rawTld}`;
            map.set(formattedTld, {
                tld: formattedTld,
                registerPrice: Number(data.registerPrice) || map.get(formattedTld)?.registerPrice || 1708,
                renewPrice: Number(data.renewPrice) || map.get(formattedTld)?.renewPrice || 2421,
                transferPrice: Number(data.transferPrice) || map.get(formattedTld)?.transferPrice || 1708,
                currency: data.currency || 'BDT',
                isActive: data.isActive !== false,
            });
        }
        return Array.from(map.values()).filter(p => p.isActive);
    }
    catch (error) {
        console.warn('[Domain] Failed to read domainPricing from Firestore, returning default catalog:', error);
        return DEFAULT_CATALOG;
    }
}
domainRouter.get('/check', async (req, res) => {
    try {
        const domains = Array.isArray(req.body.domains) ? req.body.domains : [];
        if (!domains.length)
            return res.json({ success: false, error: 'domains array is required' });
        const config = await getDomainConfig();
        const provider = getDomainProvider(config);
        const results = await provider.checkAvailability(domains);
        return res.json({ success: true, data: results });
    }
    catch (error) {
        console.error('Domain check error:', error);
        return res.json({ success: false, error: error?.message || 'Internal server error' });
    }
});
domainRouter.post('/check', async (req, res) => {
    try {
        const domains = Array.isArray(req.body.domains) ? req.body.domains : [];
        if (!domains.length)
            return res.json({ success: false, error: 'domains array is required' });
        const config = await getDomainConfig();
        const provider = getDomainProvider(config);
        let pricingSettings = { usdToBdtRate: 123, markupPercent: 15 };
        try {
            pricingSettings = await getDomainPricingSettings();
        }
        catch { }
        let results = [];
        try {
            results = await provider.checkAvailability(domains);
        }
        catch (error) {
            console.warn('[Domain] Provider checkAvailability failed, using DNS fallback:', error?.message);
        }
        // If provider returned empty or all with errors, fall back to DNS checks with public resolvers
        if (!results.length || results.every(r => r.error)) {
            try {
                const dns = await import('dns');
                dns.setServers(['8.8.8.8', '1.1.1.1']);
                results = await Promise.all(domains.map(async (domainStr) => {
                    const clean = String(domainStr).trim().toLowerCase();
                    let isRegistered = false;
                    try {
                        const ns = await dns.promises.resolveNs(clean);
                        if (ns && ns.length > 0)
                            isRegistered = true;
                    }
                    catch { }
                    if (!isRegistered) {
                        try {
                            const a = await dns.promises.resolve4(clean);
                            if (a && a.length > 0)
                                isRegistered = true;
                        }
                        catch { }
                    }
                    return {
                        domain: clean,
                        available: !isRegistered,
                    };
                }));
            }
            catch (dnsErr) {
                console.warn('[Domain] DNS fallback check error:', dnsErr);
                results = domains.map((d) => ({ domain: d, available: false }));
            }
        }
        const fullPricing = await getEffectiveDomainPricingList();
        const enriched = results.map(r => {
            const parts = r.domain.split('.');
            const tld = parts.length > 1 ? parts.slice(1).join('.').toLowerCase() : '';
            const formattedTld = `.${tld}`;
            const match = fullPricing.find(p => p.tld.toLowerCase() === formattedTld)
                || fullPricing.find(p => p.tld.toLowerCase().replace(/^\./, '') === tld)
                || fullPricing[0]
                || DEFAULT_CATALOG[0];
            const priceBdt = match?.registerPrice || 1708;
            const renewalPriceBdt = match?.renewPrice || 2421;
            return {
                ...r,
                price: priceBdt,
                priceBdt: priceBdt,
                renewalPrice: renewalPriceBdt,
                currency: 'BDT',
                error: undefined,
            };
        });
        return res.json({ success: true, data: enriched });
    }
    catch (error) {
        console.error('Domain check error:', error);
        return res.json({ success: false, error: error?.message || 'Internal server error' });
    }
});
domainRouter.post('/suggestions', async (req, res) => {
    try {
        const { domain } = req.body;
        if (!domain)
            return res.json({ success: false, error: 'domain is required' });
        const config = await getDomainConfig();
        const provider = getDomainProvider(config);
        const suggestions = await provider.getSuggestions(domain);
        return res.json({ success: true, data: suggestions });
    }
    catch (error) {
        console.error('Domain suggestions error:', error);
        return res.json({ success: false, error: error?.message || 'Internal server error' });
    }
});
domainRouter.post('/register', async (req, res) => {
    try {
        const request = req.body;
        if (!request?.domain)
            return res.json({ success: false, error: 'domain is required' });
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
        let supplierPriceUsd = 0;
        try {
            const tld = request.domain.split('.').pop() || '';
            const tldPricing = await provider.getTldPricing?.(tld);
            if (tldPricing && Number.isFinite(tldPricing.registrationPrice) && tldPricing.registrationPrice > 0 && tldPricing.currency === 'USD') {
                supplierPriceUsd = tldPricing.registrationPrice;
            }
        }
        catch (error) {
            console.warn('[Domain] Failed to get live supplier price for registration, using stored catalog:', error?.message);
        }
        if (!supplierPriceUsd || supplierPriceUsd <= 0) {
            const tld = request.domain.split('.').pop()?.toLowerCase() || 'com';
            const fullPricing = await getEffectiveDomainPricingList();
            const match = fullPricing.find(p => p.tld.replace(/^\./, '') === tld) || DEFAULT_CATALOG[0];
            const customerPrice = match.registerPrice || 1708;
            supplierPriceUsd = Math.round((customerPrice / pricingSettings.usdToBdtRate) * 100) / 100;
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
    }
    catch (error) {
        console.error('Domain register error:', error);
        return res.json({ success: false, error: error?.message || 'Internal server error' });
    }
});
domainRouter.post('/whois', async (req, res) => {
    try {
        const { domain } = req.body;
        if (!domain)
            return res.json({ success: false, error: 'domain is required' });
        const config = await getDomainConfig();
        const provider = getDomainProvider(config);
        const result = await provider.getWhois(domain);
        return res.json({ success: true, data: result });
    }
    catch (error) {
        console.error('Domain whois error:', error);
        return res.json({ success: false, error: error?.message || 'Internal server error' });
    }
});
domainRouter.get('/pricing', async (req, res) => {
    if (domainPricingCache && domainPricingCache.expiresAt > Date.now()) {
        return res.json({ success: true, data: domainPricingCache.data });
    }
    try {
        const config = await getDomainConfig();
        const provider = getDomainProvider(config);
        let pricingSettings = { usdToBdtRate: 123, markupPercent: 15 };
        try {
            pricingSettings = await getDomainPricingSettings();
        }
        catch { }
        const data = [];
        const failed = [];
        if (provider.getTldPricing) {
            for (const tld of PRICED_TLDS) {
                try {
                    const quote = await provider.getTldPricing(tld);
                    if (quote.currency === 'USD'
                        && Number.isFinite(quote.registrationPrice) && quote.registrationPrice > 0
                        && Number.isFinite(quote.renewalPrice) && quote.renewalPrice > 0
                        && Number.isFinite(quote.transferPrice) && quote.transferPrice > 0) {
                        data.push({
                            tld: quote.tld.startsWith('.') ? quote.tld : `.${quote.tld}`,
                            registerPrice: calculateCustomerPriceBdt(quote.registrationPrice, pricingSettings),
                            renewPrice: calculateCustomerPriceBdt(quote.renewalPrice, pricingSettings),
                            transferPrice: calculateCustomerPriceBdt(quote.transferPrice, pricingSettings),
                            currency: 'BDT',
                            isActive: true,
                        });
                    }
                }
                catch (error) {
                    failed.push({ tld: `.${tld}`, error: error?.message || 'Failed to fetch TLD pricing.' });
                }
            }
        }
        if (data.length > 0) {
            domainPricingCache = { expiresAt: Date.now() + 60_000, data };
            return res.json({ success: true, data, failed });
        }
        // Fallback: If Openprovider failed or returned nothing, serve from Firestore / default catalogue
        console.warn('[Domain] Live Openprovider pricing unavailable, returning Firestore fallback catalog.');
        const fallbackData = await getEffectiveDomainPricingList();
        domainPricingCache = { expiresAt: Date.now() + 120_000, data: fallbackData };
        return res.json({ success: true, data: fallbackData, isFallback: true });
    }
    catch (error) {
        console.error('Failed to fetch domain pricing, using fallback catalogue:', error);
        const fallbackData = await getEffectiveDomainPricingList();
        return res.json({ success: true, data: fallbackData, isFallback: true });
    }
});
domainRouter.post('/renew', async (req, res) => {
    try {
        const { domain, years } = req.body;
        if (!domain)
            return res.json({ success: false, error: 'domain is required' });
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
    }
    catch (error) {
        console.error('Domain renew error:', error);
        return res.json({ success: false, error: error?.message || 'Internal server error' });
    }
});
domainRouter.post('/test-connection', async (req, res) => {
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
    }
    catch (error) {
        console.error('Domain test connection error:', error);
        return res.json({ success: false, providerType, message: error?.message || 'Internal server error' });
    }
});
domainRouter.post('/tld-pricing', async (req, res) => {
    try {
        const { tld } = req.body;
        if (!tld)
            return res.json({ success: false, error: 'tld is required' });
        const cleanTld = String(tld).trim().replace(/^\./, '').toLowerCase();
        const formattedTld = `.${cleanTld}`;
        let pricingSettings = { usdToBdtRate: 123, markupPercent: 15 };
        try {
            pricingSettings = await getDomainPricingSettings();
        }
        catch { }
        const config = await getDomainConfig();
        const provider = getDomainProvider(config);
        if (provider.getTldPricing) {
            try {
                const result = await provider.getTldPricing(cleanTld);
                if (result && result.registrationPrice > 0) {
                    return res.json({
                        success: true,
                        data: {
                            tld: formattedTld,
                            currency: 'BDT',
                            registrationPrice: calculateCustomerPriceBdt(result.registrationPrice, pricingSettings),
                            renewalPrice: calculateCustomerPriceBdt(result.renewalPrice, pricingSettings),
                            transferPrice: calculateCustomerPriceBdt(result.transferPrice, pricingSettings),
                            restorePrice: calculateCustomerPriceBdt(result.restorePrice || result.renewalPrice, pricingSettings),
                        }
                    });
                }
            }
            catch (err) {
                console.warn(`[Domain] Live getTldPricing failed for ${formattedTld}, using fallback:`, err.message);
            }
        }
        // Fallback: lookup in Firestore / default catalog
        const fullPricing = await getEffectiveDomainPricingList();
        const match = fullPricing.find(p => p.tld.toLowerCase() === formattedTld)
            || fullPricing.find(p => p.tld.toLowerCase().replace(/^\./, '') === cleanTld)
            || DEFAULT_CATALOG[0];
        return res.json({
            success: true,
            data: {
                tld: formattedTld,
                currency: 'BDT',
                registrationPrice: match.registerPrice,
                renewalPrice: match.renewPrice,
                transferPrice: match.transferPrice,
                restorePrice: match.renewPrice,
            },
            isFallback: true
        });
    }
    catch (error) {
        console.error('Domain TLD pricing error:', error);
        return res.json({
            success: true,
            data: {
                tld: `.${String(req.body?.tld || 'com').replace(/^\./, '')}`,
                currency: 'BDT',
                registrationPrice: 1708,
                renewalPrice: 2421,
                transferPrice: 1708,
                restorePrice: 2421,
            },
            isFallback: true
        });
    }
});
domainRouter.post('/tld-pricing-batch', async (req, res) => {
    try {
        const { tlds } = req.body;
        if (!Array.isArray(tlds) || !tlds.length)
            return res.json({ success: false, error: 'tlds array is required' });
        const config = await getDomainConfig();
        const provider = getDomainProvider(config);
        let pricingSettings = { usdToBdtRate: 123, markupPercent: 15 };
        try {
            pricingSettings = await getDomainPricingSettings();
        }
        catch { }
        let livePricing = null;
        if (provider.getBatchTldPricing) {
            try {
                livePricing = await provider.getBatchTldPricing(tlds);
            }
            catch (err) {
                console.warn('[Domain] Live getBatchTldPricing failed, using fallback:', err.message);
            }
        }
        if (livePricing?.pricing?.length > 0) {
            const pricing = livePricing.pricing.map((item) => ({
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
            return res.json({ success: true, data: { pricing, failed: livePricing.failed || [] } });
        }
        // Fallback using Firestore / default catalogue
        const fullPricing = await getEffectiveDomainPricingList();
        const pricing = tlds.map((rawTld) => {
            const clean = String(rawTld).trim().toLowerCase();
            const formatted = clean.startsWith('.') ? clean : `.${clean}`;
            const match = fullPricing.find(p => p.tld.toLowerCase() === formatted)
                || fullPricing.find(p => p.tld.toLowerCase().replace(/^\./, '') === clean.replace(/^\./, ''))
                || DEFAULT_CATALOG[0];
            return {
                tld: formatted,
                customerPriceBdt: match.registerPrice,
                renewalPriceBdt: match.renewPrice,
                transferPriceBdt: match.transferPrice,
                currency: 'BDT',
            };
        });
        return res.json({ success: true, data: { pricing, isFallback: true } });
    }
    catch (error) {
        console.error('Domain batch TLD pricing error:', error);
        return res.json({ success: false, error: error?.message || 'Internal server error' });
    }
});
domainRouter.post('/renewal-price', async (req, res) => {
    try {
        const { domain } = req.body;
        if (!domain)
            return res.json({ success: false, error: 'domain is required' });
        const config = await getDomainConfig();
        const provider = getDomainProvider(config);
        let pricingSettings = { usdToBdtRate: 123, markupPercent: 15 };
        try {
            pricingSettings = await getDomainPricingSettings();
        }
        catch { }
        let result = null;
        if (provider.getRenewalPrice) {
            try {
                result = await provider.getRenewalPrice(domain);
            }
            catch (err) {
                console.warn('[Domain] Live getRenewalPrice failed, using fallback:', err.message);
            }
        }
        if (result && result.success && Number.isFinite(result.supplierPriceUsd) && result.supplierPriceUsd > 0) {
            const customerPriceBdt = calculateCustomerPriceBdt(result.supplierPriceUsd, pricingSettings);
            return res.json({
                success: true,
                data: {
                    domain: result.domain,
                    tld: result.tld,
                    renewalPriceBdt: customerPriceBdt,
                    maxDuration: result.maxDuration || 10,
                }
            });
        }
        // Fallback to Firestore / default catalogue
        const parts = domain.split('.');
        const tld = parts.slice(1).join('.').toLowerCase();
        const formattedTld = `.${tld}`;
        const fullPricing = await getEffectiveDomainPricingList();
        const match = fullPricing.find(p => p.tld.toLowerCase() === formattedTld)
            || fullPricing.find(p => p.tld.toLowerCase().replace(/^\./, '') === tld)
            || DEFAULT_CATALOG[0];
        return res.json({
            success: true,
            data: {
                domain,
                tld: formattedTld,
                renewalPriceBdt: match.renewPrice || 2421,
                maxDuration: 10,
            },
            isFallback: true,
        });
    }
    catch (error) {
        console.error('Domain renewal price error:', error);
        return res.json({ success: false, error: error?.message || 'Internal server error' });
    }
});
domainRouter.post('/renewal-price-breakdown', async (req, res) => {
    try {
        const { domain } = req.body;
        if (!domain)
            return res.json({ success: false, error: 'domain is required' });
        const config = await getDomainConfig();
        const provider = getDomainProvider(config);
        let pricingSettings = { usdToBdtRate: 123, markupPercent: 15 };
        try {
            pricingSettings = await getDomainPricingSettings();
        }
        catch { }
        let result = null;
        if (provider.getRenewalPriceBreakdown) {
            try {
                result = await provider.getRenewalPriceBreakdown(domain);
            }
            catch (err) {
                console.warn('[Domain] Live getRenewalPriceBreakdown failed, using fallback:', err.message);
            }
        }
        if (result && result.success && Number.isFinite(result.supplierPriceUsd) && result.supplierPriceUsd > 0) {
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
        }
        // Fallback to Firestore / default catalogue
        const parts = domain.split('.');
        const tld = parts.slice(1).join('.').toLowerCase();
        const formattedTld = `.${tld}`;
        const fullPricing = await getEffectiveDomainPricingList();
        const match = fullPricing.find(p => p.tld.toLowerCase() === formattedTld)
            || fullPricing.find(p => p.tld.toLowerCase().replace(/^\./, '') === tld)
            || DEFAULT_CATALOG[0];
        const customerPriceBdt = match.renewPrice || 2421;
        const supplierPriceUsd = Math.round((customerPriceBdt / pricingSettings.usdToBdtRate) * 100) / 100;
        const sellingPriceUsd = supplierPriceUsd * (1 + pricingSettings.markupPercent / 100);
        return res.json({
            success: true,
            data: {
                domain,
                tld: formattedTld,
                supplierPriceUsd,
                sellingPriceBdt: customerPriceBdt,
                sellingPriceUsd: Math.round(sellingPriceUsd * 100) / 100,
                markupAmountUsd: Math.round((sellingPriceUsd - supplierPriceUsd) * 100) / 100,
                markupPercent: pricingSettings.markupPercent,
                exchangeRate: pricingSettings.usdToBdtRate,
                isSandbox: false,
            },
            isFallback: true,
        });
    }
    catch (error) {
        console.error('Domain renewal price breakdown error:', error);
        return res.json({ success: false, error: error?.message || 'Internal server error' });
    }
});
domainRouter.post('/renewal-order', async (req, res) => {
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
        let pricingSettings = { usdToBdtRate: 123, markupPercent: 15 };
        try {
            pricingSettings = await getDomainPricingSettings();
        }
        catch { }
        const renewalPeriod = Number(params.renewalPeriod);
        if (!Number.isInteger(renewalPeriod) || renewalPeriod < 1) {
            return res.status(400).json({ success: false, error: 'renewalPeriod must be a positive whole number of years' });
        }
        let supplierPricePerYearUsd = 0;
        try {
            const renewalPriceResult = await provider.getRenewalPrice?.(params.domain);
            if (renewalPriceResult?.success && Number.isFinite(renewalPriceResult.supplierPriceUsd) && renewalPriceResult.supplierPriceUsd > 0) {
                supplierPricePerYearUsd = renewalPriceResult.supplierPriceUsd;
            }
        }
        catch (e) {
            console.warn('[Domain] Live renewal price failed for order, using stored catalog:', e.message);
        }
        if (!supplierPricePerYearUsd || supplierPricePerYearUsd <= 0) {
            const parts = params.domain.split('.');
            const tld = parts.slice(1).join('.').toLowerCase();
            const formattedTld = `.${tld}`;
            const fullPricing = await getEffectiveDomainPricingList();
            const match = fullPricing.find(p => p.tld.toLowerCase() === formattedTld)
                || fullPricing.find(p => p.tld.toLowerCase().replace(/^\./, '') === tld)
                || DEFAULT_CATALOG[0];
            const customerPrice = match.renewPrice || 2421;
            supplierPricePerYearUsd = Math.round((customerPrice / pricingSettings.usdToBdtRate) * 100) / 100;
        }
        const supplierPriceUsd = supplierPricePerYearUsd * renewalPeriod;
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
    }
    catch (error) {
        console.error('Create domain renewal order error:', error);
        return res.json({ success: false, error: error?.message || 'Internal server error' });
    }
});
domainRouter.post('/transfer', async (req, res) => {
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
        let supplierPriceUsd = 0;
        try {
            const tld = domain.split('.').pop() || '';
            const tldPricing = await provider.getTldPricing?.(tld);
            if (tldPricing && Number.isFinite(tldPricing.transferPrice) && tldPricing.transferPrice > 0 && tldPricing.currency !== 'USD') {
                supplierPriceUsd = tldPricing.transferPrice;
            }
        }
        catch (error) {
            console.warn('[Domain] Failed to get live supplier price for transfer, using stored catalog:', error?.message);
        }
        if (!supplierPriceUsd || supplierPriceUsd <= 0) {
            const cleanTld = domain.split('.').pop()?.toLowerCase() || 'com';
            const fullPricing = await getEffectiveDomainPricingList();
            const match = fullPricing.find(p => p.tld.replace(/^\./, '') === cleanTld) || DEFAULT_CATALOG[0];
            const transferPrice = match.transferPrice || 1708;
            supplierPriceUsd = Math.round((transferPrice / pricingSettings.usdToBdtRate) * 100) / 100;
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
    }
    catch (error) {
        console.error('Create domain transfer order error:', error);
        return res.json({ success: false, error: error?.message || 'Internal server error' });
    }
});
domainRouter.post('/transfer/check-eligibility', async (req, res) => {
    try {
        const { domain } = req.body;
        if (!domain)
            return res.json({ success: false, error: 'domain is required' });
        const cleanDomain = String(domain).trim().toLowerCase();
        if (cleanDomain.endsWith('.bd')) {
            return res.json({
                success: true,
                data: {
                    eligible: true,
                    isBd: true,
                    reason: 'BTCL .BD domain detected. Official paperwork transfer required.',
                    domain: cleanDomain,
                }
            });
        }
        // Attempt provider availability check
        try {
            const config = await getDomainConfig();
            const provider = getDomainProvider(config);
            if (provider.checkAvailability) {
                const results = await provider.checkAvailability([cleanDomain]);
                const result = results[0];
                if (result && !result.error) {
                    if (result.available) {
                        return res.json({
                            success: true,
                            data: {
                                eligible: false,
                                reason: 'Domain is available for new registration, not transfer.',
                                domain: cleanDomain,
                            }
                        });
                    }
                    else {
                        return res.json({
                            success: true,
                            data: {
                                eligible: true,
                                reason: 'Domain is registered and eligible for transfer.',
                                domain: cleanDomain,
                            }
                        });
                    }
                }
            }
        }
        catch (e) {
            console.warn('[Domain] Provider checkAvailability error in transfer check:', e.message);
        }
        // DNS fallback check using public DNS
        let isRegistered = false;
        try {
            const dns = await import('dns');
            dns.setServers(['8.8.8.8', '1.1.1.1']);
            try {
                const ns = await dns.promises.resolveNs(cleanDomain);
                if (ns && ns.length > 0)
                    isRegistered = true;
            }
            catch { }
            if (!isRegistered) {
                try {
                    const a = await dns.promises.resolve4(cleanDomain);
                    if (a && a.length > 0)
                        isRegistered = true;
                }
                catch { }
            }
        }
        catch (dnsErr) {
            console.warn('[Domain] DNS resolution check error:', dnsErr);
        }
        const reason = isRegistered
            ? 'Domain is active on the internet and eligible for transfer.'
            : 'Domain is eligible for transfer. Please ensure your current registrar has unlocked the domain and provided your Auth/EPP code.';
        return res.json({
            success: true,
            data: {
                eligible: true,
                reason,
                domain: cleanDomain,
            }
        });
    }
    catch (error) {
        console.error('Transfer eligibility check error:', error);
        return res.json({
            success: true,
            data: {
                eligible: true,
                reason: 'Domain is eligible for transfer. Please confirm it is unlocked and retrieve your Auth/EPP code.',
                domain: req.body?.domain || '',
            }
        });
    }
});
domainRouter.post('/fulfill', requireFirebaseAuth, async (req, res) => {
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
        let collectionName = orderType === 'renewal' ? 'domain_renewals' :
            orderType === 'transfer' ? 'domain_transfers' : 'domainOrders';
        let orderRef = db.collection(collectionName).doc(orderId);
        let orderSnap = await orderRef.get();
        if (!orderSnap.exists && orderType === 'transfer') {
            collectionName = 'domainOrders';
            orderRef = db.collection('domainOrders').doc(orderId);
            orderSnap = await orderRef.get();
        }
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
                let authCode = req.body.authCode || orderData.authCode || orderData.eppCode;
                if (!authCode) {
                    const normDomain = String(orderData.domain || '').trim().toLowerCase();
                    const authSnap = await db.collection('transferAuthCodes').doc(`${orderData.orderId || orderId}_${normDomain}`).get();
                    if (authSnap.exists) {
                        authCode = authSnap.data()?.authCode;
                    }
                }
                if (!authCode) {
                    return res.json({ success: false, error: 'Auth code is required for transfer' });
                }
                result = await provider.transferDomain?.(orderData.domain, authCode, orderData.years || orderData.termYears || 1);
                fulfillmentType = 'transfer';
            }
            else if (orderType === 'renewal') {
                result = await provider.renewDomain(orderData.domain, orderData.renewalPeriod || 1);
                fulfillmentType = 'renewal';
            }
            else {
                result = await provider.registerDomain({
                    domain: orderData.domain,
                    years: orderData.years || 1,
                    contactId: orderData.contactId,
                    nameServers: orderData.nameServers,
                    autoRenew: orderData.autoRenew,
                });
                fulfillmentType = 'registration';
            }
        }
        catch (error) {
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
            let adminEmail = null;
            try {
                const siteResult = await getAdminDocument('settings', 'site');
                if (siteResult.exists && siteResult.data) {
                    adminEmail = siteResult.data.contactEmail || null;
                }
            }
            catch (error) {
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
    }
    catch (error) {
        console.error('Domain fulfill error:', error);
        return res.json({ success: false, error: error?.message || 'Internal server error' });
    }
});
domainRouter.post('/retry', requireFirebaseAuth, async (req, res) => {
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
    }
    catch (error) {
        console.error('Domain retry error:', error);
        return res.json({ success: false, error: error?.message || 'Internal server error' });
    }
});
domainRouter.post('/manual-review', requireFirebaseAuth, async (req, res) => {
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
    }
    catch (error) {
        console.error('Domain manual review error:', error);
        return res.json({ success: false, error: error?.message || 'Internal server error' });
    }
});
domainRouter.post('/transfer-auth-codes', requireFirebaseAuth, async (req, res) => {
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
        const transferDomains = new Set((Array.isArray(orderData?.items) ? orderData.items : [])
            .filter((item) => item.itemType === 'domain_transfer')
            .map((item) => String(item.domain || item.id?.replace(/^domain_transfer_/, '') || '').trim().toLowerCase())
            .filter(Boolean));
        const validatedCodes = authCodes.map((entry) => ({
            domain: String(entry?.domain || '').trim().toLowerCase(),
            authCode: String(entry?.authCode || '').trim(),
        }));
        if (validatedCodes.some((entry) => !entry.domain || (transferDomains.size > 0 && !transferDomains.has(entry.domain)) || entry.authCode.length < 3)
            || (transferDomains.size > 0 && validatedCodes.length !== transferDomains.size)
            || (transferDomains.size > 0 && new Set(validatedCodes.map((entry) => entry.domain)).size !== transferDomains.size)) {
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
                // Keep valid for 30 days so fulfillment / payment verification is never blocked by premature expiration
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            });
        }
        // Also update any corresponding domainOrders documents with the auth code
        const domainOrdersSnap = await db.collection('domainOrders')
            .where('orderId', '==', orderId)
            .get();
        for (const dDoc of domainOrdersSnap.docs) {
            const dData = dDoc.data();
            const normDomain = String(dData.domain || '').trim().toLowerCase();
            const match = validatedCodes.find(c => c.domain === normDomain);
            if (match) {
                batch.update(dDoc.ref, {
                    authCode: match.authCode,
                    eppCode: match.authCode,
                    updatedAt: new Date().toISOString(),
                });
            }
        }
        await batch.commit();
        return res.json({ success: true, message: 'Transfer auth codes stored securely' });
    }
    catch (error) {
        console.error('[Domain] Store transfer auth codes error:', error);
        return res.status(500).json({ success: false, error: 'Failed to store transfer auth codes' });
    }
});
// Admin/Owner endpoint to fetch transfer auth code
domainRouter.get('/transfer-auth-code/:orderId/:domain', requireFirebaseAuth, async (req, res) => {
    try {
        const { orderId, domain } = req.params;
        const userId = req.user?.uid;
        const cleanDomain = String(domain || '').trim().toLowerCase();
        const db = getAdminDb();
        const isAdmin = await isUserAdmin(userId).catch(() => false);
        if (!isAdmin) {
            const orderSnap = await db.collection('orders').doc(orderId).get();
            if (!orderSnap.exists || orderSnap.data()?.userId !== userId) {
                return res.status(403).json({ success: false, error: 'Access denied' });
            }
        }
        const docRef = db.collection('transferAuthCodes').doc(`${orderId}_${cleanDomain}`);
        const snap = await docRef.get();
        if (snap.exists) {
            const data = snap.data();
            return res.json({ success: true, authCode: data?.authCode });
        }
        // Fallback: check domainOrders
        const dOrdersSnap = await db.collection('domainOrders')
            .where('orderId', '==', orderId)
            .where('domain', '==', cleanDomain)
            .limit(1)
            .get();
        if (!dOrdersSnap.empty) {
            const dData = dOrdersSnap.docs[0].data();
            const code = dData.authCode || dData.eppCode;
            if (code) {
                return res.json({ success: true, authCode: code });
            }
        }
        return res.status(404).json({ success: false, error: 'Auth code not found' });
    }
    catch (error) {
        console.error('[Domain] Get transfer auth code error:', error);
        return res.status(500).json({ success: false, error: 'Failed to retrieve transfer auth code' });
    }
});
// Admin endpoint to update transfer auth code
domainRouter.post('/update-transfer-auth-code', requireFirebaseAuth, async (req, res) => {
    try {
        const userId = req.user?.uid;
        const isAdmin = await isUserAdmin(userId).catch(() => false);
        if (!isAdmin) {
            return res.status(403).json({ success: false, error: 'Admin access required' });
        }
        const { orderId, domain, authCode, domainOrderId } = req.body;
        if (!orderId || !domain || !authCode) {
            return res.status(400).json({ success: false, error: 'orderId, domain, and authCode are required' });
        }
        const cleanDomain = String(domain || '').trim().toLowerCase();
        const cleanCode = String(authCode || '').trim();
        const db = getAdminDb();
        const batch = db.batch();
        const docRef = db.collection('transferAuthCodes').doc(`${orderId}_${cleanDomain}`);
        batch.set(docRef, {
            orderId,
            domain: cleanDomain,
            authCode: cleanCode,
            updatedBy: userId,
            updatedAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }, { merge: true });
        if (domainOrderId) {
            const dRef = db.collection('domainOrders').doc(domainOrderId);
            batch.update(dRef, {
                authCode: cleanCode,
                eppCode: cleanCode,
                fulfillmentError: null,
                updatedAt: new Date().toISOString(),
            });
        }
        else {
            const dOrdersSnap = await db.collection('domainOrders')
                .where('orderId', '==', orderId)
                .where('domain', '==', cleanDomain)
                .get();
            for (const dDoc of dOrdersSnap.docs) {
                batch.update(dDoc.ref, {
                    authCode: cleanCode,
                    eppCode: cleanCode,
                    fulfillmentError: null,
                    updatedAt: new Date().toISOString(),
                });
            }
        }
        await batch.commit();
        return res.json({ success: true, message: 'Transfer authorization code updated successfully' });
    }
    catch (error) {
        console.error('[Domain] Update transfer auth code error:', error);
        return res.status(500).json({ success: false, error: 'Failed to update transfer auth code' });
    }
});
domainRouter.post('/manage', requireFirebaseAuth, async (req, res) => {
    try {
        const { command, domain, extraParams } = req.body;
        if (!command || !domain) {
            return res.status(400).json({ success: false, error: 'command and domain are required' });
        }
        const allowedCommands = ['set_ns', 'renew', 'get_details', 'set_lock', 'get_dns', 'update_dns', 'update_contacts', 'set_whois_privacy', 'push_domain'];
        if (!allowedCommands.includes(command)) {
            return res.status(400).json({ success: false, error: 'Invalid command' });
        }
        // SECURITY CHECK: Verify Ownership
        const db = getAdminDb();
        const snap = await db.collection('domainOrders').where('domain', '==', domain).where('status', '==', 'active').get();
        if (snap.empty) {
            return res.status(404).json({ success: false, error: 'Domain not found or not active in your account' });
        }
        const domainDoc = snap.docs[0].data();
        if (domainDoc.userId !== req.user.uid) {
            const isAdmin = await isUserAdmin(req.user.uid);
            if (!isAdmin) {
                return res.status(403).json({ success: false, error: 'Unauthorized. You do not own this domain.' });
            }
        }
        const config = await getDomainConfig();
        const { provider, viaBtcl } = await resolveDomainProvider(domain, { domainApiType: config.domainApiType || 'dummy', domainApiKey: config.domainApiKey });
        if (isBdDomain(domain) && !viaBtcl) {
            // No BTCL API configured -> client should fall back to the manual admin approval queue
            return res.json({ success: false, manualRequired: true, error: 'BTCL API is not enabled. Request queued for manual update.' });
        }
        let result;
        if (command === 'set_ns') {
            result = await provider.setNameservers(domain, extraParams?.ns0, extraParams?.ns1, extraParams?.ns2, extraParams?.ns3);
            if (result.success) {
                try {
                    const db = getAdminDb();
                    const snap = await db.collection('domainOrders').where('domain', '==', domain).where('status', '==', 'active').get();
                    if (!snap.empty) {
                        await snap.docs[0].ref.update({ nameservers: { ns0: extraParams?.ns0, ns1: extraParams?.ns1, ns2: extraParams?.ns2, ns3: extraParams?.ns3 } });
                    }
                }
                catch (e) {
                    console.error(e);
                }
            }
            return res.json({ success: result.success, data: result, error: result.error });
        }
        if (command === 'renew') {
            result = await provider.renewDomain(domain, extraParams?.duration || 1);
            return res.json({ success: result.success, data: result, error: result.error });
        }
        if (command === 'get_details') {
            if (!provider.getDomainDetails)
                return res.status(400).json({ success: false, error: 'Not supported' });
            result = await provider.getDomainDetails(domain);
            return res.json({ success: result.success, data: result.data, error: result.error });
        }
        if (command === 'get_dns') {
            if (!provider.getDnsZone)
                return res.status(400).json({ success: false, error: 'Not supported' });
            result = await provider.getDnsZone(domain);
            return res.json({ success: result.success, data: result.data, error: result.error });
        }
        if (command === 'update_dns') {
            if (!provider.updateDnsRecords)
                return res.status(400).json({ success: false, error: 'Not supported' });
            result = await provider.updateDnsRecords(domain, extraParams?.records || []);
            return res.json({ success: result.success, error: result.error });
        }
        if (command === 'set_lock') {
            if (!provider.updateDomainLock)
                return res.status(400).json({ success: false, error: 'Not supported' });
            result = await provider.updateDomainLock(domain, extraParams?.isLocked);
            return res.json({ success: result.success, error: result.error });
        }
        if (command === 'set_whois_privacy') {
            if (!provider.updateWhoisPrivacy)
                return res.status(400).json({ success: false, error: 'Not supported' });
            result = await provider.updateWhoisPrivacy(domain, !!extraParams?.isEnabled);
            return res.json({ success: result.success, error: result.error });
        }
        if (command === 'update_contacts') {
            if (!provider.createCustomerHandle || !provider.updateDomainContacts) {
                return res.status(400).json({ success: false, error: 'Not supported' });
            }
            try {
                const handle = await provider.createCustomerHandle(extraParams?.contact || {});
                result = await provider.updateDomainContacts(domain, handle);
                return res.json({ success: result.success, handle, error: result.error });
            }
            catch (err) {
                return res.status(400).json({ success: false, error: err?.message || 'Failed to update contacts' });
            }
        }
        if (command === 'push_domain') {
            const recipientEmail = extraParams?.recipientEmail?.trim().toLowerCase();
            if (!recipientEmail) {
                return res.status(400).json({ success: false, error: 'Recipient email address is required' });
            }
            if (recipientEmail === req.user.email?.toLowerCase()) {
                return res.status(400).json({ success: false, error: 'Cannot transfer domain to your own account' });
            }
            let targetUid = '';
            let targetName = recipientEmail;
            const usersSnap = await db.collection('users').where('email', '==', recipientEmail).limit(1).get();
            if (!usersSnap.empty) {
                targetUid = usersSnap.docs[0].id;
                targetName = usersSnap.docs[0].data()?.displayName || usersSnap.docs[0].data()?.name || recipientEmail;
            }
            else {
                try {
                    const { getAdminAuth } = await import('../firebase/admin.js');
                    const authUser = await getAdminAuth().getUserByEmail(recipientEmail);
                    targetUid = authUser.uid;
                    targetName = authUser.displayName || recipientEmail;
                }
                catch {
                    return res.status(404).json({
                        success: false,
                        error: `User with email "${recipientEmail}" not found. The recipient must have a registered Click2IT account first.`
                    });
                }
            }
            const previousOwnerId = domainDoc.userId;
            const previousOwnerEmail = req.user.email || 'Current Owner';
            await snap.docs[0].ref.update({
                userId: targetUid,
                customerId: targetUid,
                previousOwnerId,
                previousOwnerEmail,
                pushedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            // Send email notifications
            try {
                await sendEmail({
                    to: recipientEmail,
                    subject: `[Domain Transferred] ${domain} is now in your Click2IT account`,
                    html: `<h3>Domain Ownership Transferred</h3>
                 <p>Hello ${targetName},</p>
                 <p>The domain <strong>${domain}</strong> has been transferred into your Click2IT account by <strong>${previousOwnerEmail}</strong>.</p>
                 <p>You can now manage its DNS, nameservers, and security controls from your <a href="https://click2it.bd/account/services">Click2IT Dashboard</a>.</p>`
                });
                if (req.user.email) {
                    await sendEmail({
                        to: req.user.email,
                        subject: `[Domain Transferred] ${domain} transferred to ${recipientEmail}`,
                        html: `<h3>Domain Push Completed</h3>
                   <p>Your domain <strong>${domain}</strong> has been successfully transferred to <strong>${recipientEmail}</strong>.</p>`
                    });
                }
            }
            catch (mailErr) {
                console.warn('Domain push notification email failed (non-blocking):', mailErr);
            }
            return res.json({
                success: true,
                message: `Domain ${domain} has been successfully transferred to ${recipientEmail}.`
            });
        }
        return res.status(400).json({ success: false, error: 'Unsupported command' });
    }
    catch (error) {
        console.error('Domain manage error:', error);
        return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
    }
});
domainRouter.get('/balance', requireFirebaseAuth, async (req, res) => {
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
    }
    catch (error) {
        console.error('Domain balance error:', error);
        return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
    }
});
domainRouter.post('/sync-pricing', requireFirebaseAuth, async (req, res) => {
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
                }
                else {
                    failed.push({ tld, error: 'Provider returned invalid or unsupported pricing data' });
                }
            }
            catch (e) {
                console.warn(`Failed to sync ${tld}:`, e.message);
                failed.push({ tld, error: e.message || 'Failed to fetch TLD pricing' });
            }
        }
        if (synced.length === 0) {
            return res.status(502).json({ success: false, error: 'No TLD prices could be synchronized', synced, failed });
        }
        domainPricingCache = null;
        return res.json({ success: true, synced, failed });
    }
    catch (error) {
        console.error('Domain sync error:', error);
        try {
            import('fs').then(fs => fs.appendFileSync('sync-error.log', new Date().toISOString() + ' ' + (error?.stack || error?.message || error) + '\n'));
        }
        catch (e) { }
        return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
    }
});
async function requireAdmin(req, res) {
    const ok = await isUserAdmin(req.user?.uid).catch(() => false);
    if (!ok) {
        res.status(403).json({ success: false, error: 'Admin access required' });
        return false;
    }
    return true;
}
domainRouter.get('/btcl/settings', requireFirebaseAuth, async (req, res) => {
    if (!(await requireAdmin(req, res)))
        return;
    try {
        return res.json({ success: true, data: maskBtclConfig(await getBtclConfig()) });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: error?.message || 'Failed to load BTCL settings' });
    }
});
domainRouter.post('/btcl/settings', requireFirebaseAuth, async (req, res) => {
    if (!(await requireAdmin(req, res)))
        return;
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
    }
    catch (error) {
        return res.status(500).json({ success: false, error: error?.message || 'Failed to save BTCL settings' });
    }
});
domainRouter.post('/btcl/test', requireFirebaseAuth, async (req, res) => {
    if (!(await requireAdmin(req, res)))
        return;
    try {
        const cfg = await getBtclConfig();
        if (!cfg.baseUrl)
            return res.json({ success: false, message: 'BTCL base URL is not configured' });
        const result = await new BtclDomainProvider(cfg).testConnection();
        return res.json(result);
    }
    catch (error) {
        return res.json({ success: false, message: error?.message || 'BTCL test failed' });
    }
});
export default domainRouter;
// SpamExperts Endpoints
domainRouter.post('/spamexperts/provision', requireFirebaseAuth, async (req, res) => {
    try {
        const { domain, email } = req.body;
        if (!domain)
            return res.status(400).json({ success: false, error: 'domain is required' });
        const db = getAdminDb();
        const snap = await db.collection('domainOrders').where('domain', '==', domain).where('status', '==', 'active').get();
        if (snap.empty) {
            return res.status(404).json({ success: false, error: 'Active domain not found in your account' });
        }
        const domainDoc = snap.docs[0].data();
        if (domainDoc.userId !== req.user.uid) {
            const isAdmin = await isUserAdmin(req.user.uid);
            if (!isAdmin)
                return res.status(403).json({ success: false, error: 'Unauthorized' });
        }
        const config = await getDomainConfig();
        const provider = getDomainProvider(config);
        if (!provider.provisionSpamExperts) {
            return res.status(400).json({ success: false, error: 'SpamExperts not supported by configured registrar' });
        }
        const result = await provider.provisionSpamExperts(domain, email || req.user.email || 'admin@' + domain);
        if (result.success) {
            await snap.docs[0].ref.update({
                spamExpertsEnabled: true,
                spamExpertsUpdatedAt: new Date().toISOString()
            });
        }
        return res.json(result);
    }
    catch (error) {
        console.error('SpamExperts provision error:', error);
        return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
    }
});
domainRouter.get('/spamexperts/sso', requireFirebaseAuth, async (req, res) => {
    try {
        const domain = req.query.domain;
        if (!domain)
            return res.status(400).json({ success: false, error: 'domain query parameter is required' });
        const db = getAdminDb();
        const snap = await db.collection('domainOrders').where('domain', '==', domain).where('status', '==', 'active').get();
        if (snap.empty) {
            return res.status(404).json({ success: false, error: 'Active domain not found' });
        }
        const domainDoc = snap.docs[0].data();
        if (domainDoc.userId !== req.user.uid) {
            const isAdmin = await isUserAdmin(req.user.uid);
            if (!isAdmin)
                return res.status(403).json({ success: false, error: 'Unauthorized' });
        }
        const config = await getDomainConfig();
        const provider = getDomainProvider(config);
        if (!provider.getSpamExpertsLoginUrl) {
            return res.status(400).json({ success: false, error: 'SpamExperts not supported' });
        }
        const result = await provider.getSpamExpertsLoginUrl(domain);
        return res.json(result);
    }
    catch (error) {
        console.error('SpamExperts SSO error:', error);
        return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
    }
});
