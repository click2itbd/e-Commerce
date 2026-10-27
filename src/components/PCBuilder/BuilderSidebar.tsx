import React, { useState } from 'react';
import { Product } from '../../types';
import { formatCurrency, cn } from '../../lib/utils';
import { ShoppingCart, Save, Share2, Printer, Zap, AlertTriangle, ShieldCheck, Mail, FileDown, BrainCircuit, Star, ImageDown, ChevronDown, ChevronUp, CreditCard } from 'lucide-react';
import { calculateEstimatedWattage, getOverallCompatibility } from './utils';
import { CompatibilityEngine } from './CompatibilityEngine';
import { FPSPredictor } from './FPSPredictor';
import { BottleneckCalculator } from './BottleneckCalculator';
import { exportBuildAsPNG } from './exportBuildImage';
import { toast } from 'react-hot-toast';

interface BuilderSidebarProps {
  selectedComponents: Record<string, Product>;
  includeAssembly?: boolean;
  targetBudget?: number;
  onToggleAssembly?: () => void;
  onAddToCart: () => void;
  onSaveBuild: () => void;
  onPrintBuild: () => void;
  onDownloadPDF: () => void;
  onEmailBuild: () => void;
  onPublishBuild: () => void;
}

export const BuilderSidebar: React.FC<BuilderSidebarProps> = ({ 
  selectedComponents,
  includeAssembly = false,
  targetBudget = 0,
  onToggleAssembly,
  onAddToCart,
  onSaveBuild,
  onPrintBuild,
  onDownloadPDF,
  onEmailBuild,
  onPublishBuild
}) => {
  const [isPartsListOpen, setIsPartsListOpen] = useState(true);

  const selectedList = Object.values(selectedComponents).filter(Boolean) as Product[];
  const basePrice = selectedList.reduce((sum, p) => sum + (p.discountPrice || p.price) * ((p as any).builderQuantity || 1), 0);
  const assemblyFee = includeAssembly ? 1500 : 0;
  const totalPrice = basePrice + assemblyFee;
  const estimatedWattage = calculateEstimatedWattage(selectedComponents);
  const compatibility = getOverallCompatibility(selectedComponents);
  const aiAnalysis = CompatibilityEngine.evaluateScore(selectedComponents);

  const emiMonthly = Math.round(totalPrice / 12);

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200/90 shadow-[0_12px_40px_rgba(15,23,42,0.06)] p-5 sm:p-6 relative max-h-[calc(100vh-6.5rem)] overflow-y-auto custom-scrollbar transition-all">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-xl font-black tracking-tight text-slate-900">Build Summary</h3>
          <p className="text-xs text-slate-500 font-medium">Real-time status & pricing</p>
        </div>
        <span className="px-3 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100 text-xs font-black">
          {selectedList.length} Parts
        </span>
      </div>
      
      <div className="space-y-4 mb-6">
        {/* Compatibility Report */}
        {selectedList.length > 1 && (!compatibility.isCompatible || compatibility.warnings.length > 0) && (
          <div className={cn(
            'p-4 rounded-2xl border text-xs',
            compatibility.isCompatible ? 'bg-emerald-50/80 border-emerald-200' : 'bg-red-50/80 border-red-200'
          )}>
            <div className="flex items-center gap-2 mb-1.5">
              {compatibility.isCompatible ? (
                <ShieldCheck className="text-emerald-600 shrink-0" size={17} />
              ) : (
                <AlertTriangle className="text-red-600 shrink-0" size={17} />
              )}
              <span className={cn('font-black text-sm', compatibility.isCompatible ? 'text-emerald-800' : 'text-red-800')}>
                {compatibility.isCompatible ? 'Components Compatible' : 'Compatibility Issues Detected'}
              </span>
            </div>
            {compatibility.errors.map((err, i) => (
              <p key={`err-${i}`} className="text-red-700 mt-1 pl-6 leading-tight font-medium">• {err}</p>
            ))}
            {compatibility.warnings.map((warn, i) => (
              <p key={`warn-${i}`} className="text-amber-700 mt-1 pl-6 leading-tight font-medium">• {warn}</p>
            ))}
          </div>
        )}

        {/* AI Build Score Card */}
        <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100/90 p-4.5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
            <BrainCircuit size={60} className="text-violet-600" />
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-bold text-violet-700 flex items-center gap-1.5">
                <BrainCircuit size={15} /> AI Performance Rating
              </span>
              <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-violet-100 shadow-xs">
                <Star size={13} className="text-amber-400 fill-amber-400" />
                <span className="font-black text-slate-900 text-xs">
                  {aiAnalysis.score.toFixed(1)}<span className="text-slate-400 font-normal">/10</span>
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {aiAnalysis.text}
            </p>
          </div>
        </div>

        {/* Wattage Strip */}
        <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3.5 rounded-2xl">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Zap size={16} />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Est. System Wattage</p>
              <p className="text-sm font-black text-slate-900">{estimatedWattage} Watts</p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-400 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
            Min. {estimatedWattage + 150}W PSU Rec.
          </span>
        </div>

        {/* Assembly Service Toggle */}
        {onToggleAssembly && (
          <label className="flex items-center justify-between p-3.5 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50/80 transition-colors">
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                checked={includeAssembly} 
                onChange={onToggleAssembly} 
                className="w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500 cursor-pointer" 
              />
              <div>
                <p className="text-xs font-black text-slate-900">Add Professional Assembly</p>
                <p className="text-[11px] text-slate-500">Cable management, BIOS setup & stress test</p>
              </div>
            </div>
            <span className="font-black text-slate-900 text-sm">৳1,500</span>
          </label>
        )}

        {/* Total Price Section */}
        <div className="border-t border-slate-100 pt-4">
          <div className="flex justify-between items-end mb-1">
            <div>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Total Price</p>
              <p className="text-3xl font-black text-slate-900 tracking-tight">
                {formatCurrency(totalPrice)}
              </p>
            </div>
          </div>

          {totalPrice > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium mt-1">
              <CreditCard size={13} className="text-violet-600 shrink-0" />
              <span>EMI starts from <strong>৳{emiMonthly.toLocaleString()}/mo</strong> (up to 12 months)</span>
            </div>
          )}
        </div>

        {/* FPS Predictor & Bottleneck */}
        <FPSPredictor cpu={selectedComponents['cpu']} gpu={selectedComponents['graphics-card']} />
        <BottleneckCalculator cpu={selectedComponents['cpu']} gpu={selectedComponents['graphics-card']} />
      </div>

      {/* Main Actions */}
      <div className="space-y-2.5">
        <button
          type="button"
          onClick={onAddToCart}
          className="w-full bg-slate-900 hover:bg-violet-600 text-white py-3.5 px-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-md shadow-slate-900/10 text-base"
        >
          <ShoppingCart size={18} />
          <span>Add All Parts to Cart</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (selectedList.length === 0) {
              toast.error('Please select at least one component first');
              return;
            }
            exportBuildAsPNG(selectedComponents, includeAssembly, targetBudget);
            toast.success('Build spec card (PNG) downloaded!');
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-xs shadow-xs transition-all active:scale-[0.98]"
        >
          <ImageDown size={15} />
          <span>Download Social Media Card (PNG)</span>
        </button>

        <div className="grid grid-cols-4 gap-2 pt-1">
          <button 
            type="button"
            onClick={onSaveBuild}
            title="Save build to account"
            className="flex flex-col items-center justify-center gap-1 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-xs font-bold"
          >
            <Save size={15} />
            <span>Save</span>
          </button>

          <button 
            type="button"
            onClick={onPrintBuild}
            title="Print build quotation"
            className="flex flex-col items-center justify-center gap-1 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-xs font-bold"
          >
            <Printer size={15} />
            <span>Print</span>
          </button>

          <button 
            type="button"
            onClick={onDownloadPDF}
            title="Download PDF Quotation"
            className="flex flex-col items-center justify-center gap-1 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-xs font-bold"
          >
            <FileDown size={15} />
            <span>PDF</span>
          </button>

          <button 
            type="button"
            onClick={onEmailBuild}
            title="Email Quotation"
            className="flex flex-col items-center justify-center gap-1 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-xs font-bold"
          >
            <Mail size={15} />
            <span>Email</span>
          </button>
        </div>

        <button 
          type="button"
          onClick={onPublishBuild}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-50 text-violet-700 hover:bg-violet-100 rounded-2xl transition-colors font-bold text-xs border border-violet-100"
        >
          <Share2 size={14} />
          <span>Publish to Community Builds</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button 
            type="button"
            className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors font-bold text-xs border border-slate-200"
            onClick={() => {
              const ids = Object.entries(selectedComponents)
                .filter(([_, product]) => product)
                .map(([cat, product]) => {
                  const qty = (product as any)?.builderQuantity || 1;
                  return `${cat}:${product?.id}${qty > 1 ? `*${qty}` : ''}`;
                })
                .join(',');
              const shareUrl = `${window.location.origin}/pc-build?build=${btoa(ids)}`;
              navigator.clipboard.writeText(shareUrl);
              toast.success('Build share link copied to clipboard!');
            }}
          >
            <Share2 size={14} />
            <span>Copy Link</span>
          </button>

          <button 
            type="button"
            className="flex items-center justify-center gap-1.5 py-2.5 bg-[#25D366]/10 text-[#128C7E] rounded-xl hover:bg-[#25D366]/20 transition-colors font-bold text-xs border border-[#25D366]/30"
            onClick={() => {
              if (selectedList.length === 0) {
                toast.error('Add components first!');
                return;
              }
              let msg = '*My Custom PC Build (CLICK2IT)*\n\n';
              Object.entries(selectedComponents).forEach(([cat, p]) => {
                if (p) {
                  const qty = (p as any).builderQuantity || 1;
                  msg += `• *${cat.toUpperCase()}*: ${p.name}${qty > 1 ? ` (x${qty})` : ''} - ৳${((p.discountPrice || p.price) * qty).toLocaleString()}\n`;
                }
              });
              if (includeAssembly) msg += `• *Service*: Professional Assembly - ৳1,500\n`;
              msg += `\n*Total*: ৳${totalPrice.toLocaleString()}\n\n`;
              const ids = Object.entries(selectedComponents)
                .filter(([_, product]) => product)
                .map(([cat, product]) => {
                  const qty = (product as any)?.builderQuantity || 1;
                  return `${cat}:${product?.id}${qty > 1 ? `*${qty}` : ''}`;
                })
                .join(',');
              const shareUrl = `${window.location.origin}/pc-build?build=${btoa(ids)}`;
              msg += `View Build: ${shareUrl}`;
              window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
            }}
          >
            <Share2 size={14} />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Selected Parts Collapsible List */}
      <div className="mt-6 pt-5 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setIsPartsListOpen(prev => !prev)}
          className="w-full flex items-center justify-between text-left group"
        >
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Selected Parts ({selectedList.length})
          </span>
          <span className="text-slate-400 group-hover:text-slate-600 transition-colors">
            {isPartsListOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </span>
        </button>

        {isPartsListOpen && (
          <div className="space-y-2.5 mt-3 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
            {selectedList.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">No parts selected yet.</p>
            ) : (
              selectedList.map((product, idx) => {
                const qty = (product as any).builderQuantity || 1;
                return (
                  <div key={idx} className="flex justify-between items-start gap-2.5 text-xs">
                    <p className="font-medium text-slate-700 line-clamp-2 flex-grow">
                      {qty > 1 && (
                        <span className="inline-block bg-violet-100 text-violet-700 text-[10px] font-black px-1.5 py-0.2 rounded mr-1">
                          {qty}x
                        </span>
                      )}
                      {product.name}
                    </p>
                    <p className="font-black text-slate-900 shrink-0">
                      {formatCurrency((product.discountPrice || product.price) * qty)}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

    </div>
  );
};
