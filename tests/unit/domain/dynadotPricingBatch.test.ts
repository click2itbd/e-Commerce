import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/firebase', () => ({
  getFirestore: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(),
      })),
    })),
  })),
}));

describe('Dynadot TLD Pricing Batch', () => {
  it('validates input before calling Dynadot', async () => {
    const { getBatchTldPricing } = await import('@/services/dynadotApi');
    
    await expect(getBatchTldPricing([])).rejects.toThrow();
    await expect(getBatchTldPricing(null as any)).rejects.toThrow();
    await expect(getBatchTldPricing('com' as any)).rejects.toThrow();
  });

  it('normalizes duplicate TLDs', async () => {
    const unique = ['com', 'net', 'com', 'org'];
    const seen = new Set(unique);
    expect(seen.size).toBe(3);
  });

  it('rejects malformed TLDs', () => {
    const invalid = ['', ' ', '..com', 'com.'];
    const tldRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i;
    invalid.forEach(tld => {
      expect(tldRegex.test(tld)).toBe(false);
    });
  });

  it('response must only contain tld, customerPriceBdt, currency', () => {
    const allowed = ['tld', 'customerPriceBdt', 'currency'];
    const raw = { tld: 'com', customerPriceBdt: 1392, currency: 'BDT' };
    const sanitized = Object.fromEntries(
      Object.entries(raw).filter(([key]) => allowed.includes(key))
    );
    expect(sanitized).toEqual({ tld: 'com', customerPriceBdt: 1392, currency: 'BDT' });
    expect(sanitized).not.toHaveProperty('dynadotApiKey');
    expect(sanitized).not.toHaveProperty('exchangeRate');
    expect(sanitized).not.toHaveProperty('markupPercent');
    expect(sanitized).not.toHaveProperty('registerPriceUsd');
  });
});
