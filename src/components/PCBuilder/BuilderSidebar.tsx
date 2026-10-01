import React from 'react';
import { Product } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { ShoppingCart, Save, Share2, Printer, Zap, AlertTriangle, ShieldCheck, Mail, FileDown, Gamepad2, BrainCircuit, Star } from 'lucide-react';
import { calculateEstimatedWattage, getOverallCompatibility } from './utils';
import { CompatibilityEngine } from './CompatibilityEngine';
import { FPSPredictor } from './FPSPredictor';

interface BuilderSidebarProps {
  selectedComponents: Record<string, Product>;
  onAddToCart: () => void;
  onSaveBuild: () => void;
  onPrintBuild: () => void;
  onDownloadPDF: () => void;
  onEmailBuild: () => void;
  onPublishBuild: () => void;
}

export const BuilderSidebar: React.FC<BuilderSidebarProps> = ({ 
  selectedComponents, 
  onAddToCart,
  onSaveBuild,
  onPrintBuild,
    onDownloadPDF,
  onEmailBuild,
  onPublishBuild
}) => {
  const selectedList = Object.values(selectedComponents).filter(Boolean) as Product[];
  const totalPrice = selectedList.reduce((sum, p) => sum + p.price, 0);
  const estimatedWattage = calculateEstimatedWattage(selectedComponents);
  const compatibility = getOverallCompatibility(selectedComponents);
  const aiAnalysis = CompatibilityEngine.evaluateScore(selectedComponents);

  return (
    <div className="bg-[#151A23] rounded-xl border border-[#1F2633] p-6 relative overflow-hidden">
      
      <h3 className="text-lg font-black text-white mb-6">Build Summary</h3>
      
      <div className="space-y-4 mb-6">
        {/* Compatibility Report */}
          {/* Hide if perfectly compatible */}
        {selectedList.length > 1 && (!compatibility.isCompatible || compatibility.warnings.length > 0) && (
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

        
          {/* AI Build Score */}
          <div className="bg-gradient-to-r from-violet-900/40 to-indigo-900/40 border border-violet-500/30 p-5 rounded-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <BrainCircuit size={64} className="text-violet-400" />
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-bold text-violet-300 flex items-center gap-2">
                  <BrainCircuit size={16} /> AI Build Rating
                </h4>
                <div className="flex items-center gap-1 bg-violet-950/50 px-2 py-1 rounded-lg border border-violet-500/20">
                  <Star size={14} className="text-amber-400 fill-amber-400" />
                  <span className="font-black text-white">{aiAnalysis.score.toFixed(1)}<span className="text-slate-500 text-xs">/10</span></span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {aiAnalysis.text}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center bg-[#1F2633] p-4 rounded-xl">
          <div>
            <p className="text-sm text-slate-400 font-medium">Estimated Wattage</p>
            <div className="flex items-center gap-2 mt-1">
              <Zap className="text-amber-500" size={18} />
              <span className="font-bold text-slate-100">{estimatedWattage}W</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-end border-t border-[#1F2633] pt-6">
          <p className="text-sm text-white font-bold uppercase tracking-wider">Total Price</p>
          <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-indigo-500">
            {formatCurrency(totalPrice)}
          </p>
        </div>
      
      <div className="mt-4 p-4 bg-[#0B0E14] rounded-xl border border-[#1F2633] text-white p-4">
        
        <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
          <Gamepad2 size={16} className="text-indigo-400" />
          Gaming Performance (Est.)
        </h4>
        <div className="space-y-3 relative z-10">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-slate-400">Valorant / CS2 (1080p)</span>
            <span className="font-bold text-green-400">
              {Object.keys(selectedComponents).length > 2 ? '240+ FPS' : '-- FPS'}
            </span>
          </div>
          <div className="w-full bg-[#1F2633] rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-400 h-1.5 rounded-full" style={{ width: Object.keys(selectedComponents).length > 2 ? '95%' : '0%' }}></div>
          </div>
          
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-slate-400">GTA V / Warzone (1080p)</span>
            <span className="font-bold text-blue-400">
              {Object.keys(selectedComponents).length > 2 ? '144+ FPS' : '-- FPS'}
            </span>
          </div>
          <div className="w-full bg-[#1F2633] rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-400 h-1.5 rounded-full" style={{ width: Object.keys(selectedComponents).length > 2 ? '80%' : '0%' }}></div>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-slate-400">Cyberpunk 2077 (1080p)</span>
            <span className="font-bold text-purple-400">
              {Object.keys(selectedComponents).length > 2 ? '60+ FPS' : '-- FPS'}
            </span>
          </div>
          <div className="w-full bg-[#1F2633] rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-400 h-1.5 rounded-full" style={{ width: Object.keys(selectedComponents).length > 2 ? '60%' : '0%' }}></div>
          </div>
        </div>
      </div>

      </div>

      <div className="space-y-3">
        <button
          onClick={onAddToCart}
          className="w-full bg-violet-600 hover:bg-violet-500 text-white py-4 rounded-xl font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
          <ShoppingCart size={20} className="relative z-10" />
          <span className="relative z-10 text-lg">Add to Cart</span>
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={onSaveBuild}
            className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 text-slate-200 rounded-xl hover:bg-[#1F2633] transition-colors font-medium text-sm"
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
            onClick={onDownloadPDF}
            className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium text-sm"
          >
            <FileDown size={16} />
            PDF
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
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 text-slate-300 rounded-xl hover:bg-[#2A3441] transition-colors font-medium text-sm"
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
        
        <div className="relative bg-[#0B0E14] rounded-xl border border-[#1F2633]">
          <FPSPredictor 
            cpu={selectedComponents['cpu']} 
            gpu={selectedComponents['graphics-card']} 
          />
        </div>
      </div>
    </div>
  );
};
