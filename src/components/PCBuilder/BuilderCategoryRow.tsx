import React from 'react';
import { Product } from '../../types';
import { BuilderCategory } from './constants';
import { formatCurrency, cn } from '../../lib/utils';
import { getColorfulIcon } from './ColorfulIcons';
import { Plus, Minus, Check, AlertTriangle, X, Layers, ExternalLink, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface BuilderCategoryRowProps {
  category: BuilderCategory;
  selectedProduct?: Product;
  compatibility: { isCompatible: boolean; reason: string };
  onRemove: () => void;
  onChoose: () => void;
  onQuantityChange?: (qty: number) => void;
  onAddExtraSlot?: () => void;
  canAddExtraSlot?: boolean;
  step?: number;
}

export const BuilderCategoryRow: React.FC<BuilderCategoryRowProps> = ({
  category,
  selectedProduct,
  compatibility,
  onRemove,
  onChoose,
  onQuantityChange,
  onAddExtraSlot,
  canAddExtraSlot = false,
  step,
}) => {
  const Icon = category.icon;
  const hasError = !!selectedProduct && !compatibility.isCompatible;
  const isMultiQuantityCat =
    category.id === 'ram' ||
    category.id.startsWith('ram-') ||
    category.id === 'storage' ||
    category.id.startsWith('storage-') ||
    category.id === 'casing_cooler';
  const quantity = (selectedProduct as any)?.builderQuantity || 1;
  const maxQty = 4;

  return (
    <motion.div
      id={`builder-step-${category.id}`}
      layout
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className={cn(
        'group relative flex flex-col bg-white rounded-[2rem] p-5 sm:p-6 border transition-all duration-300',
        'shadow-[0_4px_20px_rgba(15,23,42,0.04)] hover:shadow-[0_16px_40px_rgba(15,23,42,0.09)]',
        hasError
          ? 'border-red-300 bg-red-50/30'
          : selectedProduct
            ? 'border-violet-300/80 ring-2 ring-violet-500/10'
            : 'border-slate-200/90'
      )}
    >
      {/* Header: step indicator + category title */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          {step !== undefined && (
            <div
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-all shadow-xs',
                selectedProduct && !hasError
                  ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                  : hasError
                    ? 'bg-red-500 text-white shadow-red-500/20'
                    : 'bg-slate-100 text-slate-500'
              )}
            >
              {selectedProduct && !hasError ? <Check size={14} strokeWidth={3} /> : step}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-black text-slate-900 truncate text-base tracking-tight">
              {category.name || category.title}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn(
                'text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md',
                category.required 
                  ? 'bg-amber-50 text-amber-700 border border-amber-200/60' 
                  : 'bg-slate-100 text-slate-500'
              )}>
                {category.required ? 'Required' : 'Optional'}
              </span>
              {selectedProduct && !hasError && (
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                  <ShieldCheck size={12} /> Fitted
                </span>
              )}
            </div>
          </div>
        </div>

        {selectedProduct && (
          <button
            type="button"
            onClick={onRemove}
            title="Remove component"
            className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Product Image Area */}
      <div
        className={cn(
          'relative h-40 rounded-2xl flex items-center justify-center overflow-hidden mb-4 p-3 transition-colors',
          selectedProduct 
            ? 'bg-slate-50/80 border border-slate-100' 
            : 'bg-slate-50/50 border-2 border-dashed border-slate-200/80'
        )}
      >
        {selectedProduct ? (
          <>
            <img
              src={selectedProduct.images?.[0] || '/placeholder.png'}
              alt={selectedProduct.name}
              className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            {quantity > 1 && (
              <span className="absolute top-2.5 right-2.5 bg-violet-600 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-md shadow-violet-600/20">
                {quantity}x Units
              </span>
            )}
            {selectedProduct.brand && (
              <span className="absolute bottom-2.5 left-2.5 bg-white/90 backdrop-blur-xs text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200/70 shadow-xs">
                {selectedProduct.brand}
              </span>
            )}
          </>
        ) : category.placeholderImage ? (
          <img
            src={category.placeholderImage}
            alt={category.title || category.name}
            className="max-h-full max-w-full object-contain p-4 opacity-40 grayscale"
          />
        ) : (
          <div className="text-slate-300 flex flex-col items-center gap-2">
            {getColorfulIcon(category.id.replace(/-\d+$/, ''), <Icon size={44} />)}
          </div>
        )}
      </div>

      {/* Body: Product Name, Price, Specs */}
      <div className="flex-grow mb-4 flex flex-col justify-between min-h-[70px]">
        {selectedProduct ? (
          <div>
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug hover:text-violet-600 transition-colors">
                <a href={`/product/${selectedProduct.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
                  <span>{selectedProduct.name}</span>
                  <ExternalLink size={12} className="opacity-0 group-hover:opacity-60 shrink-0" />
                </a>
              </h4>
            </div>

            {/* Spec tags if available */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
              {selectedProduct.socketType && (
                <span className="text-[10px] font-bold bg-violet-50 text-violet-700 px-2 py-0.5 rounded-md border border-violet-100">
                  {selectedProduct.socketType}
                </span>
              )}
              {selectedProduct.ramType && (
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                  {selectedProduct.ramType}
                </span>
              )}
              {selectedProduct.tdp && (
                <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-100">
                  {selectedProduct.tdp}W TDP
                </span>
              )}
            </div>

            {/* Price & Quantity Stepper */}
            <div className="flex items-center justify-between gap-2 mt-auto">
              <div>
                <p className="text-lg font-black text-slate-900">
                  {formatCurrency((selectedProduct.discountPrice || selectedProduct.price) * quantity)}
                </p>
                {quantity > 1 && (
                  <p className="text-[11px] font-semibold text-slate-400">
                    {formatCurrency(selectedProduct.discountPrice || selectedProduct.price)} × {quantity}
                  </p>
                )}
              </div>

              {isMultiQuantityCat && onQuantityChange && (
                <div className="flex items-center gap-1.5 bg-slate-100 rounded-2xl p-1 border border-slate-200">
                  <button
                    type="button"
                    disabled={quantity <= 1}
                    onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                    className="h-7 w-7 rounded-xl bg-white text-slate-700 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center transition-all shadow-xs"
                    title="Decrease quantity"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="text-xs font-black text-slate-900 px-1.5 min-w-[20px] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={quantity >= maxQty}
                    onClick={() => onQuantityChange(Math.min(maxQty, quantity + 1))}
                    className="h-7 w-7 rounded-xl bg-white text-slate-700 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center transition-all shadow-xs"
                    title="Increase quantity"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              )}
            </div>

            {hasError && (
              <div className="mt-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-1.5">
                <AlertTriangle size={14} className="shrink-0 mt-0.5 text-red-500" />
                <span className="line-clamp-2">{compatibility.reason}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="py-2">
            <p className="text-xs font-medium text-slate-400 italic">
              No component selected yet. Choose a compatible {(category.name || category.title || 'part').toLowerCase()} for your rig.
            </p>
          </div>
        )}
      </div>

      {/* Primary Action Button */}
      <div className="space-y-2 mt-auto">
        <button
          type="button"
          onClick={onChoose}
          className={cn(
            'w-full py-3 px-4 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98]',
            selectedProduct
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
              : 'bg-slate-900 hover:bg-violet-600 text-white shadow-md shadow-slate-900/10'
          )}
        >
          {!selectedProduct && <Plus size={16} />}
          <span>{selectedProduct ? 'Change Component' : 'Choose Component'}</span>
        </button>

        {selectedProduct && canAddExtraSlot && onAddExtraSlot && (
          <button
            type="button"
            onClick={onAddExtraSlot}
            className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200/80 transition-all flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Layers size={14} />
            <span>+ Add Another {category.id.startsWith('ram') ? 'RAM Stick / Kit' : 'Storage Drive'}</span>
          </button>
        )}
      </div>
    </motion.div>
  );
};
