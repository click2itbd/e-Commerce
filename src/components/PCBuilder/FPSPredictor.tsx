import React from 'react';
import { Product } from '../../types';
import { Target, MonitorPlay, Zap } from 'lucide-react';

interface FPSPredictorProps {
  cpu?: Product;
  gpu?: Product;
}

export const FPSPredictor: React.FC<FPSPredictorProps> = ({ cpu, gpu }) => {
  if (!cpu || !gpu) return null;

  // Simple heuristic based prediction for demonstration.
  // In a real-world app, this would query a database of benchmark data.
  const calculateFPS = (game: string) => {
    let baseFPS = 60;
    
    // CPU factor
    const cpuName = cpu.name.toLowerCase();
    if (cpuName.includes('i9') || cpuName.includes('ryzen 9')) baseFPS += 60;
    else if (cpuName.includes('i7') || cpuName.includes('ryzen 7')) baseFPS += 40;
    else if (cpuName.includes('i5') || cpuName.includes('ryzen 5')) baseFPS += 20;

    // GPU factor
    const gpuName = gpu.name.toLowerCase();
    if (gpuName.includes('4090') || gpuName.includes('rx 7900')) baseFPS += 150;
    else if (gpuName.includes('4080') || gpuName.includes('4070')) baseFPS += 100;
    else if (gpuName.includes('3060') || gpuName.includes('4060')) baseFPS += 60;

    // Game multipliers
    if (game === 'Valorant') return Math.floor(baseFPS * 2.5);
    if (game === 'Cyberpunk 2077') return Math.floor(baseFPS * 0.4);
    if (game === 'GTA V') return Math.floor(baseFPS * 1.2);
    
    return baseFPS;
  };

  const games = ['Valorant', 'Cyberpunk 2077', 'GTA V'];

  return (
    <div className="bg-slate-900 text-white rounded-xl p-4 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="text-emerald-400" size={18} />
        <h4 className="font-bold text-sm">Estimated Gaming Performance</h4>
      </div>
      
      <div className="space-y-3">
        {games.map(game => (
          <div key={game} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MonitorPlay size={14} className="text-slate-400" />
              <span className="text-xs text-slate-300">{game} (1080p High)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-emerald-400">{calculateFPS(game)}</span>
              <span className="text-[10px] text-slate-400">FPS</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-start gap-2">
        <Zap size={14} className="text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[10px] text-slate-400 leading-tight">
          Estimates are based on selected CPU & GPU combinations and may vary depending on RAM, resolution, and cooling.
        </p>
      </div>
    </div>
  );
};
