import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { Layout } from '../../components/Layout';
import { PageHeader } from '../../components/hosting/PageHeader';
import { SEO } from '../../components/SEO';
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
    
    navigate(`/domain/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <Layout fullWidth>
      <SEO 
        title="Register Domain Names"
        description="Search and register your perfect domain name today. Best prices on .com, .net, .bd and more."
        keywords="domain registration, buy domain, domain search, cheap domain"
      />
      
      <PageHeader 
        title="Find Your Perfect Domain Name" 
        subtitle="Search, register, and manage your domain names with ease. Get the perfect web address for your business." 
      />

      {/* Domain Search Section */}
      <section className="py-5 ">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Start Your Journey Here
          </h2>
          <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden flex items-stretch max-w-3xl mx-auto mb-6">
            <form onSubmit={handleSearch} className="flex-grow flex items-stretch">
              <div className="flex items-center pl-5 text-gray-400">
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder="Type your domain name here..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-5 text-lg text-gray-800 outline-none bg-transparent placeholder-gray-400"
                disabled={isSearching}
              />
              <div className="flex items-center gap-2 pr-2">
                <select className="hidden md:block text-sm text-gray-600 bg-gray-100 border-0 rounded-lg px-3 py-2 outline-none h-[44px]">
                  <option>.com</option>
                  <option>.net</option>
                  <option>.org</option>
                  <option>.xyz</option>
                </select>
                <button 
                  type="submit"
                  disabled={isSearching}
                  className="flex items-center gap-2 text-white font-bold px-7 h-[44px] rounded-xl transition-all active:scale-95 hover:opacity-90 disabled:opacity-70 my-auto"
                  style={{ background: 'linear-gradient(135deg, #f97316, #ea6100)' }}
                >
                  {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search size={18} />} 
                  <span className="hidden sm:inline">{isSearching ? 'Checking...' : 'Search Now'}</span>
                </button>
              </div>
            </form>
          </div>



          <p className="mt-6 text-sm text-black/70">
            Popular extensions: <span className="font-medium text-black/70">.com, .net, .org, .io, .co</span>
          </p>
        </div>
      </section>

      {/* Domain Pricing Section */}
      <DomainPricingSection />

      {/* Why Register With Us Section */}
      <section className="py-20 bg-white ">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-black-700 sm:text-4xl">
              Why Register With Us?
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 mx-auto">
              Everything you need to manage your domains effectively and securely.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Card 1 */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl transition-transform group-hover:scale-110"></div>
              <div className="bg-white/20 backdrop-blur-sm w-14 h-14 rounded-xl flex items-center justify-center mb-6 relative z-10">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 relative z-10">Free Domain Privacy</h3>
              <p className="text-blue-100 relative z-10">
                Keep your personal information safe. We include free WHOIS privacy protection with every eligible domain registration.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl transition-transform group-hover:scale-110"></div>
              <div className="bg-white/20 backdrop-blur-sm w-14 h-14 rounded-xl flex items-center justify-center mb-6 relative z-10">
                <Settings className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 relative z-10">Easy DNS Management</h3>
              <p className="text-blue-100 relative z-10">
                Route your domain to any website, email service, or hosting provider with our powerful, intuitive DNS control panel.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl transition-transform group-hover:scale-110"></div>
              <div className="bg-white/20 backdrop-blur-sm w-14 h-14 rounded-xl flex items-center justify-center mb-6 relative z-10">
                <RefreshCw className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 relative z-10">Auto-renewal</h3>
              <p className="text-blue-100 relative z-10">
                Never lose your domain. Set up auto-renewal to ensure your perfect web address stays yours, year after year.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Domain Transfer Banner */}
      <section className="py-8 ">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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
                <button 
                  onClick={() => navigate('/domain/transfer')}
                  className="bg-white hover:bg-gray-50 text-blue-600 font-bold py-4 px-8 rounded-full shadow-lg transition-all duration-200 transform hover:-translate-y-1 flex items-center gap-2"
                >
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
