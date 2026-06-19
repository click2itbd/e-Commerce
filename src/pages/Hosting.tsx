import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Search, Server, Globe, ShieldCheck, CheckCircle2, ShoppingCart } from 'lucide-react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { HostingService, Product } from '../types';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

export const Hosting: React.FC = () => {
  const [domain, setDomain] = useState('');
  const [availability, setAvailability] = useState<{status: string, message: string, price?: number} | null>(null);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<HostingService[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const navigate = useNavigate();
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const q = query(collection(db, 'hostingServices'), orderBy('order', 'asc'));
        const querySnapshot = await getDocs(q);
        const servicesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as HostingService[];
        setServices(servicesData.filter(s => s.isActive));
      } catch (error) {
        console.error("Error fetching services", error);
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, []);

  const checkDomain = async () => {
    if (!domain) return;
    setLoading(true);
    // Simulate domain checking API for preview purposes
    setTimeout(() => {
      if (domain.length > 4) {
        setAvailability({ status: 'available', message: `Congratulations! ${domain} is available!`, price: 1000 });
      } else {
        setAvailability({ status: 'unavailable', message: `Sorry, ${domain} is already taken.` });
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <Layout>
      <div className="bg-[#f0f4f8] py-16">
        <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-6 text-[#1a2b3c]">Domain & Hosting Solutions</h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">Find the perfect domain name & get lightning-fast hosting in one place.</p>
            
            <div className="flex bg-white p-2 rounded-lg shadow-lg max-w-xl mx-auto">
                <input 
                    type="text" 
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="Enter your domain name (e.g. example.com)"
                    className="flex-grow p-4 outline-none"
                />
                <button 
                    onClick={checkDomain}
                    disabled={loading}
                    className="bg-[#EF4444] text-white px-8 py-4 rounded font-bold hover:bg-red-600 flex items-center gap-2"
                >
                    <Search size={20} /> {loading ? 'Checking...' : 'Search'}
                </button>
            </div>
            
            {availability && (
                <div className={`mt-6 p-4 rounded flex items-center justify-between ${availability.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    <span className="font-medium text-lg">{availability.message}</span>
                    {availability.status === 'available' && (
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-xl">BDT {availability.price}/yr</span>
                        <button 
                          onClick={() => {
                            const product: Product = {
                              id: `domain_${domain}`,
                              name: `Domain Registration - ${domain}`,
                              description: '1 Year Registration',
                              price: availability.price || 1000,
                              category: 'Hosting & Domains',
                              stock: 9999,
                              images: [],
                              createdAt: new Date().toISOString()
                            };
                            addToCart(product);
                            toast.success(`Domain ${domain} added to cart`);
                            navigate('/cart');
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 flex items-center gap-2 rounded-md font-bold transition-all"
                        >
                          <ShoppingCart size={18} /> Add to Cart
                        </button>
                      </div>
                    )}
                </div>
            )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Services We Provide With Love</h2>
        {loadingServices ? (
            <div className="flex justify-center text-gray-500">Loading services...</div>
        ) : services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {services.map(service => (
                    <div 
                      key={service.id} 
                      className="bg-white border hover:border-[#3b82f6] border-gray-200 p-6 rounded-lg text-center shadow-sm hover:shadow-lg transition-all flex flex-col items-center justify-between h-full cursor-pointer group"
                      onClick={() => navigate(`/hosting/${service.id}`)}
                    >
                        <div className="mb-4 text-5xl">
                          {service.iconPath ? service.iconPath : <Server size={48} className="text-[#3b82f6] mx-auto opacity-80" />}
                        </div>
                        
                        <h3 className="text-lg font-bold text-[#1f2937] mb-2">{service.title}</h3>
                        <p className="text-sm text-gray-500 mb-6 flex-1 px-2 leading-tight">{service.description}</p>
                        
                        <div className="w-full">
                          <p className="text-xs text-gray-400 mb-1">Starting From</p>
                          <p className="text-lg font-bold text-[#1f2937] mb-4">
                            {service.startingPrice} {service.currency || 'BDT'}{service.billingCycle}
                          </p>
                          
                          <button 
                            className="bg-[#84cc16] hover:bg-[#65a30d] text-white w-full py-2 rounded text-sm font-bold transition-all shadow-sm group-hover:shadow-md"
                          >
                            View Plans
                          </button>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center text-gray-500">No hosting services available right now.</div>
        )}
      </div>
      
      <div className="bg-white py-16">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
                { icon: Server, title: '99.9% Uptime', desc: 'Guaranteed uptime to keep your site online.' },
                { icon: Globe, title: 'Global CDN', desc: 'Fast load times worldwide.' },
                { icon: ShieldCheck, title: 'Secure SSL', desc: 'Free SSL for all your domains.' }
            ].map((feat, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                    <div className="bg-red-50 p-4 rounded-full mb-4 text-[#EF4444]">
                        <feat.icon size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{feat.title}</h3>
                    <p className="text-gray-600">{feat.desc}</p>
                </div>
            ))}
        </div>
      </div>
    </Layout>
  );
};
