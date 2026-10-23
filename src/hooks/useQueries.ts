import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, NavigationMenu, SiteSettings } from '../types';

/**
 * Hook to fetch & cache active products with TanStack Query.
 * Drastically reduces Firestore reads by serving from memory when fresh.
 */
export function useProductsQuery(maxLimit: number = 200) {
  return useQuery({
    queryKey: ['products', maxLimit],
    queryFn: async () => {
      const q = query(
        collection(db, 'products'),
        orderBy('createdAt', 'desc'),
        limit(maxLimit)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[];
    },
    staleTime: 1000 * 60 * 3, // 3 minutes
  });
}

/**
 * Hook to fetch & cache navigation menus / categories.
 */
export function useMenusQuery() {
  return useQuery({
    queryKey: ['menus'],
    queryFn: async () => {
      const q = query(collection(db, 'menus'), orderBy('order', 'asc'), limit(100));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() })) as NavigationMenu[];
    },
    staleTime: 1000 * 60 * 10, // Menus change rarely; cache for 10 minutes
  });
}

/**
 * Hook to fetch & cache site settings.
 */
export function useSiteSettingsQuery() {
  return useQuery({
    queryKey: ['site_settings'],
    queryFn: async () => {
      const snap = await getDoc(doc(db, 'settings', 'general'));
      if (snap.exists()) {
        return snap.data() as SiteSettings;
      }
      return null;
    },
    staleTime: 1000 * 60 * 10,
  });
}
