import React from 'react';
import { Product } from '../../types';
import { BuilderCategory } from './constants';
import { formatCurrency, cn } from '../../lib/utils';
import { getColorfulIcon } from './ColorfulIcons';
import { Plus, Minus, Check, AlertTriangle, X, Layers } from 'lucide-react';
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

/**
 * Card-style component slot (Modern Card Grid design).
 * Kept the filename/export for backwards compatibility.
 */
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
  const maxQty = category.id.startsWith('ram') || category.id === 'ram' ? 4 : 4;

  return (
    <motion.div
      id={`builder-step-${category.id}`}
      layout
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={cn(
        'group relative flex flex-col bg-white rounded-3xl p-5 border transition-shadow duration-300',
        'shadow-[0_2px_16px_rgba(15,23,42,0.05)] hover:shadow-[0_16px_40px_rgba(15,23,42,0.10)]',
        hasError
          ? 'border-red-200 bg-red-50/40'
          : selectedProduct
            ? 'border-violet-200 ring-1 ring-violet-100'
            : 'border-slate-200/80'
      )}
    >
      {/* Header: step + name */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          {step !== undefined && (
            <div
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-colors',
                selectedProduct && !hasError
                  ? 'bg-emerald-500 text-white'
                  : hasError
                    ? 'bg-red-500 text-white'
                    : 'bg-slate-100 text-slate-500'
              )}
            >
              {selectedProduct && !hasError ? <Check size={14} strokeWidth={3} /> : step}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 truncate">{category.name || category.title}</h3>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {category.required ? 'Required' : 'Optional'}
            </p>
          </div>
        </div>
        {selectedProduct && (
          <button
            onClick={onRemove}
            title="Remove component"
            className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Image area */}
      <div
        className={cn(
          'relative h-36 rounded-2xl flex items-center justify-center overflow-hidden mb-4 transition-colors',
          selectedProduct ? 'bg-slate-50' : 'bg-slate-50 border-2 border-dashed border-slate-200'
        )}
      >
        {selectedProduct ? (
          <>
            <img
              src={selectedProduct.images?.[0] || '/placeholder.png'}
              alt={selectedProduct.name}
              className="max-h-full max-w-full object-contain p-3 mix-blend-multiply"
              referrerPolicy="no-referrer"
            />
            {quantity > 1 && (
              <span className="absolute top-2.5 right-2.5 bg-violet-600 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-sm">
                {quantity}x
              </span>
            )}
          </>
        ) : category.placeholderImage ? (
          <img
            src={category.placeholderImage}
            alt={category.title || category.name}
            className="max-h-full max-w-full object-contain p-4 opacity-40 mix-blend-multiply"
          />
        ) : (
          <div className="text-slate-300">{getColorfulIcon(category.id.replace(/-\d+$/, ''), <Icon size={40} />)}</div>
        )}
      </div>

      {/* Body */}
      <div className="flex-grow mb-4 min-h-[56px]">
        {selectedProduct ? (
          <>
            <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">{selectedProduct.name}</p>
            <div className="flex items-center justify-between gap-2 mt-2">
              <div>
                <p className="text-lg font-black text-slate-900">
                  {formatCurrency(selectedProduct.price * quantity)}
                </p>
                {quantity > 1 && (
                  <p className="text-[11px] font-medium text-slate-400">
                    {formatCurrency(selectedProduct.price)} × {quantity}
                  </p>
                )}
              </div>

              {isMultiQuantityCat && onQuantityChange && (
                <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 border border-slate-200/70">
                  <button
                    type="button"
                    disabled={quantity <= 1}
                    onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                    className="h-6 w-6 rounded-lg bg-white text-slate-700 hover:bg-slate-200 disabled:opacity-40 flex items-center justify-center transition-colors shadow-sm"
                    title="Decrease quantity"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-xs font-black text-slate-800 px-2">{quantity}x</span>
                  <button
                    type="button"
                    disabled={quantity >= maxQty}
                    onClick={() => onQuantityChange(Math.min(maxQty, quantity + 1))}
                    className="h-6 w-6 rounded-lg bg-white text-slate-700 hover:bg-slate-200 disabled:opacity-40 flex items-center justify-center transition-colors shadow-sm"
                    title="Increase quantity"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              )}
            </div>
            {hasError && (
              <p className="mt-2 text-[11px] text-red-600 font-medium flex items-start gap-1">
                <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {compatibility.reason}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-400">No {(category.name || category.title || 'part').toLowerCase()} selected yet</p>
        )}
      </div>

      {/* Action */}
      <div className="space-y-2">
        <button
          onClick={onChoose}
          className={cn(
            'w-full py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2',
            selectedProduct
              ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
              : 'bg-slate-900 text-white hover:bg-violet-600 shadow-lg shadow-slate-900/10'
          )}
        >
          {!selectedProduct && <Plus size={16} />}
          {selectedProduct ? 'Change' : 'Choose'}
        </button>

        {selectedProduct && canAddExtraSlot && onAddExtraSlot && (
          <button
            type="button"
            onClick={onAddExtraSlot}
            className="w-full py-2 rounded-xl text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200/70 transition-colors flex items-center justify-center gap-1.5"
          >
            <Layers size={13} />
            + Add Another {category.id.startsWith('ram') ? 'RAM Slot' : 'Storage Drive'}
          </button>
        )}
      </div>
    </motion.div>
  );
};
