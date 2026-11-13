import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { getAdminDb, getAdminDocument } from '../firebase/admin.js';
const CACHE_TTL_MS = 5 * 60 * 1000;
let cachedCatalog = null;
let cachedSiteInfo = null;
function getAiClient() {
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
async function getCachedSiteInfo() {
    const now = Date.now();
    if (cachedSiteInfo && now - cachedSiteInfo.fetchedAt < CACHE_TTL_MS) {
        return cachedSiteInfo.info;
    }
    const fallback = {
        brandName: 'CLICK2IT BD',
        phone: '+8809640887777',
        email: 'info@click2itbd.com',
        address: 'Dhaka, Bangladesh',
    };
    try {
        const docSnap = await getAdminDocument('settings', 'site');
        const d = docSnap?.data || {};
        const info = {
            brandName: d.brandName || fallback.brandName,
            phone: d.contactPhone || fallback.phone,
            email: d.contactEmail || fallback.email,
            address: d.address || fallback.address,
        };
        cachedSiteInfo = { fetchedAt: now, info };
        return info;
    }
    catch {
        return fallback;
    }
}
async function loadCatalogProducts() {
    const now = Date.now();
    if (cachedCatalog && now - cachedCatalog.fetchedAt < CACHE_TTL_MS) {
        return cachedCatalog.products;
    }
    try {
        const db = getAdminDb();
        const snap = await db.collection('products').get();
        const products = [];
        snap.forEach((docSnap) => {
            const p = docSnap.data() || {};
            if (p.isDraft || p.deletedAt || p.showInStore === false)
                return;
            const stock = typeof p.stock === 'number' ? p.stock : 0;
            const inStock = !p.isOutOfStock && stock > 0;
            const warranty = p.warrantyMonths && Number(p.warrantyMonths) > 0
                ? `${p.warrantyMonths} ${p.warrantyUnit || 'months'}`
                : '';
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
            });
        });
        cachedCatalog = { fetchedAt: now, products };
        return products;
    }
    catch {
        return cachedCatalog?.products || [];
    }
}
const QUERY_SYNONYMS = {
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
};
function findRelevantProducts(message, products) {
    if (!products.length)
        return [];
    const normalized = message.toLowerCase().replace(/[^\w\s.\-/]/g, ' ');
    const rawTokens = normalized.split(/\s+/).filter((t) => t.length >= 2);
    if (!rawTokens.length)
        return [];
    const expandedTokens = new Set(rawTokens);
    for (const token of rawTokens) {
        const syns = QUERY_SYNONYMS[token];
        if (syns)
            syns.forEach((s) => expandedTokens.add(s));
    }
    const scored = products
        .map((p) => {
        const hay = `${p.name} ${p.category} ${p.brand}`.toLowerCase();
        let score = 0;
        for (const tok of expandedTokens) {
            if (hay.includes(tok)) {
                score += rawTokens.includes(tok) ? 3 : 1;
            }
        }
        if (score > 0 && p.inStock)
            score += 2;
        return { p, score };
    })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map((item) => item.p);
    return scored;
}
export async function generateChatResponse(message, options) {
    const client = getAiClient();
    if (!message || typeof message !== 'string' || message.trim().length === 0 || message.length > 2000) {
        throw new Error('Message is required and must be under 2000 characters');
    }
    const isStorefrontChat = options?.mode === 'storefront_chat';
    if (!isStorefrontChat) {
        try {
            const response = await client.models.generateContent({
                model: 'gemini-3.8-flash',
                contents: message.trim(),
            });
            return response.text || '';
        }
        catch (error) {
            console.error('AI chat error with primary model, trying fallback:', error.message);
            try {
                const fallbackResponse = await client.models.generateContent({
                    model: 'gemini-flash-latest',
                    contents: message.trim(),
                });
                return fallbackResponse.text || '';
            }
            catch (fallbackError) {
                console.error('AI chat fallback error:', fallbackError.message);
                throw new Error('AI service error');
            }
        }
    }
    const [siteInfo, catalog] = await Promise.all([
        getCachedSiteInfo(),
        loadCatalogProducts(),
    ]);
    const historyText = (options?.history || [])
        .slice(-8)
        .map((h) => `${h.sender === 'user' ? 'Customer' : 'Assistant'}: ${h.text}`)
        .join('\n');
    const recentQueryContext = `${historyText} ${message}`;
    const matchedProducts = findRelevantProducts(recentQueryContext, catalog);
    const productSnippet = matchedProducts.length
        ? matchedProducts
            .map((p) => {
            const finalPrice = p.discountPrice > 0 && p.discountPrice < p.price ? p.discountPrice : p.price;
            const stockLabel = p.inStock ? `In Stock (${p.stock})` : 'Out of Stock';
            const warrantyInfo = p.warranty ? `, Warranty: ${p.warranty}` : '';
            return `- ${p.name} | Brand: ${p.brand || 'N/A'} | Price: ৳${finalPrice.toLocaleString('en-IN')} | ${stockLabel}${warrantyInfo} | Link: /product/${p.id}`;
        })
            .join('\n')
        : 'No exact catalog keyword matches found for this message (direct user to /shop, /deals, or /pc-build if looking for products).';
    const ctx = options?.context || {};
    const pageContextStr = ctx.currentPath
        ? `Customer is currently viewing page: ${ctx.currentPath}${ctx.pageTitle ? ` (${ctx.pageTitle})` : ''}${typeof ctx.cartCount === 'number' && ctx.cartCount > 0 ? `, Cart items: ${ctx.cartCount} (৳${Number(ctx.cartTotal || 0).toLocaleString('en-IN')})` : ''}.`
        : '';
    const systemInstruction = `You are the friendly, knowledgeable AI Shopping & Tech Support Assistant for **${siteInfo.brandName}** — a premier Computer Hardware, Custom PC, Laptop, CCTV, Networking & Electronics E-Commerce Store in Bangladesh.

STORE INFORMATION & POLICIES:
- Brand: ${siteInfo.brandName}
- Hotline / WhatsApp: ${siteInfo.phone}
- Email: ${siteInfo.email}
- Store Address: ${siteInfo.address}
- Catalog Size: ${catalog.length} active products online
- Useful Storefront Links (write exact relative paths starting with / so our chat UI makes them clickable):
  • Shop All Products: /shop
  • Hot Deals & Campaigns: /deals
  • Custom PC Builder (auto compatibility + PSU wattage + EMI): /pc-build
  • Credit Card EMI Plans: /emi-terms (Available on orders ≥ ৳5,000 across 16 Bangladeshi banks for 3–36 months; selectable directly at /checkout)
  • Track Order: /track-order
  • Delivery Policy: /online-delivery (Inside Dhaka fast delivery ৳80–৳150 in 1–2 days; Outside Dhaka via courier in 2–4 days)
  • Payment Methods: Cash on Delivery (COD), Online Payment via EPS Gateway (Card / bKash / Nagad / Net Banking), and Credit Card EMI
  • Warranty & Refund Policy: /warranty-policy and /refund-policy
  • Corporate IT / CCTV Projects & Contact: /projects and /contact

${pageContextStr ? `CURRENT SESSION CONTEXT:\n${pageContextStr}\n` : ''}
LIVE MATCHING PRODUCTS FROM STORE DATABASE (Use ONLY these exact prices/links if quoting store inventory; NEVER invent fake prices):
${productSnippet}

RESPONSE GUIDELINES:
1. Language Match: Reply naturally in **Bengali (বাংলা)** if the customer wrote in Bengali or Banglish (e.g., "dam koto", "emi hobe?"). Reply in clear **English** if the customer wrote in English.
2. Concise & Helpful: Keep answers concise, warm, and well-structured using short bullet points ("- ") and **bold** highlights where helpful.
3. Accuracy: Never guess prices or claim a product is in stock if not listed in the Live Matching Products above. If a specific item isn't matched, invite them to search on /shop or contact our sales team at ${siteInfo.phone} / WhatsApp.
4. Clickable Paths: Whenever recommending a tool/page/product, include its path like /pc-build, /emi-terms, /track-order, or /product/<id> directly in the text.`;
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
    try {
        const response = await client.models.generateContent({
            model: 'gemini-3.8-flash',
            contents,
            config: {
                systemInstruction,
                temperature: 0.4,
            },
        });
        return response.text || '';
    }
    catch (error) {
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
            return fallbackResponse.text || '';
        }
        catch (fallbackError) {
            console.error('AI chat fallback error:', fallbackError.message);
            throw new Error('AI service error');
        }
    }
}
export async function polishText(text, options) {
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
        }
        catch (err) {
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
    }
    catch (error) {
        console.error('AI polish error:', error.message);
        throw new Error(error.message || 'AI polish error');
    }
}
