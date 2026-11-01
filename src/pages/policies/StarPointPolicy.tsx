import React from 'react';
import { Layout } from '../../components/Layout';
import { SEO } from '../../components/SEO';
import { Link } from 'react-router-dom';
import {
  Star,
  Gift,
  Zap,
  ShieldCheck,
  ArrowRight,
  Coins,
  CheckCircle2,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { DynamicPolicyPage } from '../../components/DynamicPolicyPage';

const StarPointPolicy = () => {
  const { settings } = useSettings();
  const brandName = settings?.brandName || 'Click2IT BD';

  return (
    <DynamicPolicyPage pageId="star-point-policy" defaultTitle="Star Point Policy">
      <Layout fullWidth>
        <SEO
          title={`Star Point & Loyalty Rewards Policy - ${brandName}`}
          description={`Learn how to earn, redeem, and maximize your Star Points on electronics, computer components, and IT services at ${brandName}.`}
        />
        <div className="bg-slate-50/80 py-10 md:py-16 min-h-screen">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            {/* Top Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-8 md:p-12 mb-8 shadow-xl">
              <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-4">
                    <Sparkles className="w-3.5 h-3.5" /> Official Loyalty Program
                  </div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight mb-3">
                    Star Point <span className="text-amber-400">Rewards Policy</span>
                  </h1>
                  <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                    Shop smarter at <strong>{brandName}</strong>. Earn reward points on every purchase of PC components, laptops, gadgets, and IT services—and redeem them for instant cash discounts at checkout.
                  </p>
                </div>

                {/* Quick Conversion Badge */}
                <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 shrink-0 text-center md:min-w-[220px]">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center mx-auto mb-2.5">
                    <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                  </div>
                  <div className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                    Point Value
                  </div>
                  <div className="text-2xl font-black text-white mt-0.5">
                    1 Point = <span className="text-amber-400">৳1 BDT</span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1">
                    Instant Checkout Discount
                  </div>
                </div>
              </div>
            </div>

            {/* 3-Step How It Works Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <span className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-black text-base">
                    01
                  </span>
                  <Coins className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-1.5">Earn on Orders</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Receive <strong>1 Star Point</strong> for every <strong>৳100 BDT</strong> spent on eligible tech products, custom PC builds, and services.
                </p>
              </div>

              <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <span className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-black text-base">
                    02
                  </span>
                  <UserCheck className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-1.5">Track in Profile</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Points are automatically credited to your registered customer account once your order is delivered and completed.
                </p>
              </div>

              <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <span className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-black text-base">
                    03
                  </span>
                  <Gift className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-1.5">Redeem Instantly</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Apply your accumulated Star Points directly on the checkout screen to reduce your payable order total.
                </p>
              </div>
            </div>

            {/* Detailed Policy Content Card */}
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200/80 space-y-10 text-slate-700 leading-relaxed">
              {/* 1. Program Overview */}
              <section>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                    <Gift className="w-5 h-5" />
                  </div>
                  1. What is the Star Points Program?
                </h2>
                <p className="text-sm md:text-base text-slate-600">
                  <strong>Star Points</strong> is {brandName}&apos;s official customer loyalty and reward system designed to give back to our regular customers. Whenever you purchase computer hardware, laptops, monitors, gaming accessories, networking gear, or web services through our online store or retail outlet, you earn reward points linked directly to your account.
                </p>
              </section>

              <div className="h-px bg-slate-100" />

              {/* 2. How to Earn */}
              <section>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Zap className="w-5 h-5" />
                  </div>
                  2. How to Earn Star Points
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                    <div className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      Standard Hardware Purchases
                    </div>
                    <p className="text-xs text-slate-600">
                      Earn <strong>1 Star Point</strong> for every <strong>৳100 BDT</strong> spent on eligible products across our store.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                    <div className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      Verified Buyer Reviews
                    </div>
                    <p className="text-xs text-slate-600">
                      Earn bonus Star Points when you submit an approved product review after purchasing an item.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                    <div className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      Custom PC Builder Orders
                    </div>
                    <p className="text-xs text-slate-600">
                      Full desktop builds ordered via our PC Builder qualify for Star Points on the total hardware invoice value.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                    <div className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      Special Promotional Campaigns
                    </div>
                    <p className="text-xs text-slate-600">
                      Unlock 2X multiplier Star Points on featured brands during seasonal tech fests, Eid campaigns, and flash events.
                    </p>
                  </div>
                </div>
              </section>

              <div className="h-px bg-slate-100" />

              {/* 3. Valuation & Redemption Rules */}
              <section>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <Star className="w-5 h-5" />
                  </div>
                  3. Valuation & Redemption Guidelines
                </h2>
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-5 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-amber-700">
                      Official Redemption Rate
                    </div>
                    <div className="text-xl font-black text-slate-900 mt-0.5">
                      1 Star Point = <span className="text-emerald-600">৳1.00 BDT Instant Discount</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-3.5 py-1.5 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 shadow-2xs">
                    Min. Redeem: 50 Points (৳50)
                  </span>
                </div>

                <ul className="list-disc pl-6 space-y-2.5 text-sm text-slate-600">
                  <li>
                    <strong>Minimum Threshold:</strong> You must have at least <strong>50 Star Points (equivalent to ৳50 BDT)</strong> in your account balance to redeem points at checkout.
                  </li>
                  <li>
                    <strong>Online & POS Checkout:</strong> You must be logged in to your registered account during checkout to view and apply your available Star Points.
                  </li>
                  <li>
                    <strong>Non-Transferable:</strong> Star Points are bound to the earning customer account and cannot be transferred, sold, or encashed for physical currency outside of order discounts.
                  </li>
                  <li>
                    <strong>Cancelled or Returned Orders:</strong> If an order is cancelled or returned for a refund, the Star Points earned from that transaction will be automatically reversed from your balance.
                  </li>
                </ul>
              </section>

              <div className="h-px bg-slate-100" />

              {/* 4. Validity & Expiration */}
              <section>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  4. Validity & Expiration Policy
                </h2>
                <p className="text-sm md:text-base text-slate-600">
                  Star Points remain valid for <strong>365 days (12 months)</strong> from the date they are credited to your account. Unused points that pass their 1-year validity period will expire automatically. {brandName} reserves the right to modify point earning rates or promotional terms at any time without prior notice.
                </p>
              </section>

              {/* Bottom CTA Banner */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-6 md:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 shadow-lg">
                <div>
                  <h3 className="font-bold text-xl">Ready to Start Earning Star Points?</h3>
                  <p className="text-blue-100 text-sm mt-1">
                    Browse our latest hardware collection or check your current Star Points balance in your profile.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <Link
                    to="/profile"
                    className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white border border-white/25 rounded-xl font-bold text-sm transition-colors"
                  >
                    My Points Balance
                  </Link>
                  <Link
                    to="/"
                    className="px-5 py-2.5 bg-white text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-sm"
                  >
                    Explore Shop <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </DynamicPolicyPage>
  );
};

export default StarPointPolicy;
