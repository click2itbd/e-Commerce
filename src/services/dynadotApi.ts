/**
 * Dynadot API Integration Service
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../firebase';

export interface DomainAvailabilityResponse {
  domain: string;
  available: boolean;
  priceUsd: number;
  priceBdt: number;
  status: string;
}

export const searchDomainDynadot = async (domain: string): Promise<DomainAvailabilityResponse> => {
  try {
    const functions = getFunctions(auth.app);
    const dynadotSearchProxy = httpsCallable(functions, 'dynadotSearchProxy');
    
    const payload = { command: 'search', domain };
    console.log('[Dynadot] Calling searchDomainDynadot with payload:', payload);
    
    const result = await dynadotSearchProxy(payload);

    const data: any = result.data;
    
    if (data?.Response?.Error || data?.SearchResponse?.Status === "invalid_key" || data?.SearchResponse?.Error) {
      console.error(`Dynadot Error: Blocked by API or Invalid Key`);
      throw new Error('Domain search failed, please try again.');
    }
    
    const searchResult = data?.SearchResponse?.SearchResults?.[0];
    if (!searchResult) {
      throw new Error('Domain search failed, please try again.');
    }
    
    const isAvailable = searchResult.Available?.toLowerCase() === 'yes';
    const priceUsd = searchResult.Price ? parseFloat(searchResult.Price) : 0;
    
    return {
      domain,
      available: isAvailable,
      priceUsd,
      priceBdt: searchResult.priceBdt || 0,
      status: isAvailable ? 'available' : 'taken',
    };

  } catch (error) {
    console.error('Dynadot search error:', error);
    throw new Error('Domain search failed, please try again.');
  }
}
