import React, { useState, useEffect } from 'react';
import { Globe, CheckCircle } from 'lucide-react';
import { getDomainPricing } from '../../services/hostingApi';

const FALLBACK = [
  { tld: '.com', registerPrice: 1299, renewPrice: 1499, isActive: true },
  { tld: '.net', registerPrice: 1099, renewPrice: 1299, isActive: true },
  { tld: '.org', registerPrice: 1199, renewPrice: 1399, isActive: true },
  { tld: '.com.bd', registerPrice: 2499, renewPrice: 2799, isActive: true },
  { tld: '.xyz', registerPrice: 499, renewPrice: 799, isActive: true },
  { tld: '.store', registerPrice: 799, renewPrice: 1199, isActive: true },
  { tld: '.online', registerPrice: 699, renewPrice: 999, isActive: true },
  { tld: '.io', registerPrice: 3999, renewPrice: 4299, isActive: true },
];

const FEATURES = ['Free WHOIS Privacy', 'Free DNS Management', 'Easy Transfer', 'Domain Lock'];

export default function DomainPricingSection() {
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDomainPricing()
      .then(data => setPricing(data && data.length > 0 ? data : FALLBACK))
      .catch(() => setPricing(FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  const active = pricing.filter(p => p.isActive);
  const popular = ['.com', '.net', '.org', '.com.bd'];

  return (
    <section className="py-20" style={{ background: '#f0f4ff' }}>
      <div className="container mx-auto px-4">

        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-4">
            <Globe size={12} /> Domain Registration
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--c2i-blue-dark)] mb-4">
            Register Your Domain Today
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto text-sm leading-relaxed">
            Find and register your perfect domain name at the best price. All domains include free WHOIS privacy protection.
          </p>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-10">Loading prices...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-5xl mx-auto mb-14">
            {active.map((item, idx) => {
              const isPopular = popular.includes(item.tld);
              return (
                <div
                  key={idx}
                  className="relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  style={isPopular
                    ? { background: 'linear-gradient(135deg, #0e1c52, #1a307a)', color: '#fff' }
                    : { background: '#fff', color: '#0e1c52', border: '1px solid #e2e8f0' }
                  }
                >
                  {isPopular && (
                    <div className="absolute top-0 left-0 right-0 h-[3px]"
                      style={{ background: 'linear-gradient(90deg, #f97316, #fb923c)' }} />
                  )}
                  {isPopular && (
                    <span className="absolute top-3 right-3 bg-orange-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Popular
                    </span>
                  )}
                  <div className="p-6 text-center">
                    <p className="text-2xl font-black mb-3"
                      style={isPopular ? { color: '#93c5fd' } : { color: '#0e1c52' }}>
                      {item.tld}
                    </p>
                    <p className="text-3xl font-black mb-1"
                      style={isPopular ? { color: '#fff' } : { color: '#0e1c52' }}>
                      {'\u09F3'}{item.registerPrice?.toLocaleString()}
                    </p>
                    <p className="text-xs mb-4"
                      style={{ color: isPopular ? '#94a3b8' : '#64748b' }}>
                      /year &middot; Renew {'\u09F3'}{item.renewPrice?.toLocaleString()}
                    </p>
                    <button
                      className="w-full py-2 rounded-xl text-sm font-bold transition-all"
                      style={isPopular
                        ? { background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }
                        : { background: '#0e1c52', color: '#fff' }
                      }
                    >
                      Register
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-4">
          {FEATURES.map((f, i) => (
            <div key={i} className="flex items-center gap-2 bg-white border border-blue-100 rounded-full px-5 py-2.5 text-sm font-semibold text-[var(--c2i-blue-dark)] shadow-sm">
              <CheckCircle size={16} className="text-green-500" />
              {f}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
