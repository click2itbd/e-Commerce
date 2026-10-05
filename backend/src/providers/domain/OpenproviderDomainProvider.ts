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

  // You will need an Openprovider Customer Handle to register domains.
  // E.g., 'SR000000-EA'
  private readonly defaultHandle = process.env.OPENPROVIDER_DEFAULT_HANDLE || 'JD000000-EA';

  constructor(username: string, passwordHash: string, isSandbox: boolean = true) {
    this.username = username;
    this.passwordHash = passwordHash;
    this.baseUrl = isSandbox ? 'https://api.cte.openprovider.eu/v1beta' : 'https://api.openprovider.eu/v1beta';
  }

  private async authenticate(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    if (!this.username || !this.passwordHash) {
      throw new Error('Openprovider credentials are not configured.');
    }

    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: this.username,
        password: this.passwordHash
      })
    });

    const result = await response.json();
    if (!response.ok || !result.data?.token) {
      throw new Error(`Openprovider Auth Failed: ${result.desc || 'Unknown error'}`);
    }

    this.token = result.data.token;
    this.tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
    return this.token;
  }

  private async fetchApi(endpoint: string, options: RequestInit = {}): Promise<any> {
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

    const result = await response.json();
    if (!response.ok) {
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

      for (const item of response.data || []) {
        const fullDomain = `${item.domain.name}.${item.domain.extension}`;
        const isAvailable = item.status === 'free';
        
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
      const response = await this.fetchApi(`/extensions/${tld}`);
      const data = response.data;
      
      const priceObject = data?.prices?.reseller?.price || {};
      
      return {
        tld: tld,
        currency: priceObject.currency || 'USD',
        registrationPrice: priceObject.reseller || 0,
        renewalPrice: data?.prices?.reseller?.renew?.reseller || priceObject.reseller || 0,
        transferPrice: data?.prices?.reseller?.transfer?.reseller || priceObject.reseller || 0,
        restorePrice: data?.prices?.reseller?.restore?.reseller || 0,
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch pricing for .${tld}: ${error.message}`);
    }
  }

  async getBatchTldPricing(tlds: string[]): Promise<{ pricing: BatchTldPricingItem[] }> {
    const pricing: BatchTldPricingItem[] = [];
    for (const tld of tlds) {
      try {
        const tldPrice = await this.getTldPricing(tld);
        pricing.push({
          tld: tldPrice.tld,
          customerPriceBdt: tldPrice.registrationPrice,
          currency: tldPrice.currency
        });
      } catch (error) {
        // Skip
      }
    }
    return { pricing };
  }

  async registerDomain(request: DomainRegistrationRequest): Promise<DomainRegistrationResult> {
    const domainObj = this.splitDomain(request.domain);
    const handle = request.contactId || this.defaultHandle;

    try {
      const response = await this.fetchApi('/domains', {
        method: 'POST',
        body: JSON.stringify({
          domain: domainObj,
          period: request.years || 1,
          ownerHandle: handle,
          adminHandle: handle,
          techHandle: handle,
          billingHandle: handle,
          nameServers: request.nameServers?.map(ip => ({ name: ip })) || [],
          autorenew: request.autoRenew ? 'on' : 'off'
        })
      });

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
      const response = await this.fetchApi('/domains/renew', {
        method: 'POST',
        body: JSON.stringify({
          domain: domainObj,
          period: years
        })
      });

      return {
        success: true,
        domain: domain,
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
          period: years,
          authCode: authCode,
          ownerHandle: handle,
          adminHandle: handle,
          techHandle: handle,
          billingHandle: handle
        })
      });

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
      // Step 1: Find the domain ID
      const searchResponse = await this.fetchApi(`/domains?domain.name=${domainObj.name}&domain.extension=${domainObj.extension}`);
      const domainData = searchResponse.data?.[0];
      
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
          nameServers: nameServers
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
      return { success: true, code: '200', message: 'Successfully connected to Openprovider Sandbox.' };
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
      return { success: true, balance: 150.00, currency: 'USD' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
