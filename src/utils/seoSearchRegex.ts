import type { Product, Review } from '../types';

export interface GscRegexPattern {
  id: string;
  title: string;
  banglaTitle: string;
  regex: string;
  gscFilterMode?: 'matches' | 'not_matches';
  gscRe2Alternative?: string;
  purpose: string;
  exampleMatches: string[];
}

export interface ProductMetaProps {
  priceAmount?: number;
  priceCurrency?: string;
  availability?: 'in stock' | 'out of stock';
  brand?: string;
  condition?: 'new' | 'used';
  retailerItemId?: string;
}

export interface ParsedSearchQuery {
  rawQuery: string;
  cleanedQuery: string;
  tokens: string[];
  expandedTokenGroups: string[][];
  minPrice?: number;
  maxPrice?: number;
  inStockOnly: boolean;
}

export interface ProductFaqItem {
  question: string;
  answer: string;
}

export interface ProductSeoPayload {
  title: string;
  description: string;
  keywords: string;
  canonicalUrl: string;
  imageUrl: string;
  currentPrice: number;
  regularPrice: number;
  discountAmount: number;
  isOutOfStock: boolean;
  productMeta: ProductMetaProps;
  productSchema: Record<string, any>;
  breadcrumbSchema: Record<string, any>;
  faqSchema: Record<string, any>;
  faqItems: ProductFaqItem[];
}

/**
 * Converts a GSC RE2 regex pattern containing inline (?i) into a JS RegExp.
 */
export function toJsRegExp(pattern: string): RegExp {
  const isCaseInsensitive = pattern.startsWith('(?i)');
  const stripped = isCaseInsensitive ? pattern.slice(4) : pattern;
  return new RegExp(stripped, isCaseInsensitive ? 'i' : '');
}

/**
 * Google Search Console (GSC) Search Query Regex Patterns tailored for
 * Bangladesh Computer, Laptop, Hardware, CCTV & Tech E-Commerce SEO.
 */
export const GSC_QUERY_REGEX_PATTERNS: GscRegexPattern[] = [
  {
    id: 'bd-buyer-intent',
    title: 'High-Intent BD Buyer Queries (Price / Buy / Dam)',
    banglaTitle: 'বাংলাদেশি বায়ার সার্চ কুয়েরি (Price in BD / Dam / Buy)',
    regex:
      '(?i)\\b(price|dam|koto|rate|buy|shop|order|deal|offer|discount|original|authentic|official|warranty|emi)\\b.*?\\b(bd|bangladesh|dhaka|multiplan|bdt|tk|taka)\\b|\\b(price in bd|price in bangladesh|bd price)\\b',
    gscFilterMode: 'matches',
    purpose:
      'উচ্চ ক্রয়-আগ্রহী কাস্টমারদের সার্চ কুয়েরি ট্র্যাক করতে (যারা বাংলাদেশে পণ্যের দাম বা কিনতে খুঁজছেন)।',
    exampleMatches: [
      'ryzen 5 5600g price in bd',
      'asus monitor price in bangladesh',
      'hikvision cctv camera dam koto bd',
      'gaming laptop emi dhaka multiplan',
    ],
  },
  {
    id: 'hardware-models-specs',
    title: 'Product Model & Technical Spec Queries (CPU / GPU / RAM / SSD / Hz)',
    banglaTitle: 'প্রোডাক্ট মডেল ও টেকনিক্যাল স্পেক্স সার্চ',
    regex:
      '(?i)\\b(core\\s*i[3579]|ultra\\s*[579]|ryzen\\s*[3579]|rtx\\s*\\d{4}|gtx\\s*\\d{3,4}|rx\\s*\\d{4}|ddr[45](\\s*\\d+\\s*gb)?|nvme|pcie\\s*[345]\\.0|\\d+\\s*(gb|tb)\\s*(?:ddr[45]\\s*)?(ssd|hdd|ram)|\\d{2,3}\\s*hz|[abxz]\\d{3}[m]?|h\\d{2}0[m]?)\\b',
    gscFilterMode: 'matches',
    purpose:
      'নির্দিষ্ট প্রসেসর, গ্রাফিক্স কার্ড, মাদারবোর্ড চিপসেট, SSD, RAM বা মনিটর রিফ্রেশ রেট সার্চ ট্র্যাক করতে।',
    exampleMatches: [
      'core i5 12400f bd price',
      'rtx 4060 graphics card',
      '16gb ddr5 ram bangladesh',
      'b760m motherboard price',
      '100hz ips monitor bd',
    ],
  },
  {
    id: 'question-snippet-queries',
    title: 'Question & Featured-Snippet Queries (What / Which / Best / Koto)',
    banglaTitle: 'প্রশ্নবোধক ও ফিচার্ড-স্নাইপেট কুয়েরি',
    regex:
      '(?i)^(what|which|how|where|is|can|does|why|best|top|cheapest|koto|kon|kivabe|kothay)\\b|\\?$',
    gscFilterMode: 'matches',
    purpose:
      'Google-এর "People Also Ask" এবং FAQ স্নাইপেটে র‍্যাংক করার মতো প্রশ্নবোধক সার্চ খুঁজে বের করতে।',
    exampleMatches: [
      'best gaming monitor in bangladesh',
      'which ssd is best for laptop in bd',
      'how much is ryzen 5 5600g in bangladesh?',
      'kothay original intel processor pabo',
    ],
  },
  {
    id: 'comparison-review-queries',
    title: 'Comparison & Review Queries (VS / Compare / Spec / Review)',
    banglaTitle: 'তুলনা ও রিভিউ কুয়েরি (VS / Compare / Review)',
    regex:
      '(?i)\\b(vs\\.?|versus|compare|comparison|better than|alternative|review|spec|specification|benchmark)\\b',
    gscFilterMode: 'matches',
    purpose:
      'দুটো প্রোডাক্টের তুলনা বা স্পেসিফিকেশন সার্চ ট্র্যাফিক ট্র্যাক করে ব্লগ ও কম্পেয়ার পেজ বুস্ট করতে।',
    exampleMatches: [
      'ryzen 5 5600g vs core i5 12400',
      'kingspec nx nvme ssd review bangladesh',
      'msi b550m spec',
    ],
  },
  {
    id: 'budget-price-cap',
    title: 'Budget & Price-Cap Queries (Under / Below / 20000 / 50k)',
    banglaTitle: 'নির্দিষ্ট বাজেট সার্চ কুয়েরি (Under 20k / Below 50000)',
    regex:
      '(?i)\\b(under|below|within|around|less than|budget|between)\\s*(bdt|tk|taka)?\\s*\\d+[kK]?\\b',
    gscFilterMode: 'matches',
    purpose:
      'বাজেট অনুযায়ী প্রোডাক্ট খোঁজা ক্রেতাদের (যেমন monitor under 20000, pc build under 50k) চিহ্নিত করতে।',
    exampleMatches: [
      'gaming pc under 50000 in bd',
      'monitor under 20k bangladesh',
      'laptop below tk 60000',
    ],
  },
  {
    id: 'top-tech-brands',
    title: 'Top Tech Brand Queries in Bangladesh',
    banglaTitle: 'জনপ্রিয় ব্র্যান্ডভিত্তিক সার্চ কুয়েরি',
    regex:
      '(?i)\\b(intel|amd|asus|msi|gigabyte|corsair|kingspec|kingston|samsung|wd|western digital|hp|dell|lenovo|acer|apple|tp-link|mikrotik|hikvision|dahua|logitech|a4tech|fantech|razer|value-top)\\b',
    gscFilterMode: 'matches',
    purpose:
      'ব্র্যান্ড নাম ধরে প্রোডাক্ট সার্চের পারফরম্যান্স ও র‍্যাংকিং মনিটর করতে।',
    exampleMatches: [
      'asus tuf gaming motherboard',
      'hikvision ip camera price bd',
      'logitech wireless mouse price bangladesh',
    ],
  },
  {
    id: 'non-branded-discovery',
    title: 'Non-Branded Pure Product Discovery Queries (Excludes Click2IT)',
    banglaTitle: 'নন-ব্র্যান্ডেড অর্গানিক সার্চ (দোকানের নাম ছাড়া)',
    regex: '(?i)^(?!.*(click2it|click 2 it|clicktoit)).*$',
    gscFilterMode: 'not_matches',
    gscRe2Alternative: '(?i)(click2it|click\\s*2\\s*it|clicktoit)',
    purpose:
      'যারা দোকানের নাম ছাড়াই সরাসরি প্রোডাক্ট সার্চ করে প্রথম ২-৩ পজিশনে পাচ্ছে তা আলাদা করে মাপতে (GSC UI-তে Doesn’t match regex মোডে (?i)(click2it|click\\s*2\\s*it|clicktoit) ব্যবহার করুন)।',
    exampleMatches: [
      'ryzen 5 5600g price in bangladesh',
      '22 inch ips monitor bd',
    ],
  },
];

/**
 * Google Search Console Page URL Regex Filters for auditing Product, Category & Brand rankings.
 */
export const GSC_PAGE_URL_REGEX_PATTERNS: GscRegexPattern[] = [
  {
    id: 'product-pages',
    title: 'All Product Detail Pages',
    banglaTitle: 'সব প্রোডাক্ট ডিটেইল পেজ URL',
    regex: '^https://click2itbd\\.com/product/[A-Za-z0-9_-]+$',
    gscFilterMode: 'matches',
    purpose: 'সব /product/:id পেজের গুগল ইম্প্রেশন ও এভারেজ পজিশন দেখতে।',
    exampleMatches: ['https://click2itbd.com/product/ryzen-5-5600g'],
  },
  {
    id: 'category-pages',
    title: 'All Category & Subcategory Pages',
    banglaTitle: 'সব ক্যাটাগরি ও সাব-ক্যাটাগরি URL',
    regex: '^https://click2itbd\\.com/category/[a-z0-9-]+(/[a-z0-9-]+)*$',
    gscFilterMode: 'matches',
    purpose: 'সব /category/... পেজগুলোর র‍্যাংকিং ট্র্যাক করতে।',
    exampleMatches: [
      'https://click2itbd.com/category/components/cpu',
      'https://click2itbd.com/category/monitor',
    ],
  },
  {
    id: 'brand-pages',
    title: 'All Brand Filter Pages',
    banglaTitle: 'সব ব্র্যান্ড ফিল্টার পেজ URL',
    regex: '^https://click2itbd\\.com/brands\\?brand=.+$',
    gscFilterMode: 'matches',
    purpose: 'নির্দিষ্ট ব্র্যান্ড পেজের ট্র্যাফিক দেখতে।',
    exampleMatches: ['https://click2itbd.com/brands?brand=intel'],
  },
];

const HARDWARE_SYNONYMS: Record<string, string[]> = {
  cpu: ['cpu', 'processor', 'processors'],
  processor: ['processor', 'processors', 'cpu'],
  processors: ['processor', 'processors', 'cpu'],
  gpu: ['gpu', 'vga', 'graphics', 'graphics card'],
  vga: ['gpu', 'vga', 'graphics', 'graphics card'],
  graphics: ['graphics', 'gpu', 'vga'],
  ram: ['ram', 'memory', 'ddr4', 'ddr5'],
  memory: ['memory', 'ram'],
  ssd: ['ssd', 'nvme', 'solid state', 'storage'],
  nvme: ['nvme', 'ssd', 'm.2', 'storage'],
  hdd: ['hdd', 'hard drive', 'hard disk', 'storage'],
  psu: ['psu', 'power supply'],
  mobo: ['mobo', 'motherboard', 'mainboard'],
  motherboard: ['motherboard', 'mainboard', 'mobo'],
  mainboard: ['mainboard', 'motherboard', 'mobo'],
  casing: ['casing', 'case', 'chassis', 'cabinet'],
  case: ['case', 'casing', 'chassis', 'cabinet'],
  cooler: ['cooler', 'cooling', 'fan', 'aio', 'heatsink'],
  cctv: ['cctv', 'camera', 'surveillance', 'ip camera', 'dvr', 'nvr'],
  camera: ['camera', 'cctv', 'webcam'],
  monitor: ['monitor', 'display', 'screen'],
  mouse: ['mouse', 'mice'],
  keyboard: ['keyboard', 'keypad', 'mechanical'],
  ups: ['ups', 'backup power'],
};

const parseCompactNumber = (rawNum: string): number => {
  const normalized = rawNum.toLowerCase().replace(/,/g, '').trim();
  if (normalized.endsWith('k')) {
    const base = parseFloat(normalized.slice(0, -1));
    return Number.isFinite(base) ? Math.round(base * 1000) : 0;
  }
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
};

/**
 * Parses natural BD buyer search queries with regex to extract price caps,
 * stock preference, normalized keywords, and hardware synonym groups.
 */
export function parseSearchQueryWithRegex(rawQuery: string): ParsedSearchQuery {
  const input = String(rawQuery || '').trim();
  let working = input.toLowerCase();

  let minPrice: number | undefined;
  let maxPrice: number | undefined;

  // Range syntax: "10000 to 25000", "10k-25k", "between 15000 and 30000"
  const rangeMatch = working.match(
    /(?:between\s+)?(?:bdt|tk|taka|৳)?\s*(\d+(?:[.,]\d+)?k?)\s*(?:to|-|and)\s*(?:bdt|tk|taka|৳)?\s*(\d+(?:[.,]\d+)?k?)\b/i
  );
  if (rangeMatch) {
    const low = parseCompactNumber(rangeMatch[1]);
    const high = parseCompactNumber(rangeMatch[2]);
    if (low > 0 && high > 0 && high >= low) {
      minPrice = low;
      maxPrice = high;
      working = working.replace(rangeMatch[0], ' ');
    }
  }

  // Max price cap: "under 20000", "below 50k", "within 30000"
  if (maxPrice === undefined) {
    const maxMatch = working.match(
      /\b(?:under|below|within|less\s*than|max|upto|up\s*to)\s*(?:bdt|tk|taka|৳)?\s*(\d+(?:[.,]\d+)?k?)\b/i
    );
    if (maxMatch) {
      const cap = parseCompactNumber(maxMatch[1]);
      if (cap > 0) {
        maxPrice = cap;
        working = working.replace(maxMatch[0], ' ');
      }
    }
  }

  // Min price floor: "above 10000", "over 20k", "min 15000"
  if (minPrice === undefined) {
    const minMatch = working.match(
      /\b(?:above|over|more\s*than|min|starting)\s*(?:bdt|tk|taka|৳)?\s*(\d+(?:[.,]\d+)?k?)\b/i
    );
    if (minMatch) {
      const floor = parseCompactNumber(minMatch[1]);
      if (floor > 0) {
        minPrice = floor;
        working = working.replace(minMatch[0], ' ');
      }
    }
  }

  const inStockOnly = /\b(in\s*stock|available)\b/i.test(working);

  // Strip common BD search filler suffixes so "ryzen 5 5600g price in bd" matches cleanly
  working = working
    .replace(/\b(price\s*in\s*bangladesh|price\s*in\s*bd|bd\s*price|in\s*bangladesh|in\s*dhaka|in\s*bd|bangladesh|dhaka|click2it)\b/gi, ' ')
    .replace(/\b(price|dam|koto|rate|buy|online|shop|best|cheapest|genuine|original|official|warranty|available|in\s*stock|at|for|with|the|a|an)\b/gi, ' ')
    .replace(/[^\p{L}\p{N}.+-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const hasStructuredConstraint =
    minPrice !== undefined || maxPrice !== undefined || inStockOnly;
  const effectiveTokenSource =
    working || (hasStructuredConstraint ? '' : input.toLowerCase());

  const rawTokens = effectiveTokenSource
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length >= 1);

  const uniqueTokens = Array.from(new Set(rawTokens));
  const expandedTokenGroups = uniqueTokens.map(token => {
    const syns = HARDWARE_SYNONYMS[token];
    return syns ? Array.from(new Set([token, ...syns])) : [token];
  });

  return {
    rawQuery: input,
    cleanedQuery: working,
    tokens: uniqueTokens,
    expandedTokenGroups,
    minPrice,
    maxPrice,
    inStockOnly,
  };
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Ranks and filters products using regex token matching, model/SKU priority,
 * hardware synonyms, specs matching, and optional price-cap/stock filters.
 */
export function rankProductsBySearchQuery(
  products: Product[],
  rawQuery: string
): Product[] {
  const parsed = parseSearchQueryWithRegex(rawQuery);
  if (!parsed.rawQuery) return [];

  const activeProducts = products.filter(
    p => p && p.showInStore !== false && !(p as any).isDraft && !(p as any).deletedAt && (p as any).isActive !== false
  );

  const exactPhraseRegex =
    parsed.cleanedQuery.length >= 2
      ? new RegExp(escapeRegExp(parsed.cleanedQuery), 'i')
      : null;

  const scored: Array<{ product: Product; score: number }> = [];

  for (const p of activeProducts) {
    const activePrice = Number(p.discountPrice || p.price || 0);
    if (parsed.minPrice !== undefined && activePrice < parsed.minPrice) continue;
    if (parsed.maxPrice !== undefined && activePrice > parsed.maxPrice) continue;
    if (parsed.inStockOnly && (p.isOutOfStock || (typeof p.stock === 'number' && p.stock <= 0))) {
      continue;
    }

    const name = String(p.name || '');
    const brand = String(p.brand || '');
    const model = String(p.model || '');
    const sku = String(p.sku || '');
    const category = String(p.category || '');
    const subCategory = String(p.subCategory || '');
    const subSubCategory = String(p.subSubCategory || '');
    const tags = Array.isArray(p.tags) ? p.tags.join(' ') : '';
    const specsText = p.specs
      ? Object.entries(p.specs)
          .map(([k, v]) => `${k} ${v}`)
          .join(' ')
      : '';
    const shortDesc = String(p.shortDescription || '').replace(/<[^>]*>?/gm, ' ');

    const combinedText = `${name} ${brand} ${model} ${sku} ${category} ${subCategory} ${subSubCategory} ${tags} ${specsText} ${shortDesc}`;

    if (parsed.expandedTokenGroups.length === 0) {
      // Price-only or stock-only query like "under 20000"
      scored.push({ product: p, score: 10 });
      continue;
    }

    let matchedGroups = 0;
    let score = 0;

    if (exactPhraseRegex && exactPhraseRegex.test(name)) {
      score += 120;
    }

    for (const group of parsed.expandedTokenGroups) {
      let groupMatched = false;
      for (const term of group) {
        const tokenRegex = new RegExp(
          term.length <= 3 ? `\\b${escapeRegExp(term)}\\b` : escapeRegExp(term),
          'i'
        );

        if (tokenRegex.test(model) || tokenRegex.test(sku)) {
          score += 55;
          groupMatched = true;
          break;
        }
        if (tokenRegex.test(name)) {
          score += 40;
          groupMatched = true;
          break;
        }
        if (tokenRegex.test(brand) || tokenRegex.test(category) || tokenRegex.test(subCategory) || tokenRegex.test(subSubCategory)) {
          score += 28;
          groupMatched = true;
          break;
        }
        if (tokenRegex.test(specsText) || tokenRegex.test(tags) || tokenRegex.test(shortDesc)) {
          score += 15;
          groupMatched = true;
          break;
        }
      }

      // Substring fallback for short partial tokens in combined text if strict word-boundary missed
      if (!groupMatched) {
        const primary = group[0];
        if (primary.length >= 2 && combinedText.toLowerCase().includes(primary)) {
          score += 12;
          groupMatched = true;
        }
      }

      if (groupMatched) matchedGroups += 1;
    }

    // Require either all tokens matched (for 1-3 words) or strong majority (>= 60%) for long queries
    const minRequiredMatches =
      parsed.expandedTokenGroups.length <= 2
        ? parsed.expandedTokenGroups.length
        : Math.ceil(parsed.expandedTokenGroups.length * 0.6);

    if (matchedGroups >= minRequiredMatches && score > 0) {
      if (!p.isOutOfStock) score += 5;
      scored.push({ product: p, score });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .map(item => item.product);
}

/**
 * Builds rich Product, BreadcrumbList, FAQPage JSON-LD and BD meta tags for a product detail page.
 */
export function buildProductSeoPayload(
  product: Product,
  reviews: Review[] = [],
  year: number = new Date().getFullYear()
): ProductSeoPayload {
  const baseDomain = 'https://click2itbd.com';
  const rawImg = product.imageUrl || product.images?.[0] || `${baseDomain}/logo.png`;
  const absoluteImg = rawImg.startsWith('http')
    ? rawImg
    : `${baseDomain}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`;

  const allImages = Array.from(
    new Set(
      [absoluteImg, ...(Array.isArray(product.images) ? product.images : [])]
        .filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
        .map(u => (u.startsWith('http') ? u : `${baseDomain}${u.startsWith('/') ? '' : '/'}${u}`))
    )
  ).slice(0, 6);

  const canonicalUrl = `${baseDomain}/product/${product.id}`;
  const currentPrice = Number(product.discountPrice || product.price || 0);
  const regularPrice = Number(product.price || currentPrice || 0);
  const discountAmount = Math.max(0, regularPrice - currentPrice);
  const isOutOfStock = Boolean(
    product.isOutOfStock || (typeof product.stock === 'number' && product.stock <= 0)
  );
  const availabilityUrl = isOutOfStock
    ? 'https://schema.org/OutOfStock'
    : 'https://schema.org/InStock';

  const brandName = String(product.brand || 'CLICK2IT').trim();
  const categoryName = String(product.category || 'Computer Hardware').trim();
  const modelLabel = product.model || product.sku || product.id;

  const warrantyLabel = product.warrantyMonths
    ? `${product.warrantyMonths} ${product.warrantyUnit || 'months'} Official Warranty`
    : '7 Days Replacement Warranty';

  const cleanShortDesc = String(product.shortDescription || '')
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const seoTitle = `${product.name} Price in Bangladesh (${year}) | CLICK2IT`;
  const priceTag = currentPrice > 0 ? `৳${currentPrice.toLocaleString()}` : 'Best Price';

  const productDesc = cleanShortDesc
    ? `${product.name} latest price in Bangladesh is ${priceTag} at CLICK2IT. ${cleanShortDesc}`.slice(0, 260)
    : `Buy genuine ${product.name} at ${priceTag} in Bangladesh from CLICK2IT (Multiplan Center, Dhaka). Brand: ${brandName}. ${warrantyLabel} & fast nationwide delivery.`;

  const keywordsList = [
    `${product.name} price in bd`,
    `${product.name} price in bangladesh`,
    `buy ${product.name} bangladesh`,
    `${brandName} ${categoryName} price bd`,
    product.model ? `${product.model} price in bd` : '',
    product.sku ? `${product.sku} bd` : '',
    'click2it dhaka multiplan',
  ].filter(Boolean);

  const avgRating =
    reviews.length > 0
      ? Number(
          (
            reviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) /
            reviews.length
          ).toFixed(1)
        )
      : Number((product as any).rating || 4.9);

  const reviewCount =
    reviews.length > 0
      ? reviews.length
      : Number(
          (product as any).reviewCount ||
            (Array.isArray((product as any).reviews) && (product as any).reviews.length > 0
              ? (product as any).reviews.length
              : 14)
        );

  const additionalProperty = product.specs
    ? Object.entries(product.specs)
        .filter(([k, v]) => k && v !== undefined && v !== null && String(v).trim() !== '')
        .slice(0, 15)
        .map(([name, value]) => ({
          '@type': 'PropertyValue',
          name: String(name).trim(),
          value: String(value).trim(),
        }))
    : [];

  const priceValidUntil = `${Math.max(year + 1, 2028)}-12-31`;

  const productSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: allImages,
    description: productDesc,
    sku: product.sku || product.id,
    mpn: modelLabel,
    category: categoryName,
    brand: {
      '@type': 'Brand',
      name: brandName,
    },
    ...(additionalProperty.length > 0 ? { additionalProperty } : {}),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: avgRating,
      reviewCount,
      bestRating: '5',
      worstRating: '1',
    },
    ...(reviews.length > 0
      ? {
          review: reviews.slice(0, 5).map(r => ({
            '@type': 'Review',
            author: { '@type': 'Person', name: r.userName || 'Verified Buyer' },
            datePublished: (r.createdAt || '').split('T')[0] || `${year}-01-01`,
            reviewBody: r.comment,
            reviewRating: {
              '@type': 'Rating',
              ratingValue: Number(r.rating) || 5,
              bestRating: '5',
              worstRating: '1',
            },
          })),
        }
      : {}),
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'BDT',
      price: currentPrice,
      priceValidUntil,
      itemCondition:
        product.condition === 'used'
          ? 'https://schema.org/UsedCondition'
          : 'https://schema.org/NewCondition',
      availability: availabilityUrl,
      seller: {
        '@type': 'Organization',
        name: 'CLICK2IT',
        url: baseDomain,
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'BD',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnInStore',
        returnFees: 'https://schema.org/FreeReturn',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: 80,
          currency: 'BDT',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'BD',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 1,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'DAY',
          },
        },
      },
    },
  };

  const categorySlug = categoryName.toLowerCase().trim().replace(/\s+/g, '-') || 'all';
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseDomain,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: categoryName,
        item: `${baseDomain}/category/${encodeURIComponent(categorySlug)}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: canonicalUrl,
      },
    ],
  };

  const faqItems: ProductFaqItem[] = [
    {
      question: `What is the latest price of ${product.name} in Bangladesh?`,
      answer: `The latest price of ${product.name} in Bangladesh is ${priceTag} at CLICK2IT${
        discountAmount > 0 ? ` (save ৳${discountAmount.toLocaleString()} off regular price ৳${regularPrice.toLocaleString()})` : ''
      }. You can order online from anywhere in Bangladesh or visit our Multiplan Center showroom in Dhaka.`,
    },
    {
      question: `Does ${product.name} come with an official warranty in Bangladesh?`,
      answer: `Yes, ${product.name} by ${brandName} includes ${warrantyLabel} and 100% authentic product guarantee from CLICK2IT.`,
    },
    {
      question: `Is ${product.name} currently in stock and eligible for EMI or home delivery?`,
      answer: `${product.name} is currently ${
        isOutOfStock ? 'temporarily out of stock (you can request restock alert)' : 'In Stock'
      } at CLICK2IT with 1–3 day delivery across Dhaka & nationwide Bangladesh${
        currentPrice >= 5000 ? ', plus credit card EMI plans up to 36 months' : ''
      }.`,
    },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return {
    title: seoTitle,
    description: productDesc,
    keywords: keywordsList.join(', '),
    canonicalUrl,
    imageUrl: absoluteImg,
    currentPrice,
    regularPrice,
    discountAmount,
    isOutOfStock,
    productMeta: {
      priceAmount: currentPrice,
      priceCurrency: 'BDT',
      availability: isOutOfStock ? 'out of stock' : 'in stock',
      brand: brandName,
      condition: product.condition === 'used' ? 'used' : 'new',
      retailerItemId: product.sku || product.id,
    },
    productSchema,
    breadcrumbSchema,
    faqSchema,
    faqItems,
  };
}
