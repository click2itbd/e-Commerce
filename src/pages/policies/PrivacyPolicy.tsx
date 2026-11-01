import React from 'react';
import { Layout } from '../../components/Layout';
import { SEO } from '../../components/SEO';
import { useSettings } from '../../context/SettingsContext';
import { DynamicPolicyPage } from '../../components/DynamicPolicyPage';

const PrivacyPolicy = () => {
  const { settings } = useSettings();
  const brandName = settings?.brandName || 'Click2IT BD';

  return (
    <DynamicPolicyPage pageId="privacy-policy" defaultTitle="Privacy Policy">
      <Layout fullWidth>
        <SEO title={`Privacy Policy - ${brandName}`} description={`Privacy Policy for ${brandName}.`} />
        <div className="bg-slate-50/80 py-12 md:py-16 min-h-screen">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200/80">
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">Privacy Policy</h1>
              <p className="text-slate-500 text-sm mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

              <div className="prose prose-blue max-w-none text-slate-700 space-y-8 leading-relaxed">
                <section>
                  <p className="text-base text-slate-600">
                    Welcome to <strong>{brandName}</strong>. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services, encompassing our <strong>Tech Shop</strong>, <strong>Custom PC Builder</strong>, and <strong>Domain &amp; Hosting</strong> platforms.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-bold text-slate-900 mb-3">1. Information We Collect</h2>
                  <p className="text-sm text-slate-600">We collect information depending on the specific services you interact with:</p>
                  <ul className="list-disc pl-6 mt-3 space-y-2 text-sm text-slate-600">
                    <li><strong>General Account Data:</strong> Name, email address, phone number, and encrypted credentials when you register an account.</li>
                    <li><strong>E-Commerce &amp; Shop Data:</strong> Delivery addresses, billing information, and purchase history when you buy gadgets or components.</li>
                    <li><strong>PC Build Preferences:</strong> Saved PC build configurations and hardware compatibility preferences.</li>
                    <li><strong>Payment Data:</strong> Secure transaction references (we do not store full card numbers or Mobile Banking PINs on our servers).</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-bold text-slate-900 mb-3">2. How We Use Your Information</h2>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-slate-600">
                    <li>To process your orders, arrange nationwide courier delivery, and manage returns or warranty claims.</li>
                    <li>To review custom PC configurations for hardware compatibility before assembly.</li>
                    <li>To send order confirmations, invoices, and warranty tracking updates.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-bold text-slate-900 mb-3">3. Data Sharing and Disclosure</h2>
                  <p className="text-sm text-slate-600">
                    We strictly protect your privacy and never sell your personal data. We only share essential information with authorized partners:
                  </p>
                  <ul className="list-disc pl-6 mt-3 space-y-2 text-sm text-slate-600">
                    <li><strong>Logistics Partners:</strong> Courier services (e.g., SteadFast, Pathao, RedX) receive your delivery address and phone number to fulfill your order.</li>
                    <li><strong>Payment Processors:</strong> bKash, Nagad, and SSLCommerz process your payments securely.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-bold text-slate-900 mb-3">4. Data Security &amp; Contact</h2>
                  <p className="text-sm text-slate-600">
                    We implement SSL encryption, role-based access controls, and secure cloud databases to protect your personal and order information. If you have any questions regarding your data privacy, please contact us at <strong>{settings?.contactEmail || 'info@click2itbd.com'}</strong>.
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </DynamicPolicyPage>
  );
};

export default PrivacyPolicy;
