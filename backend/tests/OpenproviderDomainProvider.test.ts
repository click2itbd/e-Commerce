import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OpenproviderDomainProvider } from '../src/providers/domain/OpenproviderDomainProvider';

const mockFetch = vi.fn();
const response = (body: unknown, ok = true, status = 200) => ({
  ok,
  status,
  json: async () => body,
});

describe('OpenproviderDomainProvider', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses Openprovider availability results from data.results', async () => {
    mockFetch
      .mockResolvedValueOnce(response({ code: 0, data: { token: 'test-token' } }))
      .mockResolvedValueOnce(response({
        code: 0,
        data: { results: [{ domain: 'example.com', status: 'free' }] },
      }));

    const provider = new OpenproviderDomainProvider('test-user', 'test-password', true);
    const result = await provider.checkAvailability(['example.com']);

    expect(result).toEqual([{ domain: 'example.com', available: true, status: 'free' }]);
  });

  it('loads registration, renewal, and transfer prices using the v1 domain-price endpoint', async () => {
    mockFetch
      .mockResolvedValueOnce(response({ code: 0, data: { token: 'test-token' } }))
      .mockResolvedValueOnce(response({ code: 0, data: { price: { reseller: { price: 10, currency: 'USD' } } } }))
      .mockResolvedValueOnce(response({ code: 0, data: { price: { reseller: { price: 12, currency: 'USD' } } } }))
      .mockResolvedValueOnce(response({ code: 0, data: { price: { reseller: { price: 9, currency: 'USD' } } } }));

    const provider = new OpenproviderDomainProvider('test-user', 'test-password', true);
    const pricing = await provider.getTldPricing('.COM');

    expect(pricing).toEqual({
      tld: '.com',
      currency: 'USD',
      registrationPrice: 10,
      renewalPrice: 12,
      transferPrice: 9,
      restorePrice: 0,
    });
    expect(mockFetch).toHaveBeenCalledTimes(4);
    for (const [url] of mockFetch.mock.calls.slice(1)) {
      expect(String(url)).toContain('api.cte.openprovider.eu/v1/domains/prices?');
    }
  });

  it('does not turn provider errors or missing operation prices into zero prices', async () => {
    mockFetch
      .mockResolvedValueOnce(response({ code: 0, data: { token: 'test-token' } }))
      .mockResolvedValueOnce(response({ code: 0, data: { price: { reseller: { price: 10, currency: 'USD' } } } }))
      .mockResolvedValueOnce(response({ code: 0, data: { price: { reseller: { price: 12, currency: 'USD' } } } }))
      .mockResolvedValueOnce(response({ code: 1000, desc: 'Transfer price unavailable' }));

    const provider = new OpenproviderDomainProvider('test-user', 'test-password', true);

    await expect(provider.getTldPricing('com')).rejects.toThrow('Transfer price unavailable');
  });

  it('renews an existing domain using its Openprovider domain ID', async () => {
    mockFetch
      .mockResolvedValueOnce(response({ code: 0, data: { token: 'test-token' } }))
      .mockResolvedValueOnce(response({
        code: 0,
        data: { results: [{ id: 42, domain: { name: 'example', extension: 'com' } }] },
      }))
      .mockResolvedValueOnce(response({ code: 0, data: { status: 'ACT' } }));

    const provider = new OpenproviderDomainProvider('test-user', 'test-password', true);
    const result = await provider.renewDomain('example.com', 2);

    expect(result).toMatchObject({ success: true, domain: 'example.com', transactionId: '42' });
    expect(String(mockFetch.mock.calls[2][0])).toContain('/domains/42/renew');
    expect(JSON.parse(mockFetch.mock.calls[2][1].body)).toEqual({
      domain: { name: 'example', extension: 'com' },
      id: 42,
      period: 2,
    });
  });

  it('fails domain registration when no Openprovider contact handle is configured', async () => {
    const previousHandle = process.env.OPENPROVIDER_DEFAULT_HANDLE;
    delete process.env.OPENPROVIDER_DEFAULT_HANDLE;
    try {
      const provider = new OpenproviderDomainProvider('test-user', 'test-password', true);
      const result = await provider.registerDomain({ domain: 'example.com', years: 1 });

      expect(result.success).toBe(false);
      expect(result.error).toContain('OPENPROVIDER_DEFAULT_HANDLE');
      expect(mockFetch).not.toHaveBeenCalled();
    } finally {
      if (previousHandle === undefined) {
        delete process.env.OPENPROVIDER_DEFAULT_HANDLE;
      } else {
        process.env.OPENPROVIDER_DEFAULT_HANDLE = previousHandle;
      }
    }
  });

  it('sends domain registration contacts and nameservers using the v1 field names', async () => {
    mockFetch
      .mockResolvedValueOnce(response({ code: 0, data: { token: 'test-token' } }))
      .mockResolvedValueOnce(response({ code: 0, data: { id: 42 } }));

    const provider = new OpenproviderDomainProvider('test-user', 'test-password', true);
    const result = await provider.registerDomain({
      domain: 'example.com',
      years: 1,
      contactId: 'AB12345-EA',
      nameServers: ['ns1.example.net', 'ns2.example.net'],
      autoRenew: true,
    });

    expect(result.success).toBe(true);
    expect(JSON.parse(mockFetch.mock.calls[1][1].body)).toEqual({
      domain: { name: 'example', extension: 'com' },
      period: 1,
      owner_handle: 'AB12345-EA',
      admin_handle: 'AB12345-EA',
      tech_handle: 'AB12345-EA',
      billing_handle: 'AB12345-EA',
      name_servers: [{ name: 'ns1.example.net' }, { name: 'ns2.example.net' }],
      autorenew: 'on',
    });
  });
});
