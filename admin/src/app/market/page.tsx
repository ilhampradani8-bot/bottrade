"use client";

import React, { useEffect, useState } from 'react';
import { 
  Database, 
  Search, 
  RefreshCcw,
  Clock,
  Calendar,
  Layers
} from 'lucide-react';

interface MarketSummary {
  symbol: string;
  interval: string;
  start_time: number;
  end_time: number;
  count: number;
}

export default function MarketPage() {
  const [data, setData] = useState<MarketSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://139.59.122.230:8080/api/admin/market-summary');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch market summary:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatTimestamp = (ts: number) => {
    if (ts === 0) return 'N/A';
    // Assuming timestamp is in milliseconds or seconds. 
    // Usually crypto timestamps are in ms.
    return new Date(ts).toLocaleString();
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Market Intelligence</h1>
          <p className="text-[#6a6a75] text-sm mt-1">Exploration of historical kline data stored in PostgreSQL hypertables.</p>
        </div>
        <button 
          onClick={fetchData}
          className="bg-white/5 border border-white/10 p-2 text-white hover:text-[#00f2ff] transition-all rounded-xl"
        >
          <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-[#6a6a75] animate-pulse font-bold tracking-widest uppercase text-xs">
          Scanning Database Clusters...
        </div>
      ) : (
        <div className="bg-white/[0.03] border border-white/5 rounded-3xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[1000px]">
            <thead>
              <tr className="text-[#6a6a75] border-b border-white/5 uppercase text-[10px] font-bold tracking-widest bg-white/[0.02]">
                <th className="px-8 py-5">Asset Pair</th>
                <th className="px-8 py-5">Interval</th>
                <th className="px-8 py-5">Timeframe Coverage</th>
                <th className="px-8 py-5 text-right">Data Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.map((item, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#00f2ff]">
                            <Database size={20} />
                        </div>
                        <div className="font-bold text-white tracking-tight text-lg font-mono">
                            {item.symbol}
                        </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] font-bold text-white/80">
                        <Layers size={12} className="text-[#00f2ff]" />
                        {item.interval.toUpperCase()}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[11px] text-white/80 font-medium">
                            <Calendar size={12} className="text-emerald-500" />
                            {formatTimestamp(item.start_time)}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#6a6a75] font-medium">
                            <Clock size={12} className="text-[#ff0055]" />
                            {formatTimestamp(item.end_time)}
                        </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="text-xl font-bold font-mono text-white tracking-tighter">
                        {item.count.toLocaleString()}
                    </div>
                    <div className="text-[9px] text-[#6a6a75] font-bold uppercase tracking-widest">Records</div>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                    <td colSpan={4} className="px-8 py-20 text-center text-[#6a6a75] uppercase text-[10px] font-bold tracking-widest">
                        Database hypertables are currently empty
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
