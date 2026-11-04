import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, deleteField } from 'firebase/firestore';
import { db } from '../firebase';
import { SiteSettings } from '../types';
import { apiPost } from '../services/apiClient';

interface SettingsContextType {
  settings: SiteSettings;
  updateSettings: (newSettings: Partial<SiteSettings>) => Promise<void>;
  loading: boolean;
}

const defaultSettings: SiteSettings = {
  id: 'default',
  brandName: 'CLICK2IT BD',
  brandShortName: 'CLICK2IT',
  primaryColor: '#4F46E5',
  secondaryColor: '#112233',
  accentColor: '#8B5CF6',
  contactEmail: 'info@click2itbd.com',
  contactPhone: '+880 123456789',
  address: 'Dhaka, Bangladesh',
  footerText: '© 2026 CLICK2IT BD. All rights reserved.',
  popupEnabled: false,
  popupTitle: 'Welcome to CLICK2IT BD!',
  popupMessage: 'Check out our latest deals and new arrivals.',
  popupDelay: 3,
  apiSettings: {
    domainApiType: 'manual',
    domainApiKey: '',
    cloudLinuxApiType: 'manual',
    cloudLinuxApiKey: '',
    vpsApiType: 'manual',
    vpsApiKey: ''
  },
  updatedAt: new Date().toISOString(),
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'site');
    
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as SiteSettings;
        if (data.brandName === 'STAR TECH' || data.brandName === 'Star Tech') {
          const updated: Record<string, any> = {
            ...data,
            brandName: 'CLICK2IT BD',
            primaryColor: '#4F46E5',
            accentColor: '#8B5CF6',
            brandShortName: 'CLICK2IT'
          };
          delete updated.mailPassword;
          delete updated.steadfastSecretKey;
          delete updated.externalStoreKey;
          setDoc(settingsRef, updated);
          setSettings(updated as SiteSettings);
        } else {
          setSettings(data);
        }
      } else {
        // Initialize with defaults if not exists
        setDoc(settingsRef, defaultSettings);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    const settingsRef = doc(db, 'settings', 'site');
    const merged: Record<string, any> = {
      ...settings,
      ...newSettings,
      updatedAt: new Date().toISOString(),
    };

    // Route secret credentials exclusively to server-side settings/api_keys
    const secretPayload: Record<string, any> = {};
    const secretKeys = ['mailPassword', 'steadfastApiKey', 'steadfastSecretKey', 'externalStoreKey'];
    for (const key of secretKeys) {
      const val = (newSettings as any)?.[key] ?? merged[key];
      if (typeof val === 'string' && val.trim().length > 0 && !val.startsWith('••••') && !val.startsWith('****')) {
        secretPayload[key] = val.trim();
      }
      delete merged[key];
    }

    if (Object.keys(secretPayload).length > 0) {
      await apiPost('/api/admin/api-config', secretPayload);
    }

    // Ensure secret fields are never persisted or left behind in public settings/site
    await setDoc(
      settingsRef,
      {
        ...merged,
        mailPassword: deleteField(),
        steadfastApiKey: deleteField(),
        steadfastSecretKey: deleteField(),
        externalStoreKey: deleteField(),
      },
      { merge: true }
    );
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};
