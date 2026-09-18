import React from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BuilderHeaderProps {
  onReset: () => void;
}

export const BuilderHeader: React.FC<BuilderHeaderProps> = ({ onReset }) => {
  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#0E2A47] to-indigo-600">PC Builder</h1>
        <p className="text-slate-500 mt-2 font-medium">Build your custom dream PC with guaranteed compatibility.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button 
          onClick={() => document.dispatchEvent(new CustomEvent('open-ai-assistant'))}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-all"
        >
          <Sparkles size={16} />
          Build for Me (AI)
        </button>
        <Link to="/pc-build/community-builds" className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-all">
          Community Builds
        </Link>
        <button 
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
        >
          <RotateCcw size={16} />
          Start Over
        </button>
      </div>
    </div>
  );
};
