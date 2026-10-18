import React from 'react';
import { Check, Wallet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Product } from '../../types';
import { BuilderCategory } from './constants';
import { cn, formatCurrency } from '../../lib/utils';

interface BuilderProgressProps {
  categories: BuilderCategory[];
  selectedComponents: Record<string, Product>;
  targetBudget?: number;
  onTargetBudgetChange?: (budget: number) => void;
  includeAssembly?: boolean;
}

const BUDGET_PRESETS = [
  { label: 'No Limit', value: 0 },
  { label: '৳35k', value: 35000 },
  { label: '৳50k', value: 50000 },
  { label: '৳80k', value: 80000 },
  { label: '৳120k', value: 120000 },
  { label: '৳200k', value: 200000 },
];

/** Step-by-step wizard progress bar + Target Budget Tracker. */
export const BuilderProgress: React.FC<BuilderProgressProps> = ({
  categories,
  selectedComponents,
  targetBudget = 0,
  onTargetBudgetChange,
  includeAssembly = false,
}) => {
  const required = categories.filter(c => c.required);
  const doneRequired = required.filter(c => selectedComponents[c.id]).length;
  const percent = required.length ? Math.round((doneRequired / required.length) * 100) : 0;
  const currentIdx = categories.findIndex(c => !selectedComponents[c.id]);

  const currentSpend =
    Object.values(selectedComponents)
      .filter(Boolean)
      .reduce((sum, p) => sum + p.price * ((p as any).builderQuantity || 1), 0) +
    (includeAssembly ? 1500 : 0);

  const budgetPercent = targetBudget > 0 ? Math.min(100, Math.round((currentSpend / targetBudget) * 100)) : 0;
  const isOverBudget = targetBudget > 0 && currentSpend > targetBudget;
  const isNearBudget = targetBudget > 0 && !isOverBudget && currentSpend >= targetBudget * 0.85;
  const remainingBudget = targetBudget > 0 ? targetBudget - currentSpend : 0;

  const jump = (id: string) => {
    document.getElementById(`builder-step-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_2px_16px_rgba(15,23,42,0.05)] p-5 mb-8 print:hidden space-y-5">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-black text-slate-900">Your build progress</h2>
            <p className="text-xs text-slate-500">
              {doneRequired} of {required.length} required parts selected
            </p>
          </div>
          <span className="text-2xl font-black text-slate-900">{percent}%</span>
        </div>

        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden mb-5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {categories.map((cat, idx) => {
            const done = !!selectedComponents[cat.id];
            const isCurrent = idx === currentIdx;
            return (
              <button
                key={cat.id}
                onClick={() => jump(cat.id)}
                className={cn(
                  'flex items-center gap-2 shrink-0 pl-1.5 pr-3.5 py-1.5 rounded-full border text-xs font-bold transition-colors',
                  done
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : isCurrent
                      ? 'bg-violet-50 border-violet-300 text-violet-700'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                )}
              >
                <span
                  className={cn(
                    'h-5 w-5 rounded-full flex items-center justify-center text-[10px]',
                    done ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'
                  )}
                >
                  {done ? <Check size={11} strokeWidth={3} /> : idx + 1}
                </span>
                {cat.name || cat.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Budget Slider & Tracker */}
      {onTargetBudgetChange && (
        <div className="pt-4 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                <Wallet size={16} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Target Budget Tracker</h3>
                <p className="text-[11px] text-slate-500">
                  {targetBudget > 0
                    ? `Tracking against ${formatCurrency(targetBudget)} budget`
                    : 'Set a target budget to track your spending in real time'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {BUDGET_PRESETS.map(preset => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => onTargetBudgetChange(preset.value)}
                  className={cn(
                    'px-2.5 py-1 rounded-xl text-xs font-bold transition-all border',
                    targetBudget === preset.value
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 mb-2">
            <input
              type="range"
              min={0}
              max={350000}
              step={5000}
              value={targetBudget}
              onChange={e => onTargetBudgetChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
            />
            <div className="shrink-0 flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
              <span className="text-xs font-bold text-slate-400">৳</span>
              <input
                type="number"
                min={0}
                step={1000}
                value={targetBudget || ''}
                placeholder="No limit"
                onChange={e => onTargetBudgetChange(Math.max(0, Number(e.target.value) || 0))}
                className="w-20 text-xs font-black text-slate-900 bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {targetBudget > 0 && (
            <div className="mt-3 space-y-2">
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    isOverBudget
                      ? 'bg-gradient-to-r from-red-500 to-rose-600'
                      : isNearBudget
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  )}
                  style={{ width: `${budgetPercent}%` }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-600">
                  Spent: <strong className="text-slate-900">{formatCurrency(currentSpend)}</strong> of{' '}
                  <strong className="text-slate-900">{formatCurrency(targetBudget)}</strong> ({Math.round((currentSpend / targetBudget) * 100)}%)
                </span>

                {isOverBudget ? (
                  <span className="inline-flex items-center gap-1 font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                    <AlertCircle size={13} /> Over budget by {formatCurrency(Math.abs(remainingBudget))}
                  </span>
                ) : (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-full border',
                      isNearBudget
                        ? 'text-amber-700 bg-amber-50 border-amber-200'
                        : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    )}
                  >
                    <CheckCircle2 size={13} /> {formatCurrency(remainingBudget)} remaining ({100 - budgetPercent}% left)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
