import React from 'react';
import { Layout } from '../../components/Layout';
import { SEO } from '../../components/SEO';
import { CreditCard, CheckCircle2, AlertCircle, Building2, HelpCircle } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

const EMITerms = () => {
  const { settings } = useSettings();

  const supportedBanks = [
    'BRAC Bank Limited',
    'The City Bank Limited (Amex & Visa/Mastercard)',
    'Eastern Bank Limited (EBL)',
    'Standard Chartered Bank (SCB)',
    'Dutch-Bangla Bank Limited (DBBL)',
    'Mutual Trust Bank (MTB)',
    'Dhaka Bank Limited',
    'United Commercial Bank (UCB)',
    'Premier Bank Limited',
    'Prime Bank Limited',
    'Bank Asia Limited',
    'Midland Bank Limited',
    'NCC Bank Limited',
    'LankaBangla Finance',
    'Jamuna Bank Limited',
  ];

  return (
    <Layout fullWidth>
      <SEO 
        title={`EMI Terms & Conditions - ${settings.brandName}`} 
        description={`Equated Monthly Installment (EMI) terms, available banks, tenures, and policies at ${settings.brandName}.`} 
      />
      <div className="bg-gray-50 py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <CreditCard className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">EMI Terms & Conditions</h1>
                <p className="text-gray-500 text-sm mt-1">Easy Equated Monthly Installment plans for credit card holders</p>
              </div>
            </div>

            <div className="h-px bg-gray-100 my-6" />

            <div className="space-y-8 text-gray-700 leading-relaxed">
              {/* Introduction */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  1. Overview of EMI Facility
                </h2>
                <p>
                  At <strong>{settings.brandName}</strong>, we offer flexible Equated Monthly Installment (EMI) facilities to make purchasing high-value computer hardware, laptops, servers, accessories, and annual web hosting packages convenient and affordable.
                </p>
                <p className="mt-2">
                  EMI is available for customers paying with credit cards issued by our partnered commercial banks in Bangladesh.
                </p>
              </section>

              {/* Eligibility & Minimum Purchase */}
              <section className="bg-blue-50/60 border border-blue-100 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  2. Eligibility & Requirements
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700">
                  <li>Minimum cart value of <strong>৳5,000 (BDT)</strong> is required to avail of the EMI facility.</li>
                  <li>Customer must possess an active, valid credit card with a sufficient available credit limit to cover the full order total.</li>
                  <li>Debit cards, prepaid cards, bKash/Nagad personal wallets, and foreign-issued cards are not eligible for bank EMI.</li>
                  <li>EMI approval and processing are subject to the issuing bank's terms and risk evaluation.</li>
                </ul>
              </section>

              {/* Available Tenures */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">3. Available EMI Tenures</h2>
                <p className="mb-4">
                  Depending on your issuing bank and card category, you can choose from the following installment tenures:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
                  {['3 Months', '6 Months', '9 Months', '12 Months', '18 Months', '24 Months'].map((tenure) => (
                    <div key={tenure} className="bg-gray-50 border border-gray-200 rounded-xl p-3 font-semibold text-gray-800 text-sm">
                      {tenure}
                    </div>
                  ))}
                </div>
              </section>

              {/* Supported Banks */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  4. Partner Banks (Online & POS Gateway)
                </h2>
                <p className="mb-4 text-sm text-gray-600">
                  We support EMI processing via SSLCommerz, Shurjopay, and direct Bank POS terminals for the following financial institutions:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {supportedBanks.map((bank) => (
                    <div key={bank} className="flex items-center gap-2 bg-gray-50/70 p-2.5 rounded-lg border border-gray-100">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>{bank}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Fees & Bank Charges */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">5. Interest, Convenience & Bank Charges</h2>
                <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700">
                  <li><strong>0% Interest Promotional EMI:</strong> Available on selected featured laptops, desktops, and enterprise hosting bundles during special campaigns.</li>
                  <li><strong>Standard EMI:</strong> Bank processing fees / convenience charges (ranging between 3% to 12% depending on tenure and bank) will be automatically calculated and displayed during payment gateway checkout.</li>
                  <li>The total transaction amount will be initially blocked from your credit limit and converted into monthly installments by your card-issuing bank within 5 to 7 working days.</li>
                </ul>
              </section>

              {/* Cancellation & Refund */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">6. Cancellation & Refunds on EMI Orders</h2>
                <p className="text-sm">
                  If an EMI order is cancelled in accordance with our <a href="/refund-policy" className="text-blue-600 hover:underline font-semibold">Refund Policy</a>, the refund will be processed through the issuing bank. Bank convenience charges or non-refundable gateway processing fees charged by the bank may not be refundable depending on individual bank policies.
                </p>
              </section>

              {/* Need Assistance */}
              <section className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-gray-700" />
                  Have Questions Regarding EMI?
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Our customer service team is available to assist you with EMI calculation, bank verification, or offline POS card swipe at our store.
                </p>
                <div className="flex flex-wrap gap-4 text-sm font-semibold">
                  <a href={`tel:${settings.contactPhone || '+8809640887777'}`} className="text-blue-600 hover:underline">
                    📞 {settings.contactPhone || '+8809640887777'}
                  </a>
                  <a href={`mailto:${settings.contactEmail}`} className="text-blue-600 hover:underline">
                    ✉️ {settings.contactEmail}
                  </a>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EMITerms;
