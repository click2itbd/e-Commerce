import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { HostingPlan, HostingService, Product } from '../types';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

export const HostingDetails: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [service, setService] = useState<HostingService | null>(null);
  const [plans, setPlans] = useState<HostingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!serviceId) return;
      try {
        setLoading(true);
        // Fetch Service details
        const serviceRef = doc(db, 'hostingServices', serviceId);
        const serviceSnap = await getDoc(serviceRef);
        if (serviceSnap.exists()) {
          setService({ id: serviceSnap.id, ...serviceSnap.data() } as HostingService);
        }

        // Fetch Plans
        const q = query(
          collection(db, 'hostingPlans'),
          where('serviceId', '==', serviceId)
        );
        const querySnapshot = await getDocs(q);
        const plansData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as HostingPlan[];
        
        // Sort in memory by order
        plansData.sort((a, b) => (a.order || 0) - (b.order || 0));
        setPlans(plansData);
      } catch (error) {
        console.error("Error fetching hosting details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [serviceId]);

  return (
    <Layout>
      <div className="bg-[#081621] text-white py-16">
        <div className="container mx-auto px-4">
          <button 
            onClick={() => navigate('/hosting')}
            className="flex items-center gap-2 text-gray-300 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Services
          </button>
          
          {loading ? (
             <div className="animate-pulse flex space-x-4">
               <div className="flex-1 space-y-6 py-1">
                 <div className="h-8 bg-gray-700 rounded w-1/4"></div>
                 <div className="space-y-3">
                   <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                 </div>
               </div>
             </div>
          ) : service ? (
            <>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 flex items-center gap-4">
                {service.iconPath && <span className="text-5xl">{service.iconPath}</span>}
                {service.title}
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl">{service.description}</p>
            </>
          ) : (
            <h1 className="text-4xl font-bold text-red-500">Service Not Found</h1>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Choose Your Plan</h2>
        {loading ? (
            <div className="flex justify-center text-gray-500">Loading plans...</div>
        ) : plans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map(plan => (
                    <div key={plan.id} className={`border p-8 rounded-lg text-center hover:shadow-xl transition-shadow bg-white ${plan.popular ? 'border-[#EF4444] shadow-md relative mt-[-10px] pb-10' : 'border-gray-200 mt-2'}`}>
                        {plan.popular && (
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#EF4444] text-white px-4 py-1 rounded-full text-sm font-bold shadow">
                              Most Popular
                          </div>
                        )}
                        <h3 className="text-2xl font-bold mb-4 text-[#1a2b3c]">{plan.name}</h3>
                        <p className="text-4xl font-bold mb-2 text-[#EF4444]">${plan.price.toFixed(2)}<span className="text-lg text-gray-500">{plan.billingCycle}</span></p>
                        
                        <div className="mt-8 mb-8 space-y-4 text-left">
                           {plan.features?.map((feat, idx) => (
                             <div key={idx} className="flex items-start gap-3 text-gray-600">
                               <CheckCircle2 size={20} className="text-green-500 shrink-0 mt-0.5" />
                               <span>{feat}</span>
                             </div>
                           ))}
                        </div>

                        <button 
                          onClick={() => {
                            if (!service) return;
                            const product: Product = {
                              id: `hosting_${plan.id}`,
                              name: `${service.title} - ${plan.name} (${plan.billingCycle.replace('/', '')})`,
                              description: plan.features.join(', '),
                              price: plan.price,
                              category: 'Hosting & Domains',
                              stock: 9999,
                              images: [],
                              createdAt: new Date().toISOString()
                            };
                            addToCart(product);
                            toast.success(`${plan.name} plan added to cart`);
                            navigate('/cart');
                          }}
                          className={`w-full py-3 rounded-md font-bold transition-all ${plan.popular ? 'bg-[#EF4444] text-white hover:bg-red-600' : 'bg-[#1a2b3c] text-white hover:bg-[#2c3e50]'}`}
                        >
                            Get Started
                        </button>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center text-gray-500">No hosting plans available for this service right now.</div>
        )}
      </div>
    </Layout>
  );
};
