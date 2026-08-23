import { useState, useEffect } from 'react';

interface HostingApiConfig {
  bundleDiscountPercent?: number;
  updatedAt?: string;
}

export function useHostingApiConfig() {
  const [config, setConfig] = useState<HostingApiConfig>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}//api/public/hosting-config`);
        const json = await response.json();
        if (json.success && json.data) {
          setConfig({
            bundleDiscountPercent: json.data.bundleDiscountPercent || 0,
            updatedAt: json.data.updatedAt,
          });
        }
      } catch (error) {
        console.warn('Cannot load hostingApiConfig:', error);
        setConfig({});
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return { config, loading };
}
