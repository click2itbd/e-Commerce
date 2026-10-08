import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getAdminDocument } from '../src/firebase/admin';
import { getDomainProviderConfig } from '../src/services/domainProviderConfig';

vi.mock('../src/firebase/admin', () => ({
  getAdminDocument: vi.fn(),
}));

describe('getDomainProviderConfig', () => {
  beforeEach(() => {
    vi.stubEnv('DOMAIN_API_TYPE', '');
    vi.stubEnv('OPENPROVIDER_USERNAME', '');
    vi.stubEnv('OPENPROVIDER_PASSWORD', '');
    vi.mocked(getAdminDocument).mockResolvedValue({ exists: false, data: null });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('selects Openprovider credentials instead of forcing the Dynadot provider', async () => {
    vi.stubEnv('OPENPROVIDER_USERNAME', 'openprovider-user');
    vi.stubEnv('OPENPROVIDER_PASSWORD', 'openprovider-password');

    await expect(getDomainProviderConfig()).resolves.toMatchObject({
      domainApiType: 'openprovider',
      domainApiKey: 'openprovider-user',
      openproviderPassword: 'openprovider-password',
    });
  });

  it('uses the stored provider selection and Openprovider username', async () => {
    vi.mocked(getAdminDocument).mockResolvedValue({
      exists: true,
      data: { domainApiType: 'openprovider', openproviderUsername: 'stored-user' },
    });
    vi.stubEnv('OPENPROVIDER_PASSWORD', 'openprovider-password');

    await expect(getDomainProviderConfig()).resolves.toMatchObject({
      domainApiType: 'openprovider',
      domainApiKey: 'stored-user',
      openproviderPassword: 'openprovider-password',
    });
  });
});
