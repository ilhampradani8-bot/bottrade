"use client";

import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Download, 
  Filter, 
  BarChart3, 
  PieChart, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCcw,
  Activity
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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Financial Audits</h1>
          <p className="text-[#6a6a75] text-sm mt-1">Real-time performance analytics pulled from the trading database.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchReports}
            className="bg-white/5 border border-white/10 p-2 text-white hover:text-[#00f2ff] transition-all rounded-xl"
          >
            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button className="bg-[#00f2ff] text-[#050507] px-4 py-2 text-sm font-bold flex items-center gap-2 hover:bg-[#00d8e6] transition-all rounded-xl">
            <Download size={18} />
            EXPORT SQL DATA
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-[#6a6a75] animate-pulse font-bold tracking-widest uppercase text-xs">
          Calculating Net Assets...
        </div>
      ) : (
        <>
          {/* Analytics Overview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Profit Chart Simulation using Real Data */}
            <div className="lg:col-span-2 bg-white/[0.03] border border-white/5 p-8 rounded-3xl">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-white">
                  <BarChart3 size={18} className="text-[#00f2ff]" />
                  Profit Velocity (Last 7 Days)
                </h2>
              </div>
              
              <div className="h-48 flex items-end gap-3 px-2">
                {data?.daily_stats.map((stat, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                    <div className="w-full relative flex flex-col justify-end h-full">
                       <div 
                        className="w-full bg-[#00f2ff]/20 border-t-2 border-[#00f2ff] group-hover:bg-[#00f2ff]/40 transition-all rounded-t-lg" 
                        style={{ height: `${Math.max(10, (stat.profit / (Math.max(...data.daily_stats.map(s => s.profit)) || 1)) * 100)}%` }}
                      ></div>
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold font-mono opacity-0 group-hover:opacity-100 transition-opacity text-white">
                        +${stat.profit.toFixed(1)}
                      </div>
                    </div>
                    <span className="text-[10px] text-[#6a6a75] font-bold uppercase tracking-tighter">{new Date(stat.day).toLocaleDateString(undefined, {weekday: 'short'})}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent High-PnL Summary */}
            <div className="bg-white/[0.03] border border-white/5 p-8 rounded-3xl">
              <h2 className="text-sm font-bold uppercase tracking-widest mb-8 flex items-center gap-2 text-white">
                <PieChart size={18} className="text-[#7000ff]" />
                Recent Volume
              </h2>
              <div className="space-y-6">
                {data?.recent_trades.slice(0, 4).map((trade) => (
                  <div key={trade.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${trade.side === 'buy' ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'bg-[#ff0055]/10 text-[#ff0055]'}`}>
                            {trade.side.toUpperCase()}
                        </div>
                        <div>
                            <div className="text-xs font-bold text-white">{trade.pair}</div>
                            <div className="text-[9px] text-[#6a6a75] font-mono">{trade.amount} @ {trade.price}</div>
                        </div>
                    </div>
                    <div className={`text-xs font-bold font-mono ${parseFloat(trade.pnl || '0') >= 0 ? 'text-[#00ff88]' : 'text-[#ff0055]'}`}>
                        {trade.pnl ? `${parseFloat(trade.pnl) > 0 ? '+' : ''}${trade.pnl}` : '0.00'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Transaction Table */}
          <div className="bg-white/[0.03] border border-white/5 rounded-3xl overflow-hidden overflow-x-auto">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h2 className="text-xs font-bold uppercase tracking-widest text-white">Recent SQL Trade Ledger</h2>
              <button className="text-[10px] font-bold text-[#6a6a75] hover:text-[#e0e0e6] flex items-center gap-1">
                <Filter size={12} /> AUDIT FILTER
              </button>
            </div>
            <table className="w-full text-left text-sm min-w-[1000px]">
              <thead>
                <tr className="text-[#6a6a75] border-b border-white/5 uppercase text-[10px] font-bold tracking-widest">
                  <th className="px-8 py-5">Execution ID</th>
                  <th className="px-8 py-5">Asset / Strategy</th>
                  <th className="px-8 py-5">Side</th>
                  <th className="px-8 py-5">Amount / Price</th>
                  <th className="px-8 py-5 text-right">PnL Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data?.recent_trades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-5 font-mono text-[11px] text-[#6a6a75]">#TRD-{trade.id}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white tracking-tight">{trade.pair}</span>
                        <span className="text-[10px] text-[#6a6a75] font-bold uppercase px-1.5 py-0.5 bg-white/5 rounded">{trade.strategy_type}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${trade.side === 'buy' ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'bg-[#ff0055]/10 text-[#ff0055]'}`}>
                        {trade.side}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-white/80 font-mono text-xs">
                        {trade.amount} @ <span className="text-[#6a6a75]">{trade.price}</span>
                    </td>
                    <td className={`px-8 py-5 text-right font-bold font-mono ${parseFloat(trade.pnl || '0') >= 0 ? 'text-[#00ff88]' : 'text-[#ff0055]'}`}>
                      {trade.pnl ? `${parseFloat(trade.pnl) > 0 ? '+' : ''}${trade.pnl}` : '0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
