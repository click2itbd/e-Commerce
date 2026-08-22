import { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface HostingApiConfig {
  bundleDiscountPercent?: number;
  updatedAt?: string;
}

export function useHostingApiConfig() {
  const [config, setConfig] = useState<HostingApiConfig>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'hostingApiConfig'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as HostingApiConfig;
        setConfig({
          bundleDiscountPercent: data.bundleDiscountPercent || 0,
          updatedAt: data.updatedAt,
        });
      }
      setLoading(false);
    }, (error) => {
      console.warn('Cannot read hostingApiConfig:', error.message);
      setConfig({});
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { config, loading };
}
