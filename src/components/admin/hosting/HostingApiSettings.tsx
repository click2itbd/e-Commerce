import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../../firebase';
import { toast } from 'react-hot-toast';
import { Plug, Settings2, Server, Eye, EyeOff, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

interface HostingApiConfig {
  hostingApiType?: string;
  hostingApiKey?: string;
  hostingApiUrl?: string;
  hostingApiUsername?: string;
  bundleDiscountPercent?: number;
  clnLogin?: string;
  clnSecretKey?: string;
  isSandboxMode?: boolean;
  updatedAt?: string;
}

export const HostingApiSettings: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<'hosting' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const [config, setConfig] = useState<HostingApiConfig>({
    hostingApiType: 'dummy',
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [showClnSecret, setShowClnSecret] = useState(false);
  const [hasExistingToken, setHasExistingToken] = useState(false);
  const [hasExistingClnSecret, setHasExistingClnSecret] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'hostingApiConfig'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as HostingApiConfig;
        setConfig(data);
        setHasExistingToken(!!data.hostingApiKey);
        setHasExistingClnSecret(!!data.clnSecretKey);
      }
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error('Failed to load hosting API config:', err);
      setError('Failed to load configuration. Please check your permissions and try again.');
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const existingSnap = await getDoc(doc(db, 'settings', 'hostingApiConfig'));
      const existingData = existingSnap.exists() ? existingSnap.data() as HostingApiConfig : {};

      const payload: HostingApiConfig = {
        hostingApiType: config.hostingApiType || 'dummy',
        hostingApiUrl: config.hostingApiUrl || '',
        hostingApiUsername: config.hostingApiUsername?.trim() || 'root',
        bundleDiscountPercent: config.bundleDiscountPercent || 0,
        clnLogin: config.clnLogin || '',
        isSandboxMode: config.isSandboxMode || false,
        updatedAt: new Date().toISOString(),
      };

      if (config.hostingApiKey && config.hostingApiKey.trim() !== '') {
        payload.hostingApiKey = config.hostingApiKey.trim();
      } else if (existingData.hostingApiKey) {
        payload.hostingApiKey = existingData.hostingApiKey;
      }

      if (config.clnSecretKey && config.clnSecretKey.trim() !== '') {
        payload.clnSecretKey = config.clnSecretKey.trim();
      } else if (existingData.clnSecretKey) {
        payload.clnSecretKey = existingData.clnSecretKey;
      }

      await setDoc(doc(db, 'settings', 'hostingApiConfig'), payload);
      toast.success('API settings saved successfully');
      setHasExistingToken(!!payload.hostingApiKey);
      setHasExistingClnSecret(!!payload.clnSecretKey);
      setShowApiKey(false);
      setShowClnSecret(false);
    } catch (error: any) {
      console.error('Error saving settings:', error);
      const message = error?.message || 'Failed to save settings';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (type: 'domain' | 'hosting') => {
    setTesting(type);
    setError(null);
    setTestResult(null);

    if (!user) {
      setTestResult({ success: false, message: 'You must be logged in to test connection.' });
      setTesting(null);
      return;
    }

    try {
      const testApiConnection = httpsCallable(functions, 'testApiConnection');
      
      const { data } = await testApiConnection({ type }) as any;

      if (data.success) {
        setTestResult({ success: true, message: data.message || 'Connection successful' });
        toast.success(`Connection successful: ${data.message || 'Provider is reachable'}`);
      } else {
        setTestResult({ success: false, message: data.message || 'Connection failed' });
        toast.error(`Connection failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      const message = error?.message || 'Failed to test connection';
      setTestResult({ success: false, message });
      toast.error(message);
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
          <p className="text-sm text-gray-500 mt-1">Configure hosting provider connections</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

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
              <option value="cpanel">cPanel / WHM</option>
              <option value="plesk" disabled>Plesk (coming soon)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">WHM Username</label>
            <input
              type="text"
              value={config.hostingApiUsername || ''}
              onChange={(e) => setConfig({ ...config, hostingApiUsername: e.target.value })}
              placeholder="root (or your WHM reseller username)"
              className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF] focus:border-[#7B61FF]"
            />
            <p className="text-xs text-gray-400 mt-1">WHM API auth format: <code className="bg-gray-100 px-1 rounded">username:token</code>. Defaults to <code className="bg-gray-100 px-1 rounded">root</code> if blank.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">WHM API Token</label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={config.hostingApiKey || ''}
                onChange={(e) => setConfig({ ...config, hostingApiKey: e.target.value })}
                placeholder={hasExistingToken ? '••••••••••••••••' : 'Enter hosting provider API key'}
                className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF] focus:border-[#7B61FF] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {hasExistingToken && !showApiKey && (
              <p className="text-xs text-gray-400 mt-1">Existing token is masked. Click the eye icon to reveal or replace it.</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">API URL / Endpoint</label>
            <input
              type="text"
              value={config.hostingApiUrl || ''}
              onChange={(e) => setConfig({ ...config, hostingApiUrl: e.target.value })}
              placeholder="https://your-whm-server.com:2087"
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

          <div className="border-t border-gray-100 pt-4 mt-4">
            <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase">CloudLinux Integration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">CloudLinux Partner Login</label>
                <input
                  type="text"
                  value={config.clnLogin || ''}
                  onChange={(e) => setConfig({ ...config, clnLogin: e.target.value })}
                  placeholder="Enter CloudLinux partner login"
                  className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF] focus:border-[#7B61FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">CloudLinux Secret Key</label>
                <div className="relative">
                  <input
                    type={showClnSecret ? 'text' : 'password'}
                    value={config.clnSecretKey || ''}
                    onChange={(e) => setConfig({ ...config, clnSecretKey: e.target.value })}
                    placeholder={hasExistingClnSecret ? '••••••••••••••••' : 'Enter CloudLinux secret key'}
                    className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF] focus:border-[#7B61FF] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowClnSecret(!showClnSecret)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showClnSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {hasExistingClnSecret && !showClnSecret && (
                  <p className="text-xs text-gray-400 mt-1">Existing secret is masked. Click the eye icon to reveal or replace it.</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <input
                type="checkbox"
                id="isSandboxMode"
                checked={config.isSandboxMode || false}
                onChange={(e) => setConfig({ ...config, isSandboxMode: e.target.checked })}
                className="h-4 w-4 text-[#7B61FF] focus:ring-[#7B61FF] border-gray-300 rounded"
              />
              <label htmlFor="isSandboxMode" className="text-sm text-gray-700">
                Sandbox Mode (disable for production)
              </label>
            </div>
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
            {testResult && (
              <div className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md ${
                testResult.success
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {testResult.success ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                {testResult.message}
              </div>
            )}
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
