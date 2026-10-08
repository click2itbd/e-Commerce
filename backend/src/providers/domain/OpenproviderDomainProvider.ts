import { 
  IDomainProvider, 
  DomainAvailabilityResult, 
  DomainRegistrationRequest, 
  DomainRegistrationResult, 
  DomainRenewalResult, 
  WhoisResult,
  TldPricingResult,
  BatchTldPricingItem,
  DomainTransferResult
} from './IDomainProvider';

export class OpenproviderDomainProvider implements IDomainProvider {
  private readonly baseUrl: string;
  private readonly username: string;
  private readonly passwordHash: string;
  private token: string | null = null;
  private tokenExpiry: number = 0;
  private authRequest: Promise<string> | null = null;
  private readonly tldPricingCache = new Map<string, { value: TldPricingResult; expiresAt: number }>();

  // You will need an Openprovider Customer Handle to register domains.
  // E.g., 'SR000000-EA'
  private readonly defaultHandle = process.env.OPENPROVIDER_DEFAULT_HANDLE || '';

  constructor(username: string, passwordHash: string, isSandbox: boolean = true) {
    this.username = username;
    this.passwordHash = passwordHash;
    this.baseUrl = isSandbox ? 'https://api.cte.openprovider.eu/v1' : 'https://api.openprovider.eu/v1';
  }

  private async authenticate(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    if (this.authRequest) {
      return this.authRequest;
    }

    if (!this.username || !this.passwordHash) {
      throw new Error('Openprovider credentials are not configured.');
    }

    const authRequest = (async () => {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: this.username,
          password: this.passwordHash
        })
      });

      const result: any = await response.json();
      const token = result.data?.token;
      if (!response.ok || (result.code !== undefined && result.code !== 0) || typeof token !== 'string' || !token) {
        throw new Error(`Openprovider Auth Failed: ${result.desc || 'Unknown error'}`);
      }

      this.token = token;
      this.tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
      return token;
    })();
    this.authRequest = authRequest;

    try {
      return await authRequest;
    } finally {
      if (this.authRequest === authRequest) {
        this.authRequest = null;
      }
    }
  }

  public async fetchApi(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.authenticate();
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers
    });

    const result: any = await response.json();
    if (!response.ok || (result.code !== undefined && result.code !== 0)) {
      throw new Error(result.desc || `Openprovider API Error: ${response.status}`);
    }
    return result;
  }

  private splitDomain(fullDomain: string) {
    const parts = fullDomain.split('.');
    const name = parts[0];
    const extension = parts.slice(1).join('.');
    return { name, extension };
  }

  async checkAvailability(domains: string[]): Promise<DomainAvailabilityResult[]> {
    const results: DomainAvailabilityResult[] = [];
    const domainObjects = domains.map(d => this.splitDomain(d));

    try {
      const response = await this.fetchApi('/domains/check', {
        method: 'POST',
        body: JSON.stringify({ domains: domainObjects })
      });

      const availabilityItems = Array.isArray(response.data)
        ? response.data
        : response.data?.results;
      if (!Array.isArray(availabilityItems)) {
        throw new Error('Openprovider returned an invalid domain availability response.');
      }

      for (const item of availabilityItems) {
        const fullDomain = typeof item.domain === 'string'
          ? item.domain
          : `${item.domain?.name || ''}.${item.domain?.extension || ''}`;
        if (fullDomain === '.') {
          throw new Error('Openprovider returned a domain availability result without a domain name.');
        }
        const status = String(item.status || '').toLowerCase();
        const isAvailable = status === 'free' || status === 'available';
        
        results.push({
          domain: fullDomain,
          available: isAvailable,
          status: item.status
        });
      }
    } catch (error: any) {
      if (domains.length > 0) {
        results.push({ domain: domains[0], available: false, error: error.message });
      }
    }
    return results;
  }

  async getTldPricing(tld: string): Promise<TldPricingResult> {
    try {
      const cleanTld = tld.trim().replace(/^\./, '').toLowerCase();
      if (!/^[a-z0-9-]+(?:\.[a-z0-9-]+)*$/.test(cleanTld)) {
        throw new Error('Invalid TLD');
      }
      const cached = this.tldPricingCache.get(cleanTld);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.value;
      }

      const getOpPrice = async (operation: string) => {
        const randomDomainString = `test-pricing-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        const query = new URLSearchParams({
          'domain.name': randomDomainString,
          'domain.extension': cleanTld,
          operation,
        });
        const res = await this.fetchApi(`/domains/prices?${query.toString()}`);
        const price = Number(res.data?.price?.reseller?.price);
        const currency = res.data?.price?.reseller?.currency;
        if (!Number.isFinite(price) || price <= 0 || !currency) {
          throw new Error(`Openprovider returned no ${operation} price for .${cleanTld}`);
        }
        return { price, currency: String(currency).toUpperCase() };
      };

      const [regPrice, renewPrice, transferPrice] = await Promise.all([
        getOpPrice('create'),
        getOpPrice('renew'),
        getOpPrice('transfer')
      ]);
      
      if (regPrice.currency !== 'USD' || renewPrice.currency !== regPrice.currency || transferPrice.currency !== regPrice.currency) {
        throw new Error(`Unsupported or inconsistent Openprovider reseller currency for .${cleanTld}`);
      }

      const pricing = {
        tld: `.${cleanTld}`,
        currency: regPrice.currency,
        registrationPrice: regPrice.price,
        renewalPrice: renewPrice.price,
        transferPrice: transferPrice.price,
        restorePrice: 0,
      };
      this.tldPricingCache.set(cleanTld, { value: pricing, expiresAt: Date.now() + 60 * 60 * 1000 });
      return pricing;
    } catch (error: any) {
      throw new Error(`Failed to fetch pricing for ${tld.startsWith('.') ? tld : `.${tld}`}: ${error.message}`);
    }
  }

  async getBatchTldPricing(tlds: string[]): Promise<{
    pricing: BatchTldPricingItem[];
    failed: Array<{ tld: string; error: string }>;
  }> {
    const pricing: BatchTldPricingItem[] = [];
    const failed: Array<{ tld: string; error: string }> = [];
    for (const tld of tlds) {
      try {
        const tldPrice = await this.getTldPricing(tld);
        pricing.push({
          tld: tldPrice.tld,
          supplierPriceUsd: tldPrice.registrationPrice,
          currency: tldPrice.currency
        });
      } catch (error: any) {
        failed.push({ tld, error: error.message || 'Failed to fetch TLD pricing' });
      }
    }
    return { pricing, failed };
  }

  async registerDomain(request: DomainRegistrationRequest): Promise<DomainRegistrationResult> {
    const domainObj = this.splitDomain(request.domain);
    const contactHandle = request.contactId && /^[A-Z0-9]+-[A-Z0-9]+$/i.test(request.contactId)
      ? request.contactId
      : '';
    const handle = contactHandle || this.defaultHandle;

    try {
      if (!handle) {
        throw new Error('Set OPENPROVIDER_DEFAULT_HANDLE or provide a valid Openprovider contact handle before registering domains.');
      }

      const response = await this.fetchApi('/domains', {
        method: 'POST',
        body: JSON.stringify({
          domain: domainObj,
          period: request.years || 1,
          owner_handle: handle,
          admin_handle: handle,
          tech_handle: handle,
          billing_handle: handle,
          name_servers: request.nameServers?.map(name => ({ name })) || [],
          autorenew: request.autoRenew ? 'on' : 'off'
        })
      });
      if (!response.data?.id) {
        throw new Error('Openprovider did not return a domain registration ID.');
      }

      return {
        success: true,
        domain: request.domain,
        registrationId: response.data?.id?.toString() || '',
      };
    } catch (error: any) {
      return {
        success: false,
        domain: request.domain,
        error: error.message
      };
    }
  }

  async renewDomain(domain: string, years: number): Promise<DomainRenewalResult> {
    const domainObj = this.splitDomain(domain);

    try {
      const query = new URLSearchParams({ full_name: domain });
      const domainResponse = await this.fetchApi(`/domains?${query.toString()}`);
      const domainRecord = domainResponse.data?.results?.find((item: any) =>
        item.domain?.name === domainObj.name && item.domain?.extension === domainObj.extension
      );
      if (!domainRecord?.id) {
        throw new Error('Domain not found in your Openprovider account.');
      }

      const response = await this.fetchApi(`/domains/${domainRecord.id}/renew`, {
        method: 'POST',
        body: JSON.stringify({
          domain: domainObj,
          id: domainRecord.id,
          period: years
        })
      });
      if (!response.data?.status) {
        throw new Error('Openprovider did not confirm the domain renewal.');
      }

      return {
        success: true,
        domain: domain,
        transactionId: String(domainRecord.id),
      };
    } catch (error: any) {
      return {
        success: false,
        domain: domain,
        error: error.message
      };
    }
  }

  async transferDomain(domain: string, authCode: string, years: number): Promise<DomainTransferResult> {
    const domainObj = this.splitDomain(domain);
    const handle = this.defaultHandle;

    try {
      const response = await this.fetchApi('/domains/transfer', {
        method: 'POST',
        body: JSON.stringify({
          domain: domainObj,
          auth_code: authCode,
          owner_handle: handle,
          admin_handle: handle,
          tech_handle: handle,
          billing_handle: handle
        })
      });
      if (!response.data?.id) {
        throw new Error('Openprovider did not return a domain transfer ID.');
      }

      return {
        success: true,
        domain: domain,
        transferId: response.data?.id?.toString() || ''
      };
    } catch (error: any) {
      return {
        success: false,
        domain: domain,
        error: error.message
      };
    }
  }

  async getSuggestions(domain: string): Promise<string[]> {
    return [];
  }

  async getWhois(domain: string): Promise<WhoisResult> {
    return { domain, error: 'Whois not implemented yet' };
  }

  async setNameservers(domain: string, ns0?: string, ns1?: string, ns2?: string, ns3?: string): Promise<{ success: boolean; error?: string }> {
    const domainObj = this.splitDomain(domain);
    
    try {
      const query = new URLSearchParams({ full_name: domain });
      const searchResponse = await this.fetchApi(`/domains?${query.toString()}`);
      const domainData = searchResponse.data?.results?.find((item: any) =>
        item.domain?.name === domainObj.name && item.domain?.extension === domainObj.extension
      );
      
      if (!domainData || !domainData.id) {
        throw new Error('Domain not found in your Openprovider account.');
      }
      
      // Step 2: Prepare Nameservers array
      const nameServers = [];
      if (ns0) nameServers.push({ name: ns0 });
      if (ns1) nameServers.push({ name: ns1 });
      if (ns2) nameServers.push({ name: ns2 });
      if (ns3) nameServers.push({ name: ns3 });
      
      if (nameServers.length === 0) {
        throw new Error('At least one nameserver is required.');
      }

      // Step 3: Update Domain Nameservers
      await this.fetchApi(`/domains/${domainData.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          domain: domainObj,
          name_servers: nameServers
        })
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async testConnection(): Promise<{ success: boolean; code: string; message: string }> {
    try {
      await this.authenticate();
      return {
        success: true,
        code: '200',
        message: `Successfully connected to Openprovider${this.baseUrl.includes('cte') ? ' Sandbox' : ''}.`,
      };
    } catch (error: any) {
      return { success: false, code: 'AUTH_FAILED', message: error.message };
    }
  }

  async getBalance(): Promise<{ success: boolean; balance?: number; currency?: string; error?: string }> {
    try {
      // In Openprovider v1, balance is typically under reseller or finance endpoints.
      // We'll attempt a common endpoint or fallback to a dummy response for Sandbox.
      // Try fetching reseller info:
      const response = await this.fetchApi('/resellers');
      const data = response.data?.[0]; // Assuming it returns a list of resellers
      
      // If the API returns the balance in the reseller object:
      if (data && data.balance !== undefined) {
        return { success: true, balance: data.balance, currency: data.currency || 'USD' };
      }
      
      // Fallback dummy balance for Sandbox mode to show the widget works
      return { success: false, error: 'Openprovider did not return a reseller balance.' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getRenewalPrice(domain: string) {
    try {
      const parts = domain.split('.');
      const tld = parts.slice(1).join('.');
      const tldPrice = await this.getTldPricing(tld);
      
      return {
        success: true,
        domain: domain,
        tld: tld,
        supplierPriceUsd: tldPrice.renewalPrice,
        maxDuration: 10
      };
    } catch (error: any) {
      return { success: false, error: error.message, domain: domain, tld: '', supplierPriceUsd: 0, maxDuration: 0 };
    }
  }

  async getRenewalPriceBreakdown(domain: string) {
    try {
      const parts = domain.split('.');
      const tld = parts.slice(1).join('.');
      const tldPrice = await this.getTldPricing(tld);
      
      const supplierCost = tldPrice.renewalPrice || tldPrice.registrationPrice || 0;
      return {
        success: true,
        domain: domain,
        tld: tld,
        supplierPriceUsd: supplierCost,
        markupPercent: 0,
        markupAmountUsd: 0,
        sellingPriceUsd: 0,
        sellingPriceBdt: 0,
        exchangeRate: 0,
        isSandbox: this.baseUrl.includes('cte')
      };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message, 
        domain: domain, 
        tld: '', 
        supplierPriceUsd: 0, 
        markupPercent: 0, 
        markupAmountUsd: 0, 
        sellingPriceUsd: 0, 
        sellingPriceBdt: 0, 
        exchangeRate: 0,
        isSandbox: this.baseUrl.includes('cte')
      };
    }
  }
}
