import { describe, it, expect } from 'vitest';
import type { Product, Review } from '../../../src/types';
import {
  GSC_PAGE_URL_REGEX_PATTERNS,
  GSC_QUERY_REGEX_PATTERNS,
  buildProductSeoPayload,
  parseSearchQueryWithRegex,
  rankProductsBySearchQuery,
  toJsRegExp,
} from '../../../src/utils/seoSearchRegex';

const makeProduct = (overrides: Partial<Product>): Product => ({
  id: 'prod-1',
  name: 'AMD Ryzen 5 5600G Processor',
  description: '6-Core 12-Thread desktop processor with Radeon Graphics.',
  price: 16500,
  discountPrice: 15200,
  category: 'Components',
  subCategory: 'Processor',
  brand: 'AMD',
  model: '5600G',
  sku: 'AMD-R5-5600G',
  stock: 8,
  isOutOfStock: false,
  showInStore: true,
  images: ['https://click2itbd.com/images/ryzen5600g.jpg'],
  specs: {
    Socket: 'AM4',
    Cores: '6 Cores',
    Threads: '12 Threads',
  },
  warrantyMonths: 36,
  warrantyUnit: 'months',
  createdAt: '2026-11-01T00:00:00.000Z',
  ...overrides,
});

describe('seoSearchRegex', () => {
  it('compiles all GSC query and page URL regex patterns and matches expected examples', () => {
    for (const pattern of GSC_QUERY_REGEX_PATTERNS) {
      const re = toJsRegExp(pattern.regex);
      for (const sample of pattern.exampleMatches) {
        expect(re.test(sample)).toBe(true);
      }
      if (pattern.gscRe2Alternative) {
        const altRe = toJsRegExp(pattern.gscRe2Alternative);
        expect(altRe.test('click2it ryzen 5 5600g')).toBe(true);
        expect(altRe.test('ryzen 5 5600g price in bd')).toBe(false);
      }
    }

    const nonBrand = GSC_QUERY_REGEX_PATTERNS.find(p => p.id === 'non-branded-discovery')!;
    const nonBrandRe = toJsRegExp(nonBrand.regex);
    expect(nonBrandRe.test('click2itbd computer price')).toBe(false);

    for (const urlPat of GSC_PAGE_URL_REGEX_PATTERNS) {
      const re = toJsRegExp(urlPat.regex);
      for (const sample of urlPat.exampleMatches) {
        expect(re.test(sample)).toBe(true);
      }
    }
  });

  it('parses BD buyer queries, price caps/ranges, stock flags, and hardware synonyms', () => {
    const parsedPriceBd = parseSearchQueryWithRegex('ryzen 5 5600g price in bd');
    expect(parsedPriceBd.tokens).toEqual(['ryzen', '5', '5600g']);
    expect(parsedPriceBd.maxPrice).toBeUndefined();

    const parsedCap = parseSearchQueryWithRegex('gaming monitor under 20000');
    expect(parsedCap.maxPrice).toBe(20000);
    expect(parsedCap.tokens).toEqual(['gaming', 'monitor']);

    const parsedK = parseSearchQueryWithRegex('laptop below 50k');
    expect(parsedK.maxPrice).toBe(50000);
    expect(parsedK.tokens).toEqual(['laptop']);

    const parsedRange = parseSearchQueryWithRegex('10k to 25k ssd in stock');
    expect(parsedRange.minPrice).toBe(10000);
    expect(parsedRange.maxPrice).toBe(25000);
    expect(parsedRange.inStockOnly).toBe(true);
    const ssdSynGroup = parsedRange.expandedTokenGroups.find(g => g.includes('ssd'));
    expect(ssdSynGroup).toContain('nvme');
  });

  it('ranks products accurately with non-adjacent tokens, hardware synonyms, specs, and price caps', () => {
    const ryzen = makeProduct({ id: 'p-ryzen' });
    const monitor = makeProduct({
      id: 'p-mon',
      name: 'ASUS VY229HE 22 Inch IPS Monitor',
      brand: 'ASUS',
      category: 'Monitor',
      subCategory: 'IPS Monitor',
      model: 'VY229HE',
      sku: 'ASUS-VY229HE',
      price: 18500,
      discountPrice: 17500,
      specs: { 'Refresh Rate': '75Hz', Panel: 'IPS', 'Screen Size': '21.5 Inch' },
    });
    const rtx = makeProduct({
      id: 'p-gpu',
      name: 'MSI GeForce RTX 4060 Ventus 2X 8GB Graphics Card',
      brand: 'MSI',
      category: 'Components',
      subCategory: 'Graphics Card',
      model: 'RTX-4060',
      sku: 'MSI-4060',
      price: 44000,
      discountPrice: 42500,
      specs: { Memory: '8GB GDDR6' },
    });
    const hidden = makeProduct({
      id: 'p-hidden',
      name: 'Hidden Ryzen 5 5600G Draft',
      showInStore: false,
    });

    const catalog = [monitor, rtx, hidden, ryzen];

    const cpuResults = rankProductsBySearchQuery(catalog, 'cpu 5600g price in bd');
    expect(cpuResults.map(p => p.id)).toEqual(['p-ryzen']);

    const gpuResults = rankProductsBySearchQuery(catalog, 'gpu 4060');
    expect(gpuResults.map(p => p.id)).toEqual(['p-gpu']);

    const under20k = rankProductsBySearchQuery(catalog, 'monitor under 20000');
    expect(under20k.map(p => p.id)).toEqual(['p-mon']);

    const under16k = rankProductsBySearchQuery(catalog, 'under 16000');
    expect(under16k.map(p => p.id)).toEqual(['p-ryzen']);
  });

  it('builds complete Product, BreadcrumbList, and FAQPage structured SEO payloads', () => {
    const product = makeProduct({});
    const reviews: Review[] = [
      {
        id: 'rev-1',
        productId: 'prod-1',
        userId: 'u-1',
        userName: 'Tanvir',
        rating: 5,
        comment: 'Genuine processor at great BD price!',
        status: 'approved',
        createdAt: '2026-11-10T10:00:00.000Z',
      },
    ];

    const payload = buildProductSeoPayload(product, reviews, 2026);
    expect(payload.title).toContain('Price in Bangladesh (2026)');
    expect(payload.productMeta).toEqual({
      priceAmount: 15200,
      priceCurrency: 'BDT',
      availability: 'in stock',
      brand: 'AMD',
      condition: 'new',
      retailerItemId: 'AMD-R5-5600G',
    });
    expect(payload.productSchema['@type']).toBe('Product');
    expect(payload.productSchema.offers.priceCurrency).toBe('BDT');
    expect(payload.productSchema.offers.price).toBe(15200);
    expect(payload.productSchema.additionalProperty).toHaveLength(3);
    expect(payload.productSchema.aggregateRating.reviewCount).toBe(1);
    expect(payload.breadcrumbSchema['@type']).toBe('BreadcrumbList');
    expect(payload.faqSchema['@type']).toBe('FAQPage');
    expect(payload.faqItems).toHaveLength(3);
  });
});
