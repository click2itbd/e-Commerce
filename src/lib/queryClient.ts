import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes fresh cache
      gcTime: 1000 * 60 * 15, // 15 minutes garbage collection (formerly cacheTime)
      refetchOnWindowFocus: false, // Prevents aggressive network calls when switching browser tabs
      retry: 1, // Only retry once on failure to avoid flooding Firestore
    },
  },
});
