import { IDomainProvider } from './domain/IDomainProvider';
import { IHostingProvider } from './hosting/IHostingProvider';

export function getDomainProvider(config: { domainApiType: string; domainApiKey?: string }): IDomainProvider {
  return {
    checkAvailability: async (domains) => domains.map(d => ({ domain: d, available: true, price: 10, currency: 'USD' })),
    getSuggestions: async () => [],
    registerDomain: async (req) => ({ success: true, domain: req.domain, registrationId: 'mock' }),
    renewDomain: async (domain) => ({ success: true, domain, transactionId: 'mock' }),
    getWhois: async (domain) => ({ domain, error: 'Not available' })
  };
}

export function getHostingProvider(config: { hostingApiType: string; hostingApiKey?: string }): IHostingProvider {
  return {
    provisionAccount: async (req) => ({ success: true, providerAccountId: 'mock', cPanelUrl: 'https://cpanel.mock.com' }),
    suspendAccount: async () => {},
    unsuspendAccount: async () => {},
    terminateAccount: async () => {},
    getUsage: async (id) => ({ providerAccountId: id, diskUsageMB: 0, diskLimitMB: 1000, bandwidthUsageMB: 0, bandwidthLimitMB: 10000, lastUpdated: new Date().toISOString() }),
    changePlan: async () => {}
  };
}
