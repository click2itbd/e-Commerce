export interface DomainAvailabilityResult {
  domain: string;
  available: boolean;
  price?: number;
  currency?: string;
  renewalPrice?: number;
  error?: string;
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

export interface IDomainProvider {
  checkAvailability(domains: string[]): Promise<DomainAvailabilityResult[]>;
  getSuggestions(domain: string): Promise<string[]>;
  registerDomain(request: DomainRegistrationRequest): Promise<DomainRegistrationResult>;
  renewDomain(domain: string, years: number): Promise<DomainRenewalResult>;
  getWhois(domain: string): Promise<WhoisResult>;
}
