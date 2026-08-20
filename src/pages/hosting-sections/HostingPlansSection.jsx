import React, { useState, useEffect } from 'react';
import { Database, Monitor, Server, Check, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';
import { toast } from 'react-hot-toast';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

export default function HostingPlansSection({
  billingCycle,
  onBillingCycleChange,
  onNavigate,
}) {
  const { addToCart } = useCart();
  const { settings } = useSettings();
  const [specialPlans, setSpecialPlans] = useState([]);
  
  const calculatePlanPrice = (plan) => {
    if (!plan) return 0;
    
    const licenseCostUsd = plan.licenseCostUsd || plan.pricing?.licenseCostUsd || 0;
    if (licenseCostUsd > 0) {
      const exchangeRate = settings.apiSettings?.usdToBdtRate || settings.usdToBdtRate || 120;
      const markupPercent = settings.apiSettings?.hostingMarkupPercent || settings.hostingMarkupPercent || 35;
      const calculatedMonthly = Math.round(licenseCostUsd * exchangeRate * (1 + markupPercent / 100));
      
      if (plan.priceOverride && plan.overridePrice > 0) {
        return plan.overridePrice;
      }
      return calculatedMonthly;
    }
    
    return plan.price || 0;
  };
  
  useEffect(() => {
    const fetchSpecialPlans = async () => {
      try {
        const q = query(collection(db, 'specialPlans'), orderBy('order', 'asc'));
        const snap = await getDocs(q);
        const fetchedPlans = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (fetchedPlans.length > 0) {
          setSpecialPlans(fetchedPlans);
        }
      } catch (error) {
        console.error('Error fetching special plans:', error);
      }
    };
    fetchSpecialPlans();
  }, []);

  const handleBuyNow = (plan) => {
    const price = calculatePlanPrice(plan);
    if (price <= 0) {
      toast.error('Price unavailable for this plan. Please contact us.');
      return;
    }
    
    addToCart({
      id: `hosting-${plan.id}-${billingCycle}`,
      name: `${plan.name} Plan`,
      price: price,
      quantity: 1,
      category: 'Hosting & Domains',
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=200',
      billingCycle: billingCycle
    });
    toast.success(`${plan.name} added to cart!`);
    onNavigate('/hosting/cart');
  };

  if (specialPlans.length === 0) return null;

  return (
    <section className="py-24 bg-gray-50 border-t border-gray-100">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-4 border border-blue-100">
            CHOOSE A PLAN
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 uppercase tracking-tight">OUR BEST PRICING</h2>
        </div>

        <div className="flex justify-center mb-16">
          <div className="inline-flex bg-white rounded-full p-1 border border-gray-200 shadow-sm">
            <button
              onClick={() => onBillingCycleChange('yearly')}
              className={cn(
                "px-4 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-bold transition-all uppercase tracking-wide",
                billingCycle === 'yearly' ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              Yearly Plan
            </button>
            <button
              onClick={() => onBillingCycleChange('monthly')}
              className={cn(
                "px-4 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-bold transition-all uppercase tracking-wide",
                billingCycle === 'monthly' ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              Monthly Plan
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {specialPlans.map((plan, idx) => {
            const IconComponent = plan.icon === 'Monitor' ? Monitor : plan.icon === 'Server' ? Server : Database;
            return (
            <div 
              key={plan.id || idx} 
              className={cn(
                "relative rounded-3xl p-8 text-center transition-all duration-300 group",
                plan.popular 
                  ? "bg-white text-gray-900 shadow-[0_20px_50px_rgba(0,0,0,0.1)] transform md:-translate-y-4 md:scale-105 border-2 border-blue-500" 
                  : "bg-white text-gray-900 border border-gray-200 hover:border-gray-300 hover:shadow-xl"
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 inset-x-0 flex justify-center -mt-3.5">
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-widest shadow-md">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="flex justify-center mb-6">
                <div className={cn("p-4 rounded-2xl", plan.popular ? "bg-blue-50" : "bg-gray-50 group-hover:bg-blue-50/50 transition-colors")}>
                  <IconComponent size={48} strokeWidth={1.5} className={plan.popular ? "text-blue-600" : "text-gray-400 group-hover:text-blue-500 transition-colors"} />
                </div>
              </div>
              
              <h3 className="text-xl font-bold uppercase mb-4 tracking-wide text-gray-900">{plan.name}</h3>
              
              <div className="mb-8">
                <p className="text-sm uppercase tracking-wider mb-2 text-gray-500">Starting at</p>
                {(() => {
                  const price = calculatePlanPrice(plan);
                  return (
                    <div className="flex items-center justify-center font-bold">
                      {price > 0 ? (
                        <>
                          <span className="text-2xl align-top mt-1 text-gray-400">৳</span>
                          <span className={cn("text-6xl tracking-tighter", plan.popular ? "text-gray-900" : "text-gray-800")}>{price}</span>
                          <span className="text-gray-500 align-bottom ml-1">/{plan.billingCycle || 'mo'}</span>
                        </>
                      ) : (
                        <span className="text-xl text-gray-500">Contact for pricing</span>
                      )}
                    </div>
                  );
                })()}
              </div>

                <ul className="space-y-4 mb-8 text-left inline-block">
                  {(plan.features || []).map((feature, i) => {
                    const fName = typeof feature === 'string' ? feature : feature.name;
                    const fValue = typeof feature === 'string' ? 'yes' : feature.value;
                    if (fValue === 'no' || fValue === 'false') return null; // Don't show negative features in the list
                    const displayValue = (fValue === 'yes' || fValue === 'true') ? '' : `${fValue} `;
                    return (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <Check size={16} className={plan.popular ? "text-blue-600" : "text-blue-500"} />
                        <span className="text-gray-600">{displayValue}{fName}</span>
                      </li>
                    );
                  })}
                </ul>

              <button 
                onClick={() => handleBuyNow(plan)}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold uppercase tracking-widest transition-all",
                  plan.popular 
                    ? "bg-blue-600 text-white shadow-lg hover:shadow-blue-500/25 hover:bg-blue-700" 
                    : "bg-gray-50 text-gray-900 border border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                )}
              >
                Buy Now
                <ArrowRight size={16} className={cn("transition-transform", plan.popular ? "group-hover:translate-x-1" : "")} />
              </button>
            </div>
          )})}
        </div>
      </div>
    </section>
  );
}




