import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { toast } from 'react-hot-toast';
import { Plug, Settings2, Server } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

interface HostingApiConfig {
  domainApiType?: string;
  domainApiKey?: string;
  hostingApiType?: string;
  hostingApiKey?: string;
  hostingApiUrl?: string;
  updatedAt?: string;
}

export const HostingApiSettings: React.FC = () => {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<'domain' | 'hosting' | null>(null);
  const [config, setConfig] = useState<HostingApiConfig>({
    domainApiType: 'dummy',
    hostingApiType: 'dummy',
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'hostingApiConfig'), (snap) => {
      if (snap.exists()) {
        setConfig(snap.data() as HostingApiConfig);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'hostingApiConfig'), {
        ...config,
        updatedAt: new Date().toISOString(),
      });
      toast.success('API settings saved successfully');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (type: 'domain' | 'hosting') => {
    setTesting(type);
    try {
      const endpoint = type === 'domain' ? '/api/domain/test-connection' : '/api/hosting/test-connection';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`Connection successful: ${data.message || 'Provider is reachable'}`);
      } else {
        toast.error(`Connection failed: ${data.error || data.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to test connection');
    } finally {
      setTesting(null);
    }
  };

  const getProviderBadge = (type: string) => {
    if (!type || type === 'dummy') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          Dummy Mode (Safe Testing)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        Live — {type}
      </span>
    );
  };

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-500">You do not have permission to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-[#EF4444] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure domain and hosting provider connections</p>
        </div>
      </div>

      {/* Domain Provider Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Plug size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Domain Provider</h2>
              <p className="text-xs text-gray-500">Configure domain registration and WHOIS provider</p>
            </div>
          </div>
          {getProviderBadge(config.domainApiType)}
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Provider</label>
            <select
              value={config.domainApiType || 'dummy'}
              onChange={(e) => setConfig({ ...config, domainApiType: e.target.value })}
              className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF] focus:border-[#7B61FF]"
            >
              <option value="dummy">Dummy (Testing)</option>
              <option value="resellerclub" disabled>ResellerClub (coming soon)</option>
              <option value="namecheap" disabled>Namecheap (coming soon)</option>
              <option value="godaddy" disabled>GoDaddy (coming soon)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">API Key</label>
            <input
              type="password"
              value={config.domainApiKey || ''}
              onChange={(e) => setConfig({ ...config, domainApiKey: e.target.value })}
              placeholder="Enter domain provider API key"
              className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF] focus:border-[#7B61FF]"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => handleTestConnection('domain')}
              disabled={testing === 'domain'}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {testing === 'domain' ? (
                <>
                  <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Plug size={14} />
                  Test Connection
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Hosting Provider Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Server size={20} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Hosting Provider</h2>
              <p className="text-xs text-gray-500">Configure hosting account provisioning provider</p>
            </div>
          </div>
          {getProviderBadge(config.hostingApiType)}
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Provider</label>
            <select
              value={config.hostingApiType || 'dummy'}
              onChange={(e) => setConfig({ ...config, hostingApiType: e.target.value })}
              className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF] focus:border-[#7B61FF]"
            >
              <option value="dummy">Dummy (Testing)</option>
              <option value="resellerclub" disabled>ResellerClub Hosting (coming soon)</option>
              <option value="cpanel" disabled>cPanel/WHM (coming soon)</option>
              <option value="plesk" disabled>Plesk (coming soon)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">API Key</label>
            <input
              type="password"
              value={config.hostingApiKey || ''}
              onChange={(e) => setConfig({ ...config, hostingApiKey: e.target.value })}
              placeholder="Enter hosting provider API key"
              className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF] focus:border-[#7B61FF]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">API URL / Endpoint</label>
            <input
              type="text"
              value={config.hostingApiUrl || ''}
              onChange={(e) => setConfig({ ...config, hostingApiUrl: e.target.value })}
              placeholder="https://api.provider.com/v1"
              className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF] focus:border-[#7B61FF]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Bundle Discount (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={config.bundleDiscountPercent || 0}
              onChange={(e) => setConfig({ ...config, bundleDiscountPercent: Number(e.target.value) })}
              placeholder="e.g. 10"
              className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF] focus:border-[#7B61FF]"
            />
            <p className="text-xs text-gray-400 mt-1">Discount % when a domain + hosting are purchased together</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => handleTestConnection('hosting')}
              disabled={testing === 'hosting'}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {testing === 'hosting' ? (
                <>
                  <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Plug size={14} />
                  Test Connection
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-[#7B61FF] text-white rounded-md font-medium hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Settings2 size={16} />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
};
