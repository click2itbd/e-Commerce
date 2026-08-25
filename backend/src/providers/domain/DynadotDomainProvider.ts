import { IDomainProvider, DomainAvailabilityResult, DomainRegistrationRequest, DomainRegistrationResult, DomainRenewalResult, WhoisResult, TldPricingResult, BatchTldPricingItem, DomainRenewalPriceResult, DomainRenewalPriceBreakdown, DomainTransferResult } from './IDomainProvider';
import { config } from '../../config/index.js';

const DEFAULT_TLD_PRICES: Record<string, { register: number; renew: number; transfer: number; restore: number }> = {
  com: { register: 10.99, renew: 11.99, transfer: 10.99, restore: 60 },
  net: { register: 12.99, renew: 13.99, transfer: 12.99, restore: 60 },
  org: { register: 11.99, renew: 12.99, transfer: 11.99, restore: 60 },
  info: { register: 4.99, renew: 19.99, transfer: 19.99, restore: 60 },
  biz: { register: 5.99, renew: 18.99, transfer: 18.99, restore: 60 },
  co: { register: 27.99, renew: 27.99, transfer: 27.99, restore: 70 },
  xyz: { register: 2.99, renew: 12.99, transfer: 12.99, restore: 50 },
  store: { register: 3.99, renew: 29.99, transfer: 29.99, restore: 60 },
  online: { register: 3.99, renew: 34.99, transfer: 34.99, restore: 60 },
  site: { register: 3.99, renew: 31.99, transfer: 31.99, restore: 60 },
  me: { register: 14.99, renew: 18.99, transfer: 18.99, restore: 60 },
  club: { register: 12.99, renew: 15.99, transfer: 15.99, restore: 50 },
  top: { register: 2.99, renew: 6.99, transfer: 6.99, restore: 50 },
  bd: { register: 25.00, renew: 25.00, transfer: 25.00, restore: 50 },
  'com.bd': { register: 25.00, renew: 25.00, transfer: 25.00, restore: 50 },
};

export class DynadotDomainProvider implements IDomainProvider {
  private apiKey: string;
  private baseUrl: string;
  private isSandbox: boolean;
  private requestTimeout: number;
  private tldPricingCache = new Map<string, { value: TldPricingResult; expires: number }>();
  private static readonly TLD_PRICING_CACHE_TTL_MS = 60 * 60 * 1000;

  constructor(apiKey?: string, isSandbox?: boolean, requestTimeout: number = 15000) {
    this.apiKey = apiKey || process.env.DYNADOT_API_KEY || '';
    this.isSandbox = isSandbox ?? (process.env.DYNADOT_SANDBOX_MODE === 'true');
    this.requestTimeout = requestTimeout;
    this.baseUrl = this.isSandbox
      ? 'https://api-sandbox.dynadot.com/api3.json'
      : 'https://api.dynadot.com/api3.json';
  }

  private getCachedTldPricing(tld: string): TldPricingResult | null {
    const entry = this.tldPricingCache.get(tld);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      this.tldPricingCache.delete(tld);
      return null;
    }
    return entry.value;
  }

  private setCachedTldPricing(tld: string, value: TldPricingResult): void {
    this.tldPricingCache.set(tld, { value, expires: Date.now() + DynadotDomainProvider.TLD_PRICING_CACHE_TTL_MS });
  }

  private async dynadotRequest(command: string, params: Record<string, string> = {}): Promise<any> {
    const url = new URL(this.baseUrl);
    url.searchParams.set('key', this.apiKey);
    url.searchParams.set('command', command);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

    try {
      const response = await fetch(url.toString(), { signal: controller.signal });
      const rawText = await response.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        throw new ProviderError('invalid_response', `Invalid Dynadot response: ${rawText}`);
      }

      const responseCode = data?.ResponseCode ?? data?.Response?.ResponseCode ?? data?.SearchResponse?.ResponseCode;
      if (!response.ok || (responseCode !== '0' && responseCode !== 0 && responseCode !== undefined && data?.ResponseCode !== undefined)) {
        if (responseCode !== '0' && responseCode !== 0 && responseCode !== undefined) {
          const message = data?.Error || data?.Response?.Error || data?.SearchResponse?.Status || `Dynadot API error: ${response.statusText}`;
          throw new ProviderError('provider_error', message, { responseCode });
        }
      }

      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new ProviderError('timeout', 'Dynadot API request timed out');
      }
      if (error instanceof ProviderError) {
        throw error;
      }
      throw new ProviderError('network', error.message || 'Network error contacting Dynadot');
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async checkAvailability(domains: string[] | string): Promise<DomainAvailabilityResult[]> {
    const domainList = Array.isArray(domains) ? domains : [domains];
    if (!domainList.length) return [];

    try {
      const params: Record<string, string> = {};
      domainList.forEach((d, i) => {
        params[`domain${i}`] = d;
      });

      const data = await this.dynadotRequest('search', params);
      const searchResults: any[] = data?.SearchResponse?.SearchResults || data?.Response?.SearchResults || data?.SearchResults || [];

      if (searchResults.length > 0) {
        return domainList.map((domain, index) => {
          const searchResult = searchResults.find((r: any) => (r.DomainName || r.Domain || r.domain || '')?.toLowerCase() === domain.toLowerCase()) || searchResults[index];
          const tldMatch = domain.match(/\.[^.]+$/);
          const tld = tldMatch ? tldMatch[0].replace(/^\./, '').toLowerCase() : 'com';
          const defaultPrice = (DEFAULT_TLD_PRICES[tld] || { register: 12.99 }).register;

          if (!searchResult) {
            return {
              domain,
              available: false,
              price: defaultPrice,
              currency: 'USD',
              status: 'taken',
            };
          }

          const rawAvailable = String(searchResult.Available || searchResult.available || searchResult.Status || searchResult.status || '').toLowerCase();
          const isAvailable = rawAvailable === 'yes' || rawAvailable === 'available' || rawAvailable === '1' || rawAvailable === 'true';
          const price = searchResult.Price ? parseFloat(searchResult.Price) : defaultPrice;

          return {
            domain,
            available: isAvailable,
            price: price,
            currency: 'USD',
            status: isAvailable ? 'available' : 'taken',
          };
        });
      }
    } catch (error: any) {
      console.warn('[Dynadot] Batch search error or timeout:', error.message);
    }

    // Fallback if Dynadot API is unavailable/timed out: return formatted domain results with default prices
    return domainList.map(domain => {
      const tldMatch = domain.match(/\.[^.]+$/);
      const tld = tldMatch ? tldMatch[0].replace(/^\./, '').toLowerCase() : 'com';
      const defaultPrice = (DEFAULT_TLD_PRICES[tld] || { register: 12.99 }).register;
      return {
        domain,
        available: false,
        price: defaultPrice,
        currency: 'USD',
        status: 'taken',
      };
    });
  }

  async getSuggestions(domain: string): Promise<string[]> {
    const parts = domain.split('.');
    const base = parts[0];
    return [`${base}.net`, `${base}.org`, `${base}.co`, `${base}.info`, `${base}.biz`];
  }

  async registerDomain(request: DomainRegistrationRequest): Promise<DomainRegistrationResult> {
    try {
      const data = await this.dynadotRequest('register', {
        domain: request.domain,
        duration: String(request.years || 1),
      });

      const regResult = data?.RegisterResponse?.RegisterResults?.[0];
      const isSuccess = regResult?.Status?.toLowerCase() === 'success';

      return {
        success: isSuccess,
        domain: request.domain,
        registrationId: regResult?.RegistrationID,
        expiresAt: regResult?.ExpirationDate,
        error: isSuccess ? undefined : (regResult?.Message || 'Registration failed'),
      };
    } catch (error: any) {
      throw error;
    }
  }

  async renewDomain(domain: string, years: number): Promise<DomainRenewalResult> {
    try {
      const data = await this.dynadotRequest('renew', {
        domain,
        duration: String(years || 1),
      });

      const renewResult = data?.RenewResponse?.RenewResults?.[0];
      const isSuccess = renewResult?.Status?.toLowerCase() === 'success';

      return {
        success: isSuccess,
        domain,
        newExpiryDate: renewResult?.ExpirationDate,
        error: isSuccess ? undefined : (renewResult?.Message || 'Renewal failed'),
      };
    } catch (error: any) {
      throw error;
    }
  }

  async getWhois(domain: string): Promise<WhoisResult> {
    try {
      const data = await this.dynadotRequest('whois', { domain });
      return {
        domain,
        registrar: data?.WhoisResponse?.Registrar || 'Dynadot',
        createdAt: data?.WhoisResponse?.CreationDate,
        updatedAt: data?.WhoisResponse?.UpdatedDate,
        expiresAt: data?.WhoisResponse?.ExpirationDate,
        status: data?.WhoisResponse?.Status || [],
        nameServers: data?.WhoisResponse?.NameServers || [],
        error: undefined,
      };
    } catch (error: any) {
      return {
        domain,
        error: error.message || 'WHOIS lookup failed',
      };
    }
  }

  async getTldPricing(tld: string): Promise<TldPricingResult> {
    const cleanTld = tld.replace(/^\./, '').toLowerCase();
    const cached = this.getCachedTldPricing(cleanTld);
    if (cached) return cached;

    const fallback = DEFAULT_TLD_PRICES[cleanTld] || { register: 12.99, renew: 14.99, transfer: 12.99, restore: 60 };

    try {
      const data = await this.dynadotRequest('tld_price', { tld: cleanTld, currency: 'USD' });
      const tldData = data?.TLDPricing || data?.TldPriceResponse;
      const entry = Array.isArray(tldData?.TldPrice) ? tldData.TldPrice[0] : null;
      if (entry) {
        const result = {
          tld: `.${cleanTld}`,
          currency: 'USD',
          registrationPrice: parseFloat(entry.RegistrationPrice || entry.registration_price || fallback.register),
          renewalPrice: parseFloat(entry.RenewPrice || entry.renewal_price || fallback.renew),
          transferPrice: parseFloat(entry.TransferPrice || entry.transfer_price || fallback.transfer),
          restorePrice: parseFloat(entry.RestorePrice || entry.restore_price || fallback.restore),
        };
        this.setCachedTldPricing(cleanTld, result);
        return result;
      }
    } catch {
      // Fallback
    }

    const result = {
      tld: `.${cleanTld}`,
      currency: 'USD',
      registrationPrice: fallback.register,
      renewalPrice: fallback.renew,
      transferPrice: fallback.transfer,
      restorePrice: fallback.restore,
    };
    this.setCachedTldPricing(cleanTld, result);
    return result;
  }

  async getBatchTldPricing(tlds: string[]): Promise<{ pricing: BatchTldPricingItem[] }> {
    const results = await Promise.allSettled(
      tlds.map(async (tld) => {
        try {
          const priced = await this.getTldPricing(tld);
          return { tld: priced.tld, customerPriceBdt: priced.registrationPrice, currency: priced.currency };
        } catch {
          const cleanTld = tld.replace(/^\./, '').toLowerCase();
          const fallback = DEFAULT_TLD_PRICES[cleanTld] || { register: 12.99, renew: 14.99, transfer: 12.99, restore: 60 };
          return { tld: `.${cleanTld}`, customerPriceBdt: fallback.register, currency: 'USD' };
        }
      })
    );
    const pricing = results
      .filter((r): r is PromiseFulfilledResult<{ tld: string; customerPriceBdt: number; currency: string }> => 
        r.status === 'fulfilled' && r.value !== null
      )
      .map(r => r.value);
    return { pricing };
  }

  async getRenewalPrice(domain: string): Promise<DomainRenewalPriceResult> {
    const tldMatch = domain.match(/\.[^.]+$/);
    const tld = tldMatch ? tldMatch[0].replace(/^\./, '').toLowerCase() : 'com';
    const fallback = DEFAULT_TLD_PRICES[tld] || { register: 12.99, renew: 14.99, transfer: 12.99, restore: 60 };
    let renewPrice = fallback.renew;

    try {
      const data = await this.dynadotRequest('tld_price', { tld, currency: 'USD' });
      const tldData = data?.TLDPricing || data?.TldPriceResponse;
      const entry = Array.isArray(tldData?.TldPrice) ? tldData.TldPrice[0] : null;
      if (entry) {
        renewPrice = parseFloat(entry.RenewPrice || entry.renewal_price || fallback.renew);
      }
    } catch {
      // Fallback
    }

    return {
      success: true,
      domain,
      tld: `.${tld}`,
      renewalPriceBdt: renewPrice,
      maxDuration: 10,
    };
  }

  async getRenewalPriceBreakdown(domain: string): Promise<DomainRenewalPriceBreakdown> {
    const tldMatch = domain.match(/\.[^.]+$/);
    const tld = tldMatch ? tldMatch[0].replace(/^\./, '').toLowerCase() : 'com';
    const fallback = DEFAULT_TLD_PRICES[tld] || { register: 12.99, renew: 14.99, transfer: 12.99, restore: 60 };
    let renewPrice = fallback.renew;

    try {
      const data = await this.dynadotRequest('tld_price', { tld, currency: 'USD' });
      const tldData = data?.TLDPricing || data?.TldPriceResponse;
      const entry = Array.isArray(tldData?.TldPrice) ? tldData.TldPrice[0] : null;
      if (entry) {
        renewPrice = parseFloat(entry.RenewPrice || entry.renewal_price || fallback.renew);
      }
    } catch {
      // Fallback
    }

    const markupPercent = config.dynadot.markupPercent;
    const exchangeRate = config.dynadot.exchangeRate;
    const retailUsd = renewPrice * (1 + markupPercent / 100);
    const priceUsd = Math.round(retailUsd * 100) / 100;
    const priceBdt = Math.round(retailUsd * exchangeRate);

    return {
      success: true,
      domain,
      tld: `.${tld}`,
      supplierPriceUsd: renewPrice,
      markupPercent,
      markupAmountUsd: Math.round((retailUsd - renewPrice) * 100) / 100,
      sellingPriceUsd: priceUsd,
      exchangeRate,
      sellingPriceBdt: priceBdt,
      isSandbox: this.isSandbox,
      discountPercent: 0,
    };
  }

  async transferDomain(domain: string, authCode: string, years: number): Promise<DomainTransferResult> {
    try {
      const data = await this.dynadotRequest('transfer', {
        domain,
        auth_code: authCode,
        duration: String(years || 1),
      });

      const transferResult = data?.TransferResponse?.TransferResults?.[0];
      const isSuccess = transferResult?.Status?.toLowerCase() === 'success';

      return {
        success: isSuccess,
        domain,
        transferId: transferResult?.TransferID,
        status: transferResult?.Status,
        error: isSuccess ? undefined : (transferResult?.Message || 'Transfer failed'),
      };
    } catch (error: any) {
      throw error;
    }
  }

  async testConnection(): Promise<{ success: boolean; code: string; message: string }> {
    try {
      const data = await this.dynadotRequest('search', { domain0: 'test-click2it-status-check.com' });
      if (data?.SearchResponse?.ResponseCode === '0' || data?.ResponseCode === '0') {
        return {
          success: true,
          code: 'DYNADOT_OK',
          message: 'Dynadot connection successful.',
        };
      }
      return {
        success: false,
        code: 'DYNADOT_ERROR',
        message: data?.SearchResponse?.Status || 'Dynadot connection test failed',
      };
    } catch (error: any) {
      const msg = error?.message || '';
      if (error instanceof ProviderError) {
        return {
          success: false,
          code: error.code.toUpperCase(),
          message: msg,
        };
      }
      return {
        success: false,
        code: 'DYNADOT_UNKNOWN_ERROR',
        message: msg || 'Dynadot connection test failed',
      };
    }
  }

  async setNameservers(domain: string, ns0?: string, ns1?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const nameservers = [ns0, ns1].filter((ns): ns is string => !!ns);
      if (nameservers.length < 2) {
        return { success: false, error: 'At least two nameservers are required' };
      }

      const data = await this.dynadotRequest('setDomainNameServer', {
        domain,
        name_server1: nameservers[0],
        name_server2: nameservers[1] || '',
      });

      return {
        success: data?.SetDomainNameServerResponse?.IsSuccess === true || data?.SetDomainNameServerResponse?.Status === 'success',
        error: data?.SetDomainNameServerResponse?.Message || data?.Error,
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to set nameservers' };
    }
  }
}

export class ProviderError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}
