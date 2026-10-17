import { getAdminDb, getAdminDocument } from '../firebase/admin.js';
import { getEffectiveDomainPricingList } from '../routes/domain.js';

export interface OrderCartItemInput {
  id: string;
  productId?: string;
  variantId?: string;
  quantity: number;
  itemType?: 'product' | 'domain' | 'hosting' | 'domain_transfer' | 'domain_renewal' | 'ssl' | 'service' | 'vps';
  domain?: string;
  domainTld?: string;
  termYears?: number;
  billingCycle?: 'monthly' | 'yearly' | 'annually';
  planId?: string;
  planSlug?: string;
  bdAppId?: string;
  details?: Record<string, any>;
  resources?: {
    disk?: number;
    websites?: number;
    cpu?: number;
    ram?: number;
    email?: number;
    databases?: number;
  };
}

export interface CreateOrderPayload {
  platform?: 'ecommerce' | 'hosting';
  items: OrderCartItemInput[];
  couponCode?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city?: string;
  state?: string;
  company?: string;
  paymentType?: 'cod' | 'pay_now';
  advanceDelivery?: boolean;
  paymentMethod: string;
  transactionId?: string | null;
  notes?: string;
  affiliateRefId?: string | null;
  domainConfig?: {
    ns1?: string;
    ns2?: string;
    useCustomNs?: boolean;
  };
  hostingConfig?: {
    domain?: string;
  };
  vpsConfig?: {
    hostname?: string;
    os?: string;
    serverLocation?: string;
    rootPassword?: string;
    sshKey?: string;
    notes?: string;
  } | null;
  transferAuthCodes?: Record<string, string>;
}

const CANONICAL_HOSTING_PLANS: Record<string, { name: string; monthly: number; annually: number }> = {
  student: { name: 'Student', monthly: 75, annually: 720 },
  plan_student: { name: 'Student', monthly: 75, annually: 720 },
  starter: { name: 'Starter', monthly: 150, annually: 1440 },
  plan_starter: { name: 'Starter', monthly: 150, annually: 1440 },
  standard: { name: 'Standard', monthly: 350, annually: 3360 },
  plan_standard: { name: 'Standard', monthly: 350, annually: 3360 },
  professional: { name: 'Professional', monthly: 650, annually: 6240 },
  plan_professional: { name: 'Professional', monthly: 650, annually: 6240 },
  premium: { name: 'Premium', monthly: 1200, annually: 11520 },
  plan_premium: { name: 'Premium', monthly: 1200, annually: 11520 },
  // WordPress Cloud canonical plans
  cl_shared_starter: { name: 'Starter Cloud', monthly: 100, annually: 1000 },
  cl_shared_standard: { name: 'Standard Cloud', monthly: 200, annually: 2000 },
  cl_shared_advanced: { name: 'Advanced Cloud', monthly: 350, annually: 3500 },
  cl_shared_turbo: { name: 'Turbo Cloud', monthly: 600, annually: 6000 },
  // Cloud VPS canonical plans
  vps_starter: { name: 'Cloud VPS 1', monthly: 1800, annually: Math.round(1800 * 12 * 0.8) },
  vps_standard: { name: 'Cloud VPS 2', monthly: 3500, annually: Math.round(3500 * 12 * 0.8) },
  vps_pro: { name: 'Cloud VPS 3', monthly: 6800, annually: Math.round(6800 * 12 * 0.8) },
  vps_ultra: { name: 'Cloud VPS Pro', monthly: 12500, annually: Math.round(12500 * 12 * 0.8) },
};

const CANONICAL_SSL_PRODUCTS: Record<string, { name: string; price: number }> = {
  ssl_positive: { name: 'Sectigo PositiveSSL', price: 850 },
  ssl_essential: { name: 'Comodo EssentialSSL', price: 1800 },
  ssl_wildcard: { name: 'PositiveSSL Wildcard', price: 8500 },
  ssl_ev: { name: 'Sectigo EV SSL', price: 15500 },
};

async function generateServerDocumentNumber(type: string = 'INV'): Promise<string> {
  const db = getAdminDb();
  const counterRef = db.collection('counters').doc(type);
  const snap = await counterRef.get();
  let newNumber = 1;
  if (snap.exists) {
    const data = snap.data() || {};
    newNumber = (Number(data.lastNumber) || 0) + 1;
    await counterRef.update({ lastNumber: newNumber });
  } else {
    await counterRef.set({ lastNumber: 1 });
  }
  return `${type}-${String(newNumber).padStart(5, '0')}`;
}

export async function calculateAndCreateServerOrder(userId: string, payload: CreateOrderPayload) {
  const db = getAdminDb();
  const rawItems = Array.isArray(payload.items) ? payload.items : [];

  if (rawItems.length === 0) {
    throw new Error('Cannot create an order with an empty cart.');
  }

  // Load promo settings
  let promoSettings: any = {
    isFreeDomainEnabled: false,
    eligibleTlds: ['.com'],
    eligibleBillingCycles: ['yearly', 'annually'],
    excludeBdDomains: true,
  };
  try {
    const promoDoc = await getAdminDocument('settings', 'hostingPromos');
    if (promoDoc.exists && promoDoc.data) {
      promoSettings = { ...promoSettings, ...promoDoc.data };
    }
  } catch {}

  // Load site settings for exchange rates / free shipping threshold
  let siteSettings: any = {};
  try {
    const siteDoc = await getAdminDocument('settings', 'site');
    if (siteDoc.exists && siteDoc.data) {
      siteSettings = siteDoc.data;
    }
  } catch {}

  // Load shipping settings
  let shippingConfig = {
    insideDhaka: 80,
    outsideDhaka: 120,
    freeShippingThreshold: 5000,
    enableFreeShipping: false,
  };
  try {
    const shipDoc = await getAdminDocument('settings', 'ecommerce_shipping');
    if (shipDoc.exists && shipDoc.data) {
      shippingConfig = { ...shippingConfig, ...shipDoc.data };
    }
  } catch {}

  // Pre-load domain pricing list if any domain items exist
  const hasAnyDomainItem = rawItems.some(i =>
    ['domain', 'domain_transfer', 'domain_renewal'].includes(i.itemType || '') ||
    String(i.id || '').startsWith('domain_')
  );
  const domainPricingList = hasAnyDomainItem ? await getEffectiveDomainPricingList(false) : [];

  // Pre-load hostingPlans if any hosting items exist
  const hasAnyHostingItem = rawItems.some(i =>
    ['hosting', 'vps'].includes(i.itemType || '') ||
    String(i.id || '').startsWith('hosting') ||
    String(i.id || '').startsWith('dynamic-hosting-') ||
    String(i.id || '').startsWith('custom-hosting-') ||
    String(i.id || '').startsWith('vps_') ||
    String(i.id || '').startsWith('cl_shared_')
  );
  let hostingPlansDocs: any[] = [];
  if (hasAnyHostingItem) {
    try {
      const hSnap = await db.collection('hostingPlans').get();
      hostingPlansDocs = hSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    } catch {}
  }

  const verifiedItems: any[] = [];
  const productStockUpdates: { prodId: string; quantity: number; variantId?: string; currentStock: number; variants?: any[] }[] = [];

  for (const rawItem of rawItems) {
    const qty = Math.max(1, Math.floor(Number(rawItem.quantity) || 1));
    const itemId = String(rawItem.id || rawItem.productId || '').trim();
    if (!itemId) {
      throw new Error('Invalid item ID in cart.');
    }

    // Determine itemType
    let itemType = rawItem.itemType;
    if (!itemType) {
      if (itemId.startsWith('domain_transfer_')) itemType = 'domain_transfer';
      else if (itemId.startsWith('domain_renewal_')) itemType = 'domain_renewal';
      else if (itemId.startsWith('domain_')) itemType = 'domain';
      else if (itemId.startsWith('ssl_')) itemType = 'ssl';
      else if (
        itemId.startsWith('hosting-') ||
        itemId.startsWith('hosting_') ||
        itemId.startsWith('dynamic-hosting-') ||
        itemId.startsWith('custom-hosting-') ||
        itemId.startsWith('vps_') ||
        itemId.startsWith('cl_shared_')
      ) {
        itemType = 'hosting';
      } else if (itemId === 'SERVICE-ASSEMBLY') {
        itemType = 'service';
      } else {
        itemType = 'product';
      }
    }

    // 1. PC Builder Assembly Service
    if (itemId === 'SERVICE-ASSEMBLY' || itemType === 'service') {
      verifiedItems.push({
        id: 'SERVICE-ASSEMBLY',
        name: 'Professional PC Assembly Service',
        description: 'Professional cable management and stress testing for your custom PC build.',
        price: 1500,
        quantity: qty,
        category: 'Service',
        itemType: 'service',
        isService: true,
      });
      continue;
    }

    // 2. Domain Registration / Transfer / Renewal
    if (itemType === 'domain' || itemType === 'domain_transfer' || itemType === 'domain_renewal') {
      const cleanDomain = (
        rawItem.domain ||
        itemId
          .replace(/^domain_transfer_/, '')
          .replace(/^domain_renewal_/, '')
          .replace(/^domain_/, '')
      )
        .trim()
        .toLowerCase();

      const tldParts = cleanDomain.split('.').slice(1).join('.');
      const rawTld = (rawItem.domainTld || tldParts || '').replace(/^\./, '').toLowerCase();
      const formattedTld = `.${rawTld}`;
      const termYears = Math.max(1, Math.min(10, Math.floor(Number(rawItem.termYears) || (rawTld.endsWith('bd') ? 2 : 1))));

      let unitYearPrice = 1450;
      if (rawTld.endsWith('bd')) {
        // .bd domains are 1840 for 2 years in Checkout.tsx or 1800 per year
        if (rawItem.bdAppId && termYears === 2) {
          unitYearPrice = 920; // 1840 total for 2 years
        } else {
          const bdMatch = domainPricingList.find(d => d.tld.toLowerCase() === `.${rawTld}` || d.tld.toLowerCase() === '.bd');
          unitYearPrice = bdMatch ? bdMatch.registerPrice : 1800;
        }
      } else {
        const matchedTld = domainPricingList.find(d => d.tld.toLowerCase() === formattedTld);
        if (matchedTld) {
          if (itemType === 'domain_transfer') unitYearPrice = matchedTld.transferPrice || matchedTld.registerPrice;
          else if (itemType === 'domain_renewal') unitYearPrice = matchedTld.renewPrice || matchedTld.registerPrice;
          else unitYearPrice = matchedTld.registerPrice;
        }
      }

      const calculatedPrice = Math.round(unitYearPrice * termYears);

      verifiedItems.push({
        id: itemId,
        name:
          itemType === 'domain_transfer'
            ? `Domain Transfer - ${cleanDomain}`
            : itemType === 'domain_renewal'
            ? `Domain Renewal - ${cleanDomain}`
            : `Domain Registration - ${cleanDomain}`,
        domain: cleanDomain,
        domainTld: rawTld,
        termYears,
        price: calculatedPrice,
        quantity: 1,
        category: 'Hosting & Domains',
        itemType,
        isDigital: true,
        ...(rawItem.bdAppId ? { bdAppId: rawItem.bdAppId } : {}),
      });
      continue;
    }

    // 3. SSL Certificates
    if (itemType === 'ssl') {
      const sslKey = itemId.split('_').slice(0, 2).join('_'); // e.g. ssl_positive
      let sslPrice = CANONICAL_SSL_PRODUCTS[sslKey]?.price || 850;
      let sslName = CANONICAL_SSL_PRODUCTS[sslKey]?.name || 'SSL Certificate';

      try {
        const sslDoc = await getAdminDocument('sslProducts', sslKey);
        if (sslDoc.exists && sslDoc.data && Number(sslDoc.data.price) > 0) {
          sslPrice = Number(sslDoc.data.price);
          sslName = sslDoc.data.name || sslName;
        }
      } catch {}

      const termYears = Math.max(1, Math.min(5, Math.floor(Number(rawItem.termYears) || 1)));
      verifiedItems.push({
        id: itemId,
        name: sslName,
        description: `${termYears} Year SSL Certificate`,
        price: Math.round(sslPrice * termYears),
        quantity: qty,
        category: 'Hosting & Domains',
        itemType: 'ssl',
        termYears,
        isDigital: true,
      });
      continue;
    }

    // 4. Hosting / Cloud VPS / Custom Hosting
    if (itemType === 'hosting' || itemType === 'vps') {
      const cycleRaw = (rawItem.billingCycle || (itemId.includes('annually') || itemId.includes('yearly') ? 'yearly' : 'monthly')).toLowerCase();
      const isAnnual = cycleRaw === 'yearly' || cycleRaw === 'annually';
      const normalizedCycle = isAnnual ? 'yearly' : 'monthly';

      // Custom Hosting Builder
      if (itemId.startsWith('custom-hosting-') || rawItem.planSlug === 'custom-package') {
        let rates = {
          perGbDisk: 50,
          perWebsite: 40,
          perCoreCpu: 120,
          perGbRam: 80,
          perEmail: 2,
          perDatabase: 5,
          basePrice: 100,
          annualDiscountPercent: 20,
        };
        try {
          const customDoc = await getAdminDocument('settings', 'custom_hosting_pricing');
          if (customDoc.exists && customDoc.data) {
            const d = customDoc.data;
            rates = {
              perGbDisk: Number(d.perGbDisk) || 50,
              perWebsite: Number(d.perWebsite) || 40,
              perCoreCpu: Number(d.perCoreCpu) || 120,
              perGbRam: Number(d.perGbRam) || 80,
              perEmail: Number(d.perEmail) || 2,
              perDatabase: Number(d.perDatabase) || 5,
              basePrice: Number(d.basePrice) || 100,
              annualDiscountPercent: Number(d.annualDiscountPercent) || 20,
            };
          }
        } catch {}

        // Parse resources from details or resources object
        const parseNum = (val: any, fallback: number) => {
          const m = String(val || '').match(/\d+(\.\d+)?/);
          return m ? Number(m[0]) : fallback;
        };
        const disk = Math.max(1, rawItem.resources?.disk ?? parseNum(rawItem.details?.disk, 5));
        const websites = Math.max(1, rawItem.resources?.websites ?? parseNum(rawItem.details?.websites, 2));
        const cpu = Math.max(1, rawItem.resources?.cpu ?? parseNum(rawItem.details?.cpu, 2));
        const ram = Math.max(1, rawItem.resources?.ram ?? parseNum(rawItem.details?.ram, 2));
        const email = Math.max(1, rawItem.resources?.email ?? parseNum(rawItem.details?.email, 10));
        const databases = Math.max(1, rawItem.resources?.databases ?? parseNum(rawItem.details?.databases, 5));

        let monthlyTotal = rates.basePrice;
        monthlyTotal += disk * rates.perGbDisk;
        monthlyTotal += (websites - 1) * rates.perWebsite;
        monthlyTotal += (cpu - 1) * rates.perCoreCpu;
        monthlyTotal += (ram - 1) * rates.perGbRam;
        monthlyTotal += Math.max(0, email - 5) * rates.perEmail;
        monthlyTotal += Math.max(0, databases - 2) * rates.perDatabase;
        const monthlyPrice = Math.max(120, Math.round(monthlyTotal));
        const discountMultiplier = 1 - rates.annualDiscountPercent / 100;
        const annualPrice = Math.round(monthlyPrice * 12 * discountMultiplier);
        const finalPrice = isAnnual ? annualPrice : monthlyPrice;

        verifiedItems.push({
          id: itemId,
          name: `Custom Cloud Plan (${disk}GB / ${cpu} Core / ${ram}GB RAM)`,
          price: finalPrice,
          quantity: qty,
          category: 'Hosting & Domains',
          itemType: 'hosting',
          planSlug: 'custom-package',
          billingCycle: normalizedCycle,
          details: rawItem.details || {},
          isDigital: true,
        });
        continue;
      }

      // Standard / Dynamic / WordPress / VPS Hosting Plan
      const slugCandidate = (
        rawItem.planId ||
        rawItem.planSlug ||
        itemId
          .replace(/^dynamic-hosting-/, '')
          .replace(/^hosting-/, '')
          .replace(/^hosting_/, '')
          .replace(/-(monthly|yearly|annually)$/, '')
          .replace(/_(monthly|yearly|annually)$/, '')
      ).trim();

      const matchedPlan = hostingPlansDocs.find(
        p =>
          p.id === slugCandidate ||
          p.slug === slugCandidate ||
          p.id === `plan_${slugCandidate}` ||
          p.id === `vps_${slugCandidate}`
      );

      let monthlyPrice = 0;
      let annualPrice = 0;
      let planName = rawItem.planSlug || slugCandidate;

      if (matchedPlan) {
        planName = matchedPlan.name || planName;
        if (matchedPlan.priceOverride && Number(matchedPlan.overridePrice) > 0) {
          monthlyPrice = Number(matchedPlan.overridePrice);
          annualPrice = Number(matchedPlan.overrideAnnualPrice) || Math.round(monthlyPrice * 12 * 0.8);
        } else if (Number(matchedPlan.licenseCostUsd || matchedPlan.pricing?.licenseCostUsd) > 0) {
          const licenseCostUsd = Number(matchedPlan.licenseCostUsd || matchedPlan.pricing?.licenseCostUsd);
          const exchangeRate = Number(siteSettings.apiSettings?.usdToBdtRate || siteSettings.usdToBdtRate) || 120;
          const markupPercent = Number(siteSettings.apiSettings?.hostingMarkupPercent || siteSettings.hostingMarkupPercent) || 35;
          monthlyPrice = Math.round(licenseCostUsd * exchangeRate * (1 + markupPercent / 100));
          annualPrice = Math.round(monthlyPrice * 12 * 0.8);
        } else {
          monthlyPrice = Number(matchedPlan.pricing?.monthly || matchedPlan.monthlyPrice || matchedPlan.price) || 0;
          annualPrice = Number(matchedPlan.pricing?.annually || matchedPlan.annualPrice) || Math.round(monthlyPrice * 12 * 0.8);
        }
      }

      if (monthlyPrice <= 0) {
        const canonical = CANONICAL_HOSTING_PLANS[slugCandidate] || CANONICAL_HOSTING_PLANS[`plan_${slugCandidate}`];
        if (!canonical) {
          throw new Error(`Hosting plan "${slugCandidate}" not found or price unavailable.`);
        }
        monthlyPrice = canonical.monthly;
        annualPrice = canonical.annually;
        planName = canonical.name;
      }

      const finalPlanPrice = isAnnual ? annualPrice : monthlyPrice;

      verifiedItems.push({
        id: itemId,
        name: matchedPlan?.name ? `${matchedPlan.name} Hosting Plan` : `${planName}`,
        price: finalPlanPrice,
        quantity: qty,
        category: 'Hosting & Domains',
        itemType: 'hosting',
        planId: matchedPlan?.id || slugCandidate,
        planSlug: matchedPlan?.slug || slugCandidate,
        billingCycle: normalizedCycle,
        details: rawItem.details || {},
        isDigital: true,
      });
      continue;
    }

    // 5. E-Commerce Physical / Digital Product from `products` collection
    const realProductId = (rawItem.productId || itemId).trim();
    const prodDoc = await getAdminDocument('products', realProductId);
    if (!prodDoc.exists || !prodDoc.data) {
      throw new Error(`Product "${realProductId}" no longer exists.`);
    }

    const pData = prodDoc.data;
    if (pData.isOutOfStock === true) {
      throw new Error(`Product "${pData.name || realProductId}" is currently out of stock.`);
    }

    let unitPrice = Number(pData.price) || 0;
    if (Number(pData.discountPrice) > 0 && Number(pData.discountPrice) < unitPrice) {
      unitPrice = Number(pData.discountPrice);
    }

    // Check variant if variantId provided
    const variantId = rawItem.variantId;
    if (variantId && Array.isArray(pData.variants)) {
      const matchedVariant = pData.variants.find((v: any) => v.id === variantId || v.sku === variantId);
      if (!matchedVariant) {
        throw new Error(`Selected variant for "${pData.name}" does not exist.`);
      }
      if (Number(matchedVariant.stock) < qty && !pData.isCustomService && !pData.isDigital) {
        throw new Error(`Insufficient stock for "${pData.name} (${matchedVariant.name})". Available: ${matchedVariant.stock}`);
      }
      if (Number(matchedVariant.price) > 0) {
        unitPrice = Number(matchedVariant.price);
      }
      if (!pData.isCustomService && !pData.isDigital) {
        const updatedVariants = pData.variants.map((v: any) =>
          v.id === matchedVariant.id ? { ...v, stock: Math.max(0, Number(v.stock) - qty) } : v
        );
        productStockUpdates.push({
          prodId: realProductId,
          quantity: qty,
          variantId: matchedVariant.id,
          currentStock: Number(pData.stock) || 0,
          variants: updatedVariants,
        });
      }
    } else {
      const currentStock = Number(pData.stock) ?? 0;
      if (!pData.isCustomService && !pData.isDigital && currentStock < qty) {
        throw new Error(`Insufficient stock for "${pData.name}". Available: ${currentStock}`);
      }
      if (!pData.isCustomService && !pData.isDigital) {
        productStockUpdates.push({
          prodId: realProductId,
          quantity: qty,
          currentStock,
        });
      }
    }

    if (unitPrice <= 0) {
      throw new Error(`Invalid price configuration for product "${pData.name}".`);
    }

    verifiedItems.push({
      id: realProductId,
      productId: realProductId,
      ...(variantId ? { variantId } : {}),
      name: pData.name,
      price: unitPrice,
      originalPrice: Number(pData.price) !== unitPrice ? Number(pData.price) : null,
      quantity: qty,
      category: pData.category || 'General',
      sku: pData.sku || '',
      images: Array.isArray(pData.images) ? pData.images.slice(0, 2) : [],
      imageUrl: pData.imageUrl || (Array.isArray(pData.images) && pData.images[0]) || '',
      isFreeShipping: Boolean(pData.isFreeShipping),
      isDigital: Boolean(pData.isDigital),
      itemType: 'product',
    });
  }

  // Apply Free Domain with Annual Hosting Promo if eligible
  if (promoSettings.isFreeDomainEnabled) {
    let isPromoValid = true;
    const now = new Date();
    if (promoSettings.startDate && new Date(promoSettings.startDate) > now) isPromoValid = false;
    if (promoSettings.endDate && new Date(promoSettings.endDate) < now) isPromoValid = false;

    if (isPromoValid) {
      const eligibleCycles = promoSettings.eligibleBillingCycles || ['yearly', 'annually'];
      const hasEligibleHosting = verifiedItems.some(
        item => item.itemType === 'hosting' && eligibleCycles.includes(item.billingCycle)
      );

      if (hasEligibleHosting) {
        const eligibleTlds = (promoSettings.eligibleTlds || ['.com']).map((t: string) =>
          t.startsWith('.') ? t.toLowerCase() : `.${t.toLowerCase()}`
        );
        const eligibleDomain = verifiedItems.find(
          item =>
            item.itemType === 'domain' &&
            eligibleTlds.includes(`.${String(item.domainTld || '').replace(/^\./, '').toLowerCase()}`)
        );
        if (eligibleDomain && eligibleDomain.price > 0) {
          eligibleDomain.originalPrice = eligibleDomain.price;
          eligibleDomain.price = 0;
        }
      }
    }
  }

  const subtotal = verifiedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Exclude .bd domains from coupon discounts if configured
  const discountableSubtotal = verifiedItems
    .filter(item => {
      const isBdDomain = item.itemType === 'domain' && String(item.domainTld || '').endsWith('bd');
      if (isBdDomain && promoSettings.excludeBdDomains !== false) return false;
      return true;
    })
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Validate couponCode from `couponCodes` collection on server
  let promoDiscount = 0;
  let verifiedCouponCode: string | null = null;
  let couponFreeShipping = false;

  if (payload.couponCode && typeof payload.couponCode === 'string' && payload.couponCode.trim()) {
    const cleanCode = payload.couponCode.trim().toUpperCase();
    const couponSnap = await db
      .collection('couponCodes')
      .where('code', '==', cleanCode)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (couponSnap.empty) {
      throw new Error(`Invalid or inactive coupon code "${cleanCode}".`);
    }

    const couponDoc = couponSnap.docs[0];
    const couponData = couponDoc.data();

    if (couponData.expiryDate && new Date(couponData.expiryDate) < new Date()) {
      throw new Error(`Coupon code "${cleanCode}" has expired.`);
    }

    if (Number(couponData.minOrderAmount) > 0 && subtotal < Number(couponData.minOrderAmount)) {
      throw new Error(`Coupon "${cleanCode}" requires a minimum order of ৳${couponData.minOrderAmount}.`);
    }

    if (Number(couponData.usageLimit) > 0 && Number(couponData.usedCount || 0) >= Number(couponData.usageLimit)) {
      throw new Error(`Coupon "${cleanCode}" has reached its usage limit.`);
    }

    verifiedCouponCode = cleanCode;

    if (couponData.type === 'fixed' && Number(couponData.fixedAmount) > 0) {
      promoDiscount = Math.min(Number(couponData.fixedAmount), discountableSubtotal);
    } else if (couponData.type === 'free_shipping') {
      couponFreeShipping = true;
    } else {
      const pct = Math.max(0, Math.min(100, Number(couponData.discountPercentage) || 0));
      promoDiscount = Math.round((discountableSubtotal * pct) / 100);
    }
  }

  const discountedTotal = Math.max(0, subtotal - promoDiscount);

  // Calculate shipping cost on the server
  let shippingCost = 0;
  const hasPhysicalProduct = verifiedItems.some(i => i.itemType === 'product' && !i.isDigital);

  if (payload.platform !== 'hosting' && hasPhysicalProduct) {
    const state = (payload.state || '').trim();
    const city = (payload.city || '').trim();
    if (state === 'Dhaka' || city === 'Dhaka') {
      shippingCost = Number(shippingConfig.insideDhaka) || 80;
    } else {
      shippingCost = Number(shippingConfig.outsideDhaka) || 120;
    }

    const isFreeShipping =
      couponFreeShipping ||
      (shippingConfig.enableFreeShipping && subtotal >= Number(shippingConfig.freeShippingThreshold || 5000)) ||
      (Number(siteSettings.freeShippingThreshold) > 0 && subtotal >= Number(siteSettings.freeShippingThreshold)) ||
      verifiedItems.every(i => i.isFreeShipping || i.isDigital || i.itemType !== 'product');

    if (isFreeShipping) {
      shippingCost = 0;
    }
  }

  const grandTotal = Math.round(discountedTotal + shippingCost);
  const docNumber = await generateServerDocumentNumber('INV');
  const now = new Date().toISOString();

  const isAdvanceCOD = payload.paymentType === 'cod' && Boolean(payload.advanceDelivery) && shippingCost > 0;
  const hasManualBkashTx =
    (payload.paymentMethod === 'bkash' || payload.paymentMethod === 'manual_bkash' || payload.paymentMethod === 'bank') &&
    Boolean(payload.transactionId && payload.transactionId.trim().length >= 3);

  const newOrderRef = db.collection('orders').doc();
  const orderId = newOrderRef.id;

  const orderData: Record<string, any> = {
    userId,
    platform: payload.platform || (hasPhysicalProduct ? 'ecommerce' : 'hosting'),
    items: verifiedItems,
    subtotal,
    total: grandTotal,
    shippingCost,
    status: 'pending',
    paymentStatus: hasManualBkashTx ? 'submitted' : 'pending',
    paymentSubmittedAt: hasManualBkashTx ? now : null,
    type: 'invoice',
    documentNumber: docNumber,
    customerName: String(payload.customerName || '').trim(),
    customerEmail: String(payload.customerEmail || '').trim(),
    customerPhone: String(payload.customerPhone || '').trim(),
    shippingAddress: String(payload.shippingAddress || '').trim(),
    company: String(payload.company || '').trim(),
    discountCode: verifiedCouponCode,
    appliedDiscountCode: verifiedCouponCode,
    discountAmount: promoDiscount,
    paymentMethod:
      payload.paymentType === 'cod'
        ? isAdvanceCOD
          ? 'cod_advance_paid'
          : 'cod'
        : payload.paymentMethod || 'bkash',
    transactionId: hasManualBkashTx ? payload.transactionId!.trim() : null,
    advancePaidAmount: isAdvanceCOD ? shippingCost : 0,
    notes: String(payload.notes || '').trim(),
    vpsConfig: payload.vpsConfig || null,
    createdAt: now,
    updatedAt: now,
  };

  const batch = db.batch();
  batch.set(newOrderRef, orderData);

  // Decrement product stocks atomically in batch
  for (const stockUpd of productStockUpdates) {
    const prodRef = db.collection('products').doc(stockUpd.prodId);
    const newStock = Math.max(0, stockUpd.currentStock - stockUpd.quantity);
    if (stockUpd.variants) {
      batch.update(prodRef, { stock: newStock, variants: stockUpd.variants, updatedAt: now });
    } else {
      batch.update(prodRef, { stock: newStock, updatedAt: now });
    }
  }

  // Record accounting ledger entry for ecommerce orders
  if (orderData.platform === 'ecommerce') {
    const txRef = db.collection('transactions').doc();
    batch.set(txRef, {
      type: 'sale',
      amount: grandTotal,
      date: now,
      description: `Online Order #${docNumber} (${orderData.customerName})`,
      entityId: userId,
      entityName: orderData.customerName,
      entityType: 'customer',
      referenceId: orderId,
      documentNumber: docNumber,
      paymentAccountId: '',
      paymentMethod: payload.paymentType === 'cod' ? 'cod' : payload.paymentMethod || 'online',
      createdAt: now,
      createdBy: 'Online Customer',
    });

    if (isAdvanceCOD && shippingCost > 0) {
      const advTxRef = db.collection('transactions').doc();
      batch.set(advTxRef, {
        type: 'payment_received',
        amount: shippingCost,
        date: now,
        description: `Advance Delivery Fee for Order #${docNumber}`,
        entityId: userId,
        entityName: orderData.customerName,
        entityType: 'customer',
        referenceId: orderId,
        documentNumber: docNumber,
        paymentAccountId: '',
        paymentMethod: 'online',
        createdAt: now,
        createdBy: 'Online Customer',
      });
    }
  }

  // Create linked SSL Orders
  const sslItems = verifiedItems.filter(i => i.itemType === 'ssl');
  for (const sslItem of sslItems) {
    const sOrderRef = db.collection('sslOrders').doc();
    batch.set(sOrderRef, {
      userId,
      orderId,
      productId: sslItem.id.split('_').slice(0, 2).join('_'),
      name: sslItem.name,
      termYears: sslItem.termYears || 1,
      price: sslItem.price,
      status: 'pending_configuration',
      createdAt: now,
      updatedAt: now,
    });
  }

  // Create linked Domain Orders
  const domainItems = verifiedItems.filter(i => ['domain', 'domain_renewal', 'domain_transfer'].includes(i.itemType));
  for (const dItem of domainItems) {
    const dOrderRef = db.collection('domainOrders').doc();
    const nameservers = payload.domainConfig?.useCustomNs
      ? [payload.domainConfig.ns1?.trim(), payload.domainConfig.ns2?.trim()].filter(Boolean)
      : ['ns1.click2itbd.com', 'ns2.click2itbd.com'];

    batch.set(dOrderRef, {
      userId,
      orderId,
      domain: dItem.domain,
      tld: dItem.domainTld,
      termYears: dItem.termYears || 1,
      years: dItem.termYears || 1,
      price: dItem.price,
      autoRenew: false,
      nameservers,
      status: 'pending',
      ...(dItem.itemType === 'domain_renewal' ? { action: 'renewal' } : {}),
      ...(dItem.itemType === 'domain_transfer' ? { type: 'transfer' } : {}),
      createdAt: now,
      updatedAt: now,
    });

    if (dItem.bdAppId) {
      const appRef = db.collection('bd_domain_applications').doc(dItem.bdAppId);
      batch.update(appRef, {
        status: 'processing',
        orderId,
        updatedAt: now,
      });
    }
  }

  // Create linked Hosting Accounts & hostingOrders
  const hostingItems = verifiedItems.filter(i => i.itemType === 'hosting');
  for (const hItem of hostingItems) {
    const hAccountRef = db.collection('hostingAccounts').doc();
    const slug = String(hItem.planSlug || hItem.planId || '').toLowerCase();
    const isItemVps = slug.includes('vps') || Boolean(hItem.details?.os);
    const packageSlug = hItem.planSlug || hItem.planId || (isItemVps ? 'vps_starter' : 'starter');

    batch.set(hAccountRef, {
      userId,
      orderId,
      planId: packageSlug,
      domain: isItemVps ? payload.vpsConfig?.hostname?.trim() || null : payload.hostingConfig?.domain || null,
      provider: isItemVps ? 'vps' : 'cpanel',
      type: isItemVps ? 'vps' : 'shared',
      status: 'pending',
      provisioningStatus: 'pending',
      billingCycle: hItem.billingCycle || 'monthly',
      autoRenew: false,
      createdAt: now,
      updatedAt: now,
      ...(isItemVps && payload.vpsConfig
        ? {
            vpsDetails: {
              hostname: payload.vpsConfig.hostname?.trim() || '',
              os: payload.vpsConfig.os || 'Ubuntu 22.04 LTS',
              serverLocation: payload.vpsConfig.serverLocation || 'Dhaka, Bangladesh',
              rootPassword: payload.vpsConfig.rootPassword || '',
              sshKey: payload.vpsConfig.sshKey?.trim() || '',
              notes: payload.vpsConfig.notes?.trim() || '',
              cores: hItem.details?.cores || '2 vCPU',
              ram: hItem.details?.ram || '4 GB',
              storage: hItem.details?.storage || '60 GB NVMe',
              bandwidth: hItem.details?.bandwidth || '2 TB',
              ipv4: hItem.details?.ipv4 || '1 Dedicated IPv4',
            },
          }
        : {}),
    });

    const hostingOrderDocRef = db.collection('hostingOrders').doc(orderId);
    batch.set(hostingOrderDocRef, {
      ...orderData,
      id: orderId,
      orderId,
      packageSlug,
      billingCycle: hItem.billingCycle || 'monthly',
      price: grandTotal,
      domain: isItemVps ? payload.vpsConfig?.hostname?.trim() || '' : payload.hostingConfig?.domain || '',
      customerInfo: {
        name: orderData.customerName,
        email: orderData.customerEmail,
        phone: orderData.customerPhone,
        address: orderData.shippingAddress,
        city: payload.city || '',
        country: 'Bangladesh',
      },
      status: 'pending',
    });
  }

  await batch.commit();

  return {
    orderId,
    orderData: {
      id: orderId,
      ...orderData,
    },
    subtotal,
    discountAmount: promoDiscount,
    shippingCost,
    grandTotal,
    payNowAmount: isAdvanceCOD ? shippingCost : grandTotal,
  };
}
