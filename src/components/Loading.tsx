import React from 'react';

interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = 'Loading...' }: PageLoaderProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#F2F4F8] to-[#E9ECF6] relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-[#7B61FF]/10 blur-[100px] -translate-y-1/4" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-[#EF4444]/5 blur-[100px] translate-y-1/3 translate-x-1/4" />

      <div className="relative text-center">
        {/* Soft glow behind the logo */}
        <div className="absolute inset-0 mx-auto w-28 h-28 -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[#7B61FF]/20 blur-2xl animate-pulse" />

        {/* Animated logo/icon */}
        <div className="relative w-20 h-20 mx-auto mb-7">
          {/* Static track */}
          <div className="absolute inset-0 rounded-full border-4 border-[#7B61FF]/10" />
          {/* Outer spinner */}
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#7B61FF] border-r-[#7B61FF]/40 animate-spin"
            style={{ animationDuration: '1.1s' }}
          />
          {/* Inner counter-spinner */}
          <div
            className="absolute inset-2 rounded-full border-[3px] border-transparent border-t-[#EF4444] animate-spin"
            style={{ animationDirection: 'reverse', animationDuration: '1.6s' }}
          />
          {/* Outer pulse ring */}
          <div className="absolute -inset-1.5 rounded-full border border-[#7B61FF]/20 animate-ping" style={{ animationDuration: '2s' }} />

          {/* Logo core */}
          <div className="absolute inset-4 rounded-full bg-white flex items-center justify-center shadow-[0_4px_20px_rgba(123,97,255,0.35)]">
            <span className="text-2xl font-black bg-gradient-to-br from-[#7B61FF] to-[#5B3FE0] bg-clip-text text-transparent">
              C2IT
            </span>
          </div>
        </div>

        {/* Loading text with dots animation */}
        <div className="flex items-center justify-center gap-1.5 mb-2.5">
          <span className="text-sm font-semibold tracking-wide text-gray-700">{message}</span>
          <span className="flex gap-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7B61FF] animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[#7B61FF] animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[#7B61FF] animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        </div>

        {/* Slim indeterminate progress bar */}
        <div className="w-40 h-1 mx-auto mb-4 rounded-full bg-[#7B61FF]/10 overflow-hidden">
          <div
            className="h-full w-1/3 rounded-full bg-gradient-to-r from-[#7B61FF] to-[#EF4444] animate-[loaderbar_1.4s_ease-in-out_infinite]"
          />
        </div>

        <p className="text-xs text-gray-400">Please wait while we prepare everything for you</p>
      </div>

      {/* Keyframes for the progress bar sweep (scoped, no tailwind.config changes needed) */}
      <style>{`
        @keyframes loaderbar {
          0% { transform: translateX(-120%); }
          50% { transform: translateX(60%); }
          100% { transform: translateX(220%); }
        }
      `}</style>
    </div>
  );
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-[3px]',
    lg: 'h-16 w-16 border-4',
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <div className={`${sizeClasses[size]} border-[#7B61FF]/15 border-t-[#7B61FF] rounded-full animate-spin ${className}`} />
    </div>
  );
}

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white rounded-2xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.25)] flex flex-col items-center gap-4 max-w-sm mx-4 border border-gray-100 animate-[scaleIn_0.25s_ease-out]">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-medium text-gray-700 text-center">{message}</p>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}