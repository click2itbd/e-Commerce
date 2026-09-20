import React from 'react';
import { Product } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { ShoppingCart, Save, Share2, Printer, Zap, AlertTriangle, ShieldCheck, Mail } from 'lucide-react';
import { calculateEstimatedWattage, getOverallCompatibility } from './utils';
import { FPSPredictor } from './FPSPredictor';

interface BuilderSidebarProps {
  selectedComponents: Record<string, Product>;
  onAddToCart: () => void;
  onSaveBuild: () => void;
  onPrintBuild: () => void;
  onEmailBuild: () => void;
  onPublishBuild: () => void;
}

export const BuilderSidebar: React.FC<BuilderSidebarProps> = ({ 
  selectedComponents, 
  onAddToCart,
  onSaveBuild,
  onPrintBuild,
  onEmailBuild,
  onPublishBuild
}) => {
  const selectedList = Object.values(selectedComponents).filter(Boolean) as Product[];
  const totalPrice = selectedList.reduce((sum, p) => sum + p.price, 0);
  const estimatedWattage = calculateEstimatedWattage(selectedComponents);
  const compatibility = getOverallCompatibility(selectedComponents);

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0E2A47] to-[#6EC72A]"></div>
      <h3 className="text-lg font-black text-[#0E2A47] mb-6">Build Summary</h3>
      
      <div className="space-y-4 mb-6">
        {/* Compatibility Report */}
        {selectedList.length > 1 && (
          <div className={`p-4 rounded-xl border ${compatibility.isCompatible ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
            <div className="flex items-center gap-2 mb-2">
              {compatibility.isCompatible ? (
                <ShieldCheck className="text-emerald-500" size={18} />
              ) : (
                <AlertTriangle className="text-red-500" size={18} />
              )}
              <span className={`font-bold text-sm ${compatibility.isCompatible ? 'text-emerald-700' : 'text-red-700'}`}>
                {compatibility.isCompatible ? 'System is Compatible' : 'Compatibility Issues Found'}
              </span>
            </div>
            {compatibility.errors.map((err, i) => (
              <p key={`err-${i}`} className="text-xs text-red-600 mt-1">• {err}</p>
            ))}
            {compatibility.warnings.map((warn, i) => (
              <p key={`warn-${i}`} className="text-xs text-amber-600 mt-1">• {warn}</p>
            ))}
            {compatibility.isCompatible && compatibility.warnings.length === 0 && (
              <p className="text-xs text-emerald-600">All selected parts will work together perfectly.</p>
            )}
          </div>
        )}

        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
          <div>
            <p className="text-sm text-slate-500 font-medium">Estimated Wattage</p>
            <div className="flex items-center gap-2 mt-1">
              <Zap className="text-amber-500" size={18} />
              <span className="font-bold text-slate-900">{estimatedWattage}W</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-end border-t border-slate-100 pt-6">
          <p className="text-sm text-[#0E2A47] font-bold uppercase tracking-wider">Total Price</p>
          <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#0E2A47] to-[#6EC72A]">
            {formatCurrency(totalPrice)}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={onAddToCart}
          className="w-full bg-gradient-to-r from-[#0E2A47] to-[#1a4a7c] text-white py-4 rounded-xl font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
          <ShoppingCart size={20} className="relative z-10" />
          <span className="relative z-10 text-lg">Add to Cart</span>
        </button>

        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={onSaveBuild}
            className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium text-sm"
          >
            <Save size={16} />
            Save
          </button>
          <button 
            onClick={onPrintBuild}
            className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium text-sm"
          >
            <Printer size={16} />
            Print
          </button>
          <button 
            onClick={onEmailBuild}
            className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium text-sm"
          >
            <Mail size={16} />
            Email
          </button>
        </div>
        
        <button 
          onClick={onPublishBuild}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors font-bold text-sm"
        >
          <Share2 size={16} />
          Publish to Community
        </button>

        <button 
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors font-medium text-sm"
          onClick={() => {
            const ids = Object.entries(selectedComponents)
              .filter(([_, product]) => product)
              .map(([cat, product]) => `${cat}:${product?.id}`)
              .join(',');
            const shareUrl = `${window.location.origin}/pc-build?build=${btoa(ids)}`;
            navigator.clipboard.writeText(shareUrl);
            alert('Build link copied to clipboard!');
          }}
        >
          <Share2 size={16} />
          Share Build Link
        </button>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-100">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Selected Parts ({selectedList.length})</h4>
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {selectedList.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No parts selected yet.</p>
          ) : (
            selectedList.map((product, idx) => (
              <div key={idx} className="flex justify-between items-start gap-3">
                <p className="text-sm font-medium text-slate-700 line-clamp-2 flex-grow">{product.name}</p>
                <p className="text-sm font-bold text-slate-900 shrink-0">{formatCurrency(product.price)}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-emerald-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative bg-white rounded-2xl ring-1 ring-slate-200/50">
          <FPSPredictor 
            cpu={selectedComponents['cpu']} 
            gpu={selectedComponents['graphics-card']} 
          />
        </div>
      </div>
    </div>
  );
};
