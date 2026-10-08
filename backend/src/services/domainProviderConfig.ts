import { getAdminDocument } from '../firebase/admin';
import { config } from '../config/index.js';

export interface DomainProviderConfig {
  domainApiType: string;
  domainApiKey: string;
  openproviderPassword?: string;
}

export async function getDomainProviderConfig(): Promise<DomainProviderConfig> {
  const envDomainApiType = process.env.DOMAIN_API_TYPE?.trim().toLowerCase();
  const dynadotApiKey = process.env.DYNADOT_API_KEY || config.secrets.dynadotApiKey || '';
  const openproviderUsername = process.env.OPENPROVIDER_USERNAME || '';
  const openproviderPassword = process.env.OPENPROVIDER_PASSWORD || '';

  let storedConfig: Record<string, any> = {};
  try {
    const result = await getAdminDocument('settings', 'api_keys');
    storedConfig = result.data || {};
  } catch (error) {
    console.warn('Error reading domain config from Firestore settings/api_keys:', error);
  }

  const domainApiType = envDomainApiType
    || String(storedConfig.domainApiType || '').trim().toLowerCase()
    || (openproviderUsername ? 'openprovider' : dynadotApiKey ? 'dynadot' : 'dummy');

  const domainApiKey = domainApiType === 'openprovider'
    ? openproviderUsername || storedConfig.openproviderUsername || storedConfig.domainApiKey || ''
    : dynadotApiKey || storedConfig.dynadotApiKey || storedConfig.domainApiKey || '';

  return {
    domainApiType,
    domainApiKey,
    openproviderPassword: domainApiType === 'openprovider' ? openproviderPassword : undefined,
  };
}
