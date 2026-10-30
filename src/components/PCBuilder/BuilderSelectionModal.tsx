import React, { useState, useMemo } from 'react';
import { Product } from '../../types';
import { BuilderCategory } from './constants';
import { getCompatibility } from './utils';
import { formatCurrency, cn } from '../../lib/utils';
import { X, Search, AlertTriangle, CheckCircle2, Filter, ShieldCheck, Check, Package, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BuilderSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: BuilderCategory | null;
  products: Product[];
  selectedComponents: Record<string, Product>;
  onSelect: (product: Product) => void;
}

type SortOption = 'default' | 'price_asc' | 'price_desc';

export const BuilderSelectionModal: React.FC<BuilderSelectionModalProps> = ({
  isOpen,
  onClose,
  category,
  products,
  selectedComponents,
  onSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedSocket, setSelectedSocket] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<SortOption>('default');
  const [hideIncompatible, setHideIncompatible] = useState<boolean>(true);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  const { filteredProducts, availableBrands, availableSockets, hiddenIncompatibleCount } = useMemo(() => {
    if (!category) return { filteredProducts: [], availableBrands: [], availableSockets: [], hiddenIncompatibleCount: 0 };

    const normalize = (str: string) => (str || '').toLowerCase().replace(/[- ]/g, '');
    const baseCategoryId = category.id.replace(/-\d+$/, '');
    const catIdNorm = normalize(baseCategoryId);
    const catNameNorm = normalize((category.name || '').replace(/#\d+$/, ''));

    let baseList = products.filter(p => {
      const pCatNorm = normalize(p.category);
      const pNameNorm = normalize(p.name);

      let matches = pCatNorm.includes(catIdNorm) || pCatNorm.includes(catNameNorm) || 
                    pNameNorm.includes(catIdNorm) || pNameNorm.includes(catNameNorm);

      if (catIdNorm === 'graphicscard' && (pCatNorm.includes('gpu') || pNameNorm.includes('gpu') || pCatNorm.includes('graphics') || pNameNorm.includes('graphics'))) matches = true;
      if (catIdNorm === 'powersupply' && (pCatNorm.includes('psu') || pNameNorm.includes('psu') || pCatNorm.includes('power') || pNameNorm.includes('power'))) matches = true;
      if (catIdNorm === 'cpu' && (pCatNorm.includes('processor') || pNameNorm.includes('processor'))) matches = true;
      if (catIdNorm === 'storage' && (pCatNorm.includes('ssd') || pCatNorm.includes('hdd') || pNameNorm.includes('ssd') || pNameNorm.includes('nvme'))) matches = true;
      if (catIdNorm === 'ram' && (pCatNorm.includes('memory') || pNameNorm.includes('memory'))) matches = true;

      return matches;
    });

    const brands = Array.from(new Set(baseList.map(p => p.brand).filter(Boolean))) as string[];
    const sockets = Array.from(new Set(baseList.map(p => p.socketType || p.ramType).filter(Boolean))) as string[];

    // In-Stock filter
    if (inStockOnly) {
      baseList = baseList.filter(p => p.stock > 0);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      baseList = baseList.filter(p => p.name.toLowerCase().includes(q) || (p.brand && p.brand.toLowerCase().includes(q)));
    }

    // Brand filter
    if (selectedBrand !== 'all') {
      baseList = baseList.filter(p => p.brand === selectedBrand);
    }

    // Socket / RAM Type filter
    if (selectedSocket !== 'all') {
      baseList = baseList.filter(p => p.socketType === selectedSocket || p.ramType === selectedSocket);
    }

    // Compatibility auto-filter
    let incompatibleCount = 0;
    const compatFiltered = baseList.filter(p => {
      const compat = getCompatibility(baseCategoryId, p, selectedComponents);
      if (!compat.isCompatible) {
        incompatibleCount++;
        return !hideIncompatible;
      }
      return true;
    });

    baseList = compatFiltered;

    // Sorting
    if (sortOrder === 'price_asc') {
      baseList.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
    } else if (sortOrder === 'price_desc') {
      baseList.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
    }

    return {
      filteredProducts: baseList,
      availableBrands: brands,
      availableSockets: sockets,
      hiddenIncompatibleCount: incompatibleCount,
    };
  }, [products, category, searchQuery, selectedBrand, selectedSocket, sortOrder, hideIncompatible, inStockOnly, selectedComponents]);

  if (!isOpen || !category) return null;
  const baseCategoryId = category.id.replace(/-\d+$/, '');

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedBrand('all');
    setSelectedSocket('all');
    setSortOrder('default');
    setHideIncompatible(true);
    setInStockOnly(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6"
    >
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ scale: 0.96, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 15 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="relative bg-white rounded-[2rem] w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200"
      >
        {/* Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Choose {category.name || category.title}
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
                {filteredProducts.length} Available
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Select a component to mount into your custom PC build</p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="h-10 w-10 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full flex items-center justify-center transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 sm:px-8 border-b border-slate-100 bg-slate-50/70 shrink-0 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder={`Search ${category.name || 'parts'} by name, brand, model...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 focus:ring-3 focus:ring-violet-500/15 transition-all shadow-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setHideIncompatible(prev => !prev)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all shadow-xs",
                hideIncompatible
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
              title="Automatically hide incompatible components"
            >
              <ShieldCheck size={15} className={hideIncompatible ? "text-emerald-600" : "text-slate-400"} />
              <span>Compatible Only</span>
              {hiddenIncompatibleCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-emerald-600 text-white font-black">
                  {hiddenIncompatibleCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setInStockOnly(prev => !prev)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all shadow-xs",
                inStockOnly
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              <Package size={15} />
              <span>In Stock</span>
            </button>

            <button
              type="button"
              onClick={() => setShowFilters(prev => !prev)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all shadow-xs",
                showFilters || selectedBrand !== 'all' || selectedSocket !== 'all' 
                  ? "bg-violet-50 text-violet-700 border-violet-200" 
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              <Filter size={15} />
              <span>Filter Specs</span>
            </button>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOption)}
              className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 outline-none focus:border-violet-500 cursor-pointer shadow-xs"
            >
              <option value="default">Default Sort</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Expandable Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-slate-100 bg-white overflow-hidden shrink-0"
            >
              <div className="p-4 sm:px-8 flex flex-wrap gap-6 items-start">
                {availableBrands.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Brand</label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedBrand('all')}
                        className={cn(
                          "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                          selectedBrand === 'all' ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                      >
                        All
                      </button>
                      {availableBrands.map(brand => (
                        <button
                          key={brand}
                          type="button"
                          onClick={() => setSelectedBrand(brand)}
                          className={cn(
                            "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                            selectedBrand === brand ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          )}
                        >
                          {brand}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {availableSockets.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Socket / Platform</label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedSocket('all')}
                        className={cn(
                          "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                          selectedSocket === 'all' ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                      >
                        All
                      </button>
                      {availableSockets.map(socket => (
                        <button
                          key={socket}
                          type="button"
                          onClick={() => setSelectedSocket(socket)}
                          className={cn(
                            "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                            selectedSocket === socket ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          )}
                        >
                          {socket}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product List */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-6 bg-slate-50/50 custom-scrollbar">
          {filteredProducts.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                <Search size={28} />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800">No components matched your search</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md">
                  Try clearing your filters or turning off "Compatible Only" to see all available inventory.
                </p>
              </div>
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-violet-600 transition-colors"
              >
                <RotateCcw size={13} />
                <span>Reset All Filters</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map(product => {
                const { isCompatible, reason } = getCompatibility(baseCategoryId, product, selectedComponents);
                const isSelected = selectedComponents[category.id]?.id === product.id;
                const isOutOfStock = Boolean(product.isOutOfStock);

                return (
                  <div
                    key={product.id}
                    className={cn(
                      "bg-white border rounded-2xl p-4 flex gap-4 transition-all relative group hover:shadow-md",
                      isOutOfStock ? "opacity-65" : "",
                      isSelected 
                        ? "border-violet-400 ring-2 ring-violet-500/10 shadow-sm" 
                        : isCompatible 
                          ? "border-slate-200 hover:border-slate-300" 
                          : "border-red-200 bg-red-50/20"
                    )}
                  >
                    {/* Image */}
                    <div className="h-24 w-24 bg-slate-50 rounded-xl p-2 shrink-0 flex items-center justify-center border border-slate-100">
                      <img 
                        src={product.images?.[0] || '/placeholder.png'} 
                        alt={product.name} 
                        className="w-full h-full object-contain" 
                        referrerPolicy="no-referrer" 
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-grow flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                            {product.name}
                          </h4>
                          {isSelected && (
                            <span className="bg-violet-600 text-white p-1 rounded-full shrink-0 shadow-xs">
                              <Check size={12} strokeWidth={3} />
                            </span>
                          )}
                        </div>

                        {/* Specs Pill row */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {product.brand && (
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                              {product.brand}
                            </span>
                          )}
                          {product.socketType && (
                            <span className="text-[10px] font-bold bg-violet-50 text-violet-700 px-2 py-0.5 rounded-md border border-violet-100">
                              {product.socketType}
                            </span>
                          )}
                          {product.ramType && (
                            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                              {product.ramType}
                            </span>
                          )}
                          {isOutOfStock ? (
                            <span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-md">
                              Out of Stock
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md">
                              In Stock
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Price & Action */}
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-base font-black text-slate-900">
                            {formatCurrency(product.discountPrice || product.price)}
                          </div>
                          {product.discountPrice && (
                            <div className="text-[10px] line-through text-slate-400">
                              {formatCurrency(product.price)}
                            </div>
                          )}
                        </div>

                        {!isCompatible ? (
                          <span 
                            title={reason} 
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-xl max-w-[140px] truncate"
                          >
                            <AlertTriangle size={12} className="shrink-0" />
                            <span className="truncate">{reason || 'Incompatible'}</span>
                          </span>
                        ) : isOutOfStock ? (
                          <button
                            type="button"
                            onClick={() => {
                              onSelect(product);
                              onClose();
                            }}
                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                          >
                            Select (Pre-order)
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              onSelect(product);
                              onClose();
                            }}
                            className={cn(
                              "px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 active:scale-95",
                              isSelected 
                                ? "bg-violet-600 text-white shadow-violet-500/20" 
                                : "bg-slate-900 hover:bg-violet-600 text-white"
                            )}
                          >
                            {isSelected ? (
                              <>
                                <Check size={13} strokeWidth={3} />
                                <span>Selected</span>
                              </>
                            ) : (
                              <span>Select Component</span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
