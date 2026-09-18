import React from 'react';
import { useCompare } from '../context/CompareContext';
import { Layout } from '../components/Layout';
import { useCart } from '../context/CartContext';
import { formatCurrency, cn } from '../lib/utils';
import { X, ShoppingCart, Info, Activity, Shield, Cpu, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const ComparePage: React.FC = () => {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();
  const { addToCart } = useCart();

  if (compareItems.length === 0) {
    return (
      <Layout fullWidth>
        <div className="bg-[#f8fafc] min-h-screen pt-20 pb-20">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto px-4 text-center"
          >
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm border border-slate-200">
              <Scale size={48} className="text-slate-300" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">No components to compare</h1>
            <p className="text-lg text-slate-500 mb-10 font-medium">Add products from our catalog to compare their specifications side-by-side.</p>
            <Link to="/pc-build" className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-sm">
              <Cpu size={20} />
              Go to PC Builder
            </Link>
          </motion.div>
        </div>
      </Layout>
    );
  }

  // Get all unique spec keys across all compare items from the 'specs' field
  const allSpecKeys = Array.from(new Set(compareItems.flatMap(item => 
    item.specs ? Object.keys(item.specs) : []
  )));

  const mainSpecLabels = [
    { key: 'socketType', label: 'Socket Type' },
    { key: 'ramType', label: 'RAM Type' },
    { key: 'chipset', label: 'Chipset' },
    { key: 'warrantyMonths', label: 'Warranty (Months)' }
  ];

  return (
    <Layout fullWidth>
      <div className="bg-[#f8fafc] min-h-screen py-12 selection:bg-slate-900 selection:text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4"
          >
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Component Comparison</h1>
              <p className="text-slate-500 font-medium mt-1">Comparing {compareItems.length} selected components side-by-side</p>
            </div>
            <button 
              onClick={clearCompare}
              className="text-sm text-red-500 hover:text-red-700 hover:underline font-bold transition-colors bg-red-50 px-4 py-2 rounded-lg"
            >
              Clear All
            </button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-x-auto pb-4 custom-scrollbar"
          >
            <div className="min-w-[900px] bg-white rounded-3xl shadow-sm border border-slate-200 flex overflow-hidden">
              {/* Labels Column */}
              <div className="w-1/5 shrink-0 bg-slate-50 border-r border-slate-200">
                <div className="h-[340px] border-b border-slate-200 flex flex-col justify-center px-6 bg-slate-100/50">
                  <span className="font-black text-slate-400 uppercase text-xs tracking-widest mb-1">Overview</span>
                  <h3 className="text-xl font-bold text-slate-800">Product<br/>Features</h3>
                </div>
                
                <div className="p-6 border-b border-slate-100 min-h-[72px] flex items-center">
                  <span className="font-bold text-slate-700">Price</span>
                </div>
                <div className="p-6 border-b border-slate-100 min-h-[72px] flex items-center">
                  <span className="font-bold text-slate-700">Category</span>
                </div>
                <div className="p-6 border-b border-slate-100 min-h-[72px] flex items-center">
                  <span className="font-bold text-slate-700">Brand</span>
                </div>
                
                {/* Dynamic Main Specs */}
                {mainSpecLabels.map(spec => (
                   <div key={spec.key} className="px-6 py-4 border-b border-slate-100 min-h-[72px] flex items-center">
                     <span className="font-semibold text-slate-600">{spec.label}</span>
                   </div>
                ))}

                <div className="p-6 border-b border-slate-100 bg-slate-100/50 mt-4">
                  <span className="font-black text-slate-400 uppercase text-xs tracking-widest">Technical Specs</span>
                </div>
                {allSpecKeys.map(specKey => (
                  <div key={specKey} className="px-6 py-4 border-b border-slate-100 min-h-[72px] flex items-center">
                    <span className="font-semibold text-slate-600">{specKey}</span>
                  </div>
                ))}
              </div>

              {/* Products Columns */}
              {compareItems.map((product, idx) => (
                <div key={product.id} className={cn(
                  "flex-1 min-w-[240px] group transition-colors hover:bg-slate-50 relative",
                  idx !== compareItems.length - 1 && "border-r border-slate-100"
                )}>
                  <div className="h-[340px] p-6 border-b border-slate-200 flex flex-col items-center text-center relative bg-white group-hover:bg-slate-50 transition-colors">
                    <button 
                      onClick={() => removeFromCompare(product.id)}
                      className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                      title="Remove from comparison"
                    >
                      <X size={18} />
                    </button>
                    
                    <div className="h-40 w-full mb-6 flex items-center justify-center p-4">
                      <img 
                        src={product.images?.[0] || 'https://via.placeholder.com/200'} 
                        alt={product.name} 
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    
                    <Link to={`/product/${product.id}`} className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-4 text-sm leading-tight px-2">
                      {product.name}
                    </Link>
                    
                    <button 
                      onClick={() => addToCart(product)}
                      className="mt-auto w-full bg-slate-900 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-sm"
                    >
                      <ShoppingCart size={16} /> Add to Cart
                    </button>
                  </div>
                  
                  <div className="p-6 border-b border-slate-100 min-h-[72px] flex items-center justify-center bg-white group-hover:bg-slate-50 transition-colors">
                    <span className="text-xl font-black text-slate-900">{formatCurrency(product.price)}</span>
                  </div>
                  <div className="p-6 border-b border-slate-100 min-h-[72px] flex items-center justify-center text-slate-600 text-sm font-medium">
                    <span className="bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider text-xs">{product.category}</span>
                  </div>
                  <div className="p-6 border-b border-slate-100 min-h-[72px] flex items-center justify-center text-slate-800 font-bold text-sm">
                    {product.brand || 'N/A'}
                  </div>

                  {/* Values for Main Specs */}
                  {mainSpecLabels.map(spec => (
                    <div key={spec.key} className="p-4 border-b border-slate-100 min-h-[72px] flex items-center justify-center text-sm font-medium text-slate-700 text-center">
                      {(product as any)[spec.key] || <span className="text-slate-300">—</span>}
                    </div>
                  ))}

                  <div className="p-6 border-b border-slate-100 bg-slate-100/30 mt-4 min-h-[64px]"></div>
                  
                  {allSpecKeys.map((specKey: string) => {
                    const specValue = product.specs?.[specKey];
                    return (
                      <div key={specKey} className="p-4 border-b border-slate-100 min-h-[72px] flex items-center justify-center text-sm font-medium text-slate-700 text-center px-4">
                        {specValue || <span className="text-slate-300">—</span>}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Placeholder for adding more */}
              {compareItems.length < 4 && (
                <div className="flex-1 min-w-[240px] border-l border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center p-12 text-center relative group">
                  <div className="absolute inset-4 border-2 border-dashed border-slate-200 rounded-2xl group-hover:border-slate-300 group-hover:bg-slate-100/50 transition-all pointer-events-none"></div>
                  <div className="w-16 h-16 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center mx-auto mb-6 text-slate-400 group-hover:scale-110 group-hover:text-slate-600 transition-all z-10">
                    <Scale size={28} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2 z-10">Compare More</h4>
                  <p className="text-sm text-slate-500 font-medium mb-6 z-10 max-w-[200px]">Add up to {4 - compareItems.length} more products to see how they stack up.</p>
                  <Link to="/pc-build" className="text-slate-900 text-sm font-bold bg-white px-6 py-2.5 rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-all z-10">
                    Browse Catalog
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};
