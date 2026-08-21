/**
 * Dynadot API Integration Service
 */

import { httpsCallable } from 'firebase/functions';
import { functions as functionsInstance } from '../firebase';

export interface DomainAvailabilityResponse {
  domain: string;
  available: boolean;
  priceUsd: number;
  priceBdt: number;
  status: string;
}

export interface TldPricingResponse {
  tld: string;
  currency: string;
  registrationPrice: number;
  renewalPrice: number;
  transferPrice: number;
  restorePrice: number;
}

export const getTldPricing = async (tld: string): Promise<TldPricingResponse> => {
  try {
    const functions = functionsInstance;
    const dynadotTldPricing = httpsCallable(functions, 'dynadotTldPricing');
    
    const result = await dynadotTldPricing({ tld });
    
    const data = result.data as any;
    
    if (data?.success) {
      return {
        tld: data.tld,
        currency: data.currency,
        registrationPrice: data.registrationPrice || 0,
        renewalPrice: data.renewalPrice || 0,
        transferPrice: data.transferPrice || 0,
        restorePrice: data.restorePrice || 0,
      };
    } else {
      throw new Error(data?.error || 'Failed to fetch TLD pricing');
    }
    
  } catch (error: any) {
    console.error('Dynadot TLD Pricing Error:', error);
    throw new Error(error.message || 'Failed to fetch TLD pricing');
  }
};

export interface BatchTldPricingItem {
  tld: string;
  customerPriceBdt: number;
  currency: string;
}

export interface BatchTldPricingResponse {
  success: boolean;
  pricing: BatchTldPricingItem[];
}

export const getBatchTldPricing = async (tlds: string[]): Promise<BatchTldPricingResponse> => {
  try {
    const dynadotTldPricingBatch = httpsCallable(functionsInstance, 'dynadotTldPricingBatch');
    const result = await dynadotTldPricingBatch({ tlds });
    const data = result.data as any;
    const pricing = Array.isArray(data?.pricing) ? data.pricing : [];

    if (!data?.success || pricing.length === 0) {
      throw new Error(data?.error || 'Failed to fetch batch TLD pricing');
    }

    return {
      success: true,
      pricing: pricing.map((item: any) => ({
        tld: String(item.tld || ''),
        customerPriceBdt: Number(item.customerPriceBdt),
        currency: String(item.currency || 'BDT'),
      })),
    };
  } catch (error: any) {
    console.error('Dynadot batch TLD pricing error:', error?.code || error?.message || error);
    throw new Error('Domain pricing is temporarily unavailable. Please try again shortly.');
  }
};

export const searchDomainDynadot = async (domain: string): Promise<DomainAvailabilityResponse> => {
  try {
    const functions = functionsInstance;
    const dynadotSearchProxy = httpsCallable(functions, 'dynadotSearchProxy');
    
    const payload = { domain };
    const result = await dynadotSearchProxy(payload);
    const data: any = result.data;
    
    if (data?.Response?.Error || data?.SearchResponse?.Status === "invalid_key" || data?.SearchResponse?.Error) {
      console.error(`Dynadot Error: Blocked by API or Invalid Key`, data);
      throw new Error('Domain search failed, please try again.');
    }
    
    const searchResult = data?.SearchResponse?.SearchResults?.[0];
    if (!searchResult) {
      console.error('[Dynadot] No search results found in response:', data);
      throw new Error('Domain search failed, please try again.');
    }
    
    let isAvailable = false;
    try {
      isAvailable = String(searchResult.Available).toLowerCase() === 'yes';
    } catch (e) {
      console.warn('[Dynadot] Could not parse Available field:', searchResult.Available);
      isAvailable = false;
    }
    
    const priceUsd = searchResult.Price ? parseFloat(searchResult.Price) : 0;
    const priceBdt = searchResult.priceBdt || 0;

    return {
      domain,
      available: isAvailable,
      priceUsd,
      priceBdt,
      status: isAvailable ? 'available' : 'taken',
    };

  } catch (error) {
    console.error('Dynadot search error:', error);
    throw new Error('Domain search failed, please try again.');
  }
};

export interface DomainRenewalPriceResponse {
  success: boolean;
  domain: string;
  tld: string;
  renewalPriceBdt: number;
  maxDuration: number;
}

export const getDomainRenewalPrice = async (domain: string): Promise<DomainRenewalPriceResponse> => {
  try {
    const functions = functionsInstance;
    const getRenewalPrice = httpsCallable(functions, 'getDomainRenewalPrice');
    
    const result = await getRenewalPrice({ domain });
    
    const data = result.data as any;
    
    if (data?.success) {
      return {
        success: true,
        domain: data.domain,
        tld: data.tld,
        renewalPriceBdt: data.renewalPriceBdt || 0,
        maxDuration: data.maxDuration || 10,
      };
    } else {
      throw new Error(data?.error || 'Failed to fetch renewal price');
    }
    
  } catch (error: any) {
    console.error('Dynadot renewal price error:', error);
    throw new Error(error.message || 'Failed to fetch renewal price');
  }
};

export interface DomainRenewalPriceBreakdown {
  success: boolean;
  domain: string;
  tld: string;
  supplierPriceUsd: number;
  markupPercent: number;
  markupAmountUsd: number;
  sellingPriceUsd: number;
  exchangeRate: number;
  sellingPriceBdt: number;
  isSandbox: boolean;
  discountPercent?: number;
}

export const getDomainRenewalPriceBreakdown = async (domain: string): Promise<DomainRenewalPriceBreakdown> => {
  try {
    const functions = functionsInstance;
    const getBreakdown = httpsCallable(functions, 'getDomainRenewalPriceBreakdown');
    
    const result = await getBreakdown({ domain });
    
    const data = result.data as any;
    
    if (data?.success) {
      return {
        success: true,
        domain: data.domain,
        tld: data.tld,
        supplierPriceUsd: data.supplierPriceUsd || 0,
        markupPercent: data.markupPercent || 0,
        markupAmountUsd: data.markupAmountUsd || 0,
        sellingPriceUsd: data.sellingPriceUsd || 0,
        exchangeRate: data.exchangeRate || 120,
        sellingPriceBdt: data.sellingPriceBdt || 0,
        isSandbox: data.isSandbox || false,
        discountPercent: data.discountPercent || 0,
      };
    } else {
      throw new Error(data?.error || 'Failed to fetch renewal price breakdown');
    }
    
  } catch (error: any) {
    console.error('Dynadot renewal price breakdown error:', error);
    throw new Error(error.message || 'Failed to fetch renewal price breakdown');
  }
};

export interface CreateRenewalOrderResult {
  success: boolean;
  orderId: string;
  order: any;
}

export const createDomainRenewalOrder = async (params: {
  domain: string;
  renewalPeriod: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: string;
  transactionId?: string;
}): Promise<CreateRenewalOrderResult> => {
  try {
    const functions = functionsInstance;
    const createOrder = httpsCallable(functions, 'createDomainRenewalOrder');
    
    const result = await createOrder(params);
    
    const data = result.data as any;
    
    if (data?.success) {
      return {
        success: true,
        orderId: data.orderId,
        order: data.order,
      };
    } else {
      throw new Error(data?.error || 'Failed to create renewal order');
    }
    
  } catch (error: any) {
    console.error('Create renewal order error:', error);
    throw new Error(error.message || 'Failed to create renewal order');
  }
};
