import { getAdminDocument } from '../firebase/admin';

export interface DomainProviderConfig {
  domainApiType: 'openprovider';
  domainApiKey: string;
  openproviderPassword: string;
  openproviderSandbox: boolean;
}

export async function getDomainProviderConfig(): Promise<DomainProviderConfig> {
  let storedConfig: Record<string, any> = {};
  let registrarConfig: Record<string, any> = {};
  try {
    const [apiKeys, registrarSettings] = await Promise.all([
      getAdminDocument('settings', 'api_keys'),
      getAdminDocument('hosting_config', 'registrar_settings'),
    ]);
    storedConfig = apiKeys.data || {};
    registrarConfig = registrarSettings.data?.openprovider || {};
  } catch (error) {
    console.warn('Error reading Openprovider config from Firestore:', error);
  }

  const domainApiKey = process.env.OPENPROVIDER_USERNAME
    || registrarConfig.username
    || storedConfig.openproviderUsername
    || '';
  const openproviderPassword = process.env.OPENPROVIDER_PASSWORD
    || registrarConfig.password
    || storedConfig.openproviderPassword
    || '';
  const openproviderSandbox = process.env.OPENPROVIDER_SANDBOX_MODE !== undefined
    ? process.env.OPENPROVIDER_SANDBOX_MODE === 'true'
    : registrarConfig.isSandbox !== false;

  return {
    domainApiType: 'openprovider',
    domainApiKey,
    openproviderPassword,
    openproviderSandbox,
  };
}
