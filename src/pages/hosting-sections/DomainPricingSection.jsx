import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, ArrowRight } from 'lucide-react';
import { getDomainPricing } from '../../services/hostingApi';

export default function DomainPricingSection() {
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getDomainPricing()
      .then(data => setPricing(data || []))
      .catch(() => setPricing([]))
      .finally(() => setLoading(false));
  }, []);

  const active = pricing.filter(p => p.isActive);
  const popular = ['.com', '.net', '.org', '.com.bd'];

  return (
    <section className="py-24 bg-white border-t border-gray-100">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-4 border border-blue-100">
            <Globe size={14} /> Domain Registration
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6">
            Secure Your Identity
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto text-lg leading-relaxed">
            Find and register your perfect domain name at the best price. All domains include free WHOIS privacy protection.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : active.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">Domain pricing is calculated dynamically at search time.</p>
            <p className="text-gray-400 text-sm mt-2">Search for a domain to see real-time pricing from our registrar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {active.map((item, idx) => {
              const isPopular = popular.includes(item.tld);
              return (
                <div
                  key={idx}
                  className={`relative group bg-white rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    isPopular 
                      ? 'border-blue-500 shadow-[0_10px_30px_rgba(59,130,246,0.1)]' 
                      : 'border-gray-200 hover:border-blue-200'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute top-0 right-6 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md">
                      POPULAR
                    </div>
                  )}
                  
                  <div className="flex items-baseline gap-1 mb-4">
                    <h3 className={`text-3xl font-black ${isPopular ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600' : 'text-gray-900'}`}>
                      {item.tld}
                    </h3>
                  </div>
                  
                  <div className="mb-6 space-y-1">
                    <p className="flex items-baseline gap-1 text-gray-900">
                      <span className="text-sm font-medium text-gray-500">Register at</span>
                      <span className="text-2xl font-bold">{'\u09F3'}{item.registerPrice?.toLocaleString()}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Renews at {'\u09F3'}{item.renewPrice?.toLocaleString()} /yr
                    </p>
                  </div>

                  <button
                    onClick={() => navigate('/domain')}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                      isPopular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    Register Now
                    <ArrowRight size={16} className="opacity-70 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
