import React from 'react';
import { Database, Monitor, Server, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function HostingPlansSection({
  billingCycle,
  onBillingCycleChange,
  onNavigate,
}) {
  const dummyPlans = [
    {
      id: '1',
      name: 'SHARED HOSTING',
      price: 10,
      icon: Database,
      features: ['10 GB Storage', 'Unmetered Bandwidth', 'Free SSL', '1 Domain', '24/7 Support', '99.9% Uptime'],
      highlighted: false,
    },
    {
      id: '2',
      name: 'VPS HOSTING',
      price: 10,
      icon: Monitor,
      features: ['50 GB NVMe Storage', '2 TB Bandwidth', 'Free SSL', 'Unlimited Domains', '24/7 Priority Support', 'Dedicated IP'],
      highlighted: true,
    },
    {
      id: '3',
      name: 'DEDICATED SERVER',
      price: 10,
      icon: Server,
      features: ['1 TB Storage', 'Unmetered Bandwidth', 'Free SSL', 'Unlimited Domains', '24/7 Priority Support', 'Root Access'],
      highlighted: false,
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">CHOOSE A PLAN</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--c2i-blue-dark)] uppercase">OUR BEST PRICING</h2>
        </div>

        <div className="flex justify-center mb-16">
          <div className="inline-flex bg-white rounded-full p-1 border-2 border-[var(--c2i-blue-dark)]">
            <button
              onClick={() => onBillingCycleChange('yearly')}
              className={cn(
                "px-8 py-3 rounded-full text-sm font-bold transition-all uppercase tracking-wide",
                billingCycle === 'yearly' ? "bg-[var(--c2i-blue-dark)] text-white" : "text-[var(--c2i-blue-dark)] hover:bg-gray-100"
              )}
            >
              Yearly Plan
            </button>
            <button
              onClick={() => onBillingCycleChange('monthly')}
              className={cn(
                "px-8 py-3 rounded-full text-sm font-bold transition-all uppercase tracking-wide",
                billingCycle === 'monthly' ? "bg-[var(--c2i-blue-dark)] text-white" : "text-[var(--c2i-blue-dark)] hover:bg-gray-100"
              )}
            >
              Monthly Plan
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
          {dummyPlans.map((plan, idx) => (
            <div 
              key={idx} 
              className={cn(
                "relative rounded-2xl p-8 text-center transition-all duration-300",
                plan.highlighted 
                  ? "bg-[var(--c2i-blue-dark)] text-white shadow-2xl transform md:-translate-y-4 md:scale-105 border-4 border-[var(--c2i-blue-dark)]" 
                  : "bg-white text-[var(--c2i-blue-dark)] border border-gray-200 shadow-lg hover:shadow-xl"
              )}
            >
              <div className="flex justify-center mb-6">
                <plan.icon size={64} strokeWidth={1.5} className={plan.highlighted ? "text-white" : "text-[var(--c2i-blue-main)]"} />
              </div>
              <h3 className="text-xl font-bold uppercase mb-6 tracking-wide">{plan.name}</h3>
              
              <ul className="space-y-4 mb-8 text-left inline-block">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <Check size={16} className={plan.highlighted ? "text-[var(--c2i-orange)]" : "text-[var(--c2i-blue-light)]"} />
                    <span className={plan.highlighted ? "text-gray-200" : "text-gray-600"}>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mb-8">
                <p className="text-sm uppercase tracking-wider mb-2 opacity-80">Start From</p>
                <div className="flex items-center justify-center font-bold">
                  <span className="text-2xl align-top mt-1">$</span>
                  <span className="text-6xl tracking-tighter">{plan.price}</span>
                </div>
              </div>

              <button 
                className={cn(
                  "w-full py-4 rounded-full font-bold uppercase tracking-widest transition-all",
                  plan.highlighted 
                    ? "bg-white text-[var(--c2i-blue-dark)] hover:bg-gray-100" 
                    : "bg-[var(--c2i-blue-dark)] text-white hover:bg-[var(--c2i-blue-main)]"
                )}
                onClick={() => onNavigate('/hosting/cart')}
              >
                Buy Now
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
