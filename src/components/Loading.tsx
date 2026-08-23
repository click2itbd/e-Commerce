import React from 'react';

interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = 'Loading...' }: PageLoaderProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F2F4F8]">
      <div className="text-center">
        {/* Animated logo/icon */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-[#7B61FF]/20" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#7B61FF] animate-spin" />
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-[#EF4444] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          <div className="absolute inset-4 rounded-full bg-white flex items-center justify-center shadow-lg">
            <span className="text-2xl font-black text-[#7B61FF]">C2</span>
          </div>
        </div>
        
        {/* Loading text with dots animation */}
        <div className="flex items-center justify-center gap-1 mb-2">
          <span className="text-sm font-semibold text-gray-700">{message}</span>
          <span className="flex gap-0.5">
            <span className="w-1 h-1 rounded-full bg-[#7B61FF] animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-1 rounded-full bg-[#7B61FF] animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1 rounded-full bg-[#7B61FF] animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        </div>
        
        <p className="text-xs text-gray-400">Please wait while we prepare everything for you</p>
      </div>
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
    md: 'h-10 w-10 border-3',
    lg: 'h-16 w-16 border-4',
  };

  return (
    <div className={`${sizeClasses[size]} border-[#7B61FF]/20 border-t-[#7B61FF] rounded-full animate-spin ${className}`} />
  );
}

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 max-w-sm mx-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-medium text-gray-700">{message}</p>
      </div>
    </div>
  );
}
