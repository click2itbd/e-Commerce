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

const API_BASE = '/api';

export async function checkDomainAvailability(domains: string[]): Promise<DomainAvailabilityResult[]> {
  const res = await fetch(`${API_BASE}/domain/check`, {
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

export async function getDomainSuggestions(domain: string): Promise<string[]> {
  const res = await fetch(`${API_BASE}/domain/suggestions`, {
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
  const res = await fetch(`${API_BASE}/domain/pricing`);
  if (!res.ok) throw new Error('Network response was not ok');
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to get domain pricing');
  }
  return data.data;
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
  const res = await fetch(`${API_BASE}/hosting/usage`, {
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
