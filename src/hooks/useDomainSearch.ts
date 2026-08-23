import { useState, useCallback } from 'react';
import { checkDomainAvailability, getDomainSuggestions, DomainAvailabilityResult } from '../services/hostingApi';
import { searchDomainDynadot } from '../services/dynadotApi';

const SEARCH_TIMEOUT_MS = 12000;

interface DomainSearchState {
  loading: boolean;
  error: string | null;
  results: DomainAvailabilityResult[];
  suggestions: string[];
}

export function useDomainSearch() {
  const [state, setState] = useState<DomainSearchState>({
    loading: false,
    error: null,
    results: [],
    suggestions: [],
  });

  const search = useCallback(async (domains: string[]) => {
    if (!domains.length) return;
    setState(prev => ({ ...prev, loading: true, error: null, results: [], suggestions: [] }));
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Domain search is temporarily unavailable. Please try again.')), SEARCH_TIMEOUT_MS);
      });
      const searchPromise = Promise.allSettled(domains.map(domain => searchDomainDynadot(domain)));
      const dynadotResults = await Promise.race([searchPromise, timeoutPromise]);
      
      const results: DomainAvailabilityResult[] = dynadotResults
        .map((res, index) => {
          if (res.status === 'fulfilled') {
            const domainPrice = res.value.priceBdt || res.value.price || 0;
            return {
              domain: res.value.domain,
              available: res.value.available,
              price: domainPrice,
              originalPrice: domainPrice,
            };
          } else {
            console.warn(`Failed to check availability for ${domains[index]}:`, res.reason);
            return {
              domain: domains[index],
              available: false,
              price: 0,
              originalPrice: 0,
            };
          }
        });

      setState(prev => ({ ...prev, loading: false, results }));
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, error: err?.message || 'Search failed' }));
    }
  }, []);

  const fetchSuggestions = useCallback(async (domain: string) => {
    if (!domain) return;
    try {
      const suggestions = await getDomainSuggestions(domain);
      setState(prev => ({ ...prev, suggestions }));
    } catch {
      // silently fail suggestions
    }
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, error: null, results: [], suggestions: [] });
  }, []);

  return { ...state, search, fetchSuggestions, reset };
}
