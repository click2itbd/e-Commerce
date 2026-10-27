import React from 'react';
import { RotateCcw, Sparkles, ClipboardList, Users, Sun, Moon, Cpu, Zap, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../lib/utils';

interface BuilderHeaderProps {
  onReset: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  selectedCount?: number;
  totalPrice?: number;
  wattage?: number;
}

export const BuilderHeader: React.FC<BuilderHeaderProps> = ({
  onReset,
  isDarkMode = false,
  onToggleTheme,
  selectedCount = 0,
  totalPrice = 0,
  wattage = 0,
}) => {
  return (
    <div className="relative rounded-[2.5rem] overflow-hidden mb-8 bg-gradient-to-br from-violet-50 via-white to-cyan-50 border border-slate-200/80 shadow-[0_12px_45px_rgba(15,23,42,0.06)] transition-all">
      {/* Decorative gradient glowing orbs */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-violet-400/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-1/4 w-80 h-80 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />

      <div className="relative p-6 sm:p-8 md:p-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Main Title & Description */}
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-violet-700 border border-violet-100 text-xs font-black shadow-xs">
                <Sparkles size={13} className="text-violet-600 animate-pulse" /> Smart PC Builder BD
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-bold">
                ✓ Live Compatibility Check
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-[1.15] mb-3">
              Build your dream PC,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600">
                component by component
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed mb-6 max-w-xl">
              Choose your components easily with real-time socket matching, power estimation, and expert guidance.
            </p>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => document.dispatchEvent(new CustomEvent('open-ai-assistant'))}
                className="flex items-center gap-2 px-5 py-3 text-sm font-bold bg-slate-900 hover:bg-violet-600 text-white rounded-2xl transition-all shadow-md shadow-slate-900/15 active:scale-95"
              >
                <Sparkles size={16} className="text-violet-300" />
                <span>Build with AI</span>
              </button>

              <button
                type="button"
                onClick={() => document.dispatchEvent(new CustomEvent('open-custom-build'))}
                className="flex items-center gap-2 px-5 py-3 text-sm font-bold bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 rounded-2xl transition-all shadow-xs active:scale-95"
              >
                <ClipboardList size={16} className="text-indigo-500" />
                <span>Custom Request</span>
              </button>

              <Link
                to="/pc-build/community-builds"
                className="flex items-center gap-2 px-5 py-3 text-sm font-bold bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 rounded-2xl transition-all shadow-xs active:scale-95"
              >
                <Users size={16} className="text-cyan-600" />
                <span>Community Builds</span>
              </Link>

              {onToggleTheme && (
                <button
                  type="button"
                  onClick={onToggleTheme}
                  title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  className="h-11 w-11 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-amber-500 hover:bg-slate-50 transition-colors shadow-xs active:scale-95"
                >
                  {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
                </button>
              )}

              <button
                type="button"
                onClick={onReset}
                title="Clear current build"
                className="h-11 w-11 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shadow-xs active:scale-95"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </div>

          {/* Quick Build Snapshot Card */}
          <div className="w-full lg:w-72 shrink-0 bg-white/80 backdrop-blur-md rounded-3xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Active Build Snapshot
              </span>
              <div className="text-2xl font-black text-slate-900 mb-4">
                {formatCurrency(totalPrice)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-medium">Selected Parts</span>
                <span className="text-slate-800 font-black text-sm flex items-center gap-1 mt-0.5">
                  <Cpu size={14} className="text-violet-500" />
                  {selectedCount} Parts
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-medium">Est. Power</span>
                <span className="text-slate-800 font-black text-sm flex items-center gap-1 mt-0.5">
                  <Zap size={14} className="text-amber-500" />
                  {wattage}W
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
