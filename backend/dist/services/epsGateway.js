import crypto from 'crypto';
import { getAdminDocument, setAdminDocument } from '../firebase/admin.js';
/**
 * EPS (Easy Payment System, eps.com.bd) gateway configuration + auth helpers.
 *
 * All values live in the locked `settings/api_keys` Firestore document (never
 * readable from the client per firestore.rules). Secrets are write-only from the
 * admin panel: they are never returned to the browser, only a "configured" flag.
 *
 * NOTE: Endpoint paths and the x-hash scheme below follow EPS's published
 * merchant API (GetToken -> InitializeEPS -> VerifyTransaction). They have NOT
 * been verified against live credentials from this codebase. Use the admin
 * panel's "Test Connection" button with real sandbox credentials to confirm
 * before relying on it. Base URLs are editable for that reason.
 */
export const EPS_DEFAULT_SANDBOX_URL = 'https://sandboxpgapi.eps.com.bd/v1';
export const EPS_DEFAULT_LIVE_URL = 'https://pgapi.eps.com.bd/v1';
/** Fields that must never be sent back to the browser. */
export const EPS_SECRET_FIELDS = ['epsUsername', 'epsPassword', 'epsHashKey'];
/** Every key we persist in api_keys for EPS (used to protect them in the generic api-config route). */
export const EPS_ALL_FIELDS = [
    'epsEnabled',
    'epsMode',
    'epsMerchantId',
    'epsStoreId',
    'epsUsername',
    'epsPassword',
    'epsHashKey',
    'epsSandboxBaseUrl',
    'epsLiveBaseUrl',
];
export async function loadEpsConfig() {
    const result = await getAdminDocument('settings', 'api_keys');
    const d = result.data || {};
    return {
        epsEnabled: d.epsEnabled === true,
        epsMode: d.epsMode === 'live' ? 'live' : 'sandbox',
        epsMerchantId: String(d.epsMerchantId || ''),
        epsStoreId: String(d.epsStoreId || ''),
        epsUsername: String(d.epsUsername || ''),
        epsPassword: String(d.epsPassword || ''),
        epsHashKey: String(d.epsHashKey || ''),
        epsSandboxBaseUrl: String(d.epsSandboxBaseUrl || EPS_DEFAULT_SANDBOX_URL),
        epsLiveBaseUrl: String(d.epsLiveBaseUrl || EPS_DEFAULT_LIVE_URL),
    };
}
/** Browser-safe view: secrets replaced by a boolean "is set" flag. */
export function toPublicEpsConfig(cfg) {
    return {
        epsEnabled: cfg.epsEnabled,
        epsMode: cfg.epsMode,
        epsMerchantId: cfg.epsMerchantId,
        epsStoreId: cfg.epsStoreId,
        epsSandboxBaseUrl: cfg.epsSandboxBaseUrl,
        epsLiveBaseUrl: cfg.epsLiveBaseUrl,
        epsUsernameSet: cfg.epsUsername.length > 0,
        epsPasswordSet: cfg.epsPassword.length > 0,
        epsHashKeySet: cfg.epsHashKey.length > 0,
    };
}
function cleanUrl(value, fallback) {
    const v = String(value ?? '').trim().replace(/\/+$/, '');
    if (!v)
        return fallback;
    if (!/^https:\/\/[^\s]+$/i.test(v)) {
        throw new Error('Base URLs must start with https://');
    }
    return v;
}
/**
 * Merge an admin-submitted payload into api_keys.
 * - Secret fields: empty/undefined means "keep the existing value".
 * - Everything else is validated and overwritten.
 */
export async function saveEpsConfig(body) {
    const result = await getAdminDocument('settings', 'api_keys');
    const existing = result.data || {};
    const next = { ...existing };
    if (typeof body.epsEnabled !== 'undefined')
        next.epsEnabled = body.epsEnabled === true;
    if (typeof body.epsMode !== 'undefined') {
        if (body.epsMode !== 'sandbox' && body.epsMode !== 'live') {
            throw new Error('epsMode must be "sandbox" or "live"');
        }
        next.epsMode = body.epsMode;
    }
    if (typeof body.epsMerchantId === 'string')
        next.epsMerchantId = body.epsMerchantId.trim();
    if (typeof body.epsStoreId === 'string')
        next.epsStoreId = body.epsStoreId.trim();
    if (typeof body.epsSandboxBaseUrl === 'string') {
        next.epsSandboxBaseUrl = cleanUrl(body.epsSandboxBaseUrl, EPS_DEFAULT_SANDBOX_URL);
    }
    if (typeof body.epsLiveBaseUrl === 'string') {
        next.epsLiveBaseUrl = cleanUrl(body.epsLiveBaseUrl, EPS_DEFAULT_LIVE_URL);
    }
    for (const field of EPS_SECRET_FIELDS) {
        const v = body[field];
        if (typeof v === 'string' && v.trim().length > 0)
            next[field] = v.trim();
    }
    // Refuse to enable a half-configured gateway.
    if (next.epsEnabled === true) {
        const missing = ['epsMerchantId', 'epsStoreId', 'epsUsername', 'epsPassword', 'epsHashKey'].filter((k) => !String(next[k] || '').trim());
        if (missing.length > 0) {
            throw new Error(`Cannot enable EPS. Missing: ${missing.join(', ')}`);
        }
    }
    await setAdminDocument('settings', 'api_keys', next);
}
export function epsBaseUrl(cfg) {
    return cfg.epsMode === 'live' ? cfg.epsLiveBaseUrl : cfg.epsSandboxBaseUrl;
}
/** x-hash = base64( HMAC-SHA512( key = hashKey, message = value ) ) */
export function epsHash(value, hashKey) {
    return crypto.createHmac('sha512', hashKey).update(value, 'utf8').digest('base64');
}
export async function epsGetToken(cfg) {
    if (!cfg.epsUsername || !cfg.epsPassword || !cfg.epsHashKey) {
        throw new Error('EPS username, password and hash key are required.');
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
        const res = await fetch(`${epsBaseUrl(cfg)}/Auth/GetToken`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-hash': epsHash(cfg.epsUsername, cfg.epsHashKey),
            },
            body: JSON.stringify({ userName: cfg.epsUsername, password: cfg.epsPassword }),
            signal: controller.signal,
        });
        let json = null;
        try {
            json = await res.json();
        }
        catch {
            // non-JSON body
        }
        if (!res.ok) {
            throw new Error(json?.errorMessage || json?.message || `EPS responded with HTTP ${res.status}`);
        }
        const token = json?.token || json?.Token;
        if (!token) {
            throw new Error(json?.errorMessage || json?.message || 'EPS did not return a token.');
        }
        return String(token);
    }
    catch (err) {
        if (err?.name === 'AbortError')
            throw new Error('EPS request timed out.');
        throw err;
    }
    finally {
        clearTimeout(timer);
    }
}
/**
 * Initialize an EPS payment session on the EPS Gateway server.
 */
export async function epsInitializePayment(params) {
    const cfg = await loadEpsConfig();
    if (!cfg.epsEnabled) {
        throw new Error('EPS Payment Gateway is currently disabled by the administrator.');
    }
    if (!cfg.epsMerchantId || !cfg.epsStoreId || !cfg.epsHashKey) {
        throw new Error('EPS Merchant credentials are not fully configured.');
    }
    if (!params.amount || Number(params.amount) <= 0) {
        throw new Error('Invalid payment amount for EPS initialization.');
    }
    const token = await epsGetToken(cfg);
    const cleanOrderPrefix = params.orderId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) || 'ORD';
    const merchantTransactionId = `EPS-${cleanOrderPrefix}-${Date.now()}`;
    const payload = {
        merchantId: cfg.epsMerchantId,
        storeId: cfg.epsStoreId,
        CustomerOrderId: params.orderId,
        merchantTransactionId,
        transactionTypeId: 1, // 1 = Web
        financialEntityId: 0,
        transitionStatusId: 0,
        totalAmount: Number(Number(params.amount).toFixed(2)),
        ipAddress: params.ipAddress || '127.0.0.1',
        version: '1',
        successUrl: params.successUrl,
        failUrl: params.failUrl,
        cancelUrl: params.cancelUrl,
        customerName: params.customerName || 'Customer',
        customerEmail: params.customerEmail || 'customer@click2itbd.com',
        customerAddress: params.customerAddress || 'Dhaka, Bangladesh',
        customerAddress2: '',
        customerCity: params.customerCity || 'Dhaka',
        customerState: params.customerState || 'Dhaka',
        customerPostcode: params.customerPostcode || '1000',
        customerCountry: 'BD',
        customerPhone: params.customerPhone || '01700000000',
        shipmentName: params.customerName || 'Customer',
        shipmentAddress: params.customerAddress || 'Dhaka, Bangladesh',
        shipmentAddress2: '',
        shipmentCity: params.customerCity || 'Dhaka',
        shipmentState: params.customerState || 'Dhaka',
        shipmentPostcode: params.customerPostcode || '1000',
        shipmentCountry: 'BD',
        valueA: params.orderId,
        valueB: '',
        valueC: '',
        valueD: '',
        shippingMethod: 'NO',
        noOfItem: '1',
        productName: (params.productName || `Order #${params.orderId.slice(0, 8)}`).slice(0, 100),
        productProfile: 'general',
        productCategory: params.productCategory || 'Ecommerce',
    };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
        const res = await fetch(`${epsBaseUrl(cfg)}/EPSEngine/InitializeEPS`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                'x-hash': epsHash(merchantTransactionId, cfg.epsHashKey),
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
        });
        let json = null;
        try {
            json = await res.json();
        }
        catch {
            // non-JSON response
        }
        const redirectUrl = json?.RedirectURL || json?.redirectUrl || json?.data?.RedirectURL;
        const transactionId = json?.TransactionId || json?.transactionId || json?.data?.TransactionId || merchantTransactionId;
        if (!res.ok || !redirectUrl) {
            throw new Error(json?.ErrorMessage ||
                json?.errorMessage ||
                json?.message ||
                `EPS InitializeEPS failed (HTTP ${res.status})`);
        }
        return {
            redirectUrl: String(redirectUrl),
            transactionId: String(transactionId),
            merchantTransactionId,
        };
    }
    catch (err) {
        if (err?.name === 'AbortError')
            throw new Error('EPS initialization timed out.');
        throw err;
    }
    finally {
        clearTimeout(timer);
    }
}
/**
 * Verify a transaction directly against the EPS server using merchantTransactionId.
 */
export async function epsVerifyTransaction(merchantTransactionId) {
    const cleanMtx = String(merchantTransactionId || '').trim();
    if (!cleanMtx) {
        throw new Error('merchantTransactionId is required for EPS verification.');
    }
    const cfg = await loadEpsConfig();
    if (!cfg.epsHashKey) {
        throw new Error('EPS Hash Key is not configured.');
    }
    const token = await epsGetToken(cfg);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
        const url = `${epsBaseUrl(cfg)}/EPSEngine/CheckMerchantTransactionStatus?merchantTransactionId=${encodeURIComponent(cleanMtx)}`;
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
                'x-hash': epsHash(cleanMtx, cfg.epsHashKey),
            },
            signal: controller.signal,
        });
        let json = null;
        try {
            json = await res.json();
        }
        catch {
            // non-JSON response
        }
        if (!res.ok) {
            throw new Error(json?.ErrorMessage ||
                json?.errorMessage ||
                json?.message ||
                `EPS verification failed (HTTP ${res.status})`);
        }
        const status = String(json?.Status || json?.status || '').trim();
        const verified = status.toLowerCase() === 'success';
        const totalAmount = Number(json?.TotalAmount ?? json?.totalAmount ?? 0);
        const epsTransactionId = String(json?.EPSTransactionId || json?.epsTransactionId || json?.MerchantTransactionId || cleanMtx);
        const financialEntity = String(json?.FinancialEntity || json?.financialEntity || 'EPS');
        const customerOrderId = String(json?.CustomerOrderId || json?.ValueA || '');
        return {
            verified,
            status,
            totalAmount,
            epsTransactionId,
            merchantTransactionId: cleanMtx,
            financialEntity,
            customerOrderId,
            raw: json,
        };
    }
    catch (err) {
        if (err?.name === 'AbortError')
            throw new Error('EPS verification request timed out.');
        throw err;
    }
    finally {
        clearTimeout(timer);
    }
}
