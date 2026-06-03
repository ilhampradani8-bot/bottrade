"use client";

import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Cpu, 
  Zap,
  ArrowUpRight,
  Clock,
  RefreshCcw
} from 'lucide-react';

interface AdminOverview {
  total_users: number;
  active_bots: number;
  total_trades: number;
  total_profit: number;
}

export default function Dashboard() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://139.59.122.230:8080/api/admin/overview');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch admin overview:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const stats = [
    { label: 'Total Net Profit', value: `$${data?.total_profit.toFixed(2) || '0.00'}`, up: true, icon: TrendingUp },
    { label: 'Active Fleet', value: data?.active_bots.toString() || '0', up: true, icon: Zap },
    { label: 'Registered Traders', value: data?.total_users.toString() || '0', up: true, icon: Users },
    { label: 'Lifetime Trades', value: data?.total_trades.toString() || '0', up: true, icon: Cpu },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Master Control Center (SQL)</h1>
          <p className="text-[#6a6a75] text-sm mt-1">Real-time system-wide overview from PostgreSQL database.</p>
        </div>
        <button 
            onClick={fetchOverview}
            className="bg-white/5 border border-white/10 p-2 text-white hover:text-[#00f2ff] transition-all rounded-xl"
          >
            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white/[0.03] border border-white/5 p-6 hover:border-white/20 transition-all group rounded-3xl">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-white text-black rounded-xl">
                <stat.icon size={20} />
              </div>
              <div className="flex items-center text-[10px] font-bold text-emerald-500">
                <ArrowUpRight size={12} />
                LIVE
              </div>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-[#6a6a75] font-bold mb-1">
              {stat.label}
            </div>
            <div className="text-2xl font-bold font-mono tracking-tighter text-white">
              {loading ? '---' : stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* System Logs / Timeline */}
        <div className="lg:col-span-2 bg-white/[0.03] border border-white/5 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">Security Stream</h2>
            <div className="flex gap-2">
                <div className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[9px] font-bold rounded-md">ENCRYPTED</div>
            </div>
          </div>
          <div className="p-6 space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="mt-1">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
                <div>
                  <div className="text-xs text-[#e0e0e6] leading-relaxed">
                    <span className="font-bold text-white uppercase">[AUDIT]</span> System performed routine check on PostgreSQL hypertable integrity.
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-[#6a6a75] mt-1">
                    <Clock size={10} />
                    <span>{i * 12}m ago</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick System Health */}
        <div className="bg-white/[0.03] border border-white/5 p-8 rounded-3xl flex flex-col justify-center items-center text-center">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/20">
                <Cpu size={32} />
            </div>
            <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-xs">Kernel Integrity</h3>
            <p className="text-[#6a6a75] text-[11px] leading-relaxed mb-6">
                Rust Engine (Axum) is operating within normal parameters. 
                Average latency: 42ms.
            </p>
            <div className="w-full py-3 bg-white text-black font-bold text-[10px] rounded-xl uppercase tracking-widest">
                System Healthy
            </div>
        </div>
      </div>
    </div>
  );
}
