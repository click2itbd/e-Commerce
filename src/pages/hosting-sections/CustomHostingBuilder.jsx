import React, { useState, useEffect } from 'react';
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
      id: `custom-hosting-${Date.now()}`,
      name: `Custom CloudLinux Hosting`,
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
}