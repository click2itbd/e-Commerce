import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { Search, X, Info, Star, ShoppingCart, Lock, CreditCard, Shield, MessageCircle, ChevronDown, CheckCircle2, DollarSign, Loader2 } from 'lucide-react';
import { useDomainSearch } from '../../hooks/useDomainSearch';
import { getDomainPricing, DomainPricing } from '../../services/hostingApi';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

export default function DomainSearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [searchInput, setSearchInput] = useState(query);
  const [pricing, setPricing] = useState<DomainPricing[]>([]);
  
  const { loading, results, search } = useDomainSearch();
  
  // A base list of popular TLDs to check
  const popularTlds = ['.com', '.net', '.org', '.co', '.io', '.online', '.dev', '.tech', '.store', '.me'];

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const p = await getDomainPricing();
        setPricing(p);
      } catch (e) {
        console.error('Failed to fetch pricing', e);
      }
    };
    fetchPricing();
  }, []);

  useEffect(() => {
    if (query) {
      setSearchInput(query);
      
      // Determine base name without extension
      let baseName = query;
      let searchedTld = '';
      if (query.includes('.')) {
        baseName = query.substring(0, query.indexOf('.'));
        searchedTld = query.substring(query.indexOf('.'));
      }
      
      // We will search for the exact query (if it has a TLD), or append .com if none
      const exactDomain = searchedTld ? query : `${query}.com`;
      
      // Generate alternate domains
      const alternates = popularTlds
        .filter(tld => tld !== (searchedTld || '.com'))
        .map(tld => `${baseName}${tld}`);
        
      search([exactDomain, ...alternates]);
    }
  }, [query, search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/domain/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const getPrice = (tld: string) => {
    const normalized = tld.startsWith('.') ? tld : `.${tld}`;
    const p = pricing.find(p => p.tld === normalized);
    return p ? p.registerPrice : 1299; // Fallback price
  };

  const handleAddToCart = (domain: string, price: number) => {
    const tld = domain.split('.').pop() || '';
    const product = {
      id: `domain_${domain}`,
      name: `Domain Registration - ${domain}`,
      description: '1 Year Registration',
      price: price,
      category: 'Hosting & Domains',
      stock: 9999,
      images: [],
      createdAt: new Date().toISOString(),
      itemType: 'domain' as const,
      domainTld: tld,
      termYears: 1,
    };
    addToCart(product as any);
    toast.success(`Domain ${domain} added to cart`);
  };

  // Split results into exact match and alternatives
  let exactMatch = null;
  let alternatives = [];
  
  if (results.length > 0) {
    let baseSearch = query;
    if (!query.includes('.')) {
      baseSearch = `${query}.com`;
    }
    exactMatch = results.find(r => r.domain.toLowerCase() === baseSearch.toLowerCase());
    alternatives = results.filter(r => r.domain.toLowerCase() !== baseSearch.toLowerCase());
  }

  return (
    <Layout fullWidth>
      <div className="bg-[#f5f7f9] min-h-screen py-8">
        <div className="max-w-6xl mx-auto px-4">
          
          {/* Main Search Bar */}
          <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] overflow-hidden flex items-stretch mb-6">
            <form onSubmit={handleSearchSubmit} className="flex-grow flex items-stretch">
              <div className="flex items-center pl-5 text-gray-400">
                <Search size={20} />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Type your domain name here..."
                className="flex-1 px-4 py-5 text-lg text-gray-800 outline-none bg-transparent placeholder-gray-400"
              />
              {searchInput && (
                <button type="button" onClick={() => setSearchInput('')} className="flex items-center text-gray-400 hover:text-gray-600 px-2">
                  <X size={16} />
                </button>
              )}
              <div className="flex items-center gap-2 pr-2">
                <select className="hidden md:block text-sm text-gray-600 bg-gray-100 border-0 rounded-lg px-3 py-2 outline-none h-[44px]">
                  <option>.com</option>
                  <option>.net</option>
                  <option>.org</option>
                  <option>.xyz</option>
                </select>
                <button
                  type="submit"
                  className="flex items-center gap-2 text-white font-bold px-7 h-[44px] rounded-xl transition-all active:scale-95 hover:opacity-90 my-auto"
                  style={{ background: 'linear-gradient(135deg, #f97316, #ea6100)' }}
                >
                  <Search size={18} />
                  <span className="hidden sm:inline">Search</span>
                </button>
              </div>
            </form>
          </div>

          {/* Exact Match Result */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {loading ? (
              <div className="flex items-center gap-3 text-gray-500 py-4">
                <Loader2 className="animate-spin" size={20} />
                <span>Checking availability...</span>
              </div>
            ) : exactMatch ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-2xl text-gray-700">{exactMatch.domain}</span>
                  {!exactMatch.available && (
                    <span className="bg-[#a4a9ad] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      Registered
                    </span>
                  )}
                  <Info size={16} className="text-gray-400 cursor-pointer" />
                  <Star size={16} className="text-gray-400 cursor-pointer hover:text-yellow-400" />
                </div>
                <div>
                  {exactMatch.available ? (
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold text-lg">৳{getPrice(exactMatch.domain.substring(exactMatch.domain.indexOf('.'))).toLocaleString()}</div>
                        <div className="text-xs text-gray-500">/yr</div>
                      </div>
                      <button 
                        onClick={() => handleAddToCart(exactMatch.domain, getPrice(exactMatch.domain.substring(exactMatch.domain.indexOf('.'))))}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2.5 rounded text-sm font-bold flex items-center gap-2 transition-colors"
                      >
                        <ShoppingCart size={16} /> Add to cart
                      </button>
                    </div>
                  ) : (
                    <button className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2.5 rounded text-sm font-bold flex items-center gap-2 transition-colors">
                      <DollarSign size={16} /> Make offer
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-gray-500 py-4">No exact match found.</div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button className="bg-white text-[#eb5c27] font-bold border-t-2 border-[#eb5c27] px-4 py-3 text-sm flex items-center gap-2 shadow-sm rounded-b">
              <CheckCircle2 size={16} /> Domains
            </button>
            <button className="bg-white text-gray-600 hover:text-gray-900 font-medium px-4 py-3 text-sm flex items-center gap-2 shadow-sm rounded">
              <DollarSign size={16} className="text-red-500" /> Auctions
            </button>
            <button className="bg-white text-gray-600 hover:text-gray-900 font-medium px-4 py-3 text-sm flex items-center gap-2 shadow-sm rounded">
              <Star size={16} className="text-purple-500" /> Premium
            </button>
            <button className="bg-white text-gray-600 hover:text-gray-900 font-medium px-4 py-3 text-sm flex items-center gap-2 shadow-sm rounded">
              <ChevronDown size={16} className="text-blue-500" /> Generator
            </button>
            <button className="bg-white text-gray-600 hover:text-gray-900 font-medium px-4 py-3 text-sm flex items-center gap-2 shadow-sm rounded">
              <ChevronDown size={16} className="text-red-500" /> Beast Mode
            </button>
            <button className="bg-white text-gray-600 hover:text-gray-900 font-medium px-4 py-3 text-sm flex items-center gap-2 shadow-sm rounded">
              <Star size={16} className="text-yellow-500" /> Favorites
            </button>
          </div>

          {/* Suggested Results */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
              <h3 className="text-gray-700 font-medium">Suggested Results</h3>
              <button className="text-blue-500 text-sm hover:underline">Hide</button>
            </div>
            
            <div className="divide-y divide-gray-100">
              {/* SSL */}
              <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <Lock className="text-teal-400" size={24} />
                  <div>
                    <span className="text-gray-800 font-medium mr-2">SSL</span>
                    <span className="text-gray-500 text-sm">Site security made simple</span>
                    <Info size={14} className="inline ml-2 text-gray-400" />
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 sm:mt-0">
                  <div className="text-right">
                    <div className="text-sm font-medium">৳999.00/yr</div>
                  </div>
                  <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition-colors">
                    <ShoppingCart size={16} /> Add to cart
                  </button>
                </div>
              </div>
              
              {/* Business Cards */}
              <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <CreditCard className="text-orange-400" size={24} />
                  <div>
                    <span className="text-gray-800 font-medium mr-2">Business Cards</span>
                    <span className="text-gray-500 text-sm">Start free, pay to print</span>
                    <Info size={14} className="inline ml-2 text-gray-400" />
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 sm:mt-0">
                  <div className="text-right">
                    <div className="text-sm font-medium">Free</div>
                  </div>
                  <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition-colors">
                    <ShoppingCart size={16} /> Add to cart
                  </button>
                </div>
              </div>

              {/* VPN */}
              <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <Shield className="text-red-500" size={24} />
                  <div>
                    <span className="text-gray-800 font-medium mr-2">Secure Your Browsing with VPN</span>
                    <span className="text-gray-500 text-sm">Access Global Content</span>
                    <Info size={14} className="inline ml-2 text-gray-400" />
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 sm:mt-0">
                  <div className="text-right">
                    <div className="text-sm font-medium">Free trial</div>
                    <div className="text-[10px] text-gray-500">From</div>
                  </div>
                  <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition-colors">
                    <ShoppingCart size={16} /> Add to cart
                  </button>
                </div>
              </div>

              {/* Social Media */}
              <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <MessageCircle className="text-blue-500" size={24} />
                  <div>
                    <span className="text-gray-800 font-medium mr-2">Boost Your Social Media</span>
                    <span className="text-gray-500 text-sm">Use AI-generated content to grow your reach</span>
                    <Info size={14} className="inline ml-2 text-gray-400" />
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 sm:mt-0">
                  <div className="text-right">
                    <div className="text-sm font-medium">Free trial</div>
                    <div className="text-[10px] text-gray-500">From</div>
                  </div>
                  <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition-colors">
                    <ShoppingCart size={16} /> Add to cart
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Results List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-gray-700 font-medium">Results</h3>
              <button className="text-teal-600 font-medium text-sm flex items-center gap-1 hover:underline">
                Explore More <span className="bg-teal-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">+</span>
              </button>
            </div>
            
            <div className="divide-y divide-gray-100">
              {loading ? (
                <div className="py-12 flex justify-center items-center">
                  <Loader2 className="animate-spin text-blue-500" size={32} />
                </div>
              ) : alternatives.map((alt, idx) => (
                <div key={idx} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={alt.available ? "text-gray-800 text-lg" : "text-gray-400 text-lg"}>{alt.domain}</span>
                    
                    {!alt.available && (
                      <span className="bg-[#a4a9ad] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Registered
                      </span>
                    )}
                    {idx === 0 && alt.available && (
                      <span className="bg-[#6b52d1] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Premium
                      </span>
                    )}
                    
                    <Star size={14} className="text-gray-300 hover:text-yellow-400 cursor-pointer" />
                  </div>
                  
                  <div className="mt-3 sm:mt-0 flex items-center gap-6">
                    {alt.available ? (
                      <>
                        <div className="text-right">
                          <div className="text-sm font-bold">৳{getPrice(alt.domain.substring(alt.domain.indexOf('.'))).toLocaleString()}</div>
                          <div className="text-[10px] text-gray-500">Renews at ৳{(getPrice(alt.domain.substring(alt.domain.indexOf('.'))) * 1.2).toLocaleString()}/yr</div>
                        </div>
                        <button 
                          onClick={() => handleAddToCart(alt.domain, getPrice(alt.domain.substring(alt.domain.indexOf('.'))))}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition-colors w-32 justify-center"
                        >
                          <ShoppingCart size={16} /> Add to cart
                        </button>
                      </>
                    ) : (
                      <button className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition-colors w-32 justify-center">
                        <DollarSign size={16} /> Make offer
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </Layout>
  );
}
