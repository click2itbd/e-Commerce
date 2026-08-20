const fs = require('fs');
const path = require('path');

const sectionPath = 'src/pages/hosting-sections/DynamicHostingPlansSection.jsx';
const builderPath = 'src/pages/hosting-sections/CustomHostingBuilder.jsx';

const builderCode = `import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { useCart } from '../../context/CartContext';
import { Server, HardDrive, Mail, Database, Activity, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CustomHostingBuilder() {
  const [pricing, setPricing] = useState(null);
  const [resources, setResources] = useState({
    disk: 10,
    bandwidth: 100,
    email: 10,
    db: 5,
    cpu: 100,
    ram: 1024
  });
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    getDoc(doc(db, 'custom_hosting_pricing', 'global_pricing')).then(snap => {
      if(snap.exists()) setPricing(snap.data());
      else setPricing({ perGbDisk: 50, perGbBandwidth: 10, perEmailAccount: 5, perDatabase: 10, perCoreCpu: 200, perGbRam: 150 });
    });
  }, []);

  if (!pricing) return null;

  const calculatePrice = () => {
    let total = 0;
    total += resources.disk * pricing.perGbDisk;
    total += (resources.bandwidth / 100) * pricing.perGbBandwidth; // basic scale
    total += resources.email * pricing.perEmailAccount;
    total += resources.db * pricing.perDatabase;
    total += (resources.cpu / 100) * (pricing.perCoreCpu || 200);
    total += (resources.ram / 1024) * (pricing.perGbRam || 150);
    return Math.floor(total);
  };

  const handleAddToCart = () => {
    addToCart({
      id: \`custom-hosting-\${Date.now()}\`,
      name: \`Custom CloudLinux Hosting\`,
      price: calculatePrice(),
      quantity: 1,
      category: 'Hosting & Domains',
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=200',
      billingCycle: 'monthly',
      details: { ...resources }
    });
    toast.success('Custom plan added to cart');
    navigate('/hosting/cart');
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden mt-16 border border-gray-100">
      <div className="bg-gradient-to-r from-gray-900 to-indigo-900 p-8 text-white">
        <h3 className="text-2xl font-bold mb-2">Build Your Custom CloudLinux Plan</h3>
        <p className="text-indigo-200">Slide to adjust resources. CloudLinux limits scale automatically.</p>
      </div>
      
      <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div>
            <div className="flex justify-between mb-2">
              <label className="font-bold text-gray-700 flex items-center"><HardDrive size={16} className="mr-2 text-indigo-500" /> SSD Disk Space</label>
              <span className="font-bold text-indigo-600">{resources.disk} GB</span>
            </div>
            <input type="range" min="1" max="100" value={resources.disk} onChange={(e)=>setResources({...resources, disk: parseInt(e.target.value)})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="font-bold text-gray-700 flex items-center"><Activity size={16} className="mr-2 text-indigo-500" /> Bandwidth</label>
              <span className="font-bold text-indigo-600">{resources.bandwidth} GB</span>
            </div>
            <input type="range" min="10" max="1000" step="10" value={resources.bandwidth} onChange={(e)=>setResources({...resources, bandwidth: parseInt(e.target.value)})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="font-bold text-gray-700 flex items-center"><Server size={16} className="mr-2 text-indigo-500" /> CloudLinux CPU Limit</label>
              <span className="font-bold text-indigo-600">{resources.cpu}%</span>
            </div>
            <input type="range" min="100" max="400" step="50" value={resources.cpu} onChange={(e)=>setResources({...resources, cpu: parseInt(e.target.value)})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="font-bold text-gray-700 flex items-center"><Server size={16} className="mr-2 text-indigo-500" /> Physical Memory (PMEM)</label>
              <span className="font-bold text-indigo-600">{resources.ram} MB</span>
            </div>
            <input type="range" min="1024" max="8192" step="1024" value={resources.ram} onChange={(e)=>setResources({...resources, ram: parseInt(e.target.value)})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-gray-500 uppercase tracking-wider text-xs mb-4">Your Configuration</h4>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex justify-between"><span>CPU Limit</span> <span className="font-bold">{resources.cpu}%</span></li>
              <li className="flex justify-between"><span>Physical RAM</span> <span className="font-bold">{resources.ram} MB</span></li>
              <li className="flex justify-between"><span>SSD Storage</span> <span className="font-bold">{resources.disk} GB</span></li>
              <li className="flex justify-between"><span>Bandwidth</span> <span className="font-bold">{resources.bandwidth} GB</span></li>
              <li className="flex justify-between text-gray-400"><span>IO Usage</span> <span className="font-bold">10 MB/s</span></li>
              <li className="flex justify-between text-gray-400"><span>Entry Process</span> <span className="font-bold">{Math.floor(resources.cpu / 10)}</span></li>
            </ul>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-gray-500 text-sm mb-1">Estimated Monthly Cost</p>
            <p className="text-4xl font-extrabold text-gray-900 mb-6">৳{calculatePrice()}</p>
            <button onClick={handleAddToCart} className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
              Deploy Custom Server <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}`;

const dynamicSectionCode = `import React, { useState, useEffect } from 'react';
import { Check, ArrowRight, X, Server, Database, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCart } from '../../context/CartContext';
import { toast } from 'react-hot-toast';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import CustomHostingBuilder from './CustomHostingBuilder';

export default function DynamicHostingPlansSection({
  billingCycle,
  onBillingCycleChange,
  onNavigate,
}) {
  const { addToCart } = useCart();
  const [plans, setPlans] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansSnap, featsSnap] = await Promise.all([
          getDocs(query(collection(db, 'hosting_plans'), orderBy('order', 'asc'))),
          getDocs(query(collection(db, 'hosting_features'), orderBy('order', 'asc')))
        ]);
        setPlans(plansSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(p => p.status === 'published'));
        setFeatures(featsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error('Error fetching dynamic plans:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleBuyNow = (plan) => {
    const price = billingCycle === 'annually' ? plan.pricing?.annually : plan.pricing?.monthly;
    addToCart({
      id: \`dynamic-hosting-\${plan.id}-\${billingCycle}\`,
      name: plan.name,
      price: price || 0,
      quantity: 1,
      category: 'Hosting & Domains',
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=200',
      billingCycle: billingCycle
    });
    toast.success(\`\${plan.name} added to cart!\`);
    onNavigate('/hosting/cart');
  };

  if (loading || plans.length === 0) return null;

  return (
    <section className="py-24 bg-gray-50 border-t border-gray-100">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[#7B61FF]/10 text-[#7B61FF] rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-4">
            CloudLinux LVE Powered
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 uppercase tracking-tight">Enterprise Grade Hosting</h2>
          <p className="text-gray-500 max-w-2xl mx-auto mt-4">
            Built on robust CloudLinux technology for maximum isolation, stability and performance.
          </p>
          
          <div className="mt-8 flex justify-center gap-2">
            <button onClick={() => onBillingCycleChange('monthly')} className={cn("px-6 py-2 rounded-full text-sm font-bold transition-colors", billingCycle === 'monthly' ? "bg-gray-900 text-white" : "bg-white text-gray-600 shadow-sm border border-gray-200 hover:bg-gray-50")}>Monthly</button>
            <button onClick={() => onBillingCycleChange('annually')} className={cn("px-6 py-2 rounded-full text-sm font-bold transition-colors", billingCycle === 'annually' ? "bg-gray-900 text-white" : "bg-white text-gray-600 shadow-sm border border-gray-200 hover:bg-gray-50")}>Annually (Save 20%)</button>
          </div>
        </div>

        {/* Package Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start mb-20">
          {plans.map((plan, idx) => {
            const price = billingCycle === 'annually' ? plan.pricing?.annually : plan.pricing?.monthly;
            
            return (
            <div key={plan.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-xl hover:border-[#7B61FF] transition-all relative overflow-hidden group">
              <div className="absolute top-0 inset-x-0 h-1 bg-[#7B61FF] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              
              <h3 className="text-xl font-bold uppercase mb-2 tracking-wide text-gray-900">{plan.name}</h3>
              
              <div className="mb-6">
                <div className="flex items-baseline font-bold text-gray-900">
                  <span className="text-lg mr-1">৳</span>
                  <span className="text-4xl tracking-tighter">{price || 0}</span>
                  <span className="text-gray-500 ml-1 text-sm font-normal">/{billingCycle === 'annually' ? 'yr' : 'mo'}</span>
                </div>
              </div>

              {/* CloudLinux Highlight Box */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 flex items-center"><Server size={14} className="mr-1"/> CPU Limit</span>
                  <span className="font-bold text-gray-900">{plan.cloudLinuxLimits?.cpu}%</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 flex items-center"><Activity size={14} className="mr-1"/> Phys. Memory</span>
                  <span className="font-bold text-gray-900">{plan.cloudLinuxLimits?.pmem} MB</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 flex items-center"><Database size={14} className="mr-1"/> IO Usage</span>
                  <span className="font-bold text-gray-900">{plan.cloudLinuxLimits?.io} MB/s</span>
                </div>
              </div>

              <button onClick={() => handleBuyNow(plan)} className="w-full py-3 rounded-lg font-bold uppercase tracking-wider text-xs transition-all bg-[#7B61FF] text-white hover:bg-purple-700 shadow-md">
                Order Now
              </button>
            </div>
          )})}
        </div>

        {/* Compare Table */}
        {features.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-20">
            <div className="p-6 bg-gray-50 border-b border-gray-200 text-center">
              <h3 className="text-xl font-bold uppercase tracking-wide">Detailed Feature Comparison</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b">
                    <th className="p-4 min-w-[200px] border-r border-gray-100">Features</th>
                    {plans.map(plan => (
                      <th key={plan.id} className="p-4 text-center font-bold text-lg min-w-[150px] border-r border-gray-100 last:border-0">{plan.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {features.map((f, i) => (
                    <tr key={f.id} className={cn("border-b border-gray-100", i % 2 === 0 ? "bg-gray-50/50" : "bg-white")}>
                      <td className="p-4 text-sm font-medium text-gray-700 border-r border-gray-100">{f.name}</td>
                      {plans.map(plan => {
                        const val = plan.comparisonValues?.[f.id];
                        return (
                          <td key={plan.id} className="p-4 text-center border-r border-gray-100 last:border-0">
                            {f.type === 'boolean' ? (
                              val === true ? <Check size={18} className="mx-auto text-green-500" /> : <X size={18} className="mx-auto text-gray-300" />
                            ) : (
                              <span className="text-sm font-bold text-gray-800">{val || '-'}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Custom Builder */}
        <CustomHostingBuilder />
        
      </div>
    </section>
  );
}`;

fs.writeFileSync(builderPath, builderCode);
fs.writeFileSync(sectionPath, dynamicSectionCode);
