import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { Layout } from '../../components/Layout';
import { PageHeader } from '../../components/hosting/PageHeader';
import { SEO } from '../../components/SEO';
import { ArrowRight, Lock, Unlock, Key, RefreshCw, Shield, HelpCircle, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { checkTransferEligibility, getTldPricing } from '../../services/dynadotApi';

const DomainTransferPage = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [domainName, setDomainName] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [eligibilityError, setEligibilityError] = useState('');

  const normalizeDomain = (input: string): string => {
    return input.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/^www\./, '');
  };

  const isValidDomain = (domain: string): boolean => {
    const regex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    return regex.test(domain);
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    setEligibilityError('');
    
    if (!domainName.trim()) {
      setValidationError('Please enter the domain name you want to transfer');
      return;
    }

    const normalized = normalizeDomain(domainName);
    if (!isValidDomain(normalized)) {
      setValidationError('Please enter a valid domain name (e.g., example.com)');
      return;
    }

    if (!authCode.trim()) {
      setValidationError('Please enter your Auth/EPP Code');
      return;
    }

    setIsProcessing(true);

    try {
      const eligibilityResult = await checkTransferEligibility(normalized);
      
      if (!eligibilityResult.eligible) {
        setEligibilityError(eligibilityResult.reason || 'This domain is not eligible for transfer.');
        setIsProcessing(false);
        return;
      }

      const tld = normalized.split('.').pop() || '';
      let transferPrice = 0;
      
      try {
        const pricing = await getTldPricing(tld);
        transferPrice = pricing.transferPrice || 0;
      } catch (e) {
        console.error('Failed to get transfer price:', e);
      }

      if (transferPrice <= 0) {
        setValidationError('Transfer price unavailable for this TLD. Please try again later.');
        setIsProcessing(false);
        return;
      }

      const transferProduct = {
        id: `domain_transfer_${normalized}`,
        name: `Domain Transfer — ${normalized}`,
        description: 'Includes 1 Year Extension',
        price: transferPrice,
        category: 'Hosting & Domains',
        stock: 9999,
        images: [],
        createdAt: new Date().toISOString(),
        itemType: 'domain_transfer' as const,
        domain: normalized,
        domainTld: tld,
        termYears: 1,
      };
      
      addToCart(transferProduct as any);
      toast.success(`${normalized} transfer added to cart!`);
      navigate('/hosting/cart');
    } catch (error: any) {
      setValidationError(error.message || 'Failed to process transfer. Please try again.');
    } finally {
      setIsProcessing(false);
    }
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
      <section className="py-8 sm:py-12 lg:py-16 bg-[#f5f7f9] border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            <div className="flex flex-col md:flex-row">
              {/* Left Side: Benefits */}
              <div className="md:w-5/12 bg-gradient-to-br from-blue-600 to-indigo-700 p-6 sm:p-8 md:p-10 text-white flex flex-col justify-center">
                <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Why transfer to us?</h3>
                <ul className="space-y-4 sm:space-y-5">
                  <li className="flex items-start gap-3">
                    <RefreshCw className="text-blue-300 flex-shrink-0 mt-0.5" size={18} sm:size={20} />
                    <span className="text-sm sm:text-base">Includes a <strong>free 1-year extension</strong> on your current registration.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Shield className="text-blue-300 flex-shrink-0 mt-0.5" size={18} sm:size={20} />
                    <span className="text-sm sm:text-base"><strong>Free WHOIS Privacy</strong> to keep your personal info hidden.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Lock className="text-blue-300 flex-shrink-0 mt-0.5" size={18} sm:size={20} />
                    <span className="text-sm sm:text-base">No hidden fees. <strong>Transparent renewal pricing</strong> forever.</span>
                  </li>
                </ul>
              </div>
              
              {/* Right Side: Form */}
              <div className="md:w-7/12 p-6 sm:p-8 md:p-10">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Start your transfer</h3>
                <p className="text-gray-500 mb-6 sm:mb-8 text-sm sm:text-base">Enter the domain you'd like to transfer to Click2IT.</p>
                 
                <form onSubmit={handleTransfer} className="space-y-5 sm:space-y-6">
                  {validationError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                      <XCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                      <p className="text-sm text-red-700">{validationError}</p>
                    </div>
                  )}

                  {eligibilityError && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                      <AlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" size={18} />
                      <p className="text-sm text-amber-700">{eligibilityError}</p>
                    </div>
                  )}

                  <div>
                    <label htmlFor="domainName" className="block text-sm font-medium text-gray-700 mb-2">
                      Domain Name
                    </label>
                    <input
                      type="text"
                      id="domainName"
                      value={domainName}
                      onChange={(e) => {
                        setDomainName(normalizeDomain(e.target.value));
                        setValidationError('');
                      }}
                      placeholder="e.g., mybusiness.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-sm sm:text-base"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="authCode" className="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                      <span>Auth/EPP Code *</span>
                      <button
                        type="button"
                        onClick={() => setShowHelpModal(true)}
                        className="text-xs text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <HelpCircle size={12} /> Where do I get this?
                      </button>
                    </label>
                    <input
                      type="text"
                      id="authCode"
                      value={authCode}
                      onChange={(e) => {
                        setAuthCode(e.target.value.trim());
                        setValidationError('');
                      }}
                      placeholder="Enter your Auth/EPP Code"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-sm sm:text-base"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">This code is required by your current registrar to authorize the transfer.</p>
                  </div>

                  {/* Transfer Checklist */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-5 space-y-3">
                    <p className="text-sm font-medium text-gray-900 mb-2">Pre-Transfer Checklist</p>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="flex items-center h-5 mt-0.5">
                        <input type="checkbox" required className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                      </div>
                      <span className="text-xs sm:text-sm text-gray-600 group-hover:text-gray-900 transition-colors">I confirm that my domain is <strong>unlocked</strong> at my current registrar.</span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="flex items-center h-5 mt-0.5">
                        <input type="checkbox" required className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                      </div>
                      <span className="text-xs sm:text-sm text-gray-600 group-hover:text-gray-900 transition-colors">I have my valid <strong>Auth/EPP Code</strong> from my current registrar.</span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="flex items-center h-5 mt-0.5">
                        <input type="checkbox" required className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                      </div>
                      <span className="text-xs sm:text-sm text-gray-600 group-hover:text-gray-900 transition-colors">I confirm that my domain was registered more than <strong>60 days ago</strong> and has not been transferred to another registrar within the last 60 days.</span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="flex items-center h-5 mt-0.5">
                        <input type="checkbox" required className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                      </div>
                      <span className="text-xs sm:text-sm text-gray-600 group-hover:text-gray-900 transition-colors">I confirm that my domain is not subject to a <strong>60-day transfer lock</strong> due to a recent registrant information change.</span>
                    </label>
                  </div>

                  <button 
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 sm:py-4 px-6 rounded-xl transition-colors duration-200 flex justify-center items-center gap-2 disabled:opacity-70 text-sm sm:text-base"
                  >
                    {isProcessing ? (
                      <RefreshCw className="animate-spin" size={18} sm:size={20} />
                    ) : (
                      <>Transfer Now <ArrowRight size={18} sm:size={20} /></>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900">
              How to Transfer a Domain
            </h2>
            <p className="mt-3 sm:mt-4 max-w-2xl text-base sm:text-xl text-gray-500 mx-auto">
              Transferring your domain is a simple process. Follow these 3 easy steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 lg:gap-12 relative">
            {/* Desktop connecting line */}
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gray-100 w-2/3 mx-auto z-0"></div>
            
            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center border-4 border-blue-50 mb-4 sm:mb-6 shadow-xl shadow-blue-500/10">
                <Unlock className="text-blue-500" size={28} sm:size={36} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">1. Unlock Domain</h3>
              <p className="text-gray-600 px-2 sm:px-4 text-sm sm:text-base">
                Log into your current registrar's control panel and unlock your domain name to allow the transfer.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center border-4 border-blue-50 mb-4 sm:mb-6 shadow-xl shadow-blue-500/10">
                <Key className="text-blue-500" size={28} sm:size={36} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">2. Get Auth Code</h3>
              <p className="text-gray-600 px-2 sm:px-4 text-sm sm:text-base">
                Request an Authorization Code (also known as EPP code) from your current registrar.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center border-4 border-blue-50 mb-4 sm:mb-6 shadow-xl shadow-blue-500/10">
                <CheckCircle2 className="text-blue-500" size={28} sm:size={36} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">3. Initiate Transfer</h3>
              <p className="text-gray-600 px-2 sm:px-4 text-sm sm:text-base">
                Enter your domain and auth code above, complete the checkout, and we'll handle the rest!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100">
              <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2">How long does a domain transfer take?</h4>
              <p className="text-gray-600 text-sm sm:text-base">Depending on your current registrar, a domain transfer usually takes between 5 to 7 days to complete. However, if your current registrar allows you to approve the transfer manually, it can be completed within hours.</p>
            </div>
            
            <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100">
              <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Will my website go down during the transfer?</h4>
              <p className="text-gray-600 text-sm sm:text-base">No, your website and emails will remain active and completely unaffected during the entire transfer process.</p>
            </div>
            
            <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100">
              <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Do I lose the remaining time on my registration?</h4>
              <p className="text-gray-600 text-sm sm:text-base">Absolutely not! When you transfer a domain to us, we add a full year of registration on top of your existing expiration date.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Where do I get my Auth/EPP Code?</h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={20} />
              </button>
            </div>
            <div className="space-y-4 text-sm sm:text-base text-gray-600">
              <p>Your Auth/EPP Code is provided by your current domain registrar. You can usually find it in your domain management or transfer settings.</p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> Log into your current registrar's control panel, find your domain, and look for "Transfer", "Auth Code", or "EPP Code" options.
                </p>
              </div>
              <p className="text-xs text-gray-500">If you cannot find it, contact your current registrar's support team for assistance.</p>
            </div>
            <button
              onClick={() => setShowHelpModal(false)}
              className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default DomainTransferPage;
