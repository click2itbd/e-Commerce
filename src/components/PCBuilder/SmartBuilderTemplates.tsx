import React, { useState } from 'react';
import { Product } from '../../types';
import { Gamepad2, Video, Briefcase, Radio, Zap } from 'lucide-react';
import { getCompatibility } from './utils';
import { toast } from 'react-hot-toast';

interface SmartBuilderTemplatesProps {
  products: Product[];
  onApplyBuild: (build: Record<string, Product>) => void;
}

export const SmartBuilderTemplates: React.FC<SmartBuilderTemplatesProps> = ({ products, onApplyBuild }) => {
  const [budget, setBudget] = useState<number>(80000);
  const [activeTemplate, setActiveTemplate] = useState<string>('gaming');

  const templates = [
    { id: 'gaming', name: 'Gaming', icon: Gamepad2, color: 'bg-purple-100 text-purple-700' },
    { id: 'editing', name: 'Video Editing', icon: Video, color: 'bg-blue-100 text-blue-700' },
    { id: 'office', name: 'Office / Study', icon: Briefcase, color: 'bg-emerald-100 text-emerald-700' },
    { id: 'streaming', name: 'Streaming', icon: Radio, color: 'bg-rose-100 text-rose-700' },
  ];

  const generateBuild = () => {
    const build: Record<string, Product> = {};
    
    // Define budget allocation percentages based on template
    const allocations = {
      gaming: { cpu: 0.20, motherboard: 0.15, ram: 0.10, 'graphics-card': 0.35, storage: 0.08, 'power-supply': 0.07, casing: 0.05 },
      editing: { cpu: 0.30, motherboard: 0.15, ram: 0.15, 'graphics-card': 0.20, storage: 0.10, 'power-supply': 0.05, casing: 0.05 },
      office: { cpu: 0.40, motherboard: 0.20, ram: 0.15, storage: 0.15, 'power-supply': 0.05, casing: 0.05 }, // No GPU typically needed
      streaming: { cpu: 0.25, motherboard: 0.15, ram: 0.10, 'graphics-card': 0.30, storage: 0.08, 'power-supply': 0.07, casing: 0.05 },
    };

    const currentAlloc = (allocations as any)[activeTemplate];
    const cats = ['cpu', 'motherboard', 'ram', 'storage', 'graphics-card', 'power-supply', 'casing'];

    const findProduct = (cat: string, targetPrice: number) => {
      if (!currentAlloc[cat]) return null;
      
      const normalize = (str: string) => str.toLowerCase().replace(/[- ]/g, '');
      const catNorm = normalize(cat);
      
      const available = products.filter(p => {
        const pCatNorm = normalize(p.category);
        const pNameNorm = normalize(p.name);
        return (pCatNorm.includes(catNorm) || pNameNorm.includes(catNorm) ||
               (catNorm === 'graphicscard' && (pCatNorm.includes('gpu') || pNameNorm.includes('gpu'))) ||
               (catNorm === 'powersupply' && (pCatNorm.includes('psu') || pNameNorm.includes('psu'))) ||
               (catNorm === 'cpu' && (pCatNorm.includes('processor') || pNameNorm.includes('processor')))
        ) && p.stock > 0;
      });
      if (!available.length) return null;
      
      const sorted = available.sort((a, b) => Math.abs(a.price - targetPrice) - Math.abs(b.price - targetPrice));
      
      for (const p of sorted) {
        if (getCompatibility(cat, p, build).isCompatible) return p;
      }
      return sorted[0];
    };

    let total = 0;
    for (const cat of cats) {
      if (currentAlloc[cat]) {
        const p = findProduct(cat, budget * currentAlloc[cat]);
        if (p) {
          build[cat] = p;
          total += p.price;
        }
      }
    }

    onApplyBuild(build);
    toast.success(`Generated a ${activeTemplate} build for ৳${total.toLocaleString()}!`);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 print:hidden relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Zap className="text-white" size={18} fill="currentColor" />
        </div>
        <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600">Smart Build Generator</h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <label className="block text-sm font-bold text-slate-700 mb-4">
            Set Your Target Budget: <span className="text-indigo-600 text-xl ml-2 font-black">৳{budget.toLocaleString()}</span>
          </label>
          <input 
            type="range" 
            min="20000" 
            max="300000" 
            step="5000"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 shadow-inner"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-3 font-bold uppercase tracking-wider">
            <span>৳20K</span>
            <span>৳1.5L</span>
            <span>৳3L+</span>
          </div>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-bold text-slate-700 mb-4">
            Select Use-Case Template
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {templates.map(t => {
              const Icon = t.icon;
              const isActive = activeTemplate === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTemplate(t.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 hover:-translate-y-1 ${
                    isActive ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600/20 shadow-md shadow-indigo-500/10' : 'border-slate-200 bg-white hover:bg-slate-50 hover:shadow-sm hover:border-indigo-200'
                  }`}
                >
                  <div className={`p-2 rounded-lg mb-2 ${t.color} ${isActive ? 'scale-110 shadow-sm' : ''} transition-all duration-300`}>
                    <Icon size={20} />
                  </div>
                  <span className={`text-[11px] font-bold text-center ${isActive ? 'text-indigo-900' : 'text-slate-500'}`}>
                    {t.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-100 flex justify-end">
        <button 
          onClick={generateBuild}
          className="bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
        >
          <Zap size={18} className="text-amber-400" fill="currentColor" />
          Auto-Generate Build
        </button>
      </div>
    </div>
  );
};
