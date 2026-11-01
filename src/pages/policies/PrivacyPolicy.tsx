import React from 'react';
import { Layout } from '../../components/Layout';
import { SEO } from '../../components/SEO';
import {
  Lock,
  Database,
  Cpu,
  Share2,
  ShieldCheck,
  Phone,
  Mail,
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { DynamicPolicyPage } from '../../components/DynamicPolicyPage';

const PrivacyPolicy = () => {
  const { settings } = useSettings();
  const brandName = settings?.brandName || 'Click2IT BD';
  const contactEmail = settings?.contactEmail || 'info@click2itbd.com';
  const contactPhone = settings?.contactPhone || '+8809640887777';

  return (
    <DynamicPolicyPage pageId="privacy-policy" defaultTitle="Privacy Policy">
      <Layout fullWidth>
        <SEO
          title={`Privacy Policy - ${brandName}`}
          description={`Privacy Policy for ${brandName} E-Commerce Shop and Custom PC Builder platform.`}
        />
        <div className="bg-slate-50/80 py-10 md:py-16 min-h-screen">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200/80">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                  <Lock className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-slate-900">
                    Privacy Policy
                  </h1>
                  <p className="text-slate-500 text-sm mt-1">
                    How we protect your personal, order, and custom PC build data
                  </p>
                </div>
              </div>

              <div className="h-px bg-slate-100 my-6" />

              <div className="space-y-8 text-slate-700 leading-relaxed">
                <p className="text-sm md:text-base text-slate-600">
                  Welcome to <strong>{brandName}</strong>. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you browse our online store, purchase tech products, or configure systems using our <strong>Custom PC Builder</strong>.
                </p>

                <section>
                  <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Database className="w-5 h-5 text-indigo-600" />
                    1. Information We Collect
                  </h2>
                  <p className="text-sm text-slate-600 mb-3">
                    We collect only the information needed to fulfill your orders, track hardware warranties, and improve your shopping experience:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-slate-600">
                    <li>
                      <strong>Customer Account Data:</strong> Your name, email address, phone number, and encrypted login credentials when you register an account.
                    </li>
                    <li>
                      <strong>Order &amp; Shipping Data:</strong> Delivery address, billing details, invoice history, and product serial numbers for official warranty tracking.
                    </li>
                    <li>
                      <strong>Custom PC Builder Data:</strong> Saved component lists, hardware compatibility selections, and quotation requests created in our PC Builder tool.
                    </li>
                    <li>
                      <strong>Payment Verification Data:</strong> Transaction reference IDs for bKash, Nagad, Rocket, or Bank transfers (we never store your PIN or full card numbers).
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-blue-600" />
                    2. How We Use Your Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <h3 className="font-bold text-slate-900 text-sm mb-2">
                        A. E-Commerce &amp; Hardware Orders
                      </h3>
                      <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
                        <li>To verify orders, dispatch nationwide courier shipments, and send live delivery updates.</li>
                        <li>To maintain accurate serial-number records for manufacturer warranty (RMA) claims.</li>
                        <li>To credit and track your loyalty Star Points balance.</li>
                      </ul>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <h3 className="font-bold text-slate-900 text-sm mb-2">
                        B. Custom PC Builder &amp; Quotations
                      </h3>
                      <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
                        <li>To save your custom gaming or workstation PC configurations for future editing or sharing.</li>
                        <li>To allow our hardware engineers to verify part compatibility, PSU wattage, and BIOS requirements before assembly.</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-emerald-600" />
                    3. Data Sharing &amp; Third-Party Disclosure
                  </h2>
                  <p className="text-sm text-slate-600 mb-3">
                    We strictly respect your privacy and <strong>never sell or rent</strong> your personal information. Data is shared only with trusted operational partners when necessary to complete your order:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-slate-600">
                    <li>
                      <strong>Courier &amp; Logistics Partners:</strong> SteadFast, Pathao, RedX, or Sundarban Courier receive your name, phone number, and shipping address to deliver your package.
                    </li>
                    <li>
                      <strong>Authorized Brand Distributors:</strong> Product serial numbers and invoice dates may be shared with official importers solely to process your hardware warranty (RMA) claims.
                    </li>
                    <li>
                      <strong>Payment Gateways:</strong> bKash, Nagad, and banking partners process your payment authorization securely.
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-purple-600" />
                    4. Data Security &amp; Your Rights
                  </h2>
                  <p className="text-sm text-slate-600">
                    We enforce SSL/TLS encryption, strict role-based database security rules, and authenticated access controls to safeguard your account and order records. You may update your profile details or request account assistance at any time.
                  </p>
                </section>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                  <h3 className="font-bold text-slate-900 mb-2">Privacy &amp; Data Support</h3>
                  <p className="text-sm text-slate-600 mb-3">
                    If you have any questions regarding your account privacy, order history, or saved PC builds, please reach out to us:
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

export default PrivacyPolicy;
