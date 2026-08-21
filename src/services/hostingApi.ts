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

export async function checkDomainAvailability(domains: string[]): Promise<DomainAvailabilityResult[]> {
  const res = await fetch('/api/domain/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domains }),
  });
  if (!res.ok) throw new Error('Network response was not ok');
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to check domain availability');
  }
  return data.data;
}

export async function getDomainSuggestions(domain: string): Promise<DomainSuggestionResult[]> {
  const res = await fetch('/api/domain/suggestions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain }),
  });
  if (!res.ok) throw new Error('Network response was not ok');
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to get domain suggestions');
  }
  return data.data;
}

export async function getDomainPricing(): Promise<DomainPricing[]> {
  const snap = await getDocs(query(collection(db, 'domainPricing'), orderBy('tld', 'asc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as DomainPricing));
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
  const res = await fetch('/api/hosting/usage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ providerAccountId }),
  });
  if (!res.ok) throw new Error('Network response was not ok');
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to get hosting usage');
  }
  return data.data;
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
  const functions = (await import('../firebase')).getFunctions((await import('../firebase')).auth.app);
  const validatePrice = (await import('firebase/functions')).httpsCallable(functions, 'validateHostingPrice');
  
  const result = await validatePrice({ planId, billingCycle, licenseCostUsd });
  
  const data = result.data as any;
  
  if (data?.success) {
    return {
      success: true,
      planId: data.planId,
      billingCycle: data.billingCycle,
      licenseCostUsd: data.licenseCostUsd,
      exchangeRate: data.exchangeRate,
      markupPercent: data.markupPercent,
      calculatedMonthly: data.calculatedMonthly,
      finalPrice: data.finalPrice,
      currency: data.currency,
    };
  } else {
    throw new Error(data?.error || 'Failed to validate hosting price');
  }
}
