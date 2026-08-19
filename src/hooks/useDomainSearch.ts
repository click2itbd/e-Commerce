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
      // For each domain, call Dynadot API
      const promises = domains.map(domain => searchDomainDynadot(domain));
      const dynadotResults = await Promise.all(promises);
      
      // Map to the format expected by the UI
      const results: DomainAvailabilityResult[] = dynadotResults.map(res => ({
        domain: res.domain,
        available: res.available,
        price: res.priceBdt, // Provide BDT price directly
        originalPrice: res.priceBdt,
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
