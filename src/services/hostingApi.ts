import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export interface DomainAvailabilityResult {
  domain: string;
  available: boolean;
  price?: number;
  currency?: string;
  renewalPrice?: number;
  error?: string;
}

export interface DomainSuggestionResult {
  suggestions: string[];
}

export interface DomainPricing {
  tld: string;
  registerPrice: number;
  renewPrice: number;
  transferPrice: number;
  currency: string;
  isActive: boolean;
}

const API_BASE_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL || '');

import { auth } from '../firebase';

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const cleanBase = API_BASE_URL.replace(/\/+$/, '');
  let cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (cleanBase.endsWith('/api') && cleanPath.startsWith('/api/')) {
    cleanPath = cleanPath.slice(4);
  }

  const url = `${cleanBase}${cleanPath}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (!headers['Authorization'] && typeof window !== 'undefined' && auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } catch {
      // ignore
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

const DEFAULT_DOMAIN_PRICING: DomainPricing[] = [
  { tld: '.com', registerPrice: 1529, renewPrice: 1655, transferPrice: 1529, currency: 'BDT', isActive: true },
  { tld: '.net', registerPrice: 1808, renewPrice: 2170, transferPrice: 1808, currency: 'BDT', isActive: true },
  { tld: '.org', registerPrice: 1669, renewPrice: 1808, transferPrice: 1669, currency: 'BDT', isActive: true },
  { tld: '.info', registerPrice: 689, renewPrice: 2759, transferPrice: 2759, currency: 'BDT', isActive: true },
  { tld: '.biz', registerPrice: 828, renewPrice: 2621, transferPrice: 2621, currency: 'BDT', isActive: true },
  { tld: '.co', registerPrice: 3863, renewPrice: 3863, transferPrice: 3863, currency: 'BDT', isActive: true },
  { tld: '.xyz', registerPrice: 419, renewPrice: 1794, transferPrice: 1794, currency: 'BDT', isActive: true },
  { tld: '.online', registerPrice: 551, renewPrice: 4829, transferPrice: 4829, currency: 'BDT', isActive: true },
  { tld: '.store', registerPrice: 551, renewPrice: 4139, transferPrice: 4139, currency: 'BDT', isActive: true },
  { tld: '.me', registerPrice: 2069, renewPrice: 2621, transferPrice: 2621, currency: 'BDT', isActive: true },
  { tld: '.io', registerPrice: 5519, renewPrice: 6899, transferPrice: 6899, currency: 'BDT', isActive: true },
  { tld: '.dev', registerPrice: 2069, renewPrice: 2346, transferPrice: 2346, currency: 'BDT', isActive: true },
  { tld: '.tech', registerPrice: 689, renewPrice: 3449, transferPrice: 3449, currency: 'BDT', isActive: true },
];

export async function checkDomainAvailability(domains: string[]): Promise<DomainAvailabilityResult[]> {
  const response = await apiRequest<{ success: boolean; data: DomainAvailabilityResult[]; error?: string }>('/api/domains/check', {
    method: 'POST',
    body: JSON.stringify({ domains }),
  });
  if (response && response.success && Array.isArray(response.data)) {
    return response.data;
  }
  throw new Error(response?.error || 'Domain availability check failed');
}

export async function getDomainSuggestions(domain: string): Promise<string[]> {
  const response = await apiRequest<{ success: boolean; data: string[] }>('/api/domains/suggestions', {
    method: 'POST',
    body: JSON.stringify({ domain }),
  });
  return response.data || [];
}

export async function getDomainPricing(): Promise<DomainPricing[]> {
  try {
    const response = await apiRequest<{ success: boolean; data: DomainPricing[] }>('/api/domains/pricing');
    if (response.success && Array.isArray(response.data) && response.data.length > 0) {
      return response.data;
    }
  } catch {
    // fallback below
  }
  return DEFAULT_DOMAIN_PRICING;
}

export interface HostingUsageStats {
  providerAccountId: string;
  diskUsageMB: number;
  diskLimitMB: number;
  bandwidthUsageMB: number;
  bandwidthLimitMB: number;
  cpuUsagePercent?: number;
  ramUsageMB?: number;
  lastUpdated: string;
}

export async function getHostingUsage(providerAccountId: string): Promise<HostingUsageStats> {
  const res = await apiRequest<{ success: boolean; data: HostingUsageStats }>('/api/hosting/usage', {
    method: 'POST',
    body: JSON.stringify({ providerAccountId }),
  });
  if (!res.success) {
    throw new Error('Failed to get hosting usage');
  }
  return res.data;
}

export interface HostingPriceValidationResult {
  success: boolean;
  planId: string;
  billingCycle: string;
  licenseCostUsd: number;
  exchangeRate: number;
  markupPercent: number;
  calculatedMonthly: number;
  finalPrice: number;
  currency: string;
}

export async function validateHostingPrice(planId: string, billingCycle: string, licenseCostUsd: number): Promise<HostingPriceValidationResult> {
  const response = await apiRequest<{ success: boolean; data: HostingPriceValidationResult }>('/api/hosting/validate-price', {
    method: 'POST',
    body: JSON.stringify({ planId, billingCycle, licenseCostUsd }),
  });
  return response.data;
}

export async function testHostingConnection(): Promise<{ success: boolean; code: string; message: string }> {
  const response = await apiRequest<{ success: boolean; code: string; message: string }>('/api/hosting/test-connection', {
    method: 'POST',
  });
  return response;
}

export async function provisionHostingAccount(params: {
  domain: string;
  contactEmail: string;
  billingCycle: string;
  planCode?: string;
  idempotencyKey?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  const response = await apiRequest<{ success: boolean; data?: any; error?: string }>('/api/hosting/provision', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return response;
}

export async function suspendHostingAccount(providerAccountId: string): Promise<{ success: boolean; error?: string }> {
  const response = await apiRequest<{ success: boolean; error?: string }>('/api/hosting/suspend', {
    method: 'POST',
    body: JSON.stringify({ providerAccountId }),
  });
  return response;
}

export async function unsuspendHostingAccount(providerAccountId: string): Promise<{ success: boolean; error?: string }> {
  const response = await apiRequest<{ success: boolean; error?: string }>('/api/hosting/unsuspend', {
    method: 'POST',
    body: JSON.stringify({ providerAccountId }),
  });
  return response;
}

export async function terminateHostingAccount(providerAccountId: string): Promise<{ success: boolean; error?: string }> {
  const response = await apiRequest<{ success: boolean; error?: string }>('/api/hosting/terminate', {
    method: 'POST',
    body: JSON.stringify({ providerAccountId }),
  });
  return response;
}

export async function changeHostingPlan(providerAccountId: string, newPlanCode: string): Promise<{ success: boolean; error?: string }> {
  const response = await apiRequest<{ success: boolean; error?: string }>('/api/hosting/change-package', {
    method: 'POST',
    body: JSON.stringify({ providerAccountId, newPlanCode }),
  });
  return response;
}
