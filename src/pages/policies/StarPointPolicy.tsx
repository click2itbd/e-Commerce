import React from 'react';
import { Layout } from '../../components/Layout';
import { SEO } from '../../components/SEO';
import { Star, Gift, Zap, ShieldCheck, ArrowRight } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

const StarPointPolicy = () => {
  const { settings } = useSettings();

  return (
    <Layout fullWidth>
      <SEO 
        title={`Star Point & Loyalty Rewards Policy - ${settings.brandName}`} 
        description={`Learn how to earn, redeem, and maximize your Star Points on electronics, computer accessories, and web hosting at ${settings.brandName}.`} 
      />
      <div className="bg-gray-50 py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl">
                <Star className="w-8 h-8 fill-amber-400" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Star Point & Loyalty Policy</h1>
                <p className="text-gray-500 text-sm mt-1">Earn points on every purchase and redeem instant discounts</p>
              </div>
            </div>

            <div className="h-px bg-gray-100 my-6" />

            <div className="space-y-8 text-gray-700 leading-relaxed">
              {/* How it works cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
                <div className="bg-amber-50/50 border border-amber-100 p-5 rounded-2xl text-center">
                  <div className="w-10 h-10 mx-auto bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-lg mb-3">
                    1
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-1">Earn Points</h3>
                  <p className="text-xs text-gray-600">Get 1 Star Point for every ৳100 spent across products & hosting.</p>
                </div>
                <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl text-center">
                  <div className="w-10 h-10 mx-auto bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg mb-3">
                    2
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-1">Accumulate</h3>
                  <p className="text-xs text-gray-600">Watch your points balance grow in your account dashboard.</p>
                </div>
                <div className="bg-green-50/50 border border-green-100 p-5 rounded-2xl text-center">
                  <div className="w-10 h-10 mx-auto bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg mb-3">
                    3
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-1">Redeem Discounts</h3>
                  <p className="text-xs text-gray-600">Apply points directly at checkout to reduce your total payable amount.</p>
                </div>
              </div>

              {/* 1. What are Star Points */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-500" />
                  1. What is the Star Points Program?
                </h2>
                <p>
                  <strong>Star Points</strong> is {settings.brandName}'s exclusive customer rewards program designed to reward our loyal clients. Every time you purchase hardware, desktop components, peripherals, domain names, or web hosting services through our online platform or retail store, you earn reward points linked to your customer profile.
                </p>
              </section>

              {/* 2. Earning Points */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  2. How to Earn Star Points
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700">
                  <li><strong>Standard Purchases:</strong> Earn 1 Star Point for every <strong>৳100 BDT</strong> spent on eligible products.</li>
                  <li><strong>Hosting & Server Plans:</strong> Earn bonus 2X Star Points on annual, biennial, or triennial cloud hosting package subscriptions.</li>
                  <li><strong>Product Reviews:</strong> Earn 10 bonus Star Points when you submit an approved verified buyer review on our website.</li>
                  <li><strong>Special Promotions:</strong> Earn multiplier points during holiday campaigns, Eid sales, and Black Friday tech promotions.</li>
                </ul>
              </section>

              {/* 3. Value & Redemption */}
              <section className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" />
                  3. Points Valuation & Redemption Rules
                </h2>
                <div className="bg-white p-4 rounded-xl border border-gray-200 mb-4 inline-block">
                  <p className="font-bold text-lg text-gray-900">
                    🪙 1 Star Point = <span className="text-green-600">৳1.00 BDT Cash Value</span>
                  </p>
                </div>
                <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700">
                  <li>Minimum points required for redemption: <strong>50 Star Points (৳50 discount)</strong>.</li>
                  <li>Points can be applied at the checkout screen before final payment authorization.</li>
                  <li>Star Points can be combined with active promotional coupon codes unless explicitly restricted by a flash sale campaign.</li>
                  <li>Points are non-transferable between customer accounts and cannot be exchanged directly for liquid cash.</li>
                </ul>
              </section>

              {/* 4. Validity & Expiry */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                  4. Expiration & Account Policies
                </h2>
                <p className="text-sm">
                  Star Points remain valid for <strong>365 days (1 year)</strong> from the date they are credited to your account. Points associated with returned or refunded orders will be deducted from your point balance automatically.
                </p>
              </section>

              {/* CTA */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <h3 className="font-bold text-lg">Start Earning Points Today!</h3>
                  <p className="text-blue-100 text-xs mt-1">Create an account or login to track your current Star Points balance.</p>
                </div>
                <a 
                  href="/shop" 
                  className="px-5 py-2.5 bg-white text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors flex items-center gap-2 shrink-0"
                >
                  Explore Products <ArrowRight size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StarPointPolicy;
