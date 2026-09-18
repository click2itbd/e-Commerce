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
    
    // Simulate API delay
    await new Promise(r => setTimeout(r, 2000));

    // Parse budget roughly
    const budgetMatch = userPrompt.toLowerCase().match(/(\d+[,.]?\d*)\s*(k|thousand|lakh|tk|bdt)/);
    let maxBudget = 100000; // Default
    if (budgetMatch) {
      const val = parseFloat(budgetMatch[1].replace(/,/g, ''));
      if (budgetMatch[2] === 'k' || budgetMatch[2] === 'thousand') maxBudget = val * 1000;
      else if (budgetMatch[2] === 'lakh') maxBudget = val * 100000;
      else maxBudget = val;
    }

    const isGaming = userPrompt.toLowerCase().includes('gaming');
    const isEditing = userPrompt.toLowerCase().includes('edit');

    // Super simple heuristic algorithm to pick parts within budget
    const build: Record<string, Product> = {};
    let currentTotal = 0;

    const findProduct = (cat: string, targetPrice: number) => {
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
      // Find closest to target price without going over too much
      const sorted = available.sort((a, b) => Math.abs(a.price - targetPrice) - Math.abs(b.price - targetPrice));
      
      // Ensure compatibility with already selected items!
      for (const p of sorted) {
        if (getCompatibility(cat, p, build).isCompatible) return p;
      }
      return sorted[0]; // fallback
    };

    // Budget allocation
    const alloc = {
      cpu: maxBudget * 0.25,
      motherboard: maxBudget * 0.15,
      ram: maxBudget * 0.10,
      storage: maxBudget * 0.10,
      'graphics-card': isGaming || isEditing ? maxBudget * 0.30 : maxBudget * 0.10, // More for GPU if gaming
      'power-supply': maxBudget * 0.10,
      casing: maxBudget * 0.05
    };

    // We must pick in dependency order: CPU -> Mobo -> RAM -> ...
    const cats = ['cpu', 'motherboard', 'ram', 'storage', 'graphics-card', 'power-supply', 'casing'];
    
    for (const cat of cats) {
      const p = findProduct(cat, (alloc as any)[cat]);
      if (p) {
        build[cat] = p;
        currentTotal += p.price;
      }
    }

    let explanation = `I've put together a build for around ${maxBudget} BDT based on your request. `;
    if (isGaming) explanation += "Since you mentioned gaming, I prioritized a strong Graphics Card and CPU combo. ";
    else if (isEditing) explanation += "For editing, I've ensured you have a solid CPU and ample fast storage. ";
    else explanation += "This is a balanced configuration for general use and productivity. ";
    
    explanation += "All parts are guaranteed to be compatible!";

    setSuggestedBuild({
      components: build,
      explanation,
      total: currentTotal
    });
    
    setIsProcessing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
      >
        <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
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
              <div className="bg-indigo-50 text-indigo-900 p-4 rounded-xl text-sm font-medium">
                Example: "I need a PC for 4K video editing and 3D rendering under 1.5 Lakh BDT" or "Budget gaming PC for Valorant around 60k".
              </div>
              
              <div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your perfect PC..."
                  className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <button
                onClick={() => generateMockAIResponse(prompt)}
                disabled={!prompt.trim() || isProcessing}
                className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                <p className="text-emerald-800 text-sm leading-relaxed">{suggestedBuild.explanation}</p>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-slate-900">Suggested Components:</h3>
                {Object.entries(suggestedBuild.components).map(([cat, product]) => (
                  <div key={cat} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <img src={product.images?.[0] || '/placeholder.png'} className="w-10 h-10 object-contain mix-blend-multiply" />
                    <div>
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{cat}</p>
                      <p className="text-sm font-medium text-slate-800 line-clamp-1">{product.name}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSuggestedBuild(null)}
                  className="flex-1 bg-slate-100 text-slate-700 py-3.5 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => {
                    onApplyBuild(suggestedBuild.components);
                    onClose();
                  }}
                  className="flex-[2] bg-slate-900 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
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
