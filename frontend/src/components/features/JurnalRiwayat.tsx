"use client";

import React, { useState } from 'react';
import { 
  ScrollText, 
  Search, 
  History,
  Download
} from 'lucide-react';

const mockTrades = [
  { id: 1, pair: 'BTCUSDT', type: 'DCA', side: 'BUY', price: '65230.50', amount: '0.005', pnl: null, time: '2026-05-10 10:25:12', status: 'COMPLETED' },
  { id: 2, pair: 'ETHUSDT', type: 'GRID', side: 'SELL', price: '3450.20', amount: '0.12', pnl: '+12.50', time: '2026-05-10 09:15:45', status: 'COMPLETED' },
  { id: 3, pair: 'SOLUSDT', type: 'TRAILING', side: 'SELL', price: '145.75', amount: '2.5', pnl: '+5.20', time: '2026-05-10 08:30:00', status: 'COMPLETED' },
  { id: 4, pair: 'BTCUSDT', type: 'DCA', side: 'SELL', price: '66100.00', amount: '0.005', pnl: '+4.35', time: '2026-05-10 07:12:33', status: 'COMPLETED' },
];

export default function JurnalRiwayat() {
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTrades = mockTrades.filter(trade => {
    const matchesFilter = filter === 'ALL' || trade.type === filter;
    const matchesSearch = trade.pair.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-2 md:p-4 space-y-6 animate-in fade-in duration-700 w-full bg-transparent">
      {/* Header section with minimal borders */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-6 gap-6">
        <div className="flex items-center gap-4">
           <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
             Jurnal <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Transaksi</span>
           </h1>
           <div className="p-2 bg-indigo-500/5 text-indigo-400 border border-indigo-500/10 rounded-[6px]" title="Jurnal Transaksi">
              <ScrollText size={16} />
           </div>
        </div>

        {/* Tab Filter and Search */}
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            {/* Excel Search Box */}
            <div className="relative flex-1 sm:w-60">
                <input 
                    type="text" 
                    placeholder="CARI BURSA (CONTOH: BTC)..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black border border-white/10 p-2.5 pl-10 text-[9px] font-bold text-white uppercase tracking-widest outline-none focus:border-indigo-500/40 rounded-[6px] transition-all"
                />
                <Search size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>

            {/* Segmented Filter Tab */}
            <div className="flex p-1 bg-white/[0.03] border border-white/5 rounded-[8px]">
                <button onClick={() => setFilter('ALL')} className={`px-4 py-2 text-[9px] font-bold uppercase tracking-wider rounded-[6px] transition-all ${filter === 'ALL' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>Semua</button>
                <button onClick={() => setFilter('DCA')} className={`px-4 py-2 text-[9px] font-bold uppercase tracking-wider rounded-[6px] transition-all ${filter === 'DCA' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>DCA</button>
                <button onClick={() => setFilter('GRID')} className={`px-4 py-2 text-[9px] font-bold uppercase tracking-wider rounded-[6px] transition-all ${filter === 'GRID' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>Grid</button>
            </div>
        </div>
      </header>

      {/* Trade History Table - Structured exactly like a clean Excel spreadsheet */}
      <div className="border border-white/10 overflow-hidden rounded-[12px] bg-[#07080c] shadow-2xl">
        <div className="p-5 border-b border-white/10 bg-white/[0.01] flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2.5">
                <History size={14} className="text-indigo-400" /> Jurnal Sheet
            </h3>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest font-mono">AUTOSAVED</span>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-white/10 text-xs">
                <thead>
                    <tr className="bg-white/[0.04]">
                        {/* Column and row labels resembling spreadsheet grids */}
                        <th className="border border-white/10 px-4 py-2.5 text-center text-[9px] font-black text-slate-500 bg-black/60 w-12 font-mono">Row</th>
                        <th className="border border-white/10 px-6 py-2.5 text-[9px] font-black text-slate-500 uppercase tracking-widest bg-black/60">A. Waktu</th>
                        <th className="border border-white/10 px-6 py-2.5 text-[9px] font-black text-slate-500 uppercase tracking-widest bg-black/60">B. Aset & Strategi</th>
                        <th className="border border-white/10 px-6 py-2.5 text-[9px] font-black text-slate-500 uppercase tracking-widest bg-black/60">C. Aksi</th>
                        <th className="border border-white/10 px-6 py-2.5 text-[9px] font-black text-slate-500 uppercase tracking-widest bg-black/60">D. Harga Exec</th>
                        <th className="border border-white/10 px-6 py-2.5 text-[9px] font-black text-slate-500 uppercase tracking-widest bg-black/60">E. Jumlah</th>
                        <th className="border border-white/10 px-6 py-2.5 text-[9px] font-black text-slate-500 uppercase tracking-widest bg-black/60">F. PnL ($)</th>
                        <th className="border border-white/10 px-6 py-2.5 text-[9px] font-black text-slate-500 uppercase tracking-widest bg-black/60">G. Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {filteredTrades.map((trade, idx) => (
                        <tr key={trade.id} className="hover:bg-white/[0.02] transition-colors">
                            {/* Excel spreadsheet row numbering */}
                            <td className="border border-white/10 px-4 py-3 text-center font-mono text-[9px] font-bold text-slate-600 bg-black/30 select-none">{idx + 1}</td>
                            
                            <td className="border border-white/10 px-6 py-3 font-mono text-slate-500 text-[10px] tabular-nums">{trade.time}</td>
                            
                            <td className="border border-white/10 px-6 py-3">
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-white tracking-widest">{trade.pair}</span>
                                    <span className="text-[8px] text-slate-600 font-bold uppercase tracking-wider">{trade.type} BOT</span>
                                </div>
                            </td>
                            
                            <td className="border border-white/10 px-6 py-3">
                                <span className={`px-2 py-0.5 rounded-[4px] text-[8px] font-black tracking-wider border ${
                                    trade.side === 'BUY' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/5 border-rose-500/20 text-red-400'
                                }`}>
                                    {trade.side}
                                </span>
                            </td>
                            
                            <td className="border border-white/10 px-6 py-3 font-mono font-semibold text-slate-200 tabular-nums">{trade.price}</td>
                            
                            <td className="border border-white/10 px-6 py-3 font-mono text-slate-400 tabular-nums">{trade.amount}</td>
                            
                            <td className="border border-white/10 px-6 py-3">
                                {trade.pnl ? (
                                    <span className={`font-mono font-bold ${trade.pnl.startsWith('+') ? 'text-emerald-400' : 'text-red-400'} tabular-nums`}>
                                        {trade.pnl}
                                    </span>
                                ) : (
                                    <span className="text-slate-600 font-mono">---</span>
                                )}
                            </td>
                            
                            <td className="border border-white/10 px-6 py-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-md"></div>
                                    <span className="text-[9px] font-bold text-white uppercase tracking-wider">{trade.status}</span>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        <div className="p-6 bg-white/[0.01] border-t border-white/10 flex justify-center">
            <button className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[9px] font-black uppercase tracking-wider transition-all border border-white/10 rounded-[6px]">
                Muat Riwayat Lainnya
            </button>
        </div>
      </div>
    </div>
  );
}
