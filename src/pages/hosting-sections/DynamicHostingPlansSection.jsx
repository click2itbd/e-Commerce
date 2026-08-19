import React, { useState, useEffect } from 'react';
import { Database, Monitor, Server, Check, ArrowRight, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCart } from '../../context/CartContext';
import { toast } from 'react-hot-toast';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

export default function DynamicHostingPlansSection({
  billingCycle,
  onBillingCycleChange,
  onNavigate,
}) {
  const { addToCart } = useCart();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const q = query(collection(db, 'hostingPlans'), orderBy('order', 'asc'));
        const snap = await getDocs(q);
        const fetchedPlans = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPlans(fetchedPlans);
      } catch (error) {
        console.error('Error fetching dynamic plans:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleBuyNow = (plan) => {
    addToCart({
      id: `dynamic-hosting-${plan.id}-${billingCycle}`,
      name: `${plan.name} Plan`,
      price: plan.price,
      quantity: 1,
      category: 'Hosting & Domains',
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=200',
      billingCycle: billingCycle
    });
    toast.success(`${plan.name} added to cart!`);
    onNavigate('/hosting/cart');
  };

  // If no dynamic plans exist, we don't render anything here.
  if (loading || plans.length === 0) {
    return null; 
  }

  return (
    <section className="py-24 bg-white border-t border-gray-100">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-600 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-4 border border-purple-100">
            FLEXIBLE PLANS
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 uppercase tracking-tight">ALL HOSTING PLANS</h2>
          <p className="text-gray-500 max-w-2xl mx-auto mt-4">
            Explore our complete range of hosting solutions tailored for every need and budget.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {plans.map((plan, idx) => {
            const IconComponent = plan.icon === 'Monitor' ? Monitor : plan.icon === 'Server' ? Server : plan.icon === 'Zap' ? Zap : Database;
            return (
            <div 
              key={plan.id || idx} 
              className={cn(
                "relative rounded-2xl p-6 text-center transition-all duration-300 group bg-white border",
                plan.popular 
                  ? "border-purple-500 shadow-xl md:-translate-y-2 ring-2 ring-purple-100" 
                  : "border-gray-200 hover:border-purple-300 hover:shadow-lg"
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 inset-x-0 flex justify-center -mt-3">
                  <span className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
                    Top Choice
                  </span>
                </div>
              )}
              
              <div className="flex justify-center mb-4 mt-2">
                <div className={cn("p-3 rounded-xl", plan.popular ? "bg-purple-50" : "bg-gray-50 group-hover:bg-purple-50/50 transition-colors")}>
                  <IconComponent size={32} strokeWidth={1.5} className={plan.popular ? "text-purple-600" : "text-gray-400 group-hover:text-purple-500 transition-colors"} />
                </div>
              </div>
              
              <h3 className="text-lg font-bold uppercase mb-2 tracking-wide text-gray-900">{plan.name}</h3>
              
              <div className="mb-6">
                <div className="flex items-center justify-center font-bold">
                  <span className="text-lg align-top mt-1 text-gray-400">$</span>
                  <span className={cn("text-4xl tracking-tighter", plan.popular ? "text-gray-900" : "text-gray-800")}>{plan.price}</span>
                  <span className="text-gray-500 align-bottom ml-1 text-sm">/{plan.billingCycle || 'mo'}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 text-left text-sm">
                {(plan.features || []).map((feature, i) => {
                  const fName = typeof feature === 'string' ? feature : feature.name;
                  const fValue = typeof feature === 'string' ? 'yes' : feature.value;
                  if (fValue === 'no' || fValue === 'false') return null;
                  const displayValue = (fValue === 'yes' || fValue === 'true') ? '' : `${fValue} `;
                  return (
                    <li key={i} className="flex items-start gap-2">
                      <Check size={14} className={cn("mt-0.5 shrink-0", plan.popular ? "text-purple-600" : "text-purple-400")} />
                      <span className="text-gray-600 leading-tight">{displayValue}{fName}</span>
                    </li>
                  );
                })}
              </ul>

              <button 
                onClick={() => handleBuyNow(plan)}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold uppercase tracking-wider text-xs transition-all",
                  plan.popular 
                    ? "bg-purple-600 text-white shadow-md hover:bg-purple-700" 
                    : "bg-gray-50 text-gray-900 border border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                )}
              >
                Choose Plan
                <ArrowRight size={14} className={cn("transition-transform", plan.popular ? "group-hover:translate-x-1" : "")} />
              </button>
            </div>
          )})}
        </div>
      </div>
    </section>
  );
}
