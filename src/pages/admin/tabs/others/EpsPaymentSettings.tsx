import React, { useEffect, useState, useCallback } from 'react';
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
  AlertTriangle,
  Server,
  RefreshCw,
  ExternalLink,
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
  // Try loading instantly from sessionStorage so there is ZERO delay when switching tabs
  const getInitialCachedConfig = (): EpsPublicConfig | null => {
    try {
      const c = sessionStorage.getItem('eps_cached_public_config');
      return c ? JSON.parse(c) : null;
    } catch {
      return null;
    }
  };

  const initialCached = getInitialCachedConfig();

  const [loading, setLoading] = useState(!initialCached);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [showSecrets, setShowSecrets] = useState(false);
  const [saved, setSaved] = useState<EpsPublicConfig | null>(initialCached);

  const [enabled, setEnabled] = useState(initialCached?.epsEnabled || false);
  const [mode, setMode] = useState<'sandbox' | 'live'>(initialCached?.epsMode || 'sandbox');
  const [merchantId, setMerchantId] = useState(initialCached?.epsMerchantId || '');
  const [storeId, setStoreId] = useState(initialCached?.epsStoreId || '');
  const [sandboxUrl, setSandboxUrl] = useState(initialCached?.epsSandboxBaseUrl || 'https://sandboxpgapi.eps.com.bd/v1');
  const [liveUrl, setLiveUrl] = useState(initialCached?.epsLiveBaseUrl || 'https://pgapi.eps.com.bd/v1');
  // Secrets are write-only: blank = keep existing value on the server.
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [hashKey, setHashKey] = useState('');

  // Inline test result box
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    timestamp: string;
    is503?: boolean;
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
    try {
      sessionStorage.setItem('eps_cached_public_config', JSON.stringify(c));
    } catch {
      // ignore
    }
  };

  const checkHealth = useCallback(async (showToast = false) => {
    setCheckingHealth(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const res = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });
      if (res.ok) {
        setServerStatus('online');
        if (showToast) toast.success('Node.js ব্যাকএন্ড সার্ভার সচল ও অনলাইন আছে!');
        try {
          const json = await apiGet<{ success: boolean; data?: EpsPublicConfig }>(
            '/api/admin/payment/eps'
          );
          if (json.success && json.data) applyConfig(json.data);
        } catch {
          // ignore sub-error
        }
        return true;
      } else {
        setServerStatus('offline');
        if (showToast) {
          toast.error('সার্ভার অফলাইন (503 Service Unavailable)!', { duration: 5000 });
        }
        return false;
      }
    } catch {
      setServerStatus('offline');
      if (showToast) {
        toast.error('সার্ভারে সংযোগ পাওয়া যায়নি। cPanel থেকে Node.js অ্যাপটি রিস্টার্ট করুন।', { duration: 5000 });
      }
      return false;
    } finally {
      clearTimeout(timeout);
      setCheckingHealth(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Fast fetch with strict 6s timeout so it never hangs
    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        setLoading(false);
      }
    }, 6000);

    (async () => {
      try {
        const json = await apiGet<{ success: boolean; data?: EpsPublicConfig }>(
          '/api/admin/payment/eps'
        );
        if (!cancelled) {
          if (json.success && json.data) applyConfig(json.data);
          setServerStatus('online');
        }
      } catch (err: any) {
        if (!cancelled) {
          const is503 =
            err?.message?.includes('503') ||
            err?.message?.toLowerCase().includes('service unavailable');
          if (is503) {
            setServerStatus('offline');
          }
        }
      } finally {
        if (!cancelled) {
          clearTimeout(timeoutId);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
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
      setServerStatus('online');
      toast.success(json.message || 'EPS settings saved successfully');
    } catch (err: any) {
      const is503 =
        err?.message?.includes('503') ||
        err?.message?.toLowerCase().includes('service unavailable');
      if (is503) {
        setServerStatus('offline');
        setTestResult({
          success: false,
          is503: true,
          message:
            'HTTP 503 (Service Unavailable): Live server reverse proxy could not reach Node.js on port 4000. Please start or restart your Node.js App in cPanel.',
          timestamp: new Date().toLocaleTimeString(),
        });
        toast.error('সার্ভার অফলাইন (503 Service Unavailable)! cPanel থেকে Node.js অ্যাপটি Restart করুন।', {
          duration: 6000,
        });
      } else {
        toast.error(err?.message || 'Failed to save EPS settings');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const id = toast.loading('Testing EPS connection...');

    // Strict 15-second client timeout so it never hangs for 2 minutes
    const testTimeout = setTimeout(() => {
      if (testing) {
        setTesting(false);
        toast.error('EPS Connection timed out after 15 seconds. Please check network/credentials.', { id });
        setTestResult({
          success: false,
          message: 'Connection timed out (15s): The EPS payment gateway did not respond in time.',
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    }, 15000);

    try {
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

      clearTimeout(testTimeout);
      const msg = json.message || (json.success ? 'Connection OK' : 'Connection failed');
      setTestResult({
        success: Boolean(json.success),
        message: msg,
        timestamp: new Date().toLocaleTimeString(),
      });
      setServerStatus('online');

      if (json.success) {
        toast.success(msg, { id });
      } else {
        toast.error(msg, { id });
      }
    } catch (err: any) {
      clearTimeout(testTimeout);
      const is503 =
        err?.message?.includes('503') ||
        err?.message?.toLowerCase().includes('service unavailable');
      if (is503) {
        setServerStatus('offline');
        const errText =
          'HTTP 503 (Service Unavailable): The backend Node.js application is stopped or unreachable on port 4000.';
        setTestResult({
          success: false,
          is503: true,
          message: errText,
          timestamp: new Date().toLocaleTimeString(),
        });
        toast.error('ব্যাকএন্ড সার্ভার অফলাইন (503)! cPanel থেকে Node.js অ্যাপটি Restart করুন।', {
          id,
          duration: 6000,
        });
      } else {
        const errText = err?.message || 'Connection test failed';
        setTestResult({
          success: false,
          message: errText,
          timestamp: new Date().toLocaleTimeString(),
        });
        toast.error(errText, { id });
      }
    } finally {
      clearTimeout(testTimeout);
      setTesting(false);
    }
  };

  const secretPlaceholder = (isSet: boolean) =>
    isSet ? '•••••••• (saved - leave blank to keep)' : 'Enter value';
  const secretType = showSecrets ? 'text' : 'password';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-700 p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
            <CreditCard size={24} className="text-indigo-100" />
            <h3 className="text-xl font-bold">Payment Gateway - EPS (Easy Payment System)</h3>
          </div>

          {/* Backend Health Badge */}
          <div className="flex items-center gap-2">
            {serverStatus === 'online' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-100 border border-emerald-400/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Backend API Online
              </span>
            )}
            {serverStatus === 'offline' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/30 text-rose-100 border border-rose-400/40">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                Backend Offline (503)
              </span>
            )}
            {serverStatus === 'checking' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/80 border border-white/20">
                <Loader2 size={12} className="animate-spin" />
                Checking API...
              </span>
            )}
            <button
              type="button"
              onClick={() => checkHealth(true)}
              disabled={checkingHealth}
              title="সার্ভার সংযোগ পুনরায় পরীক্ষা করুন"
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={checkingHealth ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
        <p className="text-indigo-100 text-sm max-w-2xl">
          Configure your EPS merchant API credentials. Credentials are kept securely in
          Firestore via the backend API and are never exposed to the public browser.
        </p>
      </div>

      <div className="p-6 space-y-6 bg-gray-50/50">
        {/* 503 Server Offline Diagnostic Banner */}
        {serverStatus === 'offline' && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-xs">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={22} />
              <div className="flex-1 text-sm text-amber-900">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <span className="font-bold text-base text-amber-900 flex items-center gap-2">
                    Node.js ব্যাকএন্ড সার্ভার অফলাইন (HTTP 503 Service Unavailable)
                  </span>
                  <button
                    type="button"
                    onClick={() => checkHealth(true)}
                    disabled={checkingHealth}
                    className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    <RefreshCw size={13} className={checkingHealth ? 'animate-spin' : ''} />
                    {checkingHealth ? 'যাচাই করা হচ্ছে...' : 'পুনরায় চেক করুন'}
                  </button>
                </div>
                <p className="text-amber-800 text-xs leading-relaxed mb-3">
                  ওয়েব সার্ভার (LiteSpeed / Apache) পোর্ট ৪০০০-এ থাকা Node.js ব্যাকএন্ডের সাথে সংযোগ স্থাপন করতে পারছে না। লাইভ পেমেন্ট গেটওয়ের গোপন সিক্রেট কি (Hash Key, Password) নিরাপদে এনক্রিপ্ট ও টেস্ট করার জন্য cPanel-এ Node.js ব্যাকএন্ড চালু থাকা প্রয়োজন।
                </p>
                <div className="bg-white/90 border border-amber-200 rounded-lg p-3 text-xs text-gray-800">
                  <div className="font-bold text-amber-900 mb-2 flex items-center gap-1.5">
                    <Server size={14} className="text-amber-600" />
                    cPanel থেকে সমাধান করার সহজ ধাপ (মাত্র ১ মিনিট):
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-gray-700 font-medium">
                    <li>
                      আপনার হোস্টিংয়ের <strong>cPanel</strong>-এ লগইন করুন।
                    </li>
                    <li>
                      <strong>Software</strong> বিভাগে গিয়ে <strong>Setup Node.js App</strong>-এ ক্লিক করুন।
                    </li>
                    <li>
                      আপনার ওয়েবসাইটের Node.js অ্যাপ্লিকেশনের পাশে <strong>Restart</strong> বাটনে ক্লিক করুন (অথবা Stopped অবস্থায় থাকলে <strong>Start App</strong> দিন)।
                    </li>
                    <li>
                      রিস্টার্ট সম্পন্ন হলে এখানে এসে উপরের <strong>&quot;পুনরায় চেক করুন&quot;</strong> বাটনে ক্লিক করুন এবং ক্রেডেনশিয়াল সেভ করুন।
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

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
              {!testResult.success && !testResult.is503 && (
                <p className="mt-2 text-[11px] text-rose-700">
                  Tip: Make sure your <strong>Username</strong>, <strong>Password</strong>, and{' '}
                  <strong>Hash Key</strong> match the exact credentials provided by EPS.
                </p>
              )}
              {testResult.is503 && (
                <p className="mt-2 text-[11px] text-rose-700 font-medium">
                  সার্ভার সমাধান: cPanel-এর <strong>Setup Node.js App</strong> থেকে অ্যাপটি <strong>Restart</strong> করুন।
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
