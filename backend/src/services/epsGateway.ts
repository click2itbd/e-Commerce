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

export type EpsMode = 'sandbox' | 'live';

export interface EpsConfig {
  epsEnabled: boolean;
  epsMode: EpsMode;
  epsMerchantId: string;
  epsStoreId: string;
  epsUsername: string;
  epsPassword: string;
  epsHashKey: string;
  epsSandboxBaseUrl: string;
  epsLiveBaseUrl: string;
}

/** Fields that must never be sent back to the browser. */
export const EPS_SECRET_FIELDS = ['epsUsername', 'epsPassword', 'epsHashKey'] as const;

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
] as const;

export async function loadEpsConfig(): Promise<EpsConfig> {
  const result = await getAdminDocument('settings', 'api_keys');
  const d: Record<string, any> = result.data || {};
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
export function toPublicEpsConfig(cfg: EpsConfig) {
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

function cleanUrl(value: unknown, fallback: string): string {
  const v = String(value ?? '').trim().replace(/\/+$/, '');
  if (!v) return fallback;
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
export async function saveEpsConfig(body: Record<string, any>): Promise<void> {
  const result = await getAdminDocument('settings', 'api_keys');
  const existing: Record<string, any> = result.data || {};
  const next: Record<string, any> = { ...existing };

  if (typeof body.epsEnabled !== 'undefined') next.epsEnabled = body.epsEnabled === true;
  if (typeof body.epsMode !== 'undefined') {
    if (body.epsMode !== 'sandbox' && body.epsMode !== 'live') {
      throw new Error('epsMode must be "sandbox" or "live"');
    }
    next.epsMode = body.epsMode;
  }
  if (typeof body.epsMerchantId === 'string') next.epsMerchantId = body.epsMerchantId.trim();
  if (typeof body.epsStoreId === 'string') next.epsStoreId = body.epsStoreId.trim();
  if (typeof body.epsSandboxBaseUrl === 'string') {
    next.epsSandboxBaseUrl = cleanUrl(body.epsSandboxBaseUrl, EPS_DEFAULT_SANDBOX_URL);
  }
  if (typeof body.epsLiveBaseUrl === 'string') {
    next.epsLiveBaseUrl = cleanUrl(body.epsLiveBaseUrl, EPS_DEFAULT_LIVE_URL);
  }
  for (const field of EPS_SECRET_FIELDS) {
    const v = body[field];
    if (typeof v === 'string' && v.trim().length > 0) next[field] = v.trim();
  }

  // Refuse to enable a half-configured gateway.
  if (next.epsEnabled === true) {
    const missing = ['epsMerchantId', 'epsStoreId', 'epsUsername', 'epsPassword', 'epsHashKey'].filter(
      (k) => !String(next[k] || '').trim(),
    );
    if (missing.length > 0) {
      throw new Error(`Cannot enable EPS. Missing: ${missing.join(', ')}`);
    }
  }

  await setAdminDocument('settings', 'api_keys', next);
}

export function epsBaseUrl(cfg: EpsConfig): string {
  return cfg.epsMode === 'live' ? cfg.epsLiveBaseUrl : cfg.epsSandboxBaseUrl;
}

/** x-hash = base64( HMAC-SHA512( key = hashKey, message = value ) ) */
export function epsHash(value: string, hashKey: string): string {
  return crypto.createHmac('sha512', hashKey).update(value, 'utf8').digest('base64');
}

export async function epsGetToken(cfg: EpsConfig): Promise<string> {
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
    let json: any = null;
    try {
      json = await res.json();
    } catch {
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
  } catch (err: any) {
    if (err?.name === 'AbortError') throw new Error('EPS request timed out.');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
