import { IDomainProvider } from './domain/IDomainProvider';
import { IHostingProvider } from './hosting/IHostingProvider';
import { DummyDomainProvider } from './domain/DummyDomainProvider';
import { DummyHostingProvider } from './hosting/DummyHostingProvider';

export function getDomainProvider(config: { domainApiType: string; domainApiKey?: string }): IDomainProvider {
  switch (config.domainApiType) {
    case 'dummy':
      return new DummyDomainProvider();
    // Add real providers here, e.g. case 'resellerclub': return new ResellerClubProvider(config.domainApiKey)
    default:
      return new DummyDomainProvider();
  }
}

export function getHostingProvider(config: { hostingApiType: string; hostingApiKey?: string }): IHostingProvider {
  switch (config.hostingApiType) {
    case 'dummy':
      return new DummyHostingProvider();
    // Add real providers here, e.g. case 'resellerclub': return new ResellerClubHostingProvider(config.hostingApiKey)
    default:
      return new DummyHostingProvider();
  }
}
