/**
 * Domain API Service
 * Calls backend Express API for domain operations.
 * Never exposes Dynadot API key, wholesale prices, exchange rate, or markup to frontend.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export interface DomainAvailabilityResponse {
  domain: string;
  available: boolean;
  price?: number;
  priceBdt?: number;
  currency?: string;
  renewalPrice?: number;
  error?: string;
  status?: string;
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
    const response = await apiRequest<{ success: boolean; data: TldPricingResponse }>('/api/domain/tld-pricing', {
      method: 'POST',
      body: JSON.stringify({ tld }),
    });
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error('Failed to fetch TLD pricing');
    }
  } catch (error: any) {
    console.error('Domain TLD Pricing Error:', error);
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
    const response = await apiRequest<{ success: boolean; data: BatchTldPricingResponse }>('/api/domain/tld-pricing-batch', {
      method: 'POST',
      body: JSON.stringify({ tlds }),
    });
    
    if (response.success && response.data?.pricing?.length > 0) {
      return response.data;
    } else {
      throw new Error(response.data?.error || 'Failed to fetch batch TLD pricing');
    }
  } catch (error: any) {
    console.error('Domain batch TLD pricing error:', error?.code || error?.message || error);
    throw new Error('Domain pricing is temporarily unavailable. Please try again shortly.');
  }
};

export const searchDomainDynadot = async (domain: string): Promise<DomainAvailabilityResponse> => {
  try {
    const response = await apiRequest<{ success: boolean; data: DomainAvailabilityResponse[] }>('/api/domain/check', {
      method: 'POST',
      body: JSON.stringify({ domains: [domain] }),
    });
    
    const data = response.data?.[0];
    if (!data) {
      throw new Error('Domain search failed, please try again.');
    }
    
    return data;
  } catch (error) {
    console.error('Domain search error:', error);
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
    const response = await apiRequest<{ success: boolean; data: DomainRenewalPriceResponse }>('/api/domain/renewal-price', {
      method: 'POST',
      body: JSON.stringify({ domain }),
    });
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.data?.error || 'Failed to fetch renewal price');
    }
  } catch (error: any) {
    console.error('Domain renewal price error:', error);
    throw new Error(error.message || 'Failed to fetch renewal price');
  }
};

export interface DomainRenewalPriceBreakdown {
  success: boolean;
  domain: string;
  tld: string;
  sellingPriceBdt: number;
  isSandbox: boolean;
}

export const getDomainRenewalPriceBreakdown = async (domain: string): Promise<DomainRenewalPriceBreakdown> => {
  try {
    const response = await apiRequest<{ success: boolean; data: DomainRenewalPriceBreakdown }>('/api/domain/renewal-price-breakdown', {
      method: 'POST',
      body: JSON.stringify({ domain }),
    });
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.data?.error || 'Failed to fetch renewal price breakdown');
    }
  } catch (error: any) {
    console.error('Domain renewal price breakdown error:', error);
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
  idempotencyKey?: string;
}): Promise<CreateRenewalOrderResult> => {
  try {
    const headers: Record<string, string> = {};
    if (params.idempotencyKey) {
      headers['X-Idempotency-Key'] = params.idempotencyKey;
    }

    const response = await apiRequest<{ success: boolean; data: CreateRenewalOrderResult }>('/api/domain/renewal-order', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.data?.error || 'Failed to create renewal order');
    }
  } catch (error: any) {
    console.error('Create renewal order error:', error);
    throw new Error(error.message || 'Failed to create renewal order');
  }
};

export interface CreateTransferOrderResult {
  success: boolean;
  orderId: string;
  order: any;
}

export const createDomainTransferOrder = async (params: {
  domain: string;
  authCode: string;
  years: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: string;
  transactionId?: string;
  idempotencyKey?: string;
}): Promise<CreateTransferOrderResult> => {
  try {
    const headers: Record<string, string> = {};
    if (params.idempotencyKey) {
      headers['X-Idempotency-Key'] = params.idempotencyKey;
    }

    const response = await apiRequest<{ success: boolean; data: CreateTransferOrderResult }>('/api/domain/transfer', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.data?.error || 'Failed to create transfer order');
    }
  } catch (error: any) {
    console.error('Create transfer order error:', error);
    throw new Error(error.message || 'Failed to create transfer order');
  }
};

export interface TransferEligibilityResult {
  eligible: boolean;
  reason: string;
  domain: string;
}

export const checkTransferEligibility = async (domain: string): Promise<TransferEligibilityResult> => {
  try {
    const response = await apiRequest<{ success: boolean; data: TransferEligibilityResult }>('/api/domain/transfer/check-eligibility', {
      method: 'POST',
      body: JSON.stringify({ domain }),
    });
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.data?.error || 'Failed to check transfer eligibility');
    }
  } catch (error: any) {
    console.error('Transfer eligibility check error:', error);
    throw new Error(error.message || 'Failed to check transfer eligibility');
  }
};
