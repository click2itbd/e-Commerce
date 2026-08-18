import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { Layout } from '../../components/Layout';
import { PageHeader } from '../../components/hosting/PageHeader';
import { SEO } from '../../components/SEO';
import { ArrowRight, Lock, Unlock, Key, RefreshCw, Shield, HelpCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const DomainTransferPage = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [domainName, setDomainName] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainName.trim()) {
      toast.error('Please enter the domain name you want to transfer');
      return;
    }
    
    // Simple domain validation
    if (!domainName.includes('.')) {
      toast.error('Please enter a valid domain name (e.g., example.com)');
      return;
    }

    setIsProcessing(true);
    
    // Simulate an API call to verify transferability
    setTimeout(() => {
      const transferProduct = {
        id: `domain_transfer_${domainName}`,
        name: `Domain Transfer — ${domainName}`,
        description: 'Includes 1 Year Extension',
        price: 1299, // Standard transfer price
        category: 'Hosting & Domains',
        stock: 9999,
        images: [],
        createdAt: new Date().toISOString(),
        itemType: 'domain_transfer' as const,
        domainTld: domainName.split('.').pop() || '',
        termYears: 1,
        meta: {
          authCode: authCode
        }
      };
      
      addToCart(transferProduct as any);
      toast.success(`${domainName} transfer added to cart!`);
      navigate('/hosting/cart');
      setIsProcessing(false);
    }, 800);
  };

  return (
    <Layout fullWidth>
      <SEO 
        title="Transfer Your Domain"
        description="Transfer your domain name to Click2IT. Enjoy free privacy protection, easy management, and affordable renewal rates."
        keywords="domain transfer, transfer domain, move domain, switch domain registrar"
      />
      
      <PageHeader 
        title="Transfer Your Domain to Us" 
        subtitle="Consolidate your digital assets. Enjoy transparent pricing, free privacy protection, and a powerful control panel." 
      />

      {/* Transfer Form Section */}
      <section className="py-16 bg-[#f5f7f9] border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            <div className="md:flex">
              {/* Left Side: Benefits */}
              <div className="md:w-5/12 bg-gradient-to-br from-blue-600 to-indigo-700 p-10 text-white flex flex-col justify-center">
                <h3 className="text-2xl font-bold mb-6">Why transfer to us?</h3>
                <ul className="space-y-5">
                  <li className="flex items-start gap-3">
                    <RefreshCw className="text-blue-300 flex-shrink-0 mt-0.5" size={20} />
                    <span>Includes a <strong>free 1-year extension</strong> on your current registration.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Shield className="text-blue-300 flex-shrink-0 mt-0.5" size={20} />
                    <span><strong>Free WHOIS Privacy</strong> to keep your personal info hidden.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Lock className="text-blue-300 flex-shrink-0 mt-0.5" size={20} />
                    <span>No hidden fees. <strong>Transparent renewal pricing</strong> forever.</span>
                  </li>
                </ul>
              </div>
              
              {/* Right Side: Form */}
              <div className="md:w-7/12 p-10">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Start your transfer</h3>
                <p className="text-gray-500 mb-8">Enter the domain you'd like to transfer to Click2IT.</p>
                
                <form onSubmit={handleTransfer} className="space-y-6">
                  <div>
                    <label htmlFor="domainName" className="block text-sm font-medium text-gray-700 mb-2">
                      Domain Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="domainName"
                        value={domainName}
                        onChange={(e) => setDomainName(e.target.value.toLowerCase())}
                        placeholder="e.g., mybusiness.com"
                        className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="authCode" className="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                      <span>Auth/EPP Code (Optional now)</span>
                      <span className="text-xs text-blue-600 hover:underline cursor-pointer flex items-center gap-1">
                        <HelpCircle size={12} /> Where do I get this?
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="authCode"
                        value={authCode}
                        onChange={(e) => setAuthCode(e.target.value)}
                        placeholder="e.g., 123456789"
                        className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">You can provide the auth code later from your dashboard if you don't have it right now.</p>
                  </div>

                  <button 
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-colors duration-200 flex justify-center items-center gap-2 disabled:opacity-70"
                  >
                    {isProcessing ? (
                      <RefreshCw className="animate-spin" size={20} />
                    ) : (
                      <>Transfer Now <ArrowRight size={20} /></>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              How to Transfer a Domain
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Transferring your domain is a simple process. Follow these 3 easy steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Desktop connecting line */}
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gray-100 w-2/3 mx-auto z-0"></div>
            
            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-4 border-blue-50 mb-6 shadow-xl shadow-blue-500/10">
                <Unlock className="text-blue-500" size={36} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">1. Unlock Domain</h3>
              <p className="text-gray-600 px-4">
                Log into your current registrar's control panel and unlock your domain name to allow the transfer.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-4 border-blue-50 mb-6 shadow-xl shadow-blue-500/10">
                <Key className="text-blue-500" size={36} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">2. Get Auth Code</h3>
              <p className="text-gray-600 px-4">
                Request an Authorization Code (also known as EPP code) from your current registrar.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-4 border-blue-50 mb-6 shadow-xl shadow-blue-500/10">
                <CheckCircle2 className="text-blue-500" size={36} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">3. Initiate Transfer</h3>
              <p className="text-gray-600 px-4">
                Enter your domain and auth code above, complete the checkout, and we'll handle the rest!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h4 className="text-lg font-bold text-gray-900 mb-2">How long does a domain transfer take?</h4>
              <p className="text-gray-600">Depending on your current registrar, a domain transfer usually takes between 5 to 7 days to complete. However, if your current registrar allows you to approve the transfer manually, it can be completed within hours.</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h4 className="text-lg font-bold text-gray-900 mb-2">Will my website go down during the transfer?</h4>
              <p className="text-gray-600">No, your website and emails will remain active and completely unaffected during the entire transfer process.</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h4 className="text-lg font-bold text-gray-900 mb-2">Do I lose the remaining time on my registration?</h4>
              <p className="text-gray-600">Absolutely not! When you transfer a domain to us, we add a full year of registration on top of your existing expiration date.</p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default DomainTransferPage;
