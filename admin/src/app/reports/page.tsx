"use client";

import React, { useEffect, useState } from 'react';
import { 
  Download, 
  Filter, 
  BarChart3, 
  PieChart, 
  RefreshCcw,
  Database
} from 'lucide-react';

interface UserTrade {
  id: number;
  pair: string;
  strategy_type: string;
  side: string;
  price: string;
  amount: string;
  pnl: string | null;
  created_at: string;
  status: string;
}

interface DailyStat {
  day: string;
  profit: number;
  count: number;
}

interface AdminReport {
  recent_trades: UserTrade[];
  daily_stats: DailyStat[];
}

export default function ReportsPage() {
  const [data, setData] = useState<AdminReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDbInfo, setShowDbInfo] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://139.59.122.230:8080/api/admin/reports');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="w-[calc(100%+4rem)] -mx-8 -my-8 flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-black/10 animate-in fade-in duration-300">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-white/5 bg-[#050507]/40 backdrop-blur-md px-8 py-3 shrink-0">
        <div>
          <h2 className="text-[10px] font-extrabold tracking-[0.2em] uppercase text-white">Financial Audits Ledger</h2>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowDbInfo(true)}
            className="w-7 h-7 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 flex items-center justify-center font-black text-xs cursor-pointer transition-all mr-1"
            title="Database Schema Relations"
          >
            !
          </button>
          <button 
            onClick={fetchReports}
            className="bg-white/5 border border-white/10 p-2 text-white hover:text-[#00f2ff] transition-all rounded-lg cursor-pointer"
          >
            <RefreshCcw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <button className="bg-[#00f2ff] hover:bg-[#00d8e6] text-[#050507] px-3.5 py-1.5 text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 transition-all rounded-lg cursor-pointer">
            <Download size={13} />
            EXPORT SQL DATA
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-[#6a6a75] animate-pulse font-extrabold tracking-[0.3em] uppercase text-[10px]">
          Calculating Net Assets...
        </div>
      ) : (
        <div className="flex-1 overflow-auto min-h-0 custom-scrollbar flex flex-col">
          {/* Top Info Split Panels with Border Division */}
          <div className="grid grid-cols-1 lg:grid-cols-5 border-b border-white/5 shrink-0">
            {/* Daily Profit Chart Simulation using Real Data */}
            <div className="lg:col-span-3 border-r border-white/5 p-8 flex flex-col bg-[#050507]/10">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-2 text-white">
                  <BarChart3 size={14} className="text-[#00f2ff]" />
                  Profit Velocity (Last 7 Days)
                </h2>
              </div>
              
              <div className="h-44 flex items-end gap-3 px-2 mt-auto">
                {data?.daily_stats.map((stat, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                    <div className="w-full relative flex flex-col justify-end h-full">
                       <div 
                        className="w-full bg-[#00f2ff]/10 border-t-2 border-[#00f2ff] group-hover:bg-[#00f2ff]/20 transition-all rounded-t" 
                        style={{ height: `${Math.max(10, (stat.profit / (Math.max(...data.daily_stats.map(s => s.profit)) || 1)) * 100)}%` }}
                      ></div>
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] font-extrabold font-mono opacity-0 group-hover:opacity-100 transition-opacity text-white whitespace-nowrap">
                        +${stat.profit.toFixed(1)}
                      </div>
                    </div>
                    <span className="text-[9px] text-[#6a6a75] font-extrabold uppercase tracking-widest">{new Date(stat.day).toLocaleDateString(undefined, {weekday: 'short'})}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent High-PnL Summary */}
            <div className="lg:col-span-2 p-8 flex flex-col bg-[#050507]/5">
              <h2 className="text-[10px] font-extrabold uppercase tracking-widest mb-6 flex items-center gap-2 text-white">
                <PieChart size={14} className="text-[#7000ff]" />
                Recent Volume
              </h2>
              <div className="space-y-4">
                {data?.recent_trades.slice(0, 4).map((trade) => (
                  <div key={trade.id} className="flex justify-between items-center py-1">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-bold shrink-0 ${trade.side === 'buy' ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'bg-[#ff0055]/10 text-[#ff0055]'}`}>
                            {trade.side.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <div className="text-[11px] font-bold text-white truncate">{trade.pair}</div>
                            <div className="text-[9px] text-[#6a6a75] font-mono truncate">{trade.amount} @ {trade.price}</div>
                        </div>
                    </div>
                    <div className={`text-[11px] font-bold font-mono shrink-0 ${parseFloat(trade.pnl || '0') >= 0 ? 'text-[#00ff88]' : 'text-[#ff0055]'}`}>
                        {trade.pnl ? `${parseFloat(trade.pnl) > 0 ? '+' : ''}${trade.pnl}` : '0.00'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Transaction Table Section */}
          <div className="flex-1 flex flex-col">
            <div className="px-8 py-3.5 border-b border-white/5 flex justify-between items-center bg-[#050507]/20 shrink-0">
              <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-white">Recent SQL Trade Ledger</h2>
              <button className="text-[9px] font-extrabold text-[#6a6a75] hover:text-white flex items-center gap-1 cursor-pointer">
                <Filter size={10} /> AUDIT FILTER
              </button>
            </div>
            
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-white/5 bg-[#050507]/60 sticky top-0 backdrop-blur-md z-10">
                    <th className="px-8 py-4 text-[#86868b] uppercase tracking-wider text-[10px] font-extrabold w-40">Execution ID</th>
                    <th className="px-8 py-4 text-[#86868b] uppercase tracking-wider text-[10px] font-extrabold">Asset / Strategy</th>
                    <th className="px-8 py-4 text-[#86868b] uppercase tracking-wider text-[10px] font-extrabold w-32 text-center">Side</th>
                    <th className="px-8 py-4 text-[#86868b] uppercase tracking-wider text-[10px] font-extrabold w-52 text-right">Amount / Price</th>
                    <th className="px-8 py-4 text-[#86868b] uppercase tracking-wider text-[10px] font-extrabold w-40 text-right">PnL Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-black/5">
                  {data?.recent_trades.map((trade) => (
                    <tr key={trade.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-8 py-3.5 font-mono text-[11px] text-[#6a6a75] font-semibold">#TRD-{trade.id}</td>
                      <td className="px-8 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-[11px] tracking-tight">{trade.pair}</span>
                          <span className="text-[9px] text-[#00f2ff] font-bold uppercase px-1.5 py-0.5 bg-[#00f2ff]/5 border border-[#00f2ff]/10 rounded">{trade.strategy_type}</span>
                        </div>
                      </td>
                      <td className="px-8 py-3.5 text-center">
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                          trade.side === 'buy' 
                            ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20' 
                            : 'bg-[#ff0055]/10 text-[#ff0055] border-[#ff0055]/20'
                        }`}>
                          {trade.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-8 py-3.5 text-right text-slate-300 font-mono text-[11px] font-semibold">
                          {trade.amount} @ <span className="text-[#6a6a75]">{trade.price}</span>
                      </td>
                      <td className={`px-8 py-3.5 text-right font-bold font-mono text-[11px] ${parseFloat(trade.pnl || '0') >= 0 ? 'text-[#00ff88]' : 'text-[#ff0055]'}`}>
                        {trade.pnl ? `${parseFloat(trade.pnl) > 0 ? '+' : ''}${trade.pnl}` : '0.00'}
                      </td>
                    </tr>
                  ))}
                  {data?.recent_trades.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center text-[#6a6a75] uppercase text-[10px] font-bold tracking-widest">
                        No transactions registered in SQL ledger
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Database Schema Relation Modal */}
      {showDbInfo && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#070709] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-white/5 bg-[#0e0e12] flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400">
                <Database size={15} />
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-white">Database Schema Relations</h3>
              </div>
              <button 
                onClick={() => setShowDbInfo(false)}
                className="text-[#86868b] hover:text-white text-[10px] font-extrabold uppercase tracking-widest cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="p-6 space-y-5 text-xs text-[#86868b]">
              <div>
                <h4 className="text-white font-bold mb-1.5 uppercase text-[10px] tracking-wider text-amber-500">1. trades_by_jurnalriwayat</h4>
                <p className="leading-relaxed mb-2">
                  Tabel utama penampung riwayat transaksi (ledger) dari seluruh bot trading yang aktif (live).
                </p>
                <ul className="list-disc pl-4 space-y-1 font-mono text-[10px]">
                  <li><span className="text-white">id</span> (SERIAL, Primary Key) - Kunci transaksi unik</li>
                  <li><span className="text-white">user_id</span> (INT) - Kunci tamu relasi ke data user</li>
                  <li><span className="text-white">pair</span> (VARCHAR) - Pasangan mata uang trading</li>
                  <li><span className="text-white">strategy_type</span> (VARCHAR) - Jenis strategi bot</li>
                  <li><span className="text-white">side</span> (VARCHAR) - Posisi transaksi ('buy' / 'sell')</li>
                  <li><span className="text-white">price</span> (VARCHAR) - Harga eksekusi aset</li>
                  <li><span className="text-white">amount</span> (VARCHAR) - Jumlah volume transaksi</li>
                  <li><span className="text-white">pnl</span> (VARCHAR, Nullable) - Hasil laba/rugi bersih</li>
                  <li><span className="text-white">created_at</span> (TIMESTAMPTZ) - Waktu pencatatan transaksi</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
