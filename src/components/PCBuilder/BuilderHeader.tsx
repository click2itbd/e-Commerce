import React from 'react';
import { RotateCcw, Sparkles, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BuilderHeaderProps {
  onReset: () => void;
}

export const BuilderHeader: React.FC<BuilderHeaderProps> = ({ onReset }) => {
  return (
    
    <div className="relative rounded-3xl overflow-hidden shadow-2xl mb-10 border border-slate-800">
      {/* Hero Background Image */}
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1587202372634-32705e3bf49c?q=80&w=2070&auto=format&fit=crop" 
          alt="PC Build Setup" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
      </div>

      <div className="relative p-8 md:p-12 lg:p-16 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 z-10">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-sm font-bold mb-6 backdrop-blur-md">
            <Sparkles size={14} /> Next-Gen PC Builder
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4 drop-shadow-lg">
            Build Your Ultimate <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Dream Rig</span>
          </h1>
          <p className="text-lg text-slate-300 font-medium max-w-xl">
            Select your components with our smart compatibility engine. From budget setups to extreme gaming battlestations.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-4 shrink-0">
          <button 
            onClick={() => document.dispatchEvent(new CustomEvent('open-ai-assistant'))}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold bg-violet-600 text-white hover:bg-violet-500 rounded-xl transition-all shadow-lg shadow-violet-500/20"
          >
            <Sparkles size={18} />
            Build for Me (AI)
          </button>
          <button 
            onClick={() => document.dispatchEvent(new CustomEvent('open-custom-build'))}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold bg-slate-900/80 text-white hover:bg-slate-800 border border-slate-700 rounded-xl transition-all backdrop-blur-md"
          >
            <ClipboardList size={18} />
            Request Custom Build
          </button>
          <div className="flex gap-4 w-full sm:w-auto mt-2 sm:mt-0">
            <Link to="/pc-build/community-builds" className="flex-1 flex justify-center items-center gap-2 px-6 py-3.5 text-sm font-bold bg-slate-900/80 text-white hover:bg-slate-800 border border-slate-700 rounded-xl transition-all backdrop-blur-md">
              Community
            </Link>
            <button 
              onClick={onReset}
              className="flex items-center justify-center p-3.5 text-slate-400 hover:text-white hover:bg-rose-500/20 border border-transparent hover:border-rose-500/30 rounded-xl transition-all"
              title="Start Over"
            >
              <RotateCcw size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>

  );
};
