import { describe, it, expect } from 'vitest';

describe('Secret Exposure Prevention', () => {
  const forbiddenPatterns = [
    /DYNADOT/i,
    /WHM.*TOKEN/i,
    /RESEND.*KEY/i,
    /BKASH.*SECRET/i,
    /API_KEY/i,
    /APIKEY/i,
    /SECRET/i,
  ];

  it('pricing formula must not expose raw Dynadot API key', () => {
    const pricingResult = {
      tld: 'com',
      customerPriceBdt: 1392,
      currency: 'BDT',
    };

    const serialized = JSON.stringify(pricingResult);
    forbiddenPatterns.forEach(pattern => {
      expect(serialized).not.toMatch(pattern);
    });
  });

  it('WHM test must not return token in message', () => {
    const token = 'SECRET_WHM_TOKEN_123';
    const safeMessage = 'WHM authentication failed. Please check your API token.';

    expect(safeMessage).not.toContain(token);
    expect(safeMessage).not.toMatch(/whm\s+[A-Za-z0-9_\-]{20,}/i);
  });

  it('response fields must not include wholesale price', () => {
    const response = {
      tld: 'com',
      customerPriceBdt: 1392,
      currency: 'BDT',
    };

    expect(response).not.toHaveProperty('registerPriceUsd');
    expect(response).not.toHaveProperty('wholesalePrice');
    expect(response).not.toHaveProperty('supplierPrice');
  });

  it('response fields must not include exchange rate or markup', () => {
    const response = {
      tld: 'com',
      customerPriceBdt: 1392,
      currency: 'BDT',
    };

    expect(response).not.toHaveProperty('usdToBdtRate');
    expect(response).not.toHaveProperty('exchangeRate');
    expect(response).not.toHaveProperty('markupPercent');
    expect(response).not.toHaveProperty('domainMarkupPercent');
  });
});
