import React, { useState, useEffect } from 'react';
import { Zap, Check, ArrowRight, Sparkles, Shield, Rocket, Cpu, Server } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

const CANONICAL_WP_PLANS = [
  {
    id: 'wp_starter',
    name: 'WP Starter',
    badge: 'Student & Blogger',
    description: 'Perfect for fast personal blogs, portfolio sites, and student projects.',
    pricing: { monthly: 250, annually: 2400 },
    space: '10 GB Pure NVMe SSD',
    cpu: '2 vCPU Cores',
    ram: '2 GB DDR4 RAM',
    websites: '1 Website',
    bandwidth: 'BDIX 100 GB Traffic',
    features: [
      '10 GB Pure NVMe SSD',
      '2 vCPU Cores & 2 GB RAM',
      'LiteSpeed Enterprise Web Server',
      'LSCache & Redis Acceleration',
      'Free Unlimited SSL Certificate',
      '1-Click WordPress Staging',
      'Daily Automated JetBackup',
      'Automated WP Core & Plugin Updates',
      'Free Website Migration',
      '24/7 Priority Support'
    ],
  },
  {
    id: 'wp_pro',
    name: 'WP Pro Turbo',
    badge: 'Most Popular',
    popular: true,
    description: 'Designed for high-traffic blogs, dynamic magazines, and growing startups.',
    pricing: { monthly: 500, annually: 4800 },
    space: '25 GB Pure NVMe SSD',
    cpu: '4 vCPU Cores',
    ram: '4 GB DDR4 RAM',
    websites: '5 Websites',
    bandwidth: 'Unlimited BDIX Traffic',
    features: [
      '25 GB Pure NVMe SSD',
      '4 vCPU Cores & 4 GB RAM',
      'LiteSpeed Enterprise + QUIC.cloud',
      'Dedicated Redis Object Cache',
      'Free SSL & HTTP/3 Support',
      '1-Click Staging & Cloning',
      'Daily Automated Backups (30 Days)',
      'Free Premium Elementor Tools',
      'WP-CLI & Git Version Control',
      '24/7 Expert WP Support'
    ],
  },
  {
    id: 'wp_ecom',
    name: 'E-Commerce Ultra',
    badge: 'WooCommerce Boost',
    description: 'Optimized for WooCommerce, high-checkout sales, and database-heavy shops.',
    pricing: { monthly: 950, annually: 9120 },
    space: '50 GB Pure NVMe SSD',
    cpu: '6 vCPU Cores',
    ram: '8 GB DDR4 RAM',
    websites: 'Unlimited Websites',
    bandwidth: 'Unlimited BDIX Traffic',
    features: [
      '50 GB Pure NVMe SSD',
      '6 vCPU Cores & 8 GB RAM',
      'LiteSpeed Enterprise High-Concurrency',
      'High-Speed Redis & Memcached',
      'Dedicated IP Address Included',
      'WooCommerce Cart & Checkout Boost',
      'Real-time Malware Shield & WAF',
      'Daily & On-Demand Snapshots',
      'Free SSL & Anti-DDoS Protection',
      'Dedicated VIP Support Manager'
    ],
  },
  {
    id: 'wp_mega',
    name: 'Mega Portal Cloud',
    badge: 'High Traffic Enterprise',
    description: 'Maximum power for large news portals, high-traffic communities, and agencies.',
    pricing: { monthly: 1800, annually: 17280 },
    space: '100 GB Pure NVMe SSD',
    cpu: '8 vCPU Cores',
    ram: '16 GB DDR4 RAM',
    websites: 'Unlimited Websites',
    bandwidth: 'Unmetered 1Gbps BDIX',
    features: [
      '100 GB Pure NVMe SSD',
      '8 vCPU Cores & 16 GB RAM',
      'Extreme LiteSpeed Enterprise',
      'Isolated CloudLinux LVE Container',
      'Dedicated IP + Custom Nameservers',
      'Unlimited MySQL & Subdomains',
      'Premium CDN & Advanced Firewall',
      'Hourly Automated Backups',
      'Free White-glove Migration',
      'Direct WhatsApp VIP Support'
    ],
  }
];

export default function WordPressCloudSection() {
  const [billingCycle, setBillingCycle] = useState('annually');
  const [plans, setPlans] = useState(CANONICAL_WP_PLANS);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'hostingPlans'), (snapshot) => {
      if (!snapshot.empty) {
        const wpDocs = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter((p) => p.category === 'wordpress' || p.id.startsWith('wp_') || p.id.startsWith('wp-'))
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        if (wpDocs.length > 0) {
          const merged = wpDocs.map((docItem) => {
            const canonical = CANONICAL_WP_PLANS.find(c => c.id === docItem.id || c.id === `wp_${docItem.slug}`) || {};
            const monthlyPrice = docItem.priceOverride && docItem.overridePrice > 0 
              ? docItem.overridePrice 
              : (docItem.pricing?.monthly || canonical.pricing?.monthly || 250);
            const annualPrice = docItem.priceOverride && docItem.overrideAnnualPrice > 0 
              ? docItem.overrideAnnualPrice 
              : (docItem.pricing?.annually || Math.round(monthlyPrice * 12 * 0.8));

            return {
              id: docItem.id,
              name: docItem.name || canonical.name || 'WordPress Cloud',
              badge: docItem.badge || canonical.badge,
              popular: docItem.popular ?? canonical.popular ?? false,
              description: docItem.description || canonical.description || 'Optimized BDIX Turbo WordPress hosting with NVMe SSD.',
              pricing: {
                monthly: monthlyPrice,
                annually: annualPrice
              },
              cpu: docItem.cloudLinuxLimits?.cpu ? `${docItem.cloudLinuxLimits.cpu}% vCPU` : (canonical.cpu || '4 vCPU Cores'),
              ram: docItem.cloudLinuxLimits?.pmem ? `${docItem.cloudLinuxLimits.pmem} MB RAM` : (canonical.ram || '4 GB RAM'),
              space: docItem.comparisonValues?.disk_space || canonical.space || '25 GB Pure NVMe SSD',
              features: docItem.features || canonical.features || [
                'Pure NVMe SSD Storage',
                'LiteSpeed Enterprise Web Server',
                'Dedicated Redis Object Cache',
                'Free SSL Certificate',
                'Daily Automated Backups'
              ]
            };
          });
          setPlans(merged);
        }
      }
    }, (err) => console.log('Firestore WP Plans error:', err));

    return () => unsub();
  }, []);

  const handleOrder = (plan) => {
    const isAnnual = billingCycle === 'annually';
    const price = isAnnual ? plan.pricing.annually : plan.pricing.monthly;
    
    addToCart({
      id: `${plan.id}_${billingCycle}`,
      name: `${plan.name} (Managed WordPress Cloud)`,
      price: price,
      billingCycle: isAnnual ? 'yearly' : 'monthly',
      category: 'Hosting & Domains',
      itemType: 'hosting',
      planSlug: plan.id,
      quantity: 1,
      image: '/images/hosting-icon.png',
      details: {
        cpu: plan.cpu,
        ram: plan.ram,
        space: plan.space
      }
    });

    toast.success(`${plan.name} added to cart!`);
    navigate('/hosting/cart');
  };

  return (
    <section id="wordpress-cloud" className="py-20 bg-gradient-to-b from-gray-900 via-slate-900 to-gray-950 text-white relative overflow-hidden scroll-mt-20">
      {/* Glow Effects */}
      <div className="absolute top-0 left-1/4 w-48 h-48 md:w-96 md:h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-48 h-48 md:w-96 md:h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400 border border-blue-500/30 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-4">
            <Rocket size={14} className="text-blue-400 animate-pulse" />
            BDIX Turbo Powered WordPress Cloud
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
            Managed WordPress & E-Commerce Cloud
          </h2>
          <p className="text-gray-400 text-base md:text-lg">
            Up to 20x faster page load speed powered by LiteSpeed Enterprise, Redis Object Cache, and high-speed BDIX local network peering.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="mt-8 inline-flex items-center bg-gray-800/80 p-1.5 rounded-2xl border border-gray-700">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={cn(
                "px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                billingCycle === 'monthly'
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                  : "text-gray-400 hover:text-white"
              )}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annually')}
              className={cn(
                "px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                billingCycle === 'annually'
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-500/25"
                  : "text-gray-400 hover:text-white"
              )}
            >
              <span>Annual Prepay</span>
              <span className="bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const isAnnual = billingCycle === 'annually';
            const price = isAnnual ? plan.pricing.annually : plan.pricing.monthly;

            return (
              <div
                key={plan.id}
                className={cn(
                  "bg-gray-800/60 backdrop-blur-xl border rounded-3xl p-6 md:p-7 flex flex-col justify-between transition-all duration-300 relative group hover:-translate-y-1.5 hover:shadow-2xl",
                  plan.popular 
                    ? "border-blue-500/80 shadow-lg shadow-blue-500/10 bg-gradient-to-b from-blue-950/40 via-gray-800/80 to-gray-900" 
                    : "border-gray-700/60 hover:border-gray-600"
                )}
              >
                {plan.badge && (
                  <div className={cn(
                    "absolute -top-3.5 left-1/2 -translate-x-1/2 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full shadow-md tracking-wider whitespace-nowrap",
                    plan.popular ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-blue-500/30" : "bg-gray-700 text-gray-300"
                  )}>
                    {plan.badge}
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold text-white mb-1.5">{plan.name}</h3>
                  <p className="text-xs text-gray-400 mb-5 min-h-[32px] leading-relaxed">{plan.description}</p>

                  {/* Price Block */}
                  <div className="pb-5 mb-6 border-b border-gray-700/60">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl md:text-4xl font-black text-white">৳{price.toLocaleString()}</span>
                      <span className="text-xs text-gray-400 font-medium">{isAnnual ? '/year' : '/month'}</span>
                    </div>
                    {isAnnual && (
                      <span className="inline-block mt-1 text-[11px] text-emerald-400 font-semibold">
                        Includes 20% annual discount
                      </span>
                    )}
                  </div>

                  {/* Hardware Specs Highlights */}
                  <div className="grid grid-cols-2 gap-2 mb-6 bg-gray-900/60 p-3 rounded-2xl border border-gray-700/40 text-center">
                    <div>
                      <span className="block text-[10px] text-gray-400 font-medium">CPU Power</span>
                      <span className="text-xs font-bold text-blue-400">{plan.cpu}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-400 font-medium">Memory RAM</span>
                      <span className="text-xs font-bold text-emerald-400">{plan.ram}</span>
                    </div>
                  </div>

                  {/* Feature list */}
                  <div className="space-y-2.5 mb-8">
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 text-xs text-gray-300">
                        <div className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                          <Check size={11} className="stroke-[2.5]" />
                        </div>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOrder(plan)}
                  className={cn(
                    "w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer",
                    plan.popular
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25"
                      : "bg-gray-700 hover:bg-gray-600 text-white"
                  )}
                >
                  Buy Cloud Now
                  <ArrowRight size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
