import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CreditCard,
  ShieldCheck,
  Loader2,
  Eye,
  EyeOff,
  PlugZap,
  Save,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { apiGet, apiPost } from '../../../../services/apiClient';

interface EpsPublicConfig {
  epsEnabled: boolean;
  epsMode: 'sandbox' | 'live';
  epsMerchantId: string;
  epsStoreId: string;
  epsSandboxBaseUrl: string;
  epsLiveBaseUrl: string;
  epsUsernameSet: boolean;
  epsPasswordSet: boolean;
  epsHashKeySet: boolean;
}

const inputCls =
  'w-full text-sm border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 transition-all font-mono py-2.5 px-3 border';
const labelCls = 'block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider';

export const EpsPaymentSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [saved, setSaved] = useState<EpsPublicConfig | null>(null);

  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<'sandbox' | 'live'>('sandbox');
  const [merchantId, setMerchantId] = useState('');
  const [storeId, setStoreId] = useState('');
  const [sandboxUrl, setSandboxUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  // Secrets are write-only: blank = keep existing value on the server.
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [hashKey, setHashKey] = useState('');

  // Inline test result box
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    timestamp: string;
  } | null>(null);

  const applyConfig = (c: EpsPublicConfig) => {
    setSaved(c);
    setEnabled(c.epsEnabled);
    setMode(c.epsMode);
    setMerchantId(c.epsMerchantId || '');
    setStoreId(c.epsStoreId || '');
    setSandboxUrl(c.epsSandboxBaseUrl || 'https://sandboxpgapi.eps.com.bd/v1');
    setLiveUrl(c.epsLiveBaseUrl || 'https://pgapi.eps.com.bd/v1');
    setUsername('');
    setPassword('');
    setHashKey('');
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const json = await apiGet<{ success: boolean; data?: EpsPublicConfig }>(
          '/api/admin/payment/eps'
        );
        if (!cancelled && json.success && json.data) applyConfig(json.data);
      } catch (err: any) {
        if (!cancelled) toast.error(err?.message || 'Failed to load EPS settings');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setTestResult(null);
    try {
      const json = await apiPost<{
        success: boolean;
        message?: string;
        data?: EpsPublicConfig;
      }>('/api/admin/payment/eps', {
        epsEnabled: enabled,
        epsMode: mode,
        epsMerchantId: merchantId,
        epsStoreId: storeId,
        epsSandboxBaseUrl: sandboxUrl,
        epsLiveBaseUrl: liveUrl,
        epsUsername: username,
        epsPassword: password,
        epsHashKey: hashKey,
      });
      if (json.data) applyConfig(json.data);
      toast.success(json.message || 'EPS settings saved successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save EPS settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const id = toast.loading('Testing EPS connection...');
    try {
      // Send both saved & currently typed values so the user can test before or after saving
      const json = await apiPost<{ success: boolean; message?: string }>(
        '/api/admin/payment/eps/test-connection',
        {
          epsMode: mode,
          epsSandboxBaseUrl: sandboxUrl,
          epsLiveBaseUrl: liveUrl,
          epsUsername: username,
          epsPassword: password,
          epsHashKey: hashKey,
        }
      );

      const msg = json.message || (json.success ? 'Connection OK' : 'Connection failed');
      setTestResult({
        success: Boolean(json.success),
        message: msg,
        timestamp: new Date().toLocaleTimeString(),
      });

      if (json.success) {
        toast.success(msg, { id });
      } else {
        toast.error(msg, { id });
      }
    } catch (err: any) {
      const errText = err?.message || 'Connection test failed';
      setTestResult({
        success: false,
        message: errText,
        timestamp: new Date().toLocaleTimeString(),
      });
      toast.error(errText, { id });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 flex justify-center">
        <Loader2 className="animate-spin text-indigo-600" />
      </div>
    );
  }

  const secretPlaceholder = (isSet: boolean) =>
    isSet ? '•••••••• (saved - leave blank to keep)' : 'Enter value';
  const secretType = showSecrets ? 'text' : 'password';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-700 p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <CreditCard size={24} className="text-indigo-100" />
          <h3 className="text-xl font-bold">Payment Gateway - EPS (Easy Payment System)</h3>
        </div>
        <p className="text-indigo-100 text-sm max-w-2xl">
          Configure your EPS merchant API credentials. Credentials are kept securely in
          Firestore and are never exposed to the public browser.
        </p>
      </div>

      <div className="p-6 space-y-6 bg-gray-50/50">
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
              />
              <span className="text-sm font-bold text-gray-800">
                Enable EPS Gateway on Checkout
              </span>
            </label>

            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-bold">
              <button
                type="button"
                onClick={() => setMode('sandbox')}
                className={`px-4 py-2 cursor-pointer transition-colors ${
                  mode === 'sandbox'
                    ? 'bg-amber-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Sandbox (Test)
              </button>
              <button
                type="button"
                onClick={() => setMode('live')}
                className={`px-4 py-2 cursor-pointer transition-colors ${
                  mode === 'live'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Production (Live)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Merchant ID</label>
              <input
                className={inputCls}
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                placeholder="e.g. 094980ee-..."
              />
            </div>
            <div>
              <label className={labelCls}>Store ID</label>
              <input
                className={inputCls}
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                placeholder="e.g. 35b518f6-..."
              />
            </div>
            <div>
              <label className={labelCls}>API Username (userName)</label>
              <input
                className={inputCls}
                autoComplete="off"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={secretPlaceholder(Boolean(saved?.epsUsernameSet))}
              />
            </div>
            <div>
              <label className={labelCls}>API Password</label>
              <input
                className={inputCls}
                type={secretType}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={secretPlaceholder(Boolean(saved?.epsPasswordSet))}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Hash Key (HMAC-SHA512 Secret)</label>
              <input
                className={inputCls}
                type={secretType}
                autoComplete="off"
                value={hashKey}
                onChange={(e) => setHashKey(e.target.value)}
                placeholder={secretPlaceholder(Boolean(saved?.epsHashKeySet))}
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Used to compute the Base64 HMAC-SHA512 `x-hash` header signature for EPS.
              </p>
            </div>
            <div>
              <label className={labelCls}>Sandbox Base URL</label>
              <input
                className={inputCls}
                value={sandboxUrl}
                onChange={(e) => setSandboxUrl(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Live Base URL</label>
              <input
                className={inputCls}
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSecrets((s) => !s)}
            className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 cursor-pointer"
          >
            {showSecrets ? <EyeOff size={14} /> : <Eye size={14} />}{' '}
            {showSecrets ? 'Hide' : 'Show'} typed password &amp; hash key
          </button>
        </div>

        {/* Inline Test Result Box */}
        {testResult && (
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 animate-in fade-in duration-200 ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="text-xs leading-relaxed flex-1">
              <div className="flex items-center justify-between font-bold mb-1">
                <span className="text-sm">
                  {testResult.success ? 'EPS Connection Successful!' : 'EPS Connection Failed'}
                </span>
                <span className="text-[11px] opacity-75">{testResult.timestamp}</span>
              </div>
              <p className="font-mono text-xs break-all">{testResult.message}</p>
              {!testResult.success && (
                <p className="mt-2 text-[11px] text-rose-700">
                  Tip: Make sure your <strong>Username</strong>, <strong>Password</strong>, and{' '}
                  <strong>Hash Key</strong> match the exact credentials provided by EPS.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleTest}
            disabled={testing || saving}
            className="px-5 py-2.5 border border-indigo-200 text-indigo-700 bg-white rounded-md font-bold text-sm hover:bg-indigo-50 disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-colors shadow-2xs"
          >
            {testing ? <Loader2 size={16} className="animate-spin" /> : <PlugZap size={16} />}{' '}
            Test Connection
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || testing}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-md font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{' '}
            Save EPS Settings
          </button>
        </div>
      </div>
    </div>
  );
};
