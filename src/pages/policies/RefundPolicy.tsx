import React from 'react';
import { Layout } from '../../components/Layout';
import { SEO } from '../../components/SEO';
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
          description={`Return and refund policies for hardware, laptops, and components at ${brandName}.`}
        />
        <div className="bg-slate-50/80 py-12 md:py-16 min-h-screen">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200/80">
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">
                Return &amp; Refund Policy
              </h1>
              <p className="text-slate-500 text-sm mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

              <div className="prose prose-blue max-w-none text-slate-700 space-y-6 leading-relaxed">
                <section>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">1. General Return Policy</h2>
                  <p className="text-sm text-slate-600">
                    At <strong>{brandName}</strong>, we strive to deliver authentic, factory-sealed products. You may request a return or replacement within <strong>3 days of delivery</strong> if the item is dead on arrival (DOA), has an out-of-the-box manufacturing defect, or if an incorrect item was delivered.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">2. Conditions for Return</h2>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-slate-600">
                    <li>The product must be unused and in the exact condition received.</li>
                    <li>It must include original intact packaging, manuals, cables, accessories, and warranty cards.</li>
                    <li>Items with tampered serial stickers, physical damage, or missing accessories are not eligible for return.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">3. Non-Returnable Items</h2>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-slate-600">
                    <li>Opened software, digital license keys, or unsealed consumables (ink/toner).</li>
                    <li>Products exhibiting physical damage, burn marks, or liquid spillage.</li>
                    <li>Custom-assembled PCs (individual defective components are covered under standard RMA warranty).</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">4. Refund Processing Timeline</h2>
                  <p className="text-sm text-slate-600">
                    Once your returned item is received and verified by our technical team, approved refunds are processed to your original payment method (bKash, Nagad, Bank, or Card) within <strong>5 to 7 working days</strong>.
                  </p>
                  <p className="mt-2 text-xs text-slate-500 italic border-l-4 border-slate-300 pl-3">
                    Note: Shipping and courier charges are non-refundable unless the return is due to an error on our part.
                  </p>
                </section>

                <section className="bg-blue-50 border border-blue-100 p-6 rounded-2xl mt-8">
                  <h2 className="text-lg font-bold text-blue-900 mb-1.5">How to Request a Return or Refund</h2>
                  <p className="text-blue-800 text-sm">
                    Please contact our support team at <strong>{contactEmail}</strong> or call <strong>{contactPhone}</strong> with your Order/Invoice ID and unboxing video/photos.
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

export default RefundPolicy;
