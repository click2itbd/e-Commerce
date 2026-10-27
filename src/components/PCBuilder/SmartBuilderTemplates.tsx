import React, { useState } from 'react';
import { Product } from '../../types';
import { Gamepad2, Video, Briefcase, Radio, Zap, Sparkles, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { getCompatibility } from './utils';
import { toast } from 'react-hot-toast';
import { formatCurrency, cn } from '../../lib/utils';

interface SmartBuilderTemplatesProps {
  products: Product[];
  onApplyBuild: (build: Record<string, Product>) => void;
}

const TEMPLATES = [
  { id: 'gaming', name: 'Gaming (High FPS)', icon: Gamepad2, desc: 'GPU prioritized for 1080p/1440p gameplay' },
  { id: 'editing', name: 'Video Editing / 3D', icon: Video, desc: 'Multi-core CPU + higher RAM for rendering' },
  { id: 'office', name: 'Office / Study', icon: Briefcase, desc: 'Fast NVMe SSD, silent power, reliability' },
  { id: 'streaming', name: 'Streaming & Content', icon: Radio, desc: 'Balanced CPU/GPU for live broadcasting' },
];

const PRESET_BUDGETS = [45000, 65000, 85000, 120000, 160000, 220000];

export const SmartBuilderTemplates: React.FC<SmartBuilderTemplatesProps> = ({ products, onApplyBuild }) => {
  const [budget, setBudget] = useState<number>(85000);
  const [activeTemplate, setActiveTemplate] = useState<string>('gaming');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value.replace(/\D/g, ''), 10);
    setBudget(isNaN(val) ? 0 : val);
  };

  const generateBuild = () => {
    if (products.length === 0) {
      toast.error('Component catalog is still loading, please wait.');
      return;
    }

    const build: Record<string, Product> = {};
    const allocations = {
      gaming: { cpu: 0.22, motherboard: 0.15, ram: 0.10, 'graphics-card': 0.35, storage: 0.08, 'power-supply': 0.05, casing: 0.05 },
      editing: { cpu: 0.30, motherboard: 0.15, ram: 0.15, 'graphics-card': 0.22, storage: 0.08, 'power-supply': 0.05, casing: 0.05 },
      office: { cpu: 0.40, motherboard: 0.22, ram: 0.15, storage: 0.13, 'power-supply': 0.05, casing: 0.05 },
      streaming: { cpu: 0.25, motherboard: 0.15, ram: 0.15, 'graphics-card': 0.28, storage: 0.07, 'power-supply': 0.05, casing: 0.05 },
    };

    const targetAllocations = allocations[activeTemplate as keyof typeof allocations] || allocations.gaming;
    let currentCost = 0;

    const normalize = (str: string) => (str || '').toLowerCase().replace(/[- ]/g, '');

    Object.entries(targetAllocations).forEach(([category, percentage]) => {
      const categoryBudget = budget * percentage;
      const catIdNorm = normalize(category);

      const categoryProducts = products.filter(p => {
        const pCatNorm = normalize(p.category);
        const pNameNorm = normalize(p.name);

        let matches = pCatNorm.includes(catIdNorm) || pNameNorm.includes(catIdNorm);
        if (catIdNorm === 'graphicscard' && (pCatNorm.includes('gpu') || pNameNorm.includes('gpu') || pCatNorm.includes('graphics') || pNameNorm.includes('graphics'))) matches = true;
        if (catIdNorm === 'powersupply' && (pCatNorm.includes('psu') || pNameNorm.includes('psu') || pCatNorm.includes('power') || pNameNorm.includes('power'))) matches = true;
        if (catIdNorm === 'cpu' && (pCatNorm.includes('processor') || pNameNorm.includes('processor'))) matches = true;
        if (catIdNorm === 'ram' && (pCatNorm.includes('memory') || pNameNorm.includes('memory'))) matches = true;
        if (catIdNorm === 'storage' && (pCatNorm.includes('ssd') || pNameNorm.includes('ssd') || pCatNorm.includes('hdd') || pNameNorm.includes('nvme'))) matches = true;
        if (catIdNorm === 'casing' && (pCatNorm.includes('case') || pNameNorm.includes('case'))) matches = true;
        return matches && p.stock > 0;
      });

      // Sort candidate products by closest to category budget
      const candidates = categoryProducts.sort((a, b) => {
        const diffA = Math.abs(a.price - categoryBudget);
        const diffB = Math.abs(b.price - categoryBudget);
        return diffA - diffB;
      });

      if (candidates.length > 0) {
        for (const candidate of candidates) {
          const comp = getCompatibility(category, candidate, build);
          if (comp.isCompatible) {
            build[category] = candidate;
            currentCost += candidate.price;
            break;
          }
        }
      }
    });

    if (Object.keys(build).length === 0) {
      toast.error('Could not find compatible parts in stock for this budget. Try adjusting the target budget.');
      return;
    }

    onApplyBuild(build);
    toast.success(`Applied ${activeTemplate} configuration (${formatCurrency(currentCost)})!`);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 mb-8 shadow-[0_4px_25px_rgba(15,23,42,0.04)] transition-all">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="bg-gradient-to-tr from-violet-600 to-indigo-600 p-2 rounded-xl text-white shadow-sm shadow-violet-500/20">
            <Zap size={18} fill="currentColor" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Smart 1-Click Build Generator</h2>
            <p className="text-xs text-slate-500 font-medium">Quickly configure an optimal build based on budget & workload</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(prev => !prev)}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <SlidersHorizontal size={14} />
          <span>{isExpanded ? 'Collapse' : 'Configure'}</span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-6 pt-2">
          {/* Use Case Chips */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Select Primary Workload
            </label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {TEMPLATES.map(t => {
                const Icon = t.icon;
                const isActive = activeTemplate === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTemplate(t.id)}
                    className={cn(
                      'flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all',
                      isActive
                        ? 'border-violet-500 bg-violet-50/70 text-violet-900 ring-1 ring-violet-200 shadow-xs'
                        : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                    )}
                  >
                    <div className={cn(
                      'p-2 rounded-xl shrink-0 transition-colors',
                      isActive ? 'bg-violet-600 text-white' : 'bg-white text-slate-500 border border-slate-200'
                    )}>
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-black block truncate">{t.name}</span>
                      <span className="text-[11px] text-slate-500 line-clamp-1">{t.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Budget Range & Quick Pills */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center pt-2">
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Target Budget
                </label>
                <span className="text-base font-black text-slate-900">
                  {formatCurrency(budget)}
                </span>
              </div>

              <input
                type="range"
                min="30000"
                max="300000"
                step="5000"
                value={budget}
                onChange={e => setBudget(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
              />

              <div className="flex flex-wrap gap-1.5 pt-1">
                {PRESET_BUDGETS.map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setBudget(val)}
                    className={cn(
                      'px-2.5 py-1 text-xs font-bold rounded-xl border transition-all',
                      budget === val
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    {formatCurrency(val)}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Action Button */}
            <div className="flex flex-col justify-end">
              <button
                type="button"
                onClick={generateBuild}
                className="w-full py-4 px-6 bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 hover:from-violet-500 hover:to-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-violet-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Sparkles size={18} className="animate-spin-slow" />
                <span>Auto-Generate Build</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
