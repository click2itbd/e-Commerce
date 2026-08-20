import React from 'react';
import { Layout } from '../../components/Layout';
import { SEO } from '../../components/SEO';

const PrivacyPolicy = () => {
  return (
    <Layout fullWidth>
      <SEO title="Privacy Policy - Click2IT BD" description="Privacy Policy for Click2IT BD." />
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
            <p className="text-gray-500 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
            
            <div className="prose prose-blue max-w-none text-gray-700 space-y-6">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">1. Information We Collect</h2>
                <p>
                  At Click2IT BD, we collect the following types of information when you use our services:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li><strong>Personal Information:</strong> Name, email address, phone number, and billing details provided during registration.</li>
                  <li><strong>Technical Information:</strong> IP addresses, browser types, and usage data automatically logged by our servers.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">2. How We Use Your Information</h2>
                <p>We use the collected information for the following purposes:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>To provide, operate, and maintain our hosting and domain services.</li>
                  <li>To process transactions and send related billing information.</li>
                  <li>To send administrative emails, technical notices, and security alerts.</li>
                  <li>To register domain names on your behalf (which requires sharing details with ICANN and domain registries).</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">3. Data Sharing and Disclosure</h2>
                <p>
                  We do not sell your personal data to third parties. We only share information with:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li><strong>Domain Registries:</strong> As required by ICANN to register your domain name.</li>
                  <li><strong>Payment Processors:</strong> Such as bKash, Nagad, and SSLCommerz to process payments securely.</li>
                  <li><strong>Law Enforcement:</strong> If required by law or to protect our legal rights.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">4. Data Security</h2>
                <p>
                  We implement industry-standard security measures to protect your personal information. All sensitive data is encrypted during transmission. However, no electronic transmission over the internet is 100% secure, and we cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">5. WHOIS Privacy</h2>
                <p>
                  When you register a domain, your contact information is normally published in the public WHOIS database. We offer WHOIS Privacy Protection to mask your personal details from public view, subject to registry availability.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">6. Cookies</h2>
                <p>
                  Our website uses cookies to enhance user experience, remember your preferences, and analyze site traffic. You can choose to disable cookies through your browser settings, though this may limit your ability to use certain features.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">7. Contact Us</h2>
                <p>
                  If you have questions about our Privacy Policy or how your data is handled, please reach out to our privacy team at <strong>info@click2itbd.com</strong>.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPolicy;
