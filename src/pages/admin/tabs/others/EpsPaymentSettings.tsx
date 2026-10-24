import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CreditCard, ShieldCheck, Loader2, Eye, EyeOff, PlugZap, Save } from 'lucide-react';
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

  const applyConfig = (c: EpsPublicConfig) => {
    setSaved(c);
    setEnabled(c.epsEnabled);
    setMode(c.epsMode);
    setMerchantId(c.epsMerchantId);
    setStoreId(c.epsStoreId);
    setSandboxUrl(c.epsSandboxBaseUrl);
    setLiveUrl(c.epsLiveBaseUrl);
    setUsername('');
    setPassword('');
    setHashKey('');
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const json = await apiGet<{ success: boolean; data?: EpsPublicConfig }>('/api/admin/payment/eps');
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

  const hasUnsavedSecrets = Boolean(username || password || hashKey);

  const handleSave = async () => {
    setSaving(true);
    try {
      const json = await apiPost<{ success: boolean; message?: string; data?: EpsPublicConfig }>(
        '/api/admin/payment/eps',
        {
          epsEnabled: enabled,
          epsMode: mode,
          epsMerchantId: merchantId,
          epsStoreId: storeId,
          epsSandboxBaseUrl: sandboxUrl,
          epsLiveBaseUrl: liveUrl,
          epsUsername: username,
          epsPassword: password,
          epsHashKey: hashKey,
        },
      );
      if (json.data) applyConfig(json.data);
      toast.success(json.message || 'EPS settings saved');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save EPS settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (hasUnsavedSecrets) {
      toast.error('Save your changes first - the test uses the saved credentials.');
      return;
    }
    setTesting(true);
    const id = toast.loading('Testing EPS connection...');
    try {
      const json = await apiPost<{ success: boolean; message?: string }>('/api/admin/payment/eps/test-connection', {});
      if (json.success) toast.success(json.message || 'Connection OK', { id });
      else toast.error(json.message || 'Connection failed', { id });
    } catch (err: any) {
      toast.error(err?.message || 'Connection test failed', { id });
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

  const secretPlaceholder = (isSet: boolean) => (isSet ? '•••••••• (saved - leave blank to keep)' : 'Not set');
  const secretType = showSecrets ? 'text' : 'password';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-700 p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <CreditCard size={24} className="text-indigo-100" />
          <h3 className="text-xl font-bold">Payment Gateway - EPS (Easy Payment System)</h3>
        </div>
        <p className="text-indigo-100 text-sm max-w-2xl">
          Store your EPS merchant credentials here. They are kept server-side only and are never shown again after saving.
        </p>
      </div>

      <div className="p-6 space-y-6 bg-gray-50/50">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-sm text-amber-800">
          <ShieldCheck size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs">
            This saves configuration only. Customer checkout does not use EPS yet, so enabling it will not change
            what shoppers see. Use <strong>Test Connection</strong> with sandbox credentials first.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-sm font-bold text-gray-800">Enable EPS</span>
            </label>

            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-bold">
              {(['sandbox', 'live'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`px-4 py-2 uppercase tracking-wider ${
                    mode === m
                      ? m === 'live'
                        ? 'bg-red-600 text-white'
                        : 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {mode === 'live' && (
            <p className="text-xs font-bold text-red-600">Live mode: real money will be charged.</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelCls}>Merchant ID</label>
              <input className={inputCls} value={merchantId} onChange={(e) => setMerchantId(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Store ID</label>
              <input className={inputCls} value={storeId} onChange={(e) => setStoreId(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>API Username</label>
              <input
                className={inputCls}
                type={secretType}
                autoComplete="off"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={secretPlaceholder(!!saved?.epsUsernameSet)}
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
                placeholder={secretPlaceholder(!!saved?.epsPasswordSet)}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Hash Key</label>
              <input
                className={inputCls}
                type={secretType}
                autoComplete="off"
                value={hashKey}
                onChange={(e) => setHashKey(e.target.value)}
                placeholder={secretPlaceholder(!!saved?.epsHashKeySet)}
              />
            </div>
            <div>
              <label className={labelCls}>Sandbox Base URL</label>
              <input className={inputCls} value={sandboxUrl} onChange={(e) => setSandboxUrl(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Live Base URL</label>
              <input className={inputCls} value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSecrets((s) => !s)}
            className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1"
          >
            {showSecrets ? <EyeOff size={14} /> : <Eye size={14} />} {showSecrets ? 'Hide' : 'Show'} typed secrets
          </button>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleTest}
            disabled={testing || saving}
            className="px-5 py-2 border border-indigo-200 text-indigo-700 bg-white rounded-md font-bold text-sm hover:bg-indigo-50 disabled:opacity-50 flex items-center gap-2"
          >
            {testing ? <Loader2 size={16} className="animate-spin" /> : <PlugZap size={16} />} Test Connection
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || testing}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save EPS Settings
          </button>
        </div>
      </div>
    </div>
  );
};
