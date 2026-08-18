/**
 * domainApi.ts
 * 
 * This is a placeholder API service for domain operations.
 * When you are ready to integrate with a real provider like Namecheap or ResellerClub,
 * replace the simulated API calls here with real fetch calls to your backend or their API.
 */

export interface DomainAvailabilityResponse {
  domain: string;
  available: boolean;
  price?: number;
  currency?: string;
  isPremium?: boolean;
}

export const checkDomainAvailability = async (domain: string): Promise<DomainAvailabilityResponse> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Basic validation
  if (!domain || domain.length < 3) {
    throw new Error('Please enter a valid domain name');
  }

  // Auto-append .com if no extension is provided
  let searchDomain = domain.toLowerCase().trim();
  if (!searchDomain.includes('.')) {
    searchDomain += '.com';
  }

  // Simulate API logic:
  // Let's pretend any domain ending in "taken.com" is taken, others are randomly available 70% of the time.
  const isTaken = searchDomain.includes('taken') || Math.random() > 0.7;

  // Determine standard pricing based on TLD
  let price = 1000;
  if (searchDomain.endsWith('.com')) price = 1299;
  else if (searchDomain.endsWith('.net')) price = 1499;
  else if (searchDomain.endsWith('.org')) price = 1599;
  else if (searchDomain.endsWith('.io')) price = 4500;
  else if (searchDomain.endsWith('.bd')) price = 2500;

  return {
    domain: searchDomain,
    available: !isTaken,
    price,
    currency: 'BDT'
  };
};

export const registerDomain = async (domain: string, years: number, customerInfo: any) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Here you would call Namecheap / ResellerClub API to actually register the domain
  console.log(`[API MOCK] Registering domain ${domain} for ${years} years...`, customerInfo);
  
  return {
    success: true,
    domain,
    status: 'registered',
    message: 'Domain registered successfully (MOCK)'
  };
};
