import React from 'react';
import { Layout } from '../../components/Layout';
import { SEO } from '../../components/SEO';
import {
  CreditCard,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Building2,
  HelpCircle,
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
          title={`EMI Terms & Conditions - ${brandName}`}
          description={`Learn about Credit Card EMI facility, tenures, and eligibility at ${brandName}.`}
        />
        <div className="bg-slate-50/80 py-10 md:py-16 min-h-screen">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200/80">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3.5 bg-orange-50 text-orange-600 rounded-2xl border border-orange-100">
                  <CreditCard className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-slate-900">
                    EMI Terms &amp; Conditions
                  </h1>
                  <p className="text-slate-500 text-sm mt-1">
                    Flexible monthly installment plans for laptops, PC builds, and electronics
                  </p>
                </div>
              </div>

              <div className="h-px bg-slate-100 my-6" />

              <div className="space-y-8 text-slate-700 leading-relaxed">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-orange-50/60 border border-orange-200/70 p-5 rounded-2xl">
                    <Clock className="w-6 h-6 text-orange-600 mb-2" />
                    <h3 className="font-bold text-slate-900 text-base mb-1">Flexible Tenures</h3>
                    <p className="text-xs text-slate-600">
                      Choose between 3, 6, 9, or 12 months installment plans on eligible bank credit cards.
                    </p>
                  </div>
                  <div className="bg-blue-50/60 border border-blue-200/70 p-5 rounded-2xl">
                    <Building2 className="w-6 h-6 text-blue-600 mb-2" />
                    <h3 className="font-bold text-slate-900 text-base mb-1">Minimum Order Value</h3>
                    <p className="text-xs text-slate-600">
                      EMI facility is applicable on single or combined invoices totaling <strong>৳10,000 BDT</strong> or above.
                    </p>
                  </div>
                  <div className="bg-emerald-50/60 border border-emerald-200/70 p-5 rounded-2xl">
                    <ShieldCheck className="w-6 h-6 text-emerald-600 mb-2" />
                    <h3 className="font-bold text-slate-900 text-base mb-1">In-Store &amp; Online</h3>
                    <p className="text-xs text-slate-600">
                      Available at our retail showroom POS and through verified online checkout assistance.
                    </p>
                  </div>
                </div>

                <section>
                  <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    1. General EMI Guidelines
                  </h2>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-slate-600">
                    <li>
                      EMI (Equated Monthly Installment) is strictly available for <strong>Credit Card holders</strong> of participating commercial banks in Bangladesh (Debit cards are not eligible for bank EMI).
                    </li>
                    <li>
                      Special cash discount prices shown on select products may differ from regular MRP/EMI prices depending on bank convenience charges.
                    </li>
                    <li>
                      Once an EMI transaction is processed, the issuing bank typically takes 3 to 7 working days to convert the transaction into monthly installments on your statement.
                    </li>
                  </ul>
                </section>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                  <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-orange-500" />
                    Want to check EMI availability for your bank card?
                  </h3>
                  <p className="text-sm text-slate-600 mb-3">
                    Call or email our sales desk before placing your order for exact tenure charges and supported bank cards.
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

export default EMITerms;
