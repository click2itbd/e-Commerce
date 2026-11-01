import React from 'react';
import { Layout } from '../../components/Layout';
import { SEO } from '../../components/SEO';
import { FileText, Phone, Mail } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

const TermsOfService = () => {
  const { settings } = useSettings();
  const brandName = settings?.brandName || 'Click2IT BD';
  const contactEmail = settings?.contactEmail || 'info@click2itbd.com';
  const contactPhone = settings?.contactPhone || '+8809640887777';

  return (
    <Layout fullWidth>
      <SEO
        title={`Terms & Conditions - ${brandName}`}
        description={`Terms and Conditions for purchasing computer hardware, gadgets, and custom PC builds at ${brandName}.`}
      />
      <div className="bg-slate-50/80 py-10 md:py-16 min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200/80">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3.5 bg-slate-100 text-slate-800 rounded-2xl border border-slate-200">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900">
                  Terms &amp; Conditions
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                  Official terms governing online orders, retail purchases, and custom PC builds
                </p>
              </div>
            </div>

            <div className="h-px bg-slate-100 my-6" />

            <div className="space-y-8 text-slate-700 leading-relaxed text-sm md:text-base">
              <section>
                <h2 className="text-xl font-bold text-slate-900 mb-2">1. Acceptance of Terms</h2>
                <p className="text-slate-600">
                  By accessing and placing an order on <strong>{brandName}</strong>, you agree to abide by these Terms &amp; Conditions. These terms apply to all online e-commerce orders, Custom PC Builder quotations, and retail showroom purchases.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-900 mb-2">2. Product Pricing &amp; Stock Availability</h2>
                <ul className="list-disc pl-6 space-y-2 text-slate-600">
                  <li>
                    All prices listed on our website are in <strong>Bangladeshi Taka (BDT / ৳)</strong>.
                  </li>
                  <li>
                    Due to global hardware market fluctuations, component prices and stock availability are subject to change without prior notice.
                  </li>
                  <li>
                    In the rare event of a typographical pricing error or sudden stock-out after an order is placed, our team will contact you immediately to offer an alternative model or a 100% full refund.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-900 mb-2">3. Custom PC Builder Orders</h2>
                <ul className="list-disc pl-6 space-y-2 text-slate-600">
                  <li>
                    When ordering a full rig through our <strong>PC Builder</strong>, our engineering team performs a complete hardware compatibility and BIOS check before unboxing the parts.
                  </li>
                  <li>
                    For Cash on Delivery (COD) orders of custom-assembled PCs or outside-Dhaka shipments, a partial advance booking amount may be required before component seals are broken for assembly.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-900 mb-2">4. Order Verification &amp; Cancellation</h2>
                <p className="text-slate-600">
                  We reserve the right to verify customer orders via phone call before dispatch. Orders with unreachable phone numbers, incomplete shipping addresses, or suspected fraudulent payment references may be placed on hold or cancelled automatically.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-900 mb-2">5. Warranty &amp; Returns</h2>
                <p className="text-slate-600">
                  All products are covered by their respective official manufacturer warranty or service warranty as printed on the invoice. Please review our dedicated <strong>Warranty Policy</strong> and <strong>Return &amp; Refund Policy</strong> pages for complete RMA and 3-day replacement terms.
                </p>
              </section>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <h3 className="font-bold text-slate-900 mb-2">Questions About Our Terms?</h3>
                <p className="text-sm text-slate-600 mb-3">
                  Reach out to our customer support team for any clarification before placing your order:
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
  );
};

export default TermsOfService;
