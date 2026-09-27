import React from 'react';
import { useCompare } from '../../context/CompareContext';
import { Layout } from '../../components/Layout';
import { useCart } from '../../context/CartContext';
import { formatCurrency, cn } from '../../lib/utils';
import { useState } from 'react';
import { X, ShoppingCart, Info, Activity, Shield, Cpu, Scale, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const ComparePage: React.FC = () => {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();
  const { addToCart } = useCart();
  const [highlightDiff, setHighlightDiff] = useState(false);
  const [hideSimilar, setHideSimilar] = useState(false);

  const isDifferent = (key, isBasic) => {
    if (compareItems.length <= 1) return false;
    const values = compareItems.map(p => {
      if (isBasic) {
        if (key === 'stock') return p.stock > 0 ? 'instock' : 'outofstock';
        return String(p[key] || '').toLowerCase();
      }
      return String(p.specs?.[key] || '').toLowerCase();
    });
    return !values.every(v => v === values[0]);
  };


  if (compareItems.length === 0) {
    return (
      <Layout>
        <div className="bg-gray-50 min-h-[60vh] flex flex-col items-center justify-center p-4">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-200">
            <GitCompareIcon size={48} className="text-gray-300" />
          </div>
          <h1 className="text-3xl font-black text-[#081621] mb-3">No Products to Compare</h1>
          <p className="text-gray-500 mb-8 font-medium">Add products from our catalog to compare their specifications side-by-side.</p>
          <Link to="/shop" className="inline-flex items-center justify-center gap-2 bg-[#F97316] text-white px-8 py-3.5 rounded-md font-bold hover:bg-[#e06612] transition-colors shadow-sm">
            Browse Products
          </Link>
        </div>
      </Layout>
    );
  }

  // Get all unique spec keys across all compare items from the 'specs' field
  const allSpecKeys = Array.from(new Set(compareItems.flatMap(item => 
    item.specs ? Object.keys(item.specs) : []
  )));

  const mainSpecLabels = [
    { key: 'brand', label: 'Brand' },
    { key: 'category', label: 'Category' },
    { key: 'stock', label: 'Stock Status' },
    { key: 'warrantyMonths', label: 'Warranty' }
  ];

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen py-6">
        <div className="max-w-7xl mx-auto px-4">
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link to="/" className="hover:text-[#F97316]">Home</Link>
            <ChevronRight size={14} />
            <span className="text-gray-800 font-bold">Compare</span>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
          >
            <div>
              <h1 className="text-2xl font-black text-[#081621]">Product Comparison</h1>
              <p className="text-gray-500 text-sm mt-1">Comparing {compareItems.length} selected products side-by-side</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors">
                <input type="checkbox" checked={highlightDiff} onChange={e => setHighlightDiff(e.target.checked)} className="rounded text-blue-500 focus:ring-blue-500" />
                Highlight Differences
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors">
                <input type="checkbox" checked={hideSimilar} onChange={e => setHideSimilar(e.target.checked)} className="rounded text-blue-500 focus:ring-blue-500" />
                Hide Similarities
              </label>
              <button 
                onClick={clearCompare}
                className="text-sm text-red-500 hover:text-white border border-red-200 hover:bg-red-500 hover:border-red-500 font-bold transition-all px-5 py-2 rounded-lg"
              >
                Clear All
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-x-auto pb-4 custom-scrollbar"
          >
            <div className="min-w-[900px] bg-white rounded-2xl shadow-sm border border-gray-200 flex overflow-hidden">
              
              {/* Labels Column */}
              <div className="w-[20%] shrink-0 bg-gray-50 border-r border-gray-200">
                <div className="h-[360px] border-b border-gray-200 flex flex-col justify-center px-6 bg-white">
                  <h3 className="text-lg font-bold text-[#081621]">Product Details</h3>
                </div>
                
                <div className="p-4 border-b border-gray-200 min-h-[64px] flex items-center bg-gray-50">
                  <span className="font-bold text-gray-700 text-sm">Price</span>
                </div>
                
                {/* Basic Details */}
                {mainSpecLabels.map(spec => {
                  const diff = isDifferent(spec.key, true);
                  if (hideSimilar && !diff) return null;
                  return (
                    <div key={spec.key} className={cn("px-6 py-4 border-b border-gray-200 min-h-[64px] flex items-center transition-colors", diff && highlightDiff ? "bg-yellow-50/80" : "bg-gray-50")}>
                      <span className="font-bold text-gray-700 text-sm">{spec.label}</span>
                    </div>
                  );
                })}

                {/* Dynamic Technical Specs */}
                {allSpecKeys.length > 0 && (
                  <>
                    <div className="p-4 border-b border-gray-200 bg-[#081621] text-white">
                      <span className="font-bold text-sm tracking-wider uppercase">Technical Specs</span>
                    </div>
                    {allSpecKeys.map(specKey => {
                      const diff = isDifferent(specKey, false);
                      if (hideSimilar && !diff) return null;
                      return (
                        <div key={specKey} className={cn("px-6 py-4 border-b border-gray-200 min-h-[64px] flex items-center transition-colors", diff && highlightDiff ? "bg-yellow-50/80" : "bg-gray-50")}>
                          <span className="font-bold text-gray-700 text-sm">{specKey}</span>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>

              {/* Products Columns */}
              {compareItems.map((product, idx) => (
                <div key={product.id} className={cn(
                  "flex-1 min-w-[240px] group transition-colors relative",
                  idx !== compareItems.length - 1 && "border-r border-gray-200"
                )}>
                  {/* Top Card Area */}
                  <div className="h-[360px] p-6 border-b border-gray-200 flex flex-col items-center text-center relative bg-white transition-colors">
                    <button 
                      onClick={() => removeFromCompare(product.id)}
                      className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                      title="Remove from comparison"
                    >
                      <X size={18} />
                    </button>
                    
                    <div className="h-40 w-full mb-4 flex items-center justify-center p-2">
                      <img 
                        src={product.images?.[0] || undefined} 
                        alt={product.name} 
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 mix-blend-multiply"
                      />
                    </div>
                    
                    <Link to={`/product/${product.id}`} className="font-bold text-[#081621] hover:text-[#F97316] transition-colors line-clamp-3 mb-4 text-sm leading-tight px-2">
                      {product.name}
                    </Link>
                    
                    <button 
                      onClick={() => addToCart(product)}
                      className="mt-auto w-full bg-[#F2F4F8] text-[#081621] hover:bg-[#F97316] hover:text-white py-2.5 rounded-md font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
                    >
                      <ShoppingCart size={16} /> Add to Cart
                    </button>
                  </div>
                  
                  {/* Price Row */}
                  <div className="p-4 border-b border-gray-200 min-h-[64px] flex items-center justify-center bg-white text-center">
                    <span className="text-lg font-black text-[#EF4444]">
                      {product.discountPrice ? (
                        <div className="flex flex-col items-center">
                          <span className="text-sm line-through text-gray-400 font-bold">{formatCurrency(product.price)}</span>
                          <span>{formatCurrency(product.discountPrice)}</span>
                        </div>
                      ) : formatCurrency(product.price)}
                    </span>
                  </div>
                  
                  {/* Basic Details Rows */}
                  {(!hideSimilar || isDifferent('brand', true)) && (
                    <div className={cn("p-4 border-b border-gray-200 min-h-[64px] flex items-center justify-center text-gray-700 text-sm text-center transition-colors", isDifferent('brand', true) && highlightDiff ? "bg-yellow-50/50" : "bg-white")}>
                      <span className="font-bold capitalize">{product.brand || '-'}</span>
                    </div>
                  )}
                  {(!hideSimilar || isDifferent('category', true)) && (
                    <div className={cn("p-4 border-b border-gray-200 min-h-[64px] flex items-center justify-center text-gray-700 text-sm text-center transition-colors", isDifferent('category', true) && highlightDiff ? "bg-yellow-50/50" : "bg-white")}>
                      <span className="uppercase tracking-wider text-xs font-bold">{product.category || '-'}</span>
                    </div>
                  )}
                  {(!hideSimilar || isDifferent('stock', true)) && (
                    <div className={cn("p-4 border-b border-gray-200 min-h-[64px] flex items-center justify-center text-sm text-center transition-colors", isDifferent('stock', true) && highlightDiff ? "bg-yellow-50/50" : "bg-white")}>
                      {product.stock > 0 
                        ? <span className="text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full">In Stock</span> 
                        : <span className="text-red-500 font-bold bg-red-50 px-3 py-1 rounded-full">Out of Stock</span>
                      }
                    </div>
                  )}
                  {(!hideSimilar || isDifferent('warrantyMonths', true)) && (
                    <div className={cn("p-4 border-b border-gray-200 min-h-[64px] flex items-center justify-center text-gray-700 text-sm text-center transition-colors", isDifferent('warrantyMonths', true) && highlightDiff ? "bg-yellow-50/50" : "bg-white")}>
                      <span className="font-medium">{product.warrantyMonths ? `${product.warrantyMonths} Months` : 'No Warranty'}</span>
                    </div>
                  )}

                  {/* Dynamic Technical Specs Rows */}
                  {allSpecKeys.length > 0 && (
                    <>
                      <div className="p-4 border-b border-gray-200 min-h-[53px] bg-white"></div>
                      {allSpecKeys.map(specKey => {
                        const val = product.specs?.[specKey];
                        const diff = isDifferent(specKey, false);
                        if (hideSimilar && !diff) return null;
                        return (
                          <div key={specKey} className={cn("px-4 py-4 border-b border-gray-200 min-h-[64px] flex items-center justify-center text-center transition-colors", diff && highlightDiff ? "bg-yellow-50/50" : "bg-white")}>
                            <span className={cn(
                              "text-sm font-medium",
                              val ? "text-gray-800" : "text-gray-300"
                            )}>
                              {val || '-'}
                            </span>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

// Simple GitCompare Icon since it was omitted
const GitCompareIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="16 3 21 3 21 8"></polyline>
    <line x1="4" y1="20" x2="21" y2="3"></line>
    <polyline points="21 16 21 21 16 21"></polyline>
    <line x1="15" y1="15" x2="21" y2="21"></line>
    <line x1="4" y1="4" x2="9" y2="9"></line>
  </svg>
);
