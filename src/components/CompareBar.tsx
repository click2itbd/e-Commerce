import React from 'react';
import { useCompare } from '../context/CompareContext';
import { Link } from 'react-router-dom';
import { X, GitCompare, ArrowRight } from 'lucide-react';

export const CompareBar: React.FC = () => {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();

  if (compareItems.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-4xl bg-white border border-blue-100 shadow-2xl rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-bottom-10 duration-300">
      <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-1">
        <div className="bg-blue-50 p-2 rounded-xl text-blue-600 hidden sm:flex">
          <GitCompare size={24} />
        </div>
        <div className="flex items-center gap-3">
          {compareItems.map(product => (
            <div key={product.id} className="relative group shrink-0">
              <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-lg overflow-hidden flex items-center justify-center p-1">
                <img src={product.images?.[0]} alt={product.name} className="max-h-full max-w-full object-contain" />
              </div>
              <button 
                onClick={() => removeFromCompare(product.id)}
                className="absolute -top-2 -right-2 bg-white text-gray-400 hover:text-red-500 rounded-full border border-gray-100 shadow-sm p-0.5"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {compareItems.length < 4 && (
            <div className="w-12 h-12 border-2 border-dashed border-gray-100 rounded-lg flex items-center justify-center text-gray-200">
              <span className="text-xs font-bold">+{4 - compareItems.length}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 ml-4">
        <button 
          onClick={clearCompare}
          className="text-xs font-bold text-gray-400 hover:text-gray-600 px-3 transition-colors hidden sm:block"
        >
          Clear
        </button>
        <Link 
          to="/compare" 
          className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 whitespace-nowrap text-sm"
        >
          Compare Now
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
};
