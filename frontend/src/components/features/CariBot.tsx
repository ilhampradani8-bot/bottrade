"use client";

import React from 'react';
import { Zap, TrendingUp, ShieldCheck, Cpu, Info } from 'lucide-react';

const botStrategies = [
  {
    id: 'dca',
    name: 'DCA BOT',
    description: 'Dollar Cost Averaging otomatis untuk investasi jangka panjang tanpa emosi.',
    stats: '85% Success',
    color: 'blue'
  },
  {
    id: 'grid',
    name: 'GRIDBOT',
    description: 'Profit dari volatilitas pasar dengan buy low dan sell high secara otomatis.',
    stats: 'High Vol',
    color: 'emerald'
  },
  {
    id: 'combo',
    name: 'COMBO',
    description: 'Gabungan indikator RSI dan EMA untuk sinyal beli/jual yang lebih akurat.',
    stats: 'Stable',
    color: 'purple'
  },
  {
    id: 'trailing',
    name: 'TRAILING',
    description: 'Maksimalkan profit dengan mengunci harga saat naik dan keluar cepat.',
    stats: 'Profit Lock',
    color: 'amber'
  }
];

export default function CariBot({ setActiveView }: { setActiveView: (view: string) => void }) {
  return (
    <div className="p-2 md:p-4 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 w-full relative min-h-screen bg-transparent">
      
      {/* Sleek Warning Banner */}
      <div className="bg-amber-500/5 border border-amber-500/15 p-5 rounded-2xl flex gap-3 text-amber-200">
        <Info className="text-amber-400 shrink-0 mt-0.5" size={18} />
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider">Status Fitur</h4>
          <p className="text-[10px] text-slate-400 leading-relaxed mt-1 uppercase tracking-widest font-semibold">
            Dalam pengembangan, admin SQL tabel bot harus disiapkan supaya bisa ditampilkan daftar bot yang real.
          </p>
        </div>
      </div>

      {/* Grid containing Interactive Cards as Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {botStrategies.map((strat) => (
          <button 
            key={strat.id} 
            onClick={() => setActiveView('strategi-pengaturan')}
            className="border border-white/10 p-6 flex flex-col justify-between items-start text-left min-h-[160px] group hover:border-indigo-500/40 hover:bg-white/[0.02] transition-all relative overflow-hidden rounded-[12px] bg-white/[0.01] w-full"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/10 group-hover:bg-indigo-500 transition-all"></div>
            
            <div className="space-y-4 w-full">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 flex items-center justify-center transition-all duration-500 bg-white/5 rounded-[6px] border border-white/5 ${
                  strat.color === 'blue' ? 'text-blue-400 group-hover:bg-blue-500/5 group-hover:border-blue-500/20' : 
                  strat.color === 'emerald' ? 'text-emerald-400 group-hover:bg-emerald-500/5 group-hover:border-emerald-500/20' :
                  strat.color === 'purple' ? 'text-purple-400 group-hover:bg-purple-500/5 group-hover:border-purple-500/20' : 
                  'text-amber-400 group-hover:bg-amber-500/5 group-hover:border-amber-500/20'
                }`}>
                  {strat.id === 'dca' ? <TrendingUp size={18} /> : 
                   strat.id === 'grid' ? <Cpu size={18} /> :
                   strat.id === 'combo' ? <ShieldCheck size={18} /> : <Zap size={18} />}
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">{strat.name}</h3>
                  <div className={`text-[8px] font-bold uppercase tracking-tighter ${
                    strat.color === 'blue' ? 'text-blue-400' : 
                    strat.color === 'emerald' ? 'text-emerald-400' :
                    strat.color === 'purple' ? 'text-purple-400' : 'text-amber-400'
                  }`}>
                    {strat.stats}
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed font-semibold uppercase tracking-wider">
                {strat.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
