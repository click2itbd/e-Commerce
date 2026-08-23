import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DynadotDomainProvider, ProviderError } from '../src/providers/domain/DynadotDomainProvider';

const mockFetch = vi.fn();

describe('DynadotDomainProvider', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
  });

  const provider = new DynadotDomainProvider('TEST_API_KEY', false, 15000);

  describe('timeout', () => {
    it('returns timeout error in result on AbortError', async () => {
      mockFetch.mockRejectedValueOnce(new Error('The user aborted a request.'));

      const results = await provider.checkAvailability(['example.com']);
      expect(results[0].error).toContain('aborted');
    });
  });

  describe('provider failure', () => {
    it('returns provider_error in result on Dynadot error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ ResponseCode: '1', Error: 'Rate limit exceeded' }),
      });

      const results = await provider.checkAvailability(['example.com']);
      expect(results[0].error).toBe('Rate limit exceeded');
    });

    it('returns invalid_response in result on malformed JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'not json',
      });

      const results = await provider.checkAvailability(['example.com']);
      expect(results[0].error).toContain('Invalid Dynadot response');
    });

    it('returns network error in result on fetch failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const results = await provider.checkAvailability(['example.com']);
      expect(results[0].error).toBe('ECONNREFUSED');
    });
  });

  describe('checkAvailability', () => {
    it('returns available=true when Available=yes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          ResponseCode: '0',
          SearchResponse: { SearchResults: [{ Available: 'yes', Price: '12.99' }] },
        }),
      });

      const results = await provider.checkAvailability(['example.com']);
      expect(results[0]).toEqual({
        domain: 'example.com',
        available: true,
        price: 12.99,
        currency: 'USD',
        status: 'available',
      });
    });

    it('returns available=false when Available=no', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          ResponseCode: '0',
          SearchResponse: { SearchResults: [{ Available: 'no', Price: '12.99' }] },
        }),
      });

      const results = await provider.checkAvailability(['example.com']);
      expect(results[0].available).toBe(false);
      expect(results[0].status).toBe('taken');
    });

    it('returns error when no search results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ ResponseCode: '0', SearchResponse: { SearchResults: [] } }),
      });

      const results = await provider.checkAvailability(['example.com']);
      expect(results[0].available).toBe(false);
      expect(results[0].error).toBe('No search results found');
    });

    it('handles multiple domains', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ ResponseCode: '0', SearchResponse: { SearchResults: [{ Available: 'yes', Price: '10.00' }] } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ ResponseCode: '0', SearchResponse: { SearchResults: [{ Available: 'no', Price: '10.00' }] } }),
        });

      const results = await provider.checkAvailability(['example.com', 'taken.com']);
      expect(results).toHaveLength(2);
      expect(results[0].available).toBe(true);
      expect(results[1].available).toBe(false);
    });

    it('does not throw on individual domain failure', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ ResponseCode: '0', SearchResponse: { SearchResults: [{ Available: 'yes', Price: '10.00' }] } }),
        });

      const results = await provider.checkAvailability(['fail.com', 'ok.com']);
      expect(results).toHaveLength(2);
      expect(results[0].error).toBe('Network error');
      expect(results[1].available).toBe(true);
    });
  });

  describe('registerDomain', () => {
    it('returns success on registration', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          ResponseCode: '0',
          RegisterResponse: { RegisterResults: [{ Status: 'success', RegistrationID: 'REG123', ExpirationDate: '2025-01-01' }] },
        }),
      });

      const result = await provider.registerDomain({ domain: 'example.com', years: 1 });
      expect(result.success).toBe(true);
      expect(result.registrationId).toBe('REG123');
    });

    it('returns failure with message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          ResponseCode: '0',
          RegisterResponse: { RegisterResults: [{ Status: 'failed', Message: 'Domain not available' }] },
        }),
      });

      const result = await provider.registerDomain({ domain: 'example.com', years: 1 });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Domain not available');
    });
  });

  describe('renewDomain', () => {
    it('returns success on renewal', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          ResponseCode: '0',
          RenewResponse: { RenewResults: [{ Status: 'success', ExpirationDate: '2026-01-01' }] },
        }),
      });

      const result = await provider.renewDomain('example.com', 1);
      expect(result.success).toBe(true);
      expect(result.newExpiryDate).toBe('2026-01-01');
    });
  });

  describe('getWhois', () => {
    it('returns parsed WHOIS data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          ResponseCode: '0',
          WhoisResponse: {
            Registrar: 'Dynadot',
            CreationDate: '2020-01-01',
            ExpirationDate: '2025-01-01',
            NameServers: ['ns1.dynadot.com'],
          },
        }),
      });

      const result = await provider.getWhois('example.com');
      expect(result.registrar).toBe('Dynadot');
      expect(result.nameServers).toEqual(['ns1.dynadot.com']);
    });

    it('returns error object on failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('WHOIS failed'));

      const result = await provider.getWhois('example.com');
      expect(result.error).toBe('WHOIS failed');
    });
  });

  describe('getTldPricing', () => {
    it('returns parsed TLD pricing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          ResponseCode: '0',
          TLDPricing: { TldPrice: [{ RegistrationPrice: '12.99', RenewPrice: '13.99', TransferPrice: '11.99', RestorePrice: '20.00' }] },
        }),
      });

      const result = await provider.getTldPricing('com');
      expect(result.registrationPrice).toBe(12.99);
      expect(result.renewalPrice).toBe(13.99);
      expect(result.transferPrice).toBe(11.99);
      expect(result.restorePrice).toBe(20.00);
    });

    it('throws when TLD pricing not available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ ResponseCode: '0', TLDPricing: { TldPrice: [] } }),
      });

      await expect(provider.getTldPricing('unknown')).rejects.toThrow('TLD pricing not available');
    });
  });

  describe('getBatchTldPricing', () => {
    it('parallelizes and filters successful results', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ ResponseCode: '0', TLDPricing: { TldPrice: [{ RegistrationPrice: '12.99' }] } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ ResponseCode: '0', TLDPricing: { TldPrice: [{ RegistrationPrice: '10.99' }] } }),
        });

      const result = await provider.getBatchTldPricing(['com', 'net']);
      expect(result.pricing).toHaveLength(2);
      expect(result.pricing[0].tld).toBe('.com');
      expect(result.pricing[1].tld).toBe('.net');
    });
  });

  describe('transferDomain', () => {
    it('returns success on transfer', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          ResponseCode: '0',
          TransferResponse: { TransferResults: [{ Status: 'success', TransferID: 'TRF123' }] },
        }),
      });

      const result = await provider.transferDomain('example.com', 'auth123', 1);
      expect(result.success).toBe(true);
      expect(result.transferId).toBe('TRF123');
    });
  });

  describe('secret protection', () => {
    it('never exposes API key in error messages', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ ResponseCode: '1', Error: 'Some error' }),
      });

      const results = await provider.checkAvailability(['example.com']);
      expect(results[0].error).not.toContain('TEST_API_KEY');
    });
  });

  describe('base URL', () => {
    it('uses sandbox URL when isSandbox=true', async () => {
      const sandboxProvider = new DynadotDomainProvider('KEY', true);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ ResponseCode: '0', SearchResponse: { SearchResults: [{ Available: 'yes', Price: '10.00' }] } }),
      });

      await sandboxProvider.checkAvailability(['example.com']);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][0]).toContain('api-sandbox.dynadot.com');
    });

    it('uses production URL when isSandbox=false', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ ResponseCode: '0', SearchResponse: { SearchResults: [{ Available: 'yes', Price: '10.00' }] } }),
      });

      await provider.checkAvailability(['example.com']);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][0]).toContain('api.dynadot.com');
      expect(mockFetch.mock.calls[0][0]).not.toContain('sandbox');
    });
  });
});
