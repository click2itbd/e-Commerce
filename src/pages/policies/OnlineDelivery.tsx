import React from 'react';
import { Layout } from '../../components/Layout';
import { SEO } from '../../components/SEO';
import {
  Truck,
  Clock,
  MapPin,
  Zap,
  ShieldCheck,
  HelpCircle,
  Phone,
  Mail,
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { DynamicPolicyPage } from '../../components/DynamicPolicyPage';

const OnlineDelivery = () => {
  const { settings } = useSettings();
  const brandName = settings?.brandName || 'Click2IT BD';
  const contactPhone = settings?.contactPhone || '+8809640887777';
  const contactEmail = settings?.contactEmail || 'info@click2itbd.com';

  return (
    <DynamicPolicyPage pageId="online-delivery" defaultTitle="Online Delivery Policy">
      <Layout fullWidth>
        <SEO
          title={`Shipping & Online Delivery Information - ${brandName}`}
          description={`Nationwide delivery timelines, shipping charges, and courier partners at ${brandName}.`}
        />
        <div className="bg-slate-50/80 py-10 md:py-16 min-h-screen">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200/80">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                  <Truck className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-slate-900">
                    Shipping &amp; Delivery Policy
                  </h1>
                  <p className="text-slate-500 text-sm mt-1">
                    Fast nationwide courier shipping and order processing timelines
                  </p>
                </div>
              </div>

              <div className="h-px bg-slate-100 my-6" />

              <div className="space-y-8 text-slate-700 leading-relaxed">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/70 p-6 rounded-2xl">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-6 h-6 text-emerald-600" />
                      <h3 className="text-lg font-bold text-slate-900">Inside Dhaka City</h3>
                    </div>
                    <p className="text-2xl font-extrabold text-emerald-700 mb-2">24 – 48 Hours</p>
                    <p className="text-xs text-slate-600 leading-normal">
                      Delivered via Pathao, SteadFast, RedX, or our dedicated rider directly to your doorstep. Express same-day delivery is available on request.
                    </p>
                    <div className="mt-4 text-xs font-bold text-slate-800 bg-white/90 px-3 py-1.5 rounded-lg border border-emerald-200 inline-block">
                      Standard Charge: ৳ 60 – ৳ 100 BDT
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/70 p-6 rounded-2xl">
                    <div className="flex items-center gap-3 mb-2">
                      <MapPin className="w-6 h-6 text-blue-600" />
                      <h3 className="text-lg font-bold text-slate-900">Outside Dhaka (Nationwide)</h3>
                    </div>
                    <p className="text-2xl font-extrabold text-blue-700 mb-2">2 to 5 Working Days</p>
                    <p className="text-xs text-slate-600 leading-normal">
                      Dispatched via SteadFast, Sundarban Courier, or SA Paribahan across all 64 districts of Bangladesh with home or hub delivery options.
                    </p>
                    <div className="mt-4 text-xs font-bold text-slate-800 bg-white/90 px-3 py-1.5 rounded-lg border border-blue-200 inline-block">
                      Standard Charge: ৳ 120 – ৳ 200 BDT
                    </div>
                  </div>
                </div>

                <section>
                  <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    1. Order Processing &amp; Dispatch
                  </h2>
                  <p className="text-sm text-slate-600">
                    Orders placed before <strong>4:00 PM</strong> are verified and handed over to our courier partner on the same working day. Orders placed after 4:00 PM or during public holidays are dispatched on the next business day.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    2. Secure Packaging &amp; Unboxing Guidelines
                  </h2>
                  <p className="text-sm text-slate-600 mb-2">
                    All delicate PC hardware (Graphics Cards, Processors, Motherboards, Monitors, and Custom Builds) are packed with multi-layer bubble protection and reinforced cartons.
                  </p>
                  <ul className="list-disc pl-6 space-y-1.5 text-sm text-slate-600">
                    <li>Please record a continuous <strong>unboxing video</strong> when opening high-value shipments.</li>
                    <li>If the outer security seal appears tampered with or damaged, contact our support hotline immediately before accepting delivery.</li>
                  </ul>
                </section>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mt-8">
                  <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-blue-600" />
                    Need help tracking your shipment?
                  </h3>
                  <p className="text-sm text-slate-600 mb-3">
                    Contact our logistics support desk with your Order or Invoice ID for a real-time courier update.
                  </p>
                  <div className="flex flex-wrap gap-6 text-sm font-semibold">
                    <a href={`tel:${contactPhone}`} className="text-blue-600 hover:underline inline-flex items-center gap-1.5">
                      <Phone className="w-4 h-4" /> {contactPhone}
                    </a>
                    <a href={`mailto:${contactEmail}`} className="text-blue-600 hover:underline inline-flex items-center gap-1.5">
                      <Mail className="w-4 h-4" /> {contactEmail}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </DynamicPolicyPage>
  );
};

export default OnlineDelivery;
