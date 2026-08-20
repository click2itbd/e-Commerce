import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { Search, X, Info, Star, ShoppingCart, Lock, CreditCard, Shield, MessageCircle, ChevronDown, CheckCircle2, DollarSign, Loader2 } from 'lucide-react';
import { useDomainSearch } from '../../hooks/useDomainSearch';
import { getDomainPricing, DomainPricing } from '../../services/hostingApi';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

export default function DomainSearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [searchInput, setSearchInput] = useState(query);
  const [pricing, setPricing] = useState<DomainPricing[]>([]);
  const [offerDomain, setOfferDomain] = useState<string | null>(null);
  const [offerAmount, setOfferAmount] = useState<string>('');
  const [offerEmail, setOfferEmail] = useState('');
  const [offerPhone, setOfferPhone] = useState('');
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  
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

  const getPrice = (domainObj: any) => {
    // 1. If API provides a valid price (> 0), prioritize it (it includes the 15% markup)
    if (domainObj.price && domainObj.price > 0) {
      return domainObj.price;
    }

    // 2. Fallback to fixed DB pricing for TLDs Dynadot doesn't sell (like .com.bd)
    const tld = domainObj.domain.substring(domainObj.domain.indexOf('.'));
    const p = pricing.find(p => p.tld === tld);
    if (p) return p.registerPrice;
    
    // 3. Absolute fallback
    return 1299;
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

    const handleMakeOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerAmount || isNaN(Number(offerAmount)) || !offerEmail || !offerPhone) {
      toast.error('Please fill all required fields');
      return;
    }
    setIsSubmittingOffer(true);
    try {
      await addDoc(collection(db, 'domain_offers'), {
        domain: offerDomain,
        amount: Number(offerAmount),
        email: offerEmail,
        phone: offerPhone,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      toast.success('Offer of ?' + offerAmount + ' for ' + offerDomain + ' submitted successfully! We will contact you soon.');
      setOfferDomain(null);
      setOfferAmount('');
      setOfferEmail('');
      setOfferPhone('');
    } catch (error) {
      console.error('Error submitting offer:', error);
      toast.error('Failed to submit offer. Please try again.');
    } finally {
      setIsSubmittingOffer(false);
    }
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
          <div className="max-w-7xl mx-auto px-4">
            
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
                          <div className="font-bold text-lg">&#2547;{getPrice(exactMatch).toLocaleString()}</div>
                          <div className="text-xs text-gray-500">/yr</div>
                        </div>
                        <button 
                          onClick={() => handleAddToCart(exactMatch.domain, getPrice(exactMatch))}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2.5 rounded text-sm font-bold flex items-center gap-2 transition-colors"
                        >
                          <ShoppingCart size={16} /> Add to cart
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setOfferDomain(exactMatch.domain)} className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2.5 rounded text-sm font-bold flex items-center gap-2 transition-colors">
                        <DollarSign size={16} /> Make offer
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-gray-500 py-4">No exact match found.</div>
              )}
            </div>
  
            {/* Results List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-gray-700 font-medium">Results</h3>
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
                      
                      <Star size={14} className="text-gray-300 hover:text-yellow-400 cursor-pointer" />
                    </div>
                    
                    <div className="mt-3 sm:mt-0 flex items-center gap-6">
                      {alt.available ? (
                        <>
                          <div className="text-right">
                            <div className="text-sm font-bold">&#2547;{getPrice(alt).toLocaleString()}</div>
                            <div className="text-[10px] text-gray-500">Renews at &#2547;{(getPrice(alt) * 1.2).toLocaleString()}/yr</div>
                          </div>
                          <button 
                            onClick={() => handleAddToCart(alt.domain, getPrice(alt))}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition-colors w-32 justify-center"
                          >
                            <ShoppingCart size={16} /> Add to cart
                          </button>
                        </>
                      ) : (
                        <button onClick={() => setOfferDomain(alt.domain)} className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition-colors w-32 justify-center">
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
              {offerDomain && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-800">Make an Offer</h3>
                <button onClick={() => setOfferDomain(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleMakeOffer} className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    The domain <strong>{offerDomain}</strong> is already registered. Submit your offer and our brokers will attempt to negotiate on your behalf.
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Your Offer Amount (BDT)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">&#2547;</span>
                        <input
                          type="number"
                          required
                          min="1000"
                          value={offerAmount}
                          onChange={e => setOfferAmount(e.target.value)}
                          placeholder="e.g. 50000"
                          className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7B61FF] outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Email Address</label>
                      <input
                        type="email"
                        required
                        value={offerEmail}
                        onChange={e => setOfferEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7B61FF] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={offerPhone}
                        onChange={e => setOfferPhone(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7B61FF] outline-none"
                      />
                    </div>
                  </div>
                </div>
                <div className="pt-2 flex gap-3">
                  <button type="button" onClick={() => setOfferDomain(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmittingOffer} className="flex-1 py-3 bg-[#7B61FF] text-white font-bold rounded-lg hover:bg-[#6A52E5] transition-colors disabled:opacity-50">
                    {isSubmittingOffer ? 'Submitting...' : 'Submit Offer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Layout>
  );
}
















