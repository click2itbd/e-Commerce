export interface DomainAvailabilityResult {
  domain: string;
  available: boolean;
  price?: number;
  currency?: string;
  renewalPrice?: number;
  error?: string;
  status?: string;
}

export interface DomainRegistrationRequest {
  domain: string;
  years: number;
  contactId?: string;
  nameServers?: string[];
  autoRenew?: boolean;
}

export interface DomainRegistrationResult {
  success: boolean;
  domain: string;
  registrationId?: string;
  expiresAt?: string;
  error?: string;
}

export interface DomainRenewalResult {
  success: boolean;
  domain: string;
  newExpiryDate?: string;
  transactionId?: string;
  error?: string;
}

export interface WhoisResult {
  domain: string;
  registrar?: string;
  createdAt?: string;
  updatedAt?: string;
  expiresAt?: string;
  status?: string[];
  nameServers?: string[];
  registrantName?: string;
  registrantEmail?: string;
  error?: string;
}

export interface TldPricingResult {
  tld: string;
  currency: string;
  registrationPrice: number;
  renewalPrice: number;
  transferPrice: number;
  restorePrice: number;
}

export interface BatchTldPricingItem {
  tld: string;
  customerPriceBdt: number;
  currency: string;
}

export interface DomainRenewalPriceResult {
  success: boolean;
  domain: string;
  tld: string;
  renewalPriceBdt: number;
  maxDuration: number;
}

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

export interface DomainTransferResult {
  success: boolean;
  domain: string;
  transferId?: string;
  status?: string;
  error?: string;
}

export interface IDomainProvider {
  checkAvailability(domains: string[]): Promise<DomainAvailabilityResult[]>;
  getSuggestions(domain: string): Promise<string[]>;
  registerDomain(request: DomainRegistrationRequest): Promise<DomainRegistrationResult>;
  renewDomain(domain: string, years: number): Promise<DomainRenewalResult>;
  getWhois(domain: string): Promise<WhoisResult>;
  getTldPricing?(tld: string): Promise<TldPricingResult>;
  getBatchTldPricing?(tlds: string[]): Promise<{ pricing: BatchTldPricingItem[] }>;
  getRenewalPrice?(domain: string): Promise<DomainRenewalPriceResult>;
  getRenewalPriceBreakdown?(domain: string): Promise<DomainRenewalPriceBreakdown>;
  transferDomain?(domain: string, authCode: string, years: number): Promise<DomainTransferResult>;
  setNameservers?(domain: string, ns0?: string, ns1?: string): Promise<{ success: boolean; error?: string }>;
  testConnection?(): Promise<{ success: boolean; code: string; message: string }>;
}
