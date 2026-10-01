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
        "bg-[#151A23] rounded-lg p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 border transition-colors duration-300",
        !compatibility.isCompatible ? "border-red-300 bg-red-50/30" : "border-slate-800 hover:border-cyan-500/50 shadow-sm hover:shadow-md",
        selectedProduct ? "border-l-4 border-l-violet-500" : ""
      )}
    >
      {/* Category Info */}
      <div className="flex items-center gap-4 w-full md:w-56 shrink-0">
        <div className={cn(
          "h-12 w-12 rounded-lg flex items-center justify-center shrink-0 transition-colors",
          selectedProduct ? "bg-violet-500/20 text-violet-400" : "bg-[#1F2633] text-slate-400",
          !compatibility.isCompatible && "bg-red-100 text-red-600"
        )}>
          {getColorfulIcon(category.id, <Icon size={24} />)}
        </div>
        <div>
          <h3 className="font-bold text-slate-100">{category.name}</h3>
          <div className="flex gap-2 items-center mt-1">
            {category.required && (
              <span className="text-[10px] bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">Required</span>
            )}
            {selectedProduct && compatibility.isCompatible && (
              <span className="text-[10px] bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                <Check size={10} /> OK
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Selected Product or Placeholder */}
      <div className="flex-grow w-full border-t border-slate-800 pt-4 md:border-t-0 md:pt-0">
        <div className="flex items-center gap-4">
          {/* Always show an image container */}
          <div className={cn(
            "h-16 w-16 rounded-lg p-2 shrink-0 flex items-center justify-center transition-all",
            selectedProduct ? "bg-[#1F2633] border border-[#2A3441]" : "bg-[#0B0E14] border border-[#1F2633] border-dashed"
          )}>
            {selectedProduct ? (
              <img src={selectedProduct.images?.[0] || '/placeholder.png'} alt={selectedProduct.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            ) : category.placeholderImage ? (
              <img src={category.placeholderImage} alt={category.title || category.name} className="w-full h-full object-contain opacity-40 mix-blend-screen opacity-20" />
            ) : (
              getColorfulIcon(category.id, <Icon size={28} className="text-slate-300" />)
            )}
          </div>
          
          <div className="flex-grow">
            {selectedProduct ? (
              <>
                <p className="text-sm md:text-base font-semibold text-white line-clamp-2">{selectedProduct.name}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <p className="text-sm font-bold text-white">{formatCurrency(selectedProduct.price)}</p>
                  {!compatibility.isCompatible && (
                    <p className="text-[11px] text-red-600 font-medium flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded-full">
                      <AlertTriangle size={12} /> {compatibility.reason}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500 italic">Not selected — click Choose to add</p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t border-slate-800 pt-4 md:border-t-0 md:pt-0 shrink-0">
        {selectedProduct && (
          <button
            onClick={onRemove}
            className="text-slate-500 hover:text-red-500 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
            title="Remove component"
          >
            <Plus className="rotate-45" size={20} />
          </button>
        )}
        <button
          onClick={onChoose}
          className={cn(
            "px-6 py-2.5 rounded-lg text-sm font-bold transition-all w-full md:w-[120px]",
            selectedProduct 
              ? "bg-[#1F2633] text-white hover:bg-[#2A3441]" 
              : "bg-white text-black hover:bg-slate-200"
          )}
        >
          {selectedProduct ? 'Change' : 'Choose'}
        </button>
      </div>
    </motion.div>
  );
};
