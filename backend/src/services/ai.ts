import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { getAdminDb, getAdminDocument } from '../firebase/admin.js';

export interface ChatHistoryTurn {
  sender: 'user' | 'bot';
  text: string;
}

export interface ChatContextPayload {
  currentPath?: string;
  pageTitle?: string;
  cartCount?: number;
  cartTotal?: number;
  productId?: string;
  agentName?: string;
  agentEnName?: string;
}

export interface MatchedProductCard {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  discountPrice: number;
  finalPrice: number;
  inStock: boolean;
  stock: number;
  warranty: string;
  imageUrl: string;
  isFreeShipping?: boolean;
}

export type ChatWidgetType = 'order_tracker' | 'emi_calculator' | 'coupon_checker' | 'callback_form' | null;

export interface StorefrontChatResult {
  reply: string;
  products: MatchedProductCard[];
  followUps: string[];
  widget: ChatWidgetType;
  suggestedAmount?: number;
}

interface CachedProductSummary {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  discountPrice: number;
  inStock: boolean;
  stock: number;
  warranty: string;
  imageUrl: string;
  isFreeShipping: boolean;
  specsSnippet: string;
}

interface SiteInfoSummary {
  brandName: string;
  phone: string;
  email: string;
  address: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
let cachedCatalog: { fetchedAt: number; products: CachedProductSummary[] } | null = null;
let cachedSiteInfo: { fetchedAt: number; info: SiteInfoSummary } | null = null;

function getAiClient(): GoogleGenAI {
  let key = process.env.GEMINI_API_KEY;
  if (!key) {
    dotenv.config({ path: path.join(process.cwd(), '.env') });
    dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });
    key = process.env.GEMINI_API_KEY;
  }
  if (!key) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return new GoogleGenAI({ apiKey: key });
}

async function getCachedSiteInfo(): Promise<SiteInfoSummary> {
  const now = Date.now();
  if (cachedSiteInfo && now - cachedSiteInfo.fetchedAt < CACHE_TTL_MS) {
    return cachedSiteInfo.info;
  }

  const fallback: SiteInfoSummary = {
    brandName: 'CLICK2IT BD',
    phone: '+8809640887777',
    email: 'info@click2itbd.com',
    address: 'Dhaka, Bangladesh',
  };

  try {
    const docSnap = await getAdminDocument('settings', 'site');
    const d = docSnap?.data || {};
    const info: SiteInfoSummary = {
      brandName: d.brandName || fallback.brandName,
      phone: d.contactPhone || fallback.phone,
      email: d.contactEmail || fallback.email,
      address: d.address || fallback.address,
    };
    cachedSiteInfo = { fetchedAt: now, info };
    return info;
  } catch {
    return fallback;
  }
}

function normalizeSearchText(text: string): string {
  // Convert Bengali digits (০-৯) to ASCII digits and strip zero-width joiners (e.g. র‍্যাম -> র্যাম)
  const bnDigits = '০১২৩৪৫৬৭৮৯';
  const asciiConverted = text.replace(/[০-৯]/g, (d) => String(bnDigits.indexOf(d)));
  return asciiConverted.replace(/[\u200C\u200D]/g, '').toLowerCase();
}

function buildSpecsSnippet(p: any): string {
  const parts: string[] = [];
  if (p.model) parts.push(`Model: ${p.model}`);
  if (p.socketType) parts.push(`Socket: ${p.socketType}`);
  if (p.ramType) parts.push(`RAM: ${p.ramType}`);
  if (p.chipset) parts.push(`Chipset: ${p.chipset}`);
  if (p.tdp) parts.push(`TDP: ${p.tdp}W`);
  if (p.specs && typeof p.specs === 'object') {
    for (const [k, v] of Object.entries(p.specs)) {
      if (parts.length >= 7) break;
      if (v && typeof v === 'string') {
        parts.push(`${k}: ${v.slice(0, 60)}`);
      }
    }
  }
  return parts.join(', ');
}

function toProductCard(p: CachedProductSummary): MatchedProductCard {
  const finalPrice = p.discountPrice > 0 && p.discountPrice < p.price ? p.discountPrice : p.price;
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    brand: p.brand,
    price: p.price,
    discountPrice: p.discountPrice,
    finalPrice,
    inStock: p.inStock,
    stock: p.stock,
    warranty: p.warranty,
    imageUrl: p.imageUrl,
    isFreeShipping: p.isFreeShipping,
  };
}

async function loadCatalogProducts(): Promise<CachedProductSummary[]> {
  const now = Date.now();
  if (cachedCatalog && now - cachedCatalog.fetchedAt < CACHE_TTL_MS) {
    return cachedCatalog.products;
  }

  try {
    const db = getAdminDb();
    const snap = await db.collection('products').get();
    const products: CachedProductSummary[] = [];

    snap.forEach((docSnap: any) => {
      const p = docSnap.data() || {};
      if (p.isDraft || p.deletedAt || p.showInStore === false) return;

      const stock = typeof p.stock === 'number' ? p.stock : 0;
      const inStock = !p.isOutOfStock && stock > 0;
      const warranty =
        p.warrantyMonths && Number(p.warrantyMonths) > 0
          ? `${p.warrantyMonths} ${p.warrantyUnit || 'months'}`
          : '';
      const imageUrl = String(
        p.imageUrl || (Array.isArray(p.images) && p.images[0]) || ''
      ).trim();

      products.push({
        id: docSnap.id,
        name: String(p.name || '').trim(),
        category: String(p.category || p.subCategory || '').trim(),
        brand: String(p.brand || '').trim(),
        price: Number(p.price || 0),
        discountPrice: Number(p.discountPrice || 0),
        inStock,
        stock,
        warranty,
        imageUrl,
        isFreeShipping: Boolean(p.isFreeShipping),
        specsSnippet: buildSpecsSnippet(p),
      });
    });

    cachedCatalog = { fetchedAt: now, products };
    return products;
  } catch {
    return cachedCatalog?.products || [];
  }
}

const QUERY_SYNONYMS: Record<string, string[]> = {
  gpu: ['graphics', 'rtx', 'gtx', 'rx', 'vga'],
  graphics: ['gpu', 'rtx', 'gtx', 'rx'],
  cpu: ['processor', 'ryzen', 'intel', 'core'],
  processor: ['cpu', 'ryzen', 'intel', 'core'],
  ram: ['memory', 'ddr4', 'ddr5'],
  ssd: ['nvme', 'storage', 'm.2'],
  hdd: ['hard', 'storage'],
  psu: ['power supply', 'watt'],
  cctv: ['camera', 'dvr', 'nvr', 'hikvision', 'dahua'],
  camera: ['cctv', 'webcam', 'imou', 'ezviz'],
  pc: ['desktop', 'computer', 'processor', 'monitor'],
  monitor: ['display', 'led', 'ips', 'hz'],
  motherboard: ['board', 'b550', 'b760', 'h610', 'am4', 'am5'],
  casing: ['case', 'cabinet', 'rgb'],
  keyboard: ['mechanical', 'rgb'],
  mouse: ['gaming', 'wireless'],
  laptop: ['notebook', 'ultrabook'],
  router: ['wifi', 'mesh', 'tp-link', 'tenda'],
  ups: ['va', 'battery', 'offline', 'online'],
  // Bengali script & Banglish synonyms
  'মনিটর': ['monitor', 'display', 'ips', 'led', 'hz'],
  'গ্রাফিক্স': ['graphics', 'gpu', 'rtx', 'gtx', 'rx'],
  'প্রসেসর': ['processor', 'cpu', 'ryzen', 'intel', 'core'],
  'মাদারবোর্ড': ['motherboard', 'board', 'b550', 'b760', 'h610'],
  'র্যাম': ['ram', 'memory', 'ddr4', 'ddr5'],
  'এসএসডি': ['ssd', 'nvme', 'm.2', 'storage'],
  'হার্ডডিস্ক': ['hdd', 'hard', 'storage'],
  'পাওয়ার': ['psu', 'power supply', 'watt'],
  'ক্যাসিং': ['casing', 'case', 'cabinet'],
  'কুলার': ['cooler', 'liquid', 'fan'],
  'ইউপিএস': ['ups', 'battery'],
  'রাউটার': ['router', 'wifi', 'tp-link', 'tenda', 'mesh'],
  'ল্যাপটপ': ['laptop', 'notebook'],
  'কিবোর্ড': ['keyboard', 'mechanical'],
  'মাউস': ['mouse', 'gaming', 'wireless'],
  'হেডফোন': ['headphone', 'headset', 'earphone'],
  'স্পিকার': ['speaker', 'soundbar', 'subwoofer'],
  'প্রিন্টার': ['printer', 'toner', 'epson', 'canon', 'hp'],
  'সিসিটিভি': ['cctv', 'camera', 'dvr', 'nvr', 'hikvision', 'dahua'],
  'ক্যামেরা': ['camera', 'cctv', 'webcam', 'imou', 'ezviz'],
  'পিসি': ['pc', 'desktop', 'computer', 'processor', 'monitor'],
};

const BUDGET_HINT_REGEX =
  /(?:under|below|within|budget|moddhe|taka|takay|takar|মধ্যে|নিচে|বাজেট|টাকা)/i;

function extractAmountFromText(rawText: string): number | null {
  const norm = normalizeSearchText(rawText).replace(/,/g, '');
  const kMatch = norm.match(/\b(\d+(?:\.\d+)?)\s*k\b/i);
  if (kMatch) {
    const val = Math.round(Number(kMatch[1]) * 1000);
    if (val >= 1000 && val <= 1000000) return val;
  }
  const numMatch = norm.match(/\b(\d{4,7})\b/);
  if (numMatch) {
    const val = Number(numMatch[1]);
    if (val >= 1000 && val <= 1000000) return val;
  }
  return null;
}

function findRelevantProducts(message: string, products: CachedProductSummary[]): CachedProductSummary[] {
  if (!products.length) return [];

  const normalized = normalizeSearchText(message).replace(/[^\w\u0980-\u09FF\s.\-/]/g, ' ');
  const rawTokens = normalized.split(/\s+/).filter((t) => t.length >= 2);
  if (!rawTokens.length) return [];

  const budgetCeiling = BUDGET_HINT_REGEX.test(normalized)
    ? extractAmountFromText(normalized)
    : null;

  const expandedTokens = new Set<string>(rawTokens);
  for (const token of rawTokens) {
    const syns = QUERY_SYNONYMS[token];
    if (syns) syns.forEach((s) => expandedTokens.add(s));
  }

  const scored = products
    .map((p) => {
      const hay = normalizeSearchText(`${p.name} ${p.category} ${p.brand} ${p.specsSnippet}`);
      const finalPrice = p.discountPrice > 0 && p.discountPrice < p.price ? p.discountPrice : p.price;
      let score = 0;

      for (const tok of expandedTokens) {
        if (hay.includes(tok)) {
          score += rawTokens.includes(tok) ? 3 : 1;
        }
      }

      if (score > 0 && p.inStock) score += 2;
      if (score > 0 && budgetCeiling && finalPrice > 0) {
        if (finalPrice <= budgetCeiling) score += 3;
        else if (finalPrice <= budgetCeiling * 1.15) score += 1;
      }

      return { p, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((item) => item.p);

  return scored;
}

function isBengaliOrBanglish(text: string): boolean {
  if (/[\u0980-\u09FF]/.test(text)) return true;
  return /\b(koto|kivabe|hobe|lagbe|chai|kothay|taka|kisti|amar|nibo|ache|vai|bhai|daam|dam|bhalo|valo|korbo|koro|din|dao|dekhao|moddhe|takar|takay)\b/i.test(
    text
  );
}

function detectWidgetIntent(
  message: string,
  viewedProduct?: CachedProductSummary,
  ctx?: ChatContextPayload
): { widget: ChatWidgetType; suggestedAmount?: number } {
  const cleanMsg = normalizeSearchText(message);

  if (
    /(track\s*order|order\s*status|where\s*is\s*my\s*order|parcel\s*status|invoice\s*status|অর্ডার\s*ট্র্যাক|অর্ডার\s*কই|অর্ডার\s*কোথায়|পার্সেল|ট্র্যাক\s*কর)/i.test(
      cleanMsg
    )
  ) {
    return { widget: 'order_tracker' };
  }

  if (
    /(emi|installment|কিস্তি|মাসিক\s*কিস্তি|bank\s*charge|ক্রেডিট\s*কার্ড\s*ইএমআই|ইএমআই)/i.test(
      cleanMsg
    )
  ) {
    const mentioned = extractAmountFromText(cleanMsg);
    const viewedPrice = viewedProduct
      ? viewedProduct.discountPrice > 0 && viewedProduct.discountPrice < viewedProduct.price
        ? viewedProduct.discountPrice
        : viewedProduct.price
      : 0;
    const candidateAmount =
      mentioned && mentioned >= 5000
        ? mentioned
        : viewedPrice >= 5000
          ? viewedPrice
          : (ctx?.cartTotal || 0) >= 5000
            ? Number(ctx?.cartTotal)
            : 50000;
    return { widget: 'emi_calculator', suggestedAmount: candidateAmount };
  }

  if (
    /(coupon|promo\s*code|voucher|discount\s*code|কুপন|প্রোমো|ডিসকাউন্ট\s*কোড)/i.test(cleanMsg)
  ) {
    return { widget: 'coupon_checker' };
  }

  if (
    /(callback|call\s*me|human|real\s*person|talk\s*to\s*(?:agent|support|someone)|quotation|corporate\s*quote|কল\s*করুন|কলব্যাক|কথা\s*বলতে\s*চাই|মানুষ|এজেন্ট|কোটেশন)/i.test(
      cleanMsg
    )
  ) {
    return { widget: 'callback_form' };
  }

  return { widget: null };
}

function buildDynamicFollowUps(params: {
  isBangla: boolean;
  widget: ChatWidgetType;
  products: MatchedProductCard[];
  ctx?: ChatContextPayload;
}): string[] {
  const { isBangla, widget, products, ctx } = params;

  if (products.length > 0 && widget !== 'emi_calculator') {
    return isBangla
      ? [
          'এই পণ্যের EMI কিস্তি হিসাব করুন',
          'কম বাজেটের বিকল্প দেখুন',
          'ডেলিভারি সময় ও চার্জ জানুন',
        ]
      : [
          'Calculate EMI for these items',
          'Show budget alternatives',
          'Delivery time & charges?',
        ];
  }

  if (widget === 'emi_calculator') {
    return isBangla
      ? [
          '১৬টি ব্যাংকের EMI শর্তাবলি জানুন',
          '৬০,০০০ টাকা বাজেটে PC Build দেখুন',
          'প্রোমো / কুপন কোড যাচাই করুন',
        ]
      : [
          'See all 16 EMI banks & terms',
          'Suggest a ৳60,000 PC build',
          'Validate a coupon code',
        ];
  }

  if (widget === 'order_tracker') {
    return isBangla
      ? [
          'ঢাকা ও ঢাকার বাইরে ডেলিভারি সময় জানুন',
          'সাপোর্ট টিমের কলব্যাক অনুরোধ করুন',
          'চলমান হট ডিলগুলো দেখুন',
        ]
      : [
          'Dhaka & outside Dhaka delivery time',
          'Request a support callback',
          'Show hot deals',
        ];
  }

  if (widget === 'coupon_checker') {
    return isBangla
      ? [
          'Credit Card EMI কিস্তি হিসাব করুন',
          'আমার অর্ডার ট্র্যাক করুন',
          'জনপ্রিয় গেমিং PC পার্টস দেখুন',
        ]
      : [
          'Check Credit Card EMI plans',
          'Track my order',
          'Recommend gaming PC parts',
        ];
  }

  if (ctx?.cartCount && ctx.cartCount > 0) {
    return isBangla
      ? [
          'কার্টের অর্ডারে EMI কিস্তি হিসাব করুন',
          'প্রোমো / কুপন কোড যাচাই করুন',
          'চেকআউট ও ডেলিভারি তথ্য জানুন',
        ]
      : [
          'Calculate EMI on my cart',
          'Check a coupon code',
          'Checkout & delivery info',
        ];
  }

  return isBangla
    ? [
        '৫০,০০০ টাকা বাজেটে PC Build সাজেশন',
        'Credit Card EMI কিস্তি হিসাব করুন',
        'আমার অর্ডার ট্র্যাক করুন',
      ]
    : [
        'Suggest a ৳50,000 PC build',
        'Calculate Credit Card EMI',
        'Track my order',
      ];
}

/**
 * Strips raw Markdown syntax (#, ---, >, code fences) from storefront chat replies
 * so customers always receive clean, professional prose and structured formatting.
 */
export function sanitizeStorefrontReply(rawReply: string): string {
  if (!rawReply) return '';

  const lines = rawReply
    .replace(/\r\n?/g, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .split('\n');

  const cleaned: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Strip code fence markers like ``` or ```markdown
    if (/^```[a-zA-Z0-9_-]*\s*$/.test(trimmed)) {
      continue;
    }

    // Strip horizontal rules (---, ***, ___)
    if (/^([-*_])\1{2,}$/.test(trimmed)) {
      if (cleaned.length > 0 && cleaned[cleaned.length - 1] !== '') {
        cleaned.push('');
      }
      continue;
    }

    // Strip heading hashes (### Heading -> **Heading**)
    const headingMatch = trimmed.match(/^(?:#{2,6}\s*|#\s+)(.+?)\s*#*$/);
    if (headingMatch) {
      let title = headingMatch[1].trim();
      if (title.startsWith('**') && title.endsWith('**') && title.length > 4) {
        cleaned.push(title);
      } else {
        title = title.replace(/\*\*/g, '');
        cleaned.push(`**${title}**`);
      }
      continue;
    }

    // Strip blockquote '>' prefix cleanly
    if (/^>\s?/.test(trimmed)) {
      cleaned.push(trimmed.replace(/^>\s?/, '').replace(/^(?:#{2,6}\s*|#\s+)/, '').trim());
      continue;
    }

    cleaned.push(line);
  }

  return cleaned
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function generateStorefrontChatResponse(
  message: string,
  options?: { history?: ChatHistoryTurn[]; context?: ChatContextPayload }
): Promise<StorefrontChatResult> {
  const client = getAiClient();

  if (!message || typeof message !== 'string' || message.trim().length === 0 || message.length > 2000) {
    throw new Error('Message is required and must be under 2000 characters');
  }

  const [siteInfo, catalog] = await Promise.all([
    getCachedSiteInfo(),
    loadCatalogProducts(),
  ]);

  const ctx = options?.context || {};
  const viewedProduct = ctx.productId
    ? catalog.find((p) => p.id === ctx.productId)
    : undefined;

  const historyText = (options?.history || [])
    .slice(-8)
    .map((h) => `${h.sender === 'user' ? 'Customer' : 'Assistant'}: ${h.text}`)
    .join('\n');

  const queryMatches = findRelevantProducts(`${message} ${historyText.slice(-300)}`, catalog);
  const directMatches = findRelevantProducts(message, catalog);
  const combinedMatches = queryMatches.slice(0, 10);

  if (viewedProduct && !combinedMatches.some((p) => p.id === viewedProduct.id)) {
    combinedMatches.unshift(viewedProduct);
  }

  const productSnippet = combinedMatches.length
    ? combinedMatches
        .slice(0, 10)
        .map((p) => {
          const finalPrice = p.discountPrice > 0 && p.discountPrice < p.price ? p.discountPrice : p.price;
          const stockLabel = p.inStock ? `In Stock (${p.stock})` : 'Out of Stock';
          const warrantyInfo = p.warranty ? `, Warranty: ${p.warranty}` : '';
          const specs = p.specsSnippet ? ` | Specs: ${p.specsSnippet}` : '';
          return `- ${p.name} | Brand: ${p.brand || 'N/A'} | Price: ৳${finalPrice.toLocaleString('en-IN')} | ${stockLabel}${warrantyInfo}${specs} | Link: /product/${p.id}`;
        })
        .join('\n')
    : 'No exact catalog keyword matches found for this message (direct user to /shop, /deals, or /pc-build if looking for products).';

  const viewedProductContext = viewedProduct
    ? `\nACTIVE VIEWED PRODUCT ON SCREEN RIGHT NOW:\n- Name: ${viewedProduct.name} (/product/${viewedProduct.id})\n- Price: ৳${(viewedProduct.discountPrice > 0 && viewedProduct.discountPrice < viewedProduct.price ? viewedProduct.discountPrice : viewedProduct.price).toLocaleString('en-IN')}\n- Stock: ${viewedProduct.inStock ? `In Stock (${viewedProduct.stock})` : 'Out of Stock'}\n- Warranty: ${viewedProduct.warranty || 'Official / Check product page'}${viewedProduct.specsSnippet ? `\n- Specs: ${viewedProduct.specsSnippet}` : ''}`
    : '';

  const pageContextStr = ctx.currentPath
    ? `Customer is currently viewing page: ${ctx.currentPath}${ctx.pageTitle ? ` (${ctx.pageTitle})` : ''}${typeof ctx.cartCount === 'number' && ctx.cartCount > 0 ? `, Cart items: ${ctx.cartCount} (৳${Number(ctx.cartTotal || 0).toLocaleString('en-IN')})` : ''}.${viewedProductContext}`
    : viewedProductContext;

  const { widget, suggestedAmount } = detectWidgetIntent(message, viewedProduct, ctx);

  const widgetHint =
    widget === 'order_tracker'
      ? '\nNOTE: An interactive Order Tracker card will automatically render directly beneath your reply, so politely invite the customer to enter their Order ID and Phone number right below.'
      : widget === 'emi_calculator'
        ? '\nNOTE: An interactive 16-Bank EMI Calculator card will automatically render directly beneath your reply. Unless the customer explicitly asked for the full list of bank names, keep your message brief and executive (2–4 concise lines: minimum ৳5,000 eligibility, 16 leading banks, 3–36M tenure, selectable in the calculator below or at /checkout).'
        : widget === 'coupon_checker'
          ? '\nNOTE: An interactive Coupon Validator card will automatically render directly beneath your reply, so invite them to verify & apply their promo code right below.'
          : widget === 'callback_form'
            ? '\nNOTE: A Request Callback form will automatically render directly beneath your reply, so let them know they can submit their name & phone number right below or message us on WhatsApp.'
            : '';

  const specialistIdentity = ctx.agentName
    ? `Your name is **${ctx.agentName}**${ctx.agentEnName ? ` (${ctx.agentEnName})` : ''}, a courteous, senior Customer Care & Tech Specialist`
    : 'You are a courteous, senior Customer Care & Tech Specialist';

  const systemInstruction = `${specialistIdentity} at **${siteInfo.brandName}** — a premier Computer Hardware, Custom PC, Laptop, CCTV, Networking & Electronics E-Commerce Store in Bangladesh.

STORE INFORMATION & POLICIES:
- Brand: ${siteInfo.brandName}
- Hotline / WhatsApp: ${siteInfo.phone}
- Email: ${siteInfo.email}
- Store Address: ${siteInfo.address}
- Catalog Size: ${catalog.length} active products online
- Useful Storefront Links (place exact relative paths starting with / naturally inside sentences so our chat UI turns them into clickable buttons):
  • Shop All Products: /shop
  • Hot Deals & Campaigns: /deals
  • Custom PC Builder (auto compatibility + PSU wattage + EMI): /pc-build
  • Credit Card EMI Plans: /emi-terms (Minimum ৳5,000 across 16 Bangladeshi banks: Dutch-Bangla, Eastern Bank/EBL, City Bank, BRAC Bank, Southeast, Midland, Pubali, Prime, Mutual Trust, Bank Asia, Dhaka Bank, Standard, LankaBangla, Mercantile, AB Bank, Jamuna Bank; Tenures: 3M ~4.25%, 6M ~5.75%, 9M ~8.5%, 12M ~10.25%, 18M ~12.25%, 24M ~15.25%, 36M ~18.25–22.25%; selectable directly at /checkout)
  • Track Order: /track-order
  • Delivery Policy: /online-delivery (Inside Dhaka fast delivery ৳80–৳150 in 1–2 days; Outside Dhaka via courier in 2–4 days)
  • Payment Methods: Cash on Delivery (COD), Online Payment via EPS Gateway (Card / bKash / Nagad / Net Banking), and Credit Card EMI
  • Warranty & Refund Policy: /warranty-policy and /refund-policy
  • Corporate IT / CCTV Projects & Contact: /projects and /contact

${pageContextStr ? `CURRENT SESSION CONTEXT:\n${pageContextStr}\n` : ''}${widgetHint}
LIVE MATCHING PRODUCTS FROM STORE DATABASE (Use ONLY these exact prices/links if quoting store inventory; NEVER invent fake prices):
${productSnippet}

RESPONSE & FORMATTING GUIDELINES (STRICT):
1. Respectful, Polished Tone: Reply in clear, natural, professional **Bengali (বাংলা)** when the customer writes in Bengali or Banglish (ALWAYS address them politely using "আপনি / আপনার / করুন / দেখুন", NEVER casual "তুমি / করো / দেখাও"). Reply in crisp, polite **English** if the customer writes in English. If the customer asks your name or who they are chatting with, warmly introduce yourself as ${ctx.agentName ? `**${ctx.agentName}**` : 'Customer Care Specialist'} from ${siteInfo.brandName}. Never refer to yourself as "AI" or "bot".
2. Clean Presentation (NO Raw Markdown Noise):
   - NEVER use "#" / "##" / "###" heading hashes, "---" horizontal dividers, ">" blockquote markers, or backticks.
   - Instead of "# Heading", write section titles cleanly as bold labels on their own line (e.g., "**অর্ডার করার ধাপসমূহ:**").
   - Use concise bullet points ("- ") or clean numbered steps ("1. ") and keep emojis minimal (at most 1–2 subtle emojis per message; never place icons on every line).
3. Accuracy: Never guess prices or claim stock if not listed in Live Matching Products above. If an exact item is not matched, invite them to browse /shop or reach our team on ${siteInfo.phone} / WhatsApp.
4. Natural Clickable Paths: Embed paths like /pc-build, /emi-terms, /checkout, /track-order, or /product/<id> smoothly inside sentences (e.g., "সরাসরি /checkout পেজ থেকে Credit Card EMI নির্বাচন করুন।" or "বিস্তারিত শর্তাবলি /emi-terms পেজে দেখে নিতে পারেন।"). Avoid raw Markdown links like [Label](/path).`;

  const contents = [
    ...(options?.history || [])
      .slice(-8)
      .filter((h) => h && typeof h.text === 'string' && h.text.trim())
      .map((h) => ({
        role: h.sender === 'user' ? 'user' : 'model',
        parts: [{ text: h.text.slice(0, 1000) }],
      })),
    {
      role: 'user',
      parts: [{ text: message.trim() }],
    },
  ];

  let reply = '';
  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.4,
      },
    });
    reply = response.text || '';
  } catch (error: any) {
    console.error('AI chat error with primary model, trying fallback:', error.message);
    try {
      const fallbackResponse = await client.models.generateContent({
        model: 'gemini-flash-latest',
        contents,
        config: {
          systemInstruction,
          temperature: 0.4,
        },
      });
      reply = fallbackResponse.text || '';
    } catch (fallbackError: any) {
      console.error('AI chat fallback error:', fallbackError.message);
      throw new Error('AI service error');
    }
  }

  reply = sanitizeStorefrontReply(reply);

  // Pick matched product cards to render visually: prioritize products explicitly linked in AI reply, then direct query matches
  const replyProductIds = Array.from(reply.matchAll(/\/product\/([a-zA-Z0-9_-]+)/g)).map(
    (m) => m[1]
  );
  const selectedForCards: CachedProductSummary[] = [];
  const seenIds = new Set<string>();

  for (const pid of replyProductIds) {
    const found = catalog.find((p) => p.id === pid);
    if (found && !seenIds.has(found.id)) {
      seenIds.add(found.id);
      selectedForCards.push(found);
    }
  }

  const suppressFallbackCards =
    widget === 'order_tracker' || widget === 'coupon_checker' || widget === 'callback_form';

  if (!suppressFallbackCards && selectedForCards.length < 4) {
    const fallbackSource =
      directMatches.length > 0
        ? directMatches
        : viewedProduct && /(price|stock|warranty|dam|দাম|ওয়ারেন্টি|স্টক|emi|কিস্তি)/i.test(message)
          ? [viewedProduct]
          : [];

    for (const p of fallbackSource) {
      if (selectedForCards.length >= 4) break;
      if (!seenIds.has(p.id)) {
        seenIds.add(p.id);
        selectedForCards.push(p);
      }
    }
  }

  const productCards = selectedForCards.slice(0, 4).map(toProductCard);
  const isBangla = isBengaliOrBanglish(`${message} ${reply.slice(0, 120)}`);
  const followUps = buildDynamicFollowUps({
    isBangla,
    widget,
    products: productCards,
    ctx,
  });

  return {
    reply,
    products: productCards,
    followUps,
    widget,
    ...(suggestedAmount ? { suggestedAmount } : {}),
  };
}

export async function generateChatResponse(
  message: string,
  options?: { history?: ChatHistoryTurn[]; context?: ChatContextPayload; mode?: 'storefront_chat' | 'general' }
): Promise<string> {
  const client = getAiClient();

  if (!message || typeof message !== 'string' || message.trim().length === 0 || message.length > 2000) {
    throw new Error('Message is required and must be under 2000 characters');
  }

  if (options?.mode === 'storefront_chat') {
    const result = await generateStorefrontChatResponse(message, options);
    return result.reply;
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message.trim(),
    });
    return response.text || '';
  } catch (error: any) {
    console.error('AI chat error with primary model, trying fallback:', error.message);
    try {
      const fallbackResponse = await client.models.generateContent({
        model: 'gemini-flash-latest',
        contents: message.trim(),
      });
      return fallbackResponse.text || '';
    } catch (fallbackError: any) {
      console.error('AI chat fallback error:', fallbackError.message);
      throw new Error('AI service error');
    }
  }
}

export async function polishText(
  text: string,
  options?: {
    context?: 'product_name' | 'description' | 'notes' | 'quotation' | 'general';
    targetLang?: 'auto' | 'bangla' | 'english' | 'banglish_to_bangla';
  }
): Promise<string> {
  const client = getAiClient();

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return '';
  }

  const context = options?.context || 'general';
  const targetLang = options?.targetLang || 'english';

  const systemInstruction = `You are an expert bilingual AI editor and translator for an e-Commerce and Business ERP system.
Your mission is to convert the user's input text into FLAWLESS, PROFESSIONAL ENGLISH, no matter what language or form the input was written in!

CRITICAL TRANSLATION & POLISHING RULES:
1. Input Variety & Translation to English:
   - Banglish / Phonetic Bengali (e.g. "ei product ta khub bhalo", "1 bochor warrenty ache", "kono problem nai", "delivary shomoy taka dibe") -> MUST BE CONVERTED INTO NATURAL, GRAMMATICALLY CORRECT ENGLISH (e.g. "This product is high quality", "Includes 1 year warranty", "No issues", "Payment upon delivery").
   - Broken or misspelled Banglish (e.g. "valo kory pac king korben", "custmer taka pore debey", "akta monitor lagbe fast delivery chai") -> Fix the meaning, eliminate misspellings, and convert into clean, standard English (e.g. "Please pack securely", "Customer will pay the remaining balance later", "Need a monitor with express delivery").
   - Bengali script (বাংলা) (e.g. "১ বছরের অফিশিয়াল ওয়ারেন্টি সহ নতুন মনিটর", "কুরিয়ার সার্ভিসের মাধ্যমে পাঠানো হবে") -> MUST BE CONVERTED INTO ACCURATE, PROFESSIONAL ENGLISH (e.g. "Brand new monitor with 1-year official warranty", "Will be dispatched via courier service").
   - Misspelled or broken English (e.g. "samsng moniter with 3 year warenty", "invoce for spaczero ltd", "discription of laptop") -> Correct all typos, fix grammar, and elevate to clean, professional business English (e.g. "Samsung Monitor with 3 Years Warranty", "Invoice for Spacezero Ltd", "Laptop Description").
   - Mixed text (Bangla + English + Banglish) -> Seamlessly unify into fluent, standard English.

2. Context-Specific Guidelines:
   - 'product_name': Clean Title Case, concise, professional e-commerce product title. Ensure tech brand names (e.g. Asus, HP, Dell, Samsung, Maxline, Apple, Lenovo, Logitech, Gigabyte, MSI, TP-Link) and specifications (e.g. 24-Inch, 16GB DDR4, 512GB NVMe SSD, Full HD, IPS, 65W, USB-C, Wi-Fi) are formatted with correct casing and units. Example: "asus er 24 inc ips led moniter 3 bochor warenty" -> "Asus 24-Inch Full HD IPS LED Monitor with 3 Years Warranty".
   - 'description': Clear, engaging, and professional product description. Fix formatting, technical specifications, and bullet readability.
   - 'notes': Polite, concise, and clear business communication for invoice or delivery notes (e.g. input: "courier e pathaben jano venge na jai" -> output: "Please dispatch via courier and handle with care to prevent damage.").
   - 'quotation': Formal business terms and conditions for corporate quotation.
   - 'general': Natural, concise, and grammatically perfect English.

3. Language Rule:
   - If targetLang is explicitly 'bangla', convert/polish to standard formal Bengali script (বাংলা).
   - IN ALL OTHER CASES (default 'english' or 'auto'), the output MUST ALWAYS BE IN ENGLISH!

4. Formatting & Constraints:
   - Return ONLY the final polished English text.
   - DO NOT include conversational filler, greetings, markdown labels (e.g. DO NOT say "Here is the English version:"), or wrap quotes around the whole text.
   - Accurately preserve numbers, model numbers, dimensions, and prices (e.g. ML-844-5, 5m, BDT 5,000, 3200MHz).`;

  try {
    let responseText = '';
    try {
      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemInstruction}\n\nContext: ${context}\nTarget Language: ${targetLang}\n\nOriginal Text:\n${text}` }
            ]
          }
        ]
      });
      responseText = response.text || '';
    } catch (err: any) {
      console.warn('AI polish error on gemini-3.8-flash, trying fallback:', err.message);
      const fallbackResponse = await client.models.generateContent({
        model: 'gemini-flash-latest',
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemInstruction}\n\nContext: ${context}\nTarget Language: ${targetLang}\n\nOriginal Text:\n${text}` }
            ]
          }
        ]
      });
      responseText = fallbackResponse.text || '';
    }

    let polished = responseText.trim();
    if (polished.startsWith('"') && polished.endsWith('"') && polished.length > 2) {
      polished = polished.slice(1, -1).trim();
    }
    return polished || text;
  } catch (error: any) {
    console.error('AI polish error:', error.message);
    throw new Error(error.message || 'AI polish error');
  }
}
