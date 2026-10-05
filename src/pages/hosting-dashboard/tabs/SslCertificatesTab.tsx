import React from 'react';
import { Shield } from 'lucide-react';

export function SslCertificatesTab({ state }) {
  if (state.activeTab !== 'ssl-certificates') return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
        <Shield size={40} />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">SSL Certificates</h2>
      <p className="text-slate-500 max-w-md">
        This module will allow you to view and manage Openprovider SSL certificates, track validations, and place new orders. We are currently building this integration!
      </p>
    </div>
  );
}
