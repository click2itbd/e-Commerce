import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../../types';
import { X, Bot, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { getCompatibility } from './utils';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onApplyBuild: (build: Record<string, Product>) => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  products,
  onApplyBuild
}) => {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestedBuild, setSuggestedBuild] = useState<{
    components: Record<string, Product>;
    explanation: string;
    total: number;
  } | null>(null);

  // Fallback Mock AI Logic since we don't have the API key
  const generateMockAIResponse = async (userPrompt: string) => {
    setIsProcessing(true);
    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const lowerPrompt = userPrompt.toLowerCase();
      
      // Parse Budget
      let budget = 0;
      const kMatch = lowerPrompt.match(/(\d+)\s*k/);
      const lakhMatch = lowerPrompt.match(/([\d.]+)\s*lakh/);
      const plainMatch = lowerPrompt.match(/(\d{2,}),?(\d{3})/);
      
      if (lakhMatch) {
        budget = parseFloat(lakhMatch[1]) * 100000;
      } else if (kMatch) {
        budget = parseInt(kMatch[1]) * 1000;
      } else if (plainMatch) {
        budget = parseInt(plainMatch[1] + plainMatch[2]);
      }
      
      if (budget === 0) budget = 80000; // default to 80k

      // Parse Use Case
      let useCase = 'gaming';
      if (lowerPrompt.includes('edit') || lowerPrompt.includes('render') || lowerPrompt.includes('3d') || lowerPrompt.includes('design')) {
        useCase = 'editing';
      } else if (lowerPrompt.includes('office') || lowerPrompt.includes('study') || lowerPrompt.includes('work')) {
        useCase = 'office';
      }

      // Allocations
      const allocations: any = {
        gaming: { cpu: 0.20, motherboard: 0.15, ram: 0.10, 'graphics-card': 0.35, storage: 0.08, 'power-supply': 0.07, casing: 0.05 },
        editing: { cpu: 0.30, motherboard: 0.15, ram: 0.20, 'graphics-card': 0.20, storage: 0.10, 'power-supply': 0.05, casing: 0.05 },
        office: { cpu: 0.40, motherboard: 0.20, ram: 0.15, storage: 0.15, 'power-supply': 0.05, casing: 0.05 }
      };

      const targetAllocations = allocations[useCase];
      const build: Record<string, Product> = {};
      let currentCost = 0;
      const normalize = (str: string) => (str || '').toLowerCase().replace(/[- ]/g, '');

      Object.entries(targetAllocations).forEach(([category, percentage]) => {
        const categoryBudget = budget * (percentage as number);
        const catIdNorm = normalize(category);
        
        const categoryProducts = products.filter(p => {
          const pCatNorm = normalize(p.category);
          const pNameNorm = normalize(p.name);
          let matches = pCatNorm.includes(catIdNorm) || pNameNorm.includes(catIdNorm);
          if (catIdNorm === 'graphicscard' && (pCatNorm.includes('gpu') || pNameNorm.includes('gpu') || pCatNorm.includes('graphics'))) matches = true;
          if (catIdNorm === 'powersupply' && (pCatNorm.includes('psu') || pNameNorm.includes('psu') || pCatNorm.includes('power'))) matches = true;
          if (catIdNorm === 'cpu' && (pCatNorm.includes('processor') || pNameNorm.includes('processor'))) matches = true;
          if (catIdNorm === 'ram' && (pCatNorm.includes('memory') || pNameNorm.includes('memory'))) matches = true;
          if (catIdNorm === 'storage' && (pCatNorm.includes('ssd') || pNameNorm.includes('ssd') || pCatNorm.includes('hdd'))) matches = true;
          if (catIdNorm === 'casing' && (pCatNorm.includes('case') || pNameNorm.includes('case'))) matches = true;
          return matches;
        });

        const affordableProducts = categoryProducts
          .filter(p => p.price <= categoryBudget)
          .sort((a, b) => b.price - a.price);

        if (affordableProducts.length > 0) {
          for (const product of affordableProducts) {
            const comp = getCompatibility(category, product, build);
            if (comp.isCompatible) {
              build[category] = product;
              currentCost += product.price;
              break;
            }
          }
        } else if (categoryProducts.length > 0) {
          const cheapest = categoryProducts.sort((a, b) => a.price - b.price)[0];
          build[category] = cheapest;
          currentCost += cheapest.price;
        }
      });

      if (Object.keys(build).length === 0) {
        throw new Error("I couldn't find any compatible parts in the inventory to match your request.");
      }

      setSuggestedBuild({
        components: build,
        explanation: `Based on your request, I've designed a ${useCase} build around BDT ${budget.toLocaleString()}. I've prioritized the ${useCase === 'gaming' ? 'Graphics Card' : useCase === 'editing' ? 'Processor & RAM' : 'Processor'} to ensure you get the absolute best performance for your workload!`,
        total: currentCost
      });
      
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Unknown error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-[#151A23] rounded-3xl border border-[#1F2633] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
      >
        <div className="bg-[#1F2633] p-6 border-b border-[#2A3441] flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
              <Bot size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black">AI Build Assistant</h2>
              <p className="text-indigo-200 text-sm">Tell me what you need, and I'll build it.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-grow overflow-y-auto">
          {!suggestedBuild ? (
            <div className="space-y-6">
              <div className="bg-violet-500/10 text-violet-400 border border-violet-500/20 p-4 rounded-xl text-sm font-medium">
                Example: "I need a PC for 4K video editing and 3D rendering under 1.5 Lakh BDT" or "Budget gaming PC for Valorant around 60k".
              </div>
              
              <div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your perfect PC..."
                  className="w-full h-32 bg-[#0B0E14] border border-[#1F2633] text-white rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <button
                onClick={() => generateMockAIResponse(prompt)}
                disabled={!prompt.trim() || isProcessing}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white shadow-lg py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isProcessing ? (
                  <><Loader2 className="animate-spin" size={18} /> Analyzing Requirements...</>
                ) : (
                  <><Sparkles size={18} /> Generate Build</>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-xl">
                <p className="text-cyan-400 text-sm leading-relaxed">{suggestedBuild.explanation}</p>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-white">Suggested Components:</h3>
                {Object.entries(suggestedBuild.components).map(([cat, product]) => (
                  <div key={cat} className="flex items-center gap-3 p-3 bg-[#0B0E14] rounded-xl border border-[#1F2633]">
                    <img src={product.images?.[0] || '/placeholder.png'} className="w-10 h-10 object-contain mix-blend-multiply" />
                    <div>
                      <p className="text-xs font-bold text-violet-400 uppercase tracking-wider">{cat}</p>
                      <p className="text-sm font-medium text-slate-200 line-clamp-1">{product.name}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSuggestedBuild(null)}
                  className="flex-1 bg-[#1F2633] text-slate-400 hover:text-white hover:bg-[#2A3441] py-3.5 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => {
                    onApplyBuild(suggestedBuild.components);
                    onClose();
                  }}
                  className="flex-[2] bg-violet-600 text-white hover:bg-violet-500 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                >
                  Apply to Builder <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
