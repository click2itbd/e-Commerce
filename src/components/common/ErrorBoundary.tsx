import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown } from 'lucide-react';

const CHUNK_RELOAD_KEY = 'click2it_chunk_reload_at';

export function isChunkLoadError(error: unknown): boolean {
  const msg = String((error as any)?.message || error || '').toLowerCase();
  const name = String((error as any)?.name || '').toLowerCase();
  return (
    name === 'chunkloaderror' ||
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('importing a module script failed') ||
    msg.includes('loading chunk') ||
    msg.includes('loading css chunk')
  );
}

export function tryAutoChunkReload(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || '0');
    const now = Date.now();
    // Guard against reload loops if an asset is genuinely unreachable
    if (!last || now - last > 15000) {
      sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now));
      window.location.reload();
      return true;
    }
  } catch {
    // ignore storage errors
  }
  return false;
}

function canInspectTechnicalDetails(): boolean {
  if (import.meta.env.DEV) return true;
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    return path.startsWith('/admin') || path.startsWith('/pos');
  }
  return false;
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, showDetails: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (isChunkLoadError(error) && tryAutoChunkReload()) {
      return;
    }
    if (import.meta.env.DEV) {
      console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    }
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) {
        return this.props.fallback;
      }

      const showTechnicalSection = canInspectTechnicalDetails();

      return (
        <div className="min-h-[420px] flex items-center justify-center p-6 bg-slate-50">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200/80 p-7 text-center animate-in fade-in duration-300">
            <div className="w-14 h-14 bg-orange-50 text-[#F97316] border border-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-2">
              পৃষ্ঠাটি লোড করতে সাময়িক সমস্যা হয়েছে
            </h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              দুঃখিত, এই অংশটি লোড করা যায়নি। অনুগ্রহ করে পেজটি রিলোড দিন অথবা হোমপেজে ফিরে যান।
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F97316] hover:bg-[#ea580c] text-white rounded-xl font-bold text-sm shadow-sm shadow-orange-500/20 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                রিলোড দিন
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                হোমপেজে যান
              </button>
            </div>

            {/* Technical Error Details: strictly hidden from storefront customers in production */}
            {showTechnicalSection && (
              <div className="text-left border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                  className="text-xs text-slate-400 hover:text-slate-600 font-semibold inline-flex items-center gap-1 focus:outline-none cursor-pointer"
                >
                  টেকনিক্যাল বিবরণ {this.state.showDetails ? 'লুকান' : 'দেখুন'}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${this.state.showDetails ? 'rotate-180' : ''}`} />
                </button>

                {this.state.showDetails && (
                  <div className="mt-3 p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono overflow-x-auto max-h-48 leading-relaxed">
                    <div className="text-red-400 font-bold mb-1">
                      {this.state.error?.name}: {this.state.error?.message}
                    </div>
                    {this.state.errorInfo?.componentStack && (
                      <pre className="text-[11px] text-slate-400 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
