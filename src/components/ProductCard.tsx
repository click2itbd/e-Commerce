import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Plus, GitCompare } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useCompare } from '../context/CompareContext';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency, cn } from '../lib/utils';
import { toast } from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { settings } = useSettings();
  const { addToCompare, isInCompare } = useCompare();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col h-full border border-gray-100">
      <Link to={`/product/${product.id}`} className="block relative aspect-square overflow-hidden bg-gray-50">
        <img
          src={product.images?.[0] || undefined}
          alt={product.name}
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          referrerPolicy="no-referrer"
        />
        {product.stock > 0 && (
          <div className="absolute top-2 right-2">
            <span className="bg-green-500 text-white px-2 py-1 rounded-md text-[10px] font-bold uppercase shadow-sm">
              In Stock
            </span>
          </div>
        )}
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-black px-3 py-1 rounded-full text-xs font-bold uppercase">Stock Out</span>
          </div>
        )}
        {product.stock > 0 && product.stock < 10 && (
          <div className="absolute top-2 left-2">
            <span className="bg-orange-500 text-white px-2 py-1 rounded-md text-[10px] font-bold uppercase shadow-sm">
              Only {product.stock} left
            </span>
          </div>
        )}
      </Link>
      
      <div className="p-4 flex flex-col flex-grow">
        <Link 
          to={`/product/${product.id}`} 
          className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 min-h-[40px] transition-colors"
          style={{ color: 'inherit' }}
          onMouseEnter={(e) => e.currentTarget.style.color = settings.accentColor}
          onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}
        >
          {product.name}
        </Link>
        
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-lg" style={{ color: settings.accentColor }}>{formatCurrency(product.price)}</span>
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{product.category}</span>
          </div>
          
          <button
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className="w-full bg-[#F2F4F8] text-[#081621] py-2 rounded-md flex items-center justify-center gap-2 transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed mb-2"
            onMouseEnter={(e) => {
              if (product.stock > 0) {
                e.currentTarget.style.backgroundColor = settings.accentColor;
                e.currentTarget.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (product.stock > 0) {
                e.currentTarget.style.backgroundColor = '#F2F4F8';
                e.currentTarget.style.color = '#081621';
              }
            }}
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
  );
};
