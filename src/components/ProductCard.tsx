import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Plus, GitCompare, Eye, X, Heart } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useCompare } from '../context/CompareContext';
import { useWishlist } from '../context/WishlistContext';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency, cn } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { settings } = useSettings();
  const { addToCompare, isInCompare } = useCompare();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [showQuickView, setShowQuickView] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <>
      <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col h-full border border-gray-100">
        <div className="relative aspect-square overflow-hidden bg-gray-50 group/image">
          <Link to={`/product/${product.id}`} className="block absolute inset-0 z-0">
            <img
              src={product.images?.[0] || undefined}
              alt={product.name}
              className="w-full h-full object-contain p-3 sm:p-4 group-hover/image:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          </Link>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isInWishlist(product.id)) {
                removeFromWishlist(product.id);
                toast.success('Removed from wishlist');
              } else {
                addToWishlist(product);
                toast.success('Added to wishlist!');
              }
            }}
            className="absolute top-2 right-2 z-20 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-colors cursor-pointer"
          >
            <Heart size={16} className={isInWishlist(product.id) ? 'fill-[#F97316] text-[#F97316]' : 'text-gray-400 hover:text-[#F97316]'} />
          </button>
          {product.stock > 0 && (
            <div className="absolute top-12 right-2 z-10 pointer-events-none">
              <span className="bg-green-500 text-white px-2 py-1 rounded-md text-[10px] font-bold uppercase shadow-sm">
                In Stock
              </span>
            </div>
          )}
          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 pointer-events-none">
              <span className="bg-white text-black px-3 py-1 rounded-full text-xs font-bold uppercase">Stock Out</span>
            </div>
          )}
          
          
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center z-20 pointer-events-none">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowQuickView(true);
              }}
              className="bg-white text-[#081621] px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg transform translate-y-4 group-hover/image:translate-y-0 transition-all duration-300 hover:bg-[#F97316] hover:text-white pointer-events-auto cursor-pointer"
            >
              <Eye size={16} /> Quick View
            </button>
          </div>
        </div>
        
        <div className="p-3 sm:p-4 flex flex-col flex-grow">
          <Link 
            to={`/product/${product.id}`} 
            className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 min-h-[40px] transition-colors"
            style={{ color: 'inherit' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#F97316'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}
          >
            {product.name}
          </Link>
          
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-lg text-[#F97316]">{formatCurrency(product.price)}</span>
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{product.category}</span>
            </div>
            
            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="w-full bg-[#F97316] text-white hover:bg-[#e06612] py-2 rounded-md flex items-center justify-center gap-2 transition-colors font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed mb-2"
            >
              <ShoppingCart size={16} />
              Add to Cart
            </button>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addToCompare(product);
              }}
              className={cn(
                "w-full py-1.5 rounded-md flex items-center justify-center gap-2 transition-all text-xs font-bold border",
                isInCompare(product.id) 
                  ? "bg-blue-50 border-blue-200 text-blue-600" 
                  : "bg-white border-gray-100 text-gray-500 hover:border-blue-200 hover:text-blue-600"
              )}
            >
              <GitCompare size={14} />
              {isInCompare(product.id) ? 'Selected for Compare' : 'Add to Compare'}
            </button>
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      <AnimatePresence>
        {showQuickView && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuickView(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row z-10"
            >
              <button 
                onClick={() => setShowQuickView(false)}
                className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors z-20"
              >
                <X size={20} />
              </button>

              {/* Image Section */}
              <div className="w-full md:w-1/2 bg-gray-50 p-8 flex items-center justify-center min-h-[300px]">
                <img 
                  src={product.images?.[0] || undefined} 
                  alt={product.name} 
                  className="w-full h-full object-contain max-h-[400px]"
                />
              </div>

              {/* Details Section */}
              <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto">
                <div className="mb-2">
                  <span className="text-[11px] font-bold tracking-wider text-[#F97316] uppercase bg-orange-50 px-2 py-1 rounded">
                    {product.category}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-[#081621] mb-4 leading-tight">{product.name}</h2>
                
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-3xl font-black text-[#F97316]">{formatCurrency(product.price)}</span>
                  <span className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-bold uppercase",
                    product.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>

                <div className="space-y-4 mb-8">
                  {product.brand && (
                    <div className="flex gap-4 border-b border-gray-100 pb-2">
                      <span className="text-gray-500 text-sm font-medium w-24">Brand:</span>
                      <span className="text-[#081621] text-sm font-bold uppercase">{product.brand}</span>
                    </div>
                  )}
                  {product.model && (
                    <div className="flex gap-4 border-b border-gray-100 pb-2">
                      <span className="text-gray-500 text-sm font-medium w-24">Model:</span>
                      <span className="text-[#081621] text-sm font-bold">{product.model}</span>
                    </div>
                  )}
                  <div className="flex gap-4 border-b border-gray-100 pb-2">
                    <span className="text-gray-500 text-sm font-medium w-24">Code:</span>
                    <span className="text-[#081621] text-sm font-bold">{product.sku || product.id.substring(0, 8)}</span>
                  </div>
                </div>

                <div className="mt-auto flex gap-3">
                  <button
                    onClick={(e) => {
                      handleAddToCart(e);
                      setShowQuickView(false);
                    }}
                    disabled={product.stock <= 0}
                    className="flex-1 bg-[#081621] hover:bg-[#F97316] text-white py-3 rounded-lg flex items-center justify-center gap-2 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart size={18} />
                    Add to Cart
                  </button>
                  <Link
                    to={`/product/${product.id}`}
                    className="flex-1 border-2 border-[#081621] text-[#081621] hover:bg-gray-50 py-3 rounded-lg flex items-center justify-center font-bold transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
