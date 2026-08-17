import { useState, useCallback } from 'react';
import { checkDomainAvailability, getDomainSuggestions, DomainAvailabilityResult } from '../services/hostingApi';

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
      const results = await checkDomainAvailability(domains);
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
