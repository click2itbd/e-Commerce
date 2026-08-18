import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { Layout } from '../../components/Layout';
import { PageHeader } from '../../components/hosting/PageHeader';
import DomainPricingSection from '../hosting-sections/DomainPricingSection';
import { Search, Shield, Settings, RefreshCw, ArrowRight, Loader2, CheckCircle, XCircle, ShoppingCart } from 'lucide-react';
import { checkDomainAvailability, DomainAvailabilityResponse } from '../../services/domainApi';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../lib/utils';

const DomainPage = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<DomainAvailabilityResponse | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error('Please enter a domain name');
      return;
    }
    
    setIsSearching(true);
    setSearchResult(null);
    
    try {
      const result = await checkDomainAvailability(searchQuery);
      setSearchResult(result);
    } catch (error: any) {
      toast.error(error.message || 'Failed to check domain availability');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToCart = () => {
    if (!searchResult || !searchResult.available) return;
    
    const domainProduct = {
      id: `domain_${searchResult.domain}`,
      name: `Domain Registration — ${searchResult.domain}`,
      description: '1 Year Registration',
      price: searchResult.price || 1000,
      category: 'Hosting & Domains',
      stock: 9999,
      images: [],
      createdAt: new Date().toISOString(),
      itemType: 'domain' as const,
      domainTld: searchResult.domain.split('.').pop() || '',
      termYears: 1,
    };
    
    addToCart(domainProduct as any);
    toast.success(`${searchResult.domain} added to cart!`);
    navigate('/cart');
  };

  return (
    <Layout fullWidth>
      <PageHeader 
        title="Find Your Perfect Domain Name" 
        subtitle="Search, register, and manage your domain names with ease. Get the perfect web address for your business." 
      />

      {/* Domain Search Section */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Start Your Journey Here
          </h2>
          <form onSubmit={handleSearch} className="relative max-w-3xl mx-auto shadow-2xl rounded-full overflow-hidden flex bg-white dark:bg-gray-800 ring-4 ring-blue-100 dark:ring-blue-900/30 transition-all focus-within:ring-blue-500">
            <div className="flex-grow flex items-center pl-6">
              <Search className="h-6 w-6 text-gray-400" />
              <input
                type="text"
                placeholder="Find your perfect domain name (e.g., example.com)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-5 px-4 text-lg bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400 outline-none"
                disabled={isSearching}
              />
            </div>
            <button 
              type="submit"
              disabled={isSearching}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-lg px-8 py-5 transition-colors duration-200 ease-in-out whitespace-nowrap flex items-center gap-2"
            >
              {isSearching ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Search'} 
              <span className="hidden sm:inline">{isSearching ? 'Checking...' : 'Domain'}</span>
            </button>
          </form>

          {/* Search Result */}
          {searchResult && (
            <div className={`mt-8 max-w-3xl mx-auto p-6 rounded-2xl border-2 transition-all ${searchResult.available ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-left">
                  {searchResult.available ? (
                    <CheckCircle className="w-10 h-10 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-10 h-10 text-red-500 flex-shrink-0" />
                  )}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {searchResult.domain}
                    </h3>
                    <p className={`text-lg font-medium ${searchResult.available ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                      {searchResult.available ? 'is available!' : 'is already taken'}
                    </p>
                  </div>
                </div>

                {searchResult.available && (
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="block text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(searchResult.price || 0)}
                      </span>
                      <span className="text-sm text-gray-500">/year</span>
                    </div>
                    <button 
                      onClick={handleAddToCart}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-transform hover:scale-105 shadow-lg shadow-green-600/30"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Add to Cart
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            Popular extensions: <span className="font-medium text-gray-700 dark:text-gray-300">.com, .net, .org, .io, .co</span>
          </p>
        </div>
      </section>

      {/* Domain Pricing Section */}
      <DomainPricingSection />

      {/* Why Register With Us Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              Why Register With Us?
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 mx-auto">
              Everything you need to manage your domains effectively and securely.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Card 1 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
              <div className="bg-blue-100 dark:bg-blue-900/50 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <Shield className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Free Domain Privacy</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Keep your personal information safe. We include free WHOIS privacy protection with every eligible domain registration.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
              <div className="bg-blue-100 dark:bg-blue-900/50 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <Settings className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Easy DNS Management</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Route your domain to any website, email service, or hosting provider with our powerful, intuitive DNS control panel.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
              <div className="bg-blue-100 dark:bg-blue-900/50 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <RefreshCw className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Auto-renewal</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Never lose your domain. Set up auto-renewal to ensure your perfect web address stays yours, year after year.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Domain Transfer Banner */}
      <section className="py-16 bg-blue-600 dark:bg-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-700 dark:bg-blue-800 rounded-3xl p-8 sm:p-12 lg:flex lg:items-center lg:justify-between shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-500 rounded-full opacity-20 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-blue-400 rounded-full opacity-20 blur-3xl"></div>
            
            <div className="relative z-10 lg:w-0 lg:flex-1">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                Already have a domain?
              </h2>
              <p className="mt-4 max-w-3xl text-lg text-blue-100">
                Transfer to us and save! Enjoy lower renewal rates, free privacy protection, and a consolidated dashboard for all your assets.
              </p>
            </div>
            <div className="mt-8 lg:mt-0 lg:ml-8 relative z-10 flex-shrink-0">
              <button className="bg-white hover:bg-gray-50 text-blue-600 font-bold py-4 px-8 rounded-full shadow-lg transition-all duration-200 transform hover:-translate-y-1 flex items-center gap-2">
                Transfer Domain Now <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default DomainPage;
