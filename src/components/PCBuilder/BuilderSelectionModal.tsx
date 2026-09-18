import React, { useState, useMemo } from 'react';
import { Product } from '../../types';
import { BuilderCategory } from './constants';
import { getCompatibility } from './utils';
import { formatCurrency, cn } from '../../lib/utils';
import { X, Search, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface BuilderSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: BuilderCategory | null;
  products: Product[];
  selectedComponents: Record<string, Product>;
  onSelect: (product: Product) => void;
}

export const BuilderSelectionModal: React.FC<BuilderSelectionModalProps> = ({
  isOpen,
  onClose,
  category,
  products,
  selectedComponents,
  onSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => {
    if (!category) return [];
    
    // Normalize string by removing spaces and dashes for lenient matching
    const normalize = (str: string) => str.toLowerCase().replace(/[- ]/g, '');
    const catIdNorm = normalize(category.id);
    const catNameNorm = normalize(category.name || '');

    return products.filter(p => {
      const pCatNorm = normalize(p.category);
      const pNameNorm = normalize(p.name);
      
      const matchesCat = pCatNorm.includes(catIdNorm) || pCatNorm.includes(catNameNorm) || 
                         pNameNorm.includes(catIdNorm) || pNameNorm.includes(catNameNorm) ||
                         // Special case: 'gpu' for 'graphics-card', 'psu' for 'power-supply'
                         (catIdNorm === 'graphicscard' && (pCatNorm.includes('gpu') || pNameNorm.includes('gpu'))) ||
                         (catIdNorm === 'powersupply' && (pCatNorm.includes('psu') || pNameNorm.includes('psu'))) ||
                         (catIdNorm === 'cpu' && (pCatNorm.includes('processor') || pNameNorm.includes('processor')));
                         
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [products, category, searchQuery]);

  if (!isOpen || !category) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
    >
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white z-10">
          <div>
            <h2 className="text-xl font-black text-slate-900">Select {category.name}</h2>
            <p className="text-sm text-slate-500 mt-1">Choose a component for your build</p>
          </div>
          <button 
            onClick={onClose} 
            className="h-10 w-10 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all"
            />
          </div>
        </div>

        {/* Product List */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-6 bg-slate-50/30 custom-scrollbar">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <Search size={48} className="opacity-20" />
              <p>No components found for this category.</p>
            </div>
          ) : (
            <motion.div 
              initial="hidden" 
              animate="show" 
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.05 } }
              }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-4"
            >
              {filteredProducts.map(product => {
                const { isCompatible, reason } = getCompatibility(category.id, product, selectedComponents);
                const isSelected = selectedComponents[category.id]?.id === product.id;

                return (
                  <motion.div 
                    variants={{
                      hidden: { opacity: 0, scale: 0.95 },
                      show: { opacity: 1, scale: 1 }
                    }}
                    whileHover={{ scale: 1.02 }}
                    key={product.id} 
                    className={cn(
                    "bg-white border rounded-2xl p-4 flex gap-4 transition-colors group hover:shadow-md",
                    product.stock <= 0 ? "opacity-60 grayscale-[0.5]" : "",
                    isSelected ? "border-slate-900 ring-1 ring-slate-900" : isCompatible ? "border-slate-200 hover:border-slate-300" : "border-red-200 bg-red-50/30"
                  )}>
                    <div className="h-20 w-20 bg-white border border-slate-100 rounded-xl p-2 shrink-0 flex items-center justify-center">
                      <img src={product.images?.[0] || '/placeholder.png'} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                    
                    <div className="flex-grow flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h4 className="text-sm font-bold text-slate-900 line-clamp-2">{product.name}</h4>
                          {isSelected && <CheckCircle2 className="text-slate-900 shrink-0" size={18} />}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <p className="font-black text-slate-900">{formatCurrency(product.price)}</p>
                          {product.socketType && <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">{product.socketType}</span>}
                          {product.ramType && <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">{product.ramType}</span>}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {!isCompatible ? (
                          <div className="flex-grow flex items-center gap-1.5 text-[11px] text-red-600 font-medium bg-red-50 px-2.5 py-1.5 rounded-lg">
                            <AlertTriangle size={14} className="shrink-0" />
                            <span className="line-clamp-1">{reason}</span>
                          </div>
                        ) : product.stock <= 0 ? (
                           <div className="flex-grow flex items-center gap-1.5 text-[11px] text-amber-600 font-medium bg-amber-50 px-2.5 py-1.5 rounded-lg">
                            <AlertTriangle size={14} className="shrink-0" />
                            <span>Out of Stock</span>
                          </div>
                        ) : (
                          <div className="flex-grow"></div>
                        )}

                        {product.stock <= 0 ? (
                          <button
                            onClick={() => {
                              // Find Alternative Logic
                              const alt = products.find(p => 
                                p.category.toLowerCase().includes(category.id.toLowerCase()) && 
                                p.id !== product.id && 
                                p.stock > 0 &&
                                getCompatibility(category.id, p, selectedComponents).isCompatible &&
                                Math.abs(p.price - product.price) < (product.price * 0.2) // Within 20% price range
                              );
                              if (alt) {
                                onSelect(alt);
                                onClose();
                              } else {
                                alert("No exact alternative found in stock.");
                              }
                            }}
                            className="px-4 py-2 text-sm font-bold rounded-xl transition-all shrink-0 bg-amber-100 text-amber-700 hover:bg-amber-200"
                          >
                            Find Alternative
                          </button>
                        ) : (
                          <button
                            disabled={!isCompatible}
                            onClick={() => {
                              onSelect(product);
                              onClose();
                            }}
                            className={cn(
                              "px-4 py-2 text-sm font-bold rounded-xl transition-all shrink-0",
                              isSelected ? "bg-slate-900 text-white" : isCompatible 
                                ? "bg-slate-100 text-slate-700 hover:bg-slate-900 hover:text-white" 
                                : "bg-slate-100 text-slate-400 cursor-not-allowed"
                            )}
                          >
                            {isSelected ? 'Selected' : isCompatible ? 'Select' : 'Incompatible'}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
