import React from 'react';
import { Layout } from '../../components/Layout';
import { SEO } from '../../components/SEO';
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Mail,
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { DynamicPolicyPage } from '../../components/DynamicPolicyPage';

const RefundPolicy = () => {
  const { settings } = useSettings();
  const brandName = settings?.brandName || 'Click2IT BD';
  const contactEmail = settings?.contactEmail || 'info@click2itbd.com';
  const contactPhone = settings?.contactPhone || '+8809640887777';

  return (
    <DynamicPolicyPage pageId="refund-policy" defaultTitle="Return & Refund Policy">
      <Layout fullWidth>
        <SEO
          title={`Return & Refund Policy - ${brandName}`}
          description={`Return, replacement, and refund policies for computer hardware, laptops, and custom PC builds at ${brandName}.`}
        />
        <div className="bg-slate-50/80 py-10 md:py-16 min-h-screen">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200/80">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
                  <RotateCcw className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-slate-900">
                    Return &amp; Refund Policy
                  </h1>
                  <p className="text-slate-500 text-sm mt-1">
                    Transparent return, replacement, and refund guidelines for hardware &amp; PC builds
                  </p>
                </div>
              </div>

              <div className="h-px bg-slate-100 my-6" />

              <div className="space-y-8 text-slate-700 leading-relaxed">
                <section>
                  <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    1. 3-Day Return &amp; Replacement Eligibility
                  </h2>
                  <p className="text-sm text-slate-600">
                    At <strong>{brandName}</strong>, we guarantee 100% genuine, factory-sealed tech products. You may request an instant return or replacement within <strong>3 days (72 hours) of delivery</strong> if:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1.5 text-sm text-slate-600">
                    <li>The product is Dead on Arrival (DOA) or fails to power on out of the box.</li>
                    <li>The item has a verifiable manufacturing defect upon unboxing.</li>
                    <li>An incorrect model, specification, or wrong item was shipped to you.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    2. Mandatory Conditions for Return
                  </h2>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-slate-600">
                    <li>
                      The product must be returned in its <strong>original intact box</strong> with all factory manuals, cables, screws, driver discs, and warranty stickers undamaged.
                    </li>
                    <li>
                      You must provide the original <strong>Sales Invoice</strong> and a clear <strong>unboxing video</strong> (mandatory for courier deliveries outside Dhaka).
                    </li>
                    <li>
                      Products with scratched surfaces, bent motherboard/CPU pins, torn serial labels, or missing accessories will not be accepted for return.
                    </li>
                  </ul>
                </section>

                <section className="bg-rose-50/60 border border-rose-200 rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-rose-900 mb-3 flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-rose-600" />
                    3. Non-Returnable &amp; Non-Refundable Items
                  </h2>
                  <ul className="list-disc pl-6 space-y-1.5 text-xs md:text-sm text-rose-800">
                    <li>
                      <strong>Custom Built PCs:</strong> Once components are unboxed and assembled according to your Custom PC Builder order, the full rig cannot be returned for a cash refund. Any defective individual component is covered under official replacement/RMA warranty.
                    </li>
                    <li>
                      <strong>Unsealed Consumables &amp; Software:</strong> Opened antivirus keys, operating system licenses, thermal paste, or printers with installed ink/toner cartridges.
                    </li>
                    <li>
                      <strong>Change of Mind:</strong> Opened hardware products cannot be returned simply due to personal preference or compatibility mistakes if the product matches the invoice specification.
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-600" />
                    4. Refund Processing Timeline
                  </h2>
                  <p className="text-sm text-slate-600">
                    Once your returned hardware is inspected and approved by our technical team, if an identical replacement unit is out of stock, a full refund of the product price will be issued to your original payment method (<strong>bKash, Nagad, Rocket, or Bank Account</strong>) within <strong>5 to 7 working days</strong>.
                  </p>
                  <p className="mt-2 text-xs text-slate-500 italic border-l-4 border-slate-300 pl-3">
                    Note: Courier shipping charges are non-refundable unless the return is due to a wrong or defective item shipped by {brandName}.
                  </p>
                </section>

                <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
                  <h3 className="text-lg font-bold text-blue-950 mb-1.5">
                    How to Initiate a Return or Refund
                  </h3>
                  <p className="text-blue-900/80 text-sm mb-3">
                    Contact our support team with your Order/Invoice ID and unboxing footage within 72 hours of receiving your parcel:
                  </p>
                  <div className="flex flex-wrap gap-6 text-sm font-semibold">
                    <a href={`tel:${contactPhone}`} className="text-blue-700 hover:underline inline-flex items-center gap-1.5">
                      <Phone className="w-4 h-4" /> {contactPhone}
                    </a>
                    <a href={`mailto:${contactEmail}`} className="text-blue-700 hover:underline inline-flex items-center gap-1.5">
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

export default RefundPolicy;
