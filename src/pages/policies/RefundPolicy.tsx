import React from 'react';
import { Layout } from '../../components/Layout';
import { SEO } from '../../components/SEO';

const RefundPolicy = () => {
  return (
    <Layout fullWidth>
      <SEO title="Refund Policy - Click2IT BD" description="Refund Policy for Click2IT BD." />
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">Refund Policy</h1>
            <p className="text-gray-500 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
            
            <div className="prose prose-blue max-w-none text-gray-700 space-y-6">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">1. General Policy</h2>
                <p>
                  At Click2IT BD, customer satisfaction is our priority. We offer a 30-day money-back guarantee on select services, subject to the conditions outlined below.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">2. Web Hosting Services</h2>
                <p>
                  Shared hosting and VPS plans are eligible for a full refund within the first 30 days of service. If you are not satisfied, you may cancel your account within this period and request a refund by opening a support ticket.
                </p>
                <p className="mt-2 text-sm text-gray-500 italic">
                  Note: Dedicated servers and custom infrastructure plans are non-refundable once provisioned.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">3. Domain Registrations (Non-Refundable)</h2>
                <p>
                  <strong>Domain registrations, renewals, and transfers are strictly non-refundable.</strong> Once a domain is registered, it belongs to you for the duration of the term and cannot be canceled or refunded. Please ensure the spelling is correct before purchasing.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">4. Add-on Services</h2>
                <p>
                  Additional services such as SSL certificates, dedicated IP addresses, WHOIS Privacy, and custom development work are non-refundable once activated or initiated.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">5. Violation of Terms</h2>
                <p>
                  Accounts suspended or terminated due to a violation of our Terms of Service (e.g., hosting malware, phishing, spamming) are not eligible for any refund.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">6. Processing Refunds</h2>
                <p>
                  Approved refunds will be processed to the original payment method (e.g., bKash, SSLCommerz, or Bank Transfer) within 7-10 business days.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">7. How to Request a Refund</h2>
                <p>
                  To request a refund, please log in to your account and open a Support Ticket directed to our Billing Department within the eligible timeframe.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RefundPolicy;
