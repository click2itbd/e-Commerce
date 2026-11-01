import React from 'react';
import { Layout } from '../../components/Layout';
import { SEO } from '../../components/SEO';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Clock,
  Sparkles,
  Wallet,
  Truck,
  Building2,
  ArrowRight,
  Phone,
  Mail,
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { DynamicPolicyPage } from '../../components/DynamicPolicyPage';

const EMITerms = () => {
  const { settings } = useSettings();
  const brandName = settings?.brandName || 'Click2IT BD';
  const contactPhone = settings?.contactPhone || '+8809640887777';
  const contactEmail = settings?.contactEmail || 'info@click2itbd.com';

  return (
    <DynamicPolicyPage pageId="emi-terms" defaultTitle="EMI Terms & Conditions">
      <Layout fullWidth>
        <SEO
          title={`EMI Policy & Future Plans - ${brandName}`}
          description={`Information regarding EMI (Equated Monthly Installment) availability and current payment methods at ${brandName}.`}
        />
        <div className="bg-slate-50/80 py-10 md:py-16 min-h-screen">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200/80">
              {/* Top Hero Announcement */}
              <div className="text-center max-w-2xl mx-auto py-4">
                <div className="w-20 h-20 bg-orange-50 border border-orange-200/80 text-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 relative shadow-xs">
                  <CreditCard className="w-10 h-10" />
                  <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm">
                    <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold uppercase tracking-wider mb-4">
                  <Sparkles className="w-3.5 h-3.5" /> Future Roadmap Update
                </div>

                <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">
                  EMI Facility is <span className="text-orange-500">Not Active Yet</span>
                </h1>

                <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                  At present, <strong>{brandName}</strong> does not offer monthly installment (EMI) payment options. All online and showroom purchases are currently processed through standard one-time payment methods.
                </p>

                <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 text-left">
                  <h2 className="text-sm font-bold text-blue-950 mb-1 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                    Our Future Plan for Bank EMI
                  </h2>
                  <p className="text-xs md:text-sm text-blue-900/80 leading-relaxed">
                    We understand that many customers prefer flexible monthly installment plans when buying custom gaming PCs, laptops, and high-end components. Our management team is actively evaluating partnerships with leading commercial banks in Bangladesh to introduce <strong>3, 6, 9, and 12-month Credit Card EMI</strong> in a future update.
                  </p>
                </div>
              </div>

              <div className="h-px bg-slate-100 my-8" />

              {/* Currently Supported Payment Methods */}
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4 text-center">
                  Payment Methods Available Right Now
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center mb-3">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm mb-1">
                      Mobile Banking (MFS)
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Instant payment via <strong>bKash, Nagad, and Rocket</strong> for both online orders and retail POS purchases.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                      <Truck className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm mb-1">
                      Cash on Delivery (COD)
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Pay in cash upon receiving your product at your doorstep anywhere in Dhaka and across all 64 districts.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm mb-1">
                      Bank Transfer &amp; Showroom Cash
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Direct bank deposit, BEFTN/NPSB transfer, or instant cash payment at our retail showroom.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer Contact / CTA */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-5 text-xs md:text-sm font-semibold text-slate-600">
                  <span>Questions about payment?</span>
                  <a
                    href={`tel:${contactPhone}`}
                    className="text-blue-600 hover:underline inline-flex items-center gap-1.5"
                  >
                    <Phone className="w-4 h-4" /> {contactPhone}
                  </a>
                  <a
                    href={`mailto:${contactEmail}`}
                    className="text-blue-600 hover:underline inline-flex items-center gap-1.5"
                  >
                    <Mail className="w-4 h-4" /> {contactEmail}
                  </a>
                </div>

                <Link
                  to="/"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-blue-600 text-white rounded-xl font-bold text-sm transition-colors inline-flex items-center gap-2 shrink-0"
                >
                  Continue Shopping <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </DynamicPolicyPage>
  );
};

export default EMITerms;
