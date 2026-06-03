"use client";

import React, { useState } from 'react';
import { Zap, ArrowRight, TrendingUp, ShieldCheck, Cpu, Info, X, Sparkles } from 'lucide-react';

const botStrategies = [
  {
    id: 'dca',
    name: 'DCA BOT',
    description: 'Dollar Cost Averaging otomatis untuk investasi jangka panjang tanpa emosi. Membeli aset secara bertahap untuk mendapatkan harga rata-rata terbaik.',
    stats: '85% Success',
    color: 'blue'
  },
  {
    id: 'grid',
    name: 'GRIDBOT',
    description: 'Profit dari volatilitas pasar dengan buy low dan sell high secara otomatis di rentang harga yang ditentukan.',
    stats: 'High Vol',
    color: 'emerald'
  },
  {
    id: 'combo',
    name: 'COMBO',
    description: 'Gabungan indikator RSI dan EMA untuk sinyal beli/jual yang lebih akurat dan terkonfirmasi.',
    stats: 'Stable',
    color: 'purple'
  },
  {
    id: 'trailing',
    name: 'TRAILING',
    description: 'Maksimalkan profit dengan mengunci harga saat naik dan keluar cepat saat harga berbalik arah.',
    stats: 'Profit Lock',
    color: 'amber'
  }
];

export default function CariBot({ setActiveView }: { setActiveView: (view: string) => void }) {
  const [selectedBot, setSelectedBot] = useState<any>(null);

  return (
    <div className="p-2 md:p-4 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 w-full relative min-h-screen bg-transparent">
      {/* Header section with minimal borders */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-6 gap-6">
        <div>
           <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
             Bot <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Repository</span>
           </h1>
           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Pilih dan aktifkan bot perdagangan otomatis bersertifikat Anda.</p>
        </div>
      </header>

      {/* Grid containing Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {botStrategies.map((strat) => (
          <div 
            key={strat.id} 
            className="border border-white/10 p-6 flex flex-col justify-between min-h-[220px] group hover:border-indigo-500/40 transition-all relative overflow-hidden rounded-[12px] bg-white/[0.01] backdrop-blur-md"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/10 group-hover:bg-indigo-500 transition-all"></div>
            
            <button 
              onClick={() => setSelectedBot(strat)}
              className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-white transition-colors hover:bg-white/5 rounded-[6px]"
              title="Informasi Detail"
            >
              <Info size={14} />
            </button>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 flex items-center justify-center transition-all duration-500 bg-white/5 rounded-[6px] border border-white/5 ${
                  strat.color === 'blue' ? 'text-blue-400 group-hover:bg-blue-500/5 group-hover:border-blue-500/20' : 
                  strat.color === 'emerald' ? 'text-emerald-400 group-hover:bg-emerald-500/5 group-hover:border-emerald-500/20' :
                  strat.color === 'purple' ? 'text-purple-400 group-hover:bg-purple-500/5 group-hover:border-purple-500/20' : 
                  'text-amber-400 group-hover:bg-amber-500/5 group-hover:border-amber-500/20'
                }`}>
                  {strat.id === 'dca' ? <TrendingUp size={20} /> : 
                   strat.id === 'grid' ? <Cpu size={20} /> :
                   strat.id === 'combo' ? <ShieldCheck size={20} /> : <Zap size={20} />}
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
                {strat.description.substring(0, 75)}...
              </p>
            </div>

            <button 
              onClick={() => setActiveView('strategi-pengaturan')}
              className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[6px] text-[10px] font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Aktifkan Bot</span>
              <ArrowRight size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Info Popup Modal */}
      {selectedBot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#0c0d12]/95 border border-white/10 p-6 md:p-8 max-w-sm w-full relative shadow-2xl rounded-[12px] space-y-6">
            <button 
              onClick={() => setSelectedBot(null)}
              className="absolute top-4 right-4 p-1.5 rounded-[6px] text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-4">
               <div className={`w-12 h-12 flex items-center justify-center bg-white/5 border border-white/5 rounded-[6px] ${
                selectedBot.color === 'blue' ? 'text-blue-400' : 
                selectedBot.color === 'emerald' ? 'text-emerald-400' :
                selectedBot.color === 'purple' ? 'text-purple-400' : 'text-amber-400'
              }`}>
                {selectedBot.id === 'dca' ? <TrendingUp size={22} /> : 
                 selectedBot.id === 'grid' ? <Cpu size={22} /> :
                 selectedBot.id === 'combo' ? <ShieldCheck size={22} /> : <Zap size={22} />}
              </div>
              <div>
                <h2 className="text-base font-black text-white uppercase tracking-tight">{selectedBot.name}</h2>
                <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">{selectedBot.stats}</p>
              </div>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              {selectedBot.description}
            </p>
            <button 
              onClick={() => setSelectedBot(null)}
              className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider border border-white/10 rounded-[6px] transition-all"
            >
              Selesai
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
