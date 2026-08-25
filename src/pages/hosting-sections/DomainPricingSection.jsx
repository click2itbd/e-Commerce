import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, ArrowRight, Loader2 } from 'lucide-react';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../firebase';

const POPULAR_TLDS = ['.com', '.net', '.org', '.xyz', '.io', '.co', '.dev', '.online'];

// Standard Dynadot / Wholesale Base USD Prices
const TLD_BASE_USD = {
  '.com': 10.99,
  '.net': 12.99,
  '.org': 11.99,
  '.xyz': 2.99,
  '.io': 39.99,
  '.co': 25.99,
  '.dev': 14.99,
  '.online': 3.99,
};

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl p-6 border border-gray-200 animate-pulse">
    <div className="h-8 w-16 bg-gray-200 rounded mb-4"></div>
    <div className="h-6 w-24 bg-gray-200 rounded mb-2"></div>
    <div className="h-4 w-20 bg-gray-200 rounded mb-6"></div>
    <div className="h-10 w-full bg-gray-200 rounded-xl"></div>
  </div>
);

export default function DomainPricingSection({
  tlds = POPULAR_TLDS,
  title = 'Popular Domains',
  subtitle = 'Register your perfect domain name at transparent pricing. All domains include free WHOIS privacy protection.',
}) {
  const [globalSettings, setGlobalSettings] = useState({
    usdToBdtRate: 121,
    domainMarkupPercent: 15,
  });
  const [customOverrides, setCustomOverrides] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Real-time listener for Global Pricing Settings (Dollar Rate & Margin %)
    const unsubPublic = onSnapshot(doc(db, 'settings', 'public_config'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setGlobalSettings({
          usdToBdtRate: Number(data.usdToBdtRate) || 121,
          domainMarkupPercent: Number(data.domainMarkupPercent) || 15,
        });
      }
    }, (err) => console.log('public_config listener error:', err));

    const unsubSite = onSnapshot(doc(db, 'settings', 'site'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.usdToBdtRate) {
          setGlobalSettings(prev => ({
            ...prev,
            usdToBdtRate: Number(data.usdToBdtRate) || prev.usdToBdtRate,
            domainMarkupPercent: Number(data.domainMarkupPercent) || prev.domainMarkupPercent,
          }));
        }
      }
    }, (err) => console.log('site settings listener error:', err));

    // 2. Real-time listener for Custom Per-TLD Pricing Overrides
    const unsubPricing = onSnapshot(collection(db, 'domainPricing'), (snap) => {
      const overrides = {};
      snap.docs.forEach((d) => {
        const item = d.data();
        if (item.tld && item.isActive !== false) {
          const formattedTld = item.tld.startsWith('.') ? item.tld.toLowerCase() : `.${item.tld.toLowerCase()}`;
          overrides[formattedTld] = Number(item.registerPrice) || 0;
        }
      });
      setCustomOverrides(overrides);
      setLoading(false);
    }, (err) => {
      console.log('domainPricing listener error:', err);
      setLoading(false);
    });

    return () => {
      unsubPublic();
      unsubSite();
      unsubPricing();
    };
  }, []);

  const handleCardClick = (tld) => {
    const bareTld = String(tld || '').replace(/^\./, '');
    navigate(`/domain?tld=${encodeURIComponent(bareTld)}`);
  };

  // Compute final price for each TLD dynamically
  const getCalculatedPrice = (rawTld) => {
    const tld = rawTld.startsWith('.') ? rawTld.toLowerCase() : `.${rawTld.toLowerCase()}`;
    
    // 1. Check custom override from Firestore
    if (customOverrides[tld] && customOverrides[tld] > 0) {
      return customOverrides[tld];
    }

    // 2. Compute from Formula: Base USD * (1 + Margin% / 100) * Dollar Rate
    const baseUsd = TLD_BASE_USD[tld] || 10.99;
    const rate = globalSettings.usdToBdtRate || 121;
    const margin = globalSettings.domainMarkupPercent || 15;
    const retailUsd = baseUsd * (1 + margin / 100);
    return Math.round(retailUsd * rate);
  };

  return (
    <section className="py-16 md:py-24 bg-gray-50 border-t border-gray-100">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-4 border border-blue-100">
            <Globe size={14} /> Domain Registration
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6">
            {title}
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto text-lg leading-relaxed">
            {subtitle}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {tlds.map((tld) => (
              <SkeletonCard key={tld} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {tlds.map((rawTld) => {
              const tld = rawTld.startsWith('.') ? rawTld : `.${rawTld}`;
              const isPopular = POPULAR_TLDS.slice(0, 4).includes(tld);
              const price = getCalculatedPrice(tld);

              return (
                <button
                  key={tld}
                  onClick={() => handleCardClick(tld)}
                  className={`relative group bg-white rounded-2xl p-6 border text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
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

                  <div className="mb-4">
                    <h3
                      className={`text-3xl font-black ${
                        isPopular
                          ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600'
                          : 'text-gray-900'
                      }`}
                    >
                      {tld}
                    </h3>
                  </div>

                  <div className="mb-6 space-y-1">
                    <p className="flex items-baseline gap-1 text-gray-900">
                      <span className="text-sm font-medium text-gray-500">Starting at</span>
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      ৳{price.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">/ year (Includes Privacy)</p>
                  </div>

                  <div
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                      isPopular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    Register
                    <ArrowRight size={16} className="opacity-70 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
