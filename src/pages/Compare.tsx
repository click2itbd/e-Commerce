import React from 'react';
import { useCompare } from '../context/CompareContext';
import { Layout } from '../components/Layout';
import { useCart } from '../context/CartContext';
import { formatCurrency, cn } from '../lib/utils';
import { X, ShoppingCart, Info, Check, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ComparePage: React.FC = () => {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();
  const { addToCart } = useCart();

  if (compareItems.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Info size={64} className="mx-auto text-gray-300 mb-6" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">No products to compare</h1>
          <p className="text-gray-500 mb-8">Add products from our catalog to compare their specifications side-by-side.</p>
          <Link to="/" className="bg-[#EF4444] text-white px-8 py-3 rounded-lg font-bold hover:bg-red-600 transition-all">
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
    { key: 'socketType', label: 'Socket Type' },
    { key: 'ramType', label: 'RAM Type' },
    { key: 'chipset', label: 'Chipset' },
    { key: 'warrantyMonths', label: 'Warranty (Months)' }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#081621]">Product Comparison</h1>
            <p className="text-gray-500 mt-1">Comparing {compareItems.length} products</p>
          </div>
          <button 
            onClick={clearCompare}
            className="text-sm text-red-500 hover:underline font-medium"
          >
            Clear All
          </button>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[800px] bg-white rounded-xl shadow-sm border border-gray-100 divide-x divide-gray-100 flex">
            {/* Labels Column */}
            <div className="w-1/5 shrink-0 bg-gray-50/50">
              <div className="h-80 border-b border-gray-100 flex items-center px-6">
                <span className="font-bold text-gray-400 uppercase text-xs tracking-wider">Product Info</span>
              </div>
              <div className="p-6 border-b border-gray-100">
                <span className="font-bold text-gray-700">Price</span>
              </div>
              <div className="p-6 border-b border-gray-100">
                <span className="font-bold text-gray-700">Category</span>
              </div>
              <div className="p-6 border-b border-gray-100">
                <span className="font-bold text-gray-700">Brand</span>
              </div>
              
              {/* Dynamic Main Specs */}
              {mainSpecLabels.map(spec => (
                 <div key={spec.key} className="p-4 border-b border-gray-100 text-sm font-medium text-gray-600 min-h-[60px] flex items-center px-6">
                   {spec.label}
                 </div>
              ))}

              <div className="p-6 border-b border-gray-100 bg-gray-50/80">
                <span className="font-bold text-gray-400 uppercase text-xs tracking-wider">Additional Specs</span>
              </div>
              {allSpecKeys.map(specKey => (
                <div key={specKey} className="p-4 border-b border-gray-100 text-sm font-medium text-gray-600 min-h-[60px] flex items-center px-6">
                  {specKey}
                </div>
              ))}
            </div>

            {/* Products Columns */}
            {compareItems.map(product => (
              <div key={product.id} className="flex-1 min-w-[200px] group transition-all hover:bg-blue-50/20">
                <div className="h-80 p-6 border-b border-gray-100 flex flex-col relative text-center">
                  <button 
                    onClick={() => removeFromCompare(product.id)}
                    className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={18} />
                  </button>
                  <div className="h-40 w-full mb-4 flex items-center justify-center">
                    <img 
                      src={product.images?.[0] || 'https://via.placeholder.com/200'} 
                      alt={product.name} 
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <Link to={`/product/${product.id}`} className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2 h-10 text-sm">
                    {product.name}
                  </Link>
                  <button 
                    onClick={() => addToCart(product)}
                    className="mt-auto w-full bg-[#EF4444] text-white py-2 rounded-md font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-600 transition-all shadow-sm"
                  >
                    <ShoppingCart size={16} /> Add
                  </button>
                </div>
                
                <div className="p-6 border-b border-gray-100">
                  <span className="text-xl font-bold text-[#EF4444]">{formatCurrency(product.price)}</span>
                </div>
                <div className="p-6 border-b border-gray-100 text-gray-600 text-sm">
                  {product.category}
                </div>
                <div className="p-6 border-b border-gray-100 text-gray-600 font-medium text-sm">
                  {product.brand || 'N/A'}
                </div>

                {/* Values for Main Specs */}
                {mainSpecLabels.map(spec => (
                  <div key={spec.key} className="p-4 border-b border-gray-100 text-sm text-gray-700 min-h-[60px] flex items-center">
                    {(product as any)[spec.key] || <span className="text-gray-300">—</span>}
                  </div>
                ))}

                <div className="p-6 border-b border-gray-100 bg-gray-50/30">
                </div>
                {allSpecKeys.map((specKey: string) => {
                  const specValue = product.specs?.[specKey];
                  return (
                    <div key={specKey} className="p-4 border-b border-gray-100 text-sm text-gray-700 min-h-[60px] flex items-center">
                      {specValue || <span className="text-gray-300">—</span>}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Placeholder for adding more */}
            {compareItems.length < 4 && (
              <div className="flex-1 min-w-[200px] border-dashed border-2 border-gray-100 flex items-center justify-center p-12 text-center">
                <div>
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4 text-gray-300">
                    <AlertCircle size={24} />
                  </div>
                  <p className="text-sm text-gray-400 font-medium mb-4">Add up to {4 - compareItems.length} more products to compare</p>
                  <Link to="/" className="text-blue-600 text-sm font-bold hover:underline">
                    Back to Shop
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
