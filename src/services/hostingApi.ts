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

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const cleanBase = API_BASE_URL.replace(/\/+$/, '');
  let cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (cleanBase.endsWith('/api') && cleanPath.startsWith('/api/')) {
    cleanPath = cleanPath.slice(4);
  }

  const url = `${cleanBase}${cleanPath}`;
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

export async function checkDomainAvailability(domains: string[]): Promise<DomainAvailabilityResult[]> {
  const response = await apiRequest<{ success: boolean; data: DomainAvailabilityResult[] }>('/api/domains/check', {
    method: 'POST',
    body: JSON.stringify({ domains }),
  });
  return response.data;
}

export async function getDomainSuggestions(domain: string): Promise<string[]> {
  const response = await apiRequest<{ success: boolean; data: string[] }>('/api/domains/suggestions', {
    method: 'POST',
    body: JSON.stringify({ domain }),
  });
  return response.data || [];
}

export async function getDomainPricing(): Promise<DomainPricing[]> {
  const response = await apiRequest<{ success: boolean; data: DomainPricing[] }>('/api/domains/pricing');
  return response.data;
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
