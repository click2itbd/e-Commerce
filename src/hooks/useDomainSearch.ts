import { useState, useCallback } from 'react';
import { checkDomainAvailability, getDomainSuggestions, DomainAvailabilityResult } from '../services/hostingApi';
import { searchDomainDynadot } from '../services/dynadotApi';

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
      const promises = domains.map(domain => searchDomainDynadot(domain));
      const settled = await Promise.allSettled(promises);
      
      const results: DomainAvailabilityResult[] = settled
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map(r => ({
          domain: r.value.domain,
          available: r.value.available,
          price: r.value.priceBdt,
          originalPrice: r.value.priceBdt,
        }));

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
