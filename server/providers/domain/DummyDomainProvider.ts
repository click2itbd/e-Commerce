import { IDomainProvider, DomainAvailabilityResult, DomainRegistrationRequest, DomainRegistrationResult, DomainRenewalResult, WhoisResult } from './IDomainProvider';

export class DummyDomainProvider implements IDomainProvider {
  private tldPricing: Record<string, number> = {
    '.com': 1200,
    '.net': 1400,
    '.org': 1300,
    '.com.bd': 800,
    '.xyz': 600,
  };

  private randomDelay(min = 400, max = 900): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  private generateRegistrarOrderId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = 'DUMMY-REG-';
    for (let i = 0; i < 8; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  async checkAvailability(domains: string[]): Promise<DomainAvailabilityResult[]> {
    console.log('[DummyDomainProvider] checkAvailability called with:', domains);
    await this.randomDelay();

    return domains.map(domain => {
      const isAvailable = Math.random() < 0.7;
      const lowerDomain = domain.toLowerCase();
      let price = 1500;
      for (const [tld, tldPrice] of Object.entries(this.tldPricing)) {
        if (lowerDomain.endsWith(tld)) {
          price = tldPrice;
          break;
        }
      }

      return {
        domain,
        available: isAvailable,
        price: isAvailable ? price : undefined,
        currency: 'BDT',
        renewalPrice: isAvailable ? price : undefined,
        error: isAvailable ? undefined : 'Domain is already registered',
      };
    });
  }

  async getSuggestions(domain: string): Promise<string[]> {
    console.log('[DummyDomainProvider] getSuggestions called with:', domain);
    await this.randomDelay(300, 600);

    const parts = domain.split('.');
    const name = parts[0];
    const tld = parts[1] || 'com';

    const prefixes = ['my', 'get', 'the', 'try', 'best'];
    const suffixes = ['bd', 'pro', 'online', 'hq', 'now'];

    const suggestions: string[] = [];

    if (Math.random() < 0.5 && name.length > 2) {
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      suggestions.push(`${prefix}${name}.${tld}`);
    }

    if (Math.random() < 0.5 && name.length > 2) {
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      suggestions.push(`${name}${suffix}.${tld}`);
    }

    const alternativeTlds = ['.com', '.net', '.org', '.xyz', '.com.bd'].filter(t => t !== `.${tld}`);
    const shuffled = alternativeTlds.sort(() => Math.random() - 0.5);
    for (const altTld of shuffled.slice(0, 2)) {
      suggestions.push(`${name}${altTld}`);
    }

    return suggestions.slice(0, 5);
  }

  async registerDomain(request: DomainRegistrationRequest): Promise<DomainRegistrationResult> {
    console.log('[DummyDomainProvider] registerDomain called with:', request);
    await this.randomDelay(800, 1500);

    const success = Math.random() < 0.9;

    if (success) {
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + request.years);

      return {
        success: true,
        domain: request.domain,
        registrationId: this.generateRegistrarOrderId(),
        expiresAt: expiryDate.toISOString(),
      };
    } else {
      return {
        success: false,
        domain: request.domain,
        error: 'Registration failed due to simulated random error',
      };
    }
  }

  async renewDomain(domain: string, years: number): Promise<DomainRenewalResult> {
    console.log('[DummyDomainProvider] renewDomain called with:', { domain, years });
    await this.randomDelay(600, 1200);

    const newExpiryDate = new Date();
    newExpiryDate.setFullYear(newExpiryDate.getFullYear() + years);

    return {
      success: true,
      domain,
      newExpiryDate: newExpiryDate.toISOString(),
      transactionId: `DUMMY-RENEW-${Date.now()}`,
    };
  }

  async getWhois(domain: string): Promise<WhoisResult> {
    console.log('[DummyDomainProvider] getWhois called with:', domain);
    await this.randomDelay(500, 1000);

    const createdAt = new Date();
    createdAt.setFullYear(createdAt.getFullYear() - 2);

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    return {
      domain,
      registrar: 'Click2IT BD Registrar',
      createdAt: createdAt.toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: ['clientTransferProhibited', 'clientRenewProhibited'],
      nameServers: ['ns1.click2itbd.com', 'ns2.click2itbd.com'],
      registrantName: 'Click2IT BD Customer',
      registrantEmail: 'customer@example.com',
    };
  }
}
