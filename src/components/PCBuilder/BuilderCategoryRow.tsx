import React from 'react';
import { Product } from '../../types';
import { BuilderCategory } from './constants';
import { formatCurrency, cn } from '../../lib/utils';
import { getColorfulIcon } from './ColorfulIcons';
import { Plus, Check, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface BuilderCategoryRowProps {
  category: BuilderCategory;
  selectedProduct?: Product;
  compatibility: { isCompatible: boolean; reason: string };
  onRemove: () => void;
  onChoose: () => void;
}

export const BuilderCategoryRow: React.FC<BuilderCategoryRowProps> = ({
  category,
  selectedProduct,
  compatibility,
  onRemove,
  onChoose,
}) => {
  const Icon = category.icon;

  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      layout
      className={cn(
        "bg-white rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 border transition-colors duration-300",
        !compatibility.isCompatible ? "border-red-300 bg-red-50/30" : "border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md",
        selectedProduct ? "border-l-4 border-l-[#6EC72A]" : ""
      )}
    >
      {/* Category Info */}
      <div className="flex items-center gap-4 w-full md:w-56 shrink-0">
        <div className={cn(
          "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
          selectedProduct ? "bg-[#0E2A47] text-white" : "bg-slate-100 text-slate-500",
          !compatibility.isCompatible && "bg-red-100 text-red-600"
        )}>
          {getColorfulIcon(category.id, <Icon size={24} />)}
        </div>
        <div>
          <h3 className="font-bold text-slate-900">{category.name}</h3>
          <div className="flex gap-2 items-center mt-1">
            {category.required && (
              <span className="text-[10px] bg-[#6EC72A]/10 text-[#6EC72A] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">Required</span>
            )}
            {selectedProduct && compatibility.isCompatible && (
              <span className="text-[10px] bg-[#6EC72A]/10 text-[#6EC72A] px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                <Check size={10} /> OK
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Selected Product or Placeholder */}
      <div className="flex-grow w-full border-t border-slate-100 pt-4 md:border-t-0 md:pt-0">
        <div className="flex items-center gap-4">
          {/* Always show an image container */}
          <div className={cn(
            "h-16 w-16 rounded-lg p-2 shrink-0 flex items-center justify-center transition-all",
            selectedProduct ? "bg-white border border-slate-100 shadow-sm" : "bg-slate-50 border border-slate-100/50 border-dashed"
          )}>
            {selectedProduct ? (
              <img src={selectedProduct.images?.[0] || '/placeholder.png'} alt={selectedProduct.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            ) : category.placeholderImage ? (
              <img src={category.placeholderImage} alt={category.title || category.name} className="w-full h-full object-contain opacity-40 mix-blend-multiply" />
            ) : (
              getColorfulIcon(category.id, <Icon size={28} className="text-slate-300" />)
            )}
          </div>
          
          <div className="flex-grow">
            {selectedProduct ? (
              <>
                <p className="text-sm md:text-base font-semibold text-slate-900 line-clamp-2">{selectedProduct.name}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <p className="text-sm font-bold text-slate-900">{formatCurrency(selectedProduct.price)}</p>
                  {!compatibility.isCompatible && (
                    <p className="text-[11px] text-red-600 font-medium flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded-full">
                      <AlertTriangle size={12} /> {compatibility.reason}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400 italic">Not selected — click Choose to add</p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t border-slate-100 pt-4 md:border-t-0 md:pt-0 shrink-0">
        {selectedProduct && (
          <button
            onClick={onRemove}
            className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
            title="Remove component"
          >
            <Plus className="rotate-45" size={20} />
          </button>
        )}
        <button
          onClick={onChoose}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-bold transition-all w-full md:w-[120px]",
            selectedProduct 
              ? "bg-slate-100 text-slate-700 hover:bg-slate-200" 
              : "bg-[#6EC72A] text-white hover:bg-[#5db820] shadow-md hover:shadow-lg"
          )}
        >
          {selectedProduct ? 'Change' : 'Choose'}
        </button>
      </div>
    </motion.div>
  );
};
