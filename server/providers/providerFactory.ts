import { IDomainProvider } from './domain/IDomainProvider';
import { IHostingProvider } from './hosting/IHostingProvider';

export function getDomainProvider(config: { domainApiType: string; domainApiKey?: string }): IDomainProvider {
  if (config.domainApiType === 'dummy' || !config.domainApiType) {
    return {
      checkAvailability: async () => { throw new Error('Domain provider not configured. Please configure a real domain provider in admin settings.'); },
      getSuggestions: async () => { throw new Error('Domain provider not configured.'); },
      registerDomain: async () => ({ success: false, error: 'Domain provider not configured. Please configure a real domain provider in admin settings.' }),
      renewDomain: async () => ({ success: false, error: 'Domain provider not configured.' }),
      getWhois: async () => ({ error: 'Domain provider not configured.' })
    };
  }

  switch (config.domainApiType) {
    case 'dynadot':
      if (!config.domainApiKey) {
        return {
          checkAvailability: async () => { throw new Error('Dynadot API key not configured.'); },
          getSuggestions: async () => { throw new Error('Dynadot API key not configured.'); },
          registerDomain: async () => ({ success: false, error: 'Dynadot API key not configured.' }),
          renewDomain: async () => ({ success: false, error: 'Dynadot API key not configured.' }),
          getWhois: async () => ({ error: 'Dynadot API key not configured.' })
        };
      }
      const { DynadotDomainProvider } = require('./domain/DynadotDomainProvider');
      return new DynadotDomainProvider(config.domainApiKey);
    default:
      return {
        checkAvailability: async () => { throw new Error(`Unsupported domain provider: ${config.domainApiType}`); },
        getSuggestions: async () => { throw new Error(`Unsupported domain provider: ${config.domainApiType}`); },
        registerDomain: async () => ({ success: false, error: `Unsupported domain provider: ${config.domainApiType}` }),
        renewDomain: async () => ({ success: false, error: `Unsupported domain provider: ${config.domainApiType}` }),
        getWhois: async () => ({ error: `Unsupported domain provider: ${config.domainApiType}` })
      };
  }
}

export function getHostingProvider(config: { hostingApiType?: string; hostingApiKey?: string; hostingApiUrl?: string; hostingApiUsername?: string }): IHostingProvider {
  const hostingApiType = config.hostingApiType || process.env.WHM_API_TYPE || 'dummy';
  const hostingApiKey = config.hostingApiKey || process.env.WHM_API_TOKEN || process.env.WHM_API_KEY || '';
  const hostingApiUrl = config.hostingApiUrl || process.env.WHM_API_URL || '';
  const hostingApiUsername = config.hostingApiUsername || process.env.WHM_USERNAME || 'root';

  if (hostingApiType === 'dummy' || !hostingApiType) {
    return {
      provisionAccount: async () => ({ success: false, error: 'Hosting provider not configured. Please configure WHM_API_TYPE, WHM_API_URL, and WHM_API_TOKEN environment variables.' }),
      suspendAccount: async () => { throw new Error('Hosting provider not configured.'); },
      unsuspendAccount: async () => { throw new Error('Hosting provider not configured.'); },
      terminateAccount: async () => { throw new Error('Hosting provider not configured.'); },
      getUsage: async () => { throw new Error('Hosting provider not configured.'); },
      changePlan: async () => { throw new Error('Hosting provider not configured.'); }
    };
  }

  switch (hostingApiType) {
    case 'cpanel':
      if (!hostingApiKey) {
        return {
          provisionAccount: async () => ({ success: false, error: 'cPanel API key not configured.' }),
          suspendAccount: async () => { throw new Error('cPanel API key not configured.'); },
          unsuspendAccount: async () => { throw new Error('cPanel API key not configured.'); },
          terminateAccount: async () => { throw new Error('cPanel API key not configured.'); },
          getUsage: async () => { throw new Error('cPanel API key not configured.'); },
          changePlan: async () => { throw new Error('cPanel API key not configured.'); }
        };
      }
      const { CpanelHostingProvider } = require('./hosting/CpanelHostingProvider');
      return new CpanelHostingProvider(hostingApiKey, hostingApiUrl, hostingApiUsername);
    case 'resellerclub':
      if (!hostingApiKey) {
        return {
          provisionAccount: async () => ({ success: false, error: 'ResellerClub API key not configured.' }),
          suspendAccount: async () => { throw new Error('ResellerClub API key not configured.'); },
          unsuspendAccount: async () => { throw new Error('ResellerClub API key not configured.'); },
          terminateAccount: async () => { throw new Error('ResellerClub API key not configured.'); },
          getUsage: async () => { throw new Error('ResellerClub API key not configured.'); },
          changePlan: async () => { throw new Error('ResellerClub API key not configured.'); }
        };
      }
      const { ResellerClubHostingProvider } = require('./hosting/ResellerClubHostingProvider');
      return new ResellerClubHostingProvider(hostingApiKey, hostingApiUrl);
    default:
      return {
        provisionAccount: async () => ({ success: false, error: `Unsupported hosting provider: ${hostingApiType}` }),
        suspendAccount: async () => { throw new Error(`Unsupported hosting provider: ${hostingApiType}`); },
        unsuspendAccount: async () => { throw new Error(`Unsupported hosting provider: ${hostingApiType}`); },
        terminateAccount: async () => { throw new Error(`Unsupported hosting provider: ${hostingApiType}`); },
        getUsage: async () => { throw new Error(`Unsupported hosting provider: ${hostingApiType}`); },
        changePlan: async () => { throw new Error(`Unsupported hosting provider: ${hostingApiType}`); }
      };
  }
}
