import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { PageHeader } from '../../components/hosting/PageHeader';
import HostingPlansSection from '../hosting-sections/HostingPlansSection';
import { Shield, Check, X, ChevronDown } from 'lucide-react';

export default function PricingPage() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  
  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "Can I upgrade my plan later?",
      answer: "Yes, you can easily upgrade or downgrade your hosting plan at any time from your control panel. Prorated charges will apply."
    },
    {
      question: "Is there a setup fee?",
      answer: "No, we do not charge any setup fees for any of our hosting plans. You only pay for the hosting itself."
    },
    {
      question: "Do you offer a money-back guarantee?",
      answer: "Yes, we offer a 30-day no-questions-asked money-back guarantee on all our hosting plans."
    },
    {
      question: "Will you help me migrate my site?",
      answer: "Absolutely! Our team provides free website migration from your previous host within the first 30 days of signing up."
    }
  ];

  return (
    <Layout fullWidth>
      <PageHeader 
        title="Hosting Plans for Every Size" 
        subtitle="Choose the perfect plan for your business needs. Upgrade anytime as you grow." 
      />

      {/* Hosting Plans Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <HostingPlansSection billingCycle={billingCycle} onBillingCycleChange={setBillingCycle} onNavigate={navigate} />
      </div>

      {/* Feature Comparison Table */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">Compare Plan Features</h2>
          <p className="mt-4 text-lg text-gray-600">A detailed breakdown of what's included in every plan.</p>
        </div>
        
        <div className="overflow-x-auto shadow-xl rounded-2xl ring-1 ring-gray-200 bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-5 px-6 font-semibold text-gray-900 w-1/4">Feature</th>
                <th className="py-5 px-6 font-semibold text-gray-900 text-center w-1/4">Basic</th>
                <th className="py-5 px-6 font-semibold text-gray-900 text-center w-1/4">Pro</th>
                <th className="py-5 px-6 font-semibold text-gray-900 text-center w-1/4 bg-blue-50">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 text-gray-700 font-medium">Storage</td>
                <td className="py-4 px-6 text-gray-600 text-center">10 GB SSD</td>
                <td className="py-4 px-6 text-gray-600 text-center">50 GB NVMe</td>
                <td className="py-4 px-6 text-gray-900 text-center font-medium bg-blue-50/50">Unlimited NVMe</td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 text-gray-700 font-medium">Bandwidth</td>
                <td className="py-4 px-6 text-gray-600 text-center">100 GB</td>
                <td className="py-4 px-6 text-gray-600 text-center">Unmetered</td>
                <td className="py-4 px-6 text-gray-900 text-center font-medium bg-blue-50/50">Unmetered</td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 text-gray-700 font-medium">Databases</td>
                <td className="py-4 px-6 text-gray-600 text-center">2 MySQL</td>
                <td className="py-4 px-6 text-gray-600 text-center">Unlimited</td>
                <td className="py-4 px-6 text-gray-900 text-center font-medium bg-blue-50/50">Unlimited</td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 text-gray-700 font-medium">Free Domain (1st Year)</td>
                <td className="py-4 px-6 text-gray-400 flex justify-center"><X className="w-5 h-5 mx-auto" /></td>
                <td className="py-4 px-6 text-green-500 flex justify-center"><Check className="w-5 h-5 mx-auto" /></td>
                <td className="py-4 px-6 text-green-500 flex justify-center bg-blue-50/50"><Check className="w-5 h-5 mx-auto" /></td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 text-gray-700 font-medium">Professional Email</td>
                <td className="py-4 px-6 text-gray-600 text-center">1 Account</td>
                <td className="py-4 px-6 text-gray-600 text-center">10 Accounts</td>
                <td className="py-4 px-6 text-gray-900 text-center font-medium bg-blue-50/50">Unlimited</td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 text-gray-700 font-medium">Priority Support</td>
                <td className="py-4 px-6 text-gray-400 flex justify-center"><X className="w-5 h-5 mx-auto" /></td>
                <td className="py-4 px-6 text-gray-400 flex justify-center"><X className="w-5 h-5 mx-auto" /></td>
                <td className="py-4 px-6 text-green-500 flex justify-center bg-blue-50/50"><Check className="w-5 h-5 mx-auto" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 30-Day Money-Back Guarantee */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 sm:p-12 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-white/20 p-4 rounded-full mb-6 backdrop-blur-sm">
              <Shield className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">30-Day Money-Back Guarantee</h2>
            <p className="text-blue-100 text-lg max-w-2xl mx-auto">
              We're so confident you'll love our hosting platform that we offer a completely risk-free trial. 
              If you're not fully satisfied within the first 30 days, we'll refund your money in full.
            </p>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
          <p className="mt-4 text-lg text-gray-600">Everything you need to know about our hosting plans.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`border rounded-2xl overflow-hidden transition-all duration-200 ${openFaq === index ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/30' : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <button
                className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none"
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
              >
                <span className="font-semibold text-gray-900">{faq.question}</span>
                <ChevronDown 
                  className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${openFaq === index ? 'transform rotate-180 text-blue-500' : ''}`} 
                />
              </button>
              <div 
                className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${openFaq === index ? 'max-h-40 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </Layout>
  );
}
