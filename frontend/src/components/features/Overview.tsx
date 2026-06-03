"use client";

import { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  ArrowUpRight, 
  DollarSign, 
  Activity,
  Cpu,
  Clock,
  ChevronRight,
  Eye,
  EyeOff,
  Wallet
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Overview({ setActiveView }: { setActiveView?: (view: string) => void }) {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<any>(null);
  const [showAccounts, setShowAccounts] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiHost = window.location.hostname;
        const response = await fetch(`http://${apiHost}:8080/api/overview`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (e) {
        console.error("Failed to fetch overview data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (!mounted || loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent animate-spin rounded-full"></div>
    </div>
  );

  const chartData = data?.performance_history?.length > 0 
    ? data.performance_history 
    : [
        { date: 'Day 1', profit: 0 },
        { date: 'Day 5', profit: 1500 },
        { date: 'Day 10', profit: 1200 },
        { date: 'Day 15', profit: 2500 },
        { date: 'Day 20', profit: 3200 },
        { date: 'Day 25', profit: 4500 },
        { date: 'Day 30', profit: 5800 },
      ];

  return (
    <div className="w-full space-y-3 animate-in fade-in duration-500 bg-transparent">
      
      {/* 1. Main Growth Chart (Full-width, flat line design, no card background) */}
      <div className="w-full border-b border-white/10 py-3 bg-transparent">
        <div className="flex justify-between items-center px-4 py-2 border-b border-white/5">
          <div>
            <h2 className="text-[10px] font-black tracking-widest text-white uppercase flex items-center gap-2">
              <TrendingUp size={12} className="text-blue-500" /> Pertumbuhan Performa
            </h2>
            <p className="text-[8px] text-slate-500 uppercase font-bold">Pelacakan modal secara real-time</p>
          </div>
          <div className="flex gap-2">
            <span className="px-2 py-0.5 bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest rounded-[3px]">LIVE</span>
            <span className="px-2 py-0.5 border border-white/10 text-slate-400 text-[8px] font-black uppercase tracking-widest rounded-[3px]">30D</span>
          </div>
        </div>
        
        {/* Compact height: 200px on mobile, 320px on desktop */}
        <div className="h-[200px] sm:h-[320px] w-full pt-4 px-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                dy={10}
              />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }}
                itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                cursor={{ stroke: '#3b82f6', strokeWidth: 1 }}
              />
              <Area 
                type="monotone" 
                dataKey="profit" 
                stroke="#3b82f6" 
                fill="url(#colorProfit)" 
                strokeWidth={2} 
                animationDuration={1000}
              />
              <defs>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Neumorphic Control Buttons Bar (Directly below chart) */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-2 w-full justify-start">
        <button 
          onClick={() => setShowAccounts(!showAccounts)}
          className="neumorphic-btn px-4 py-2 text-[8px] font-black uppercase tracking-widest text-[#f5f5f7] flex items-center gap-2"
        >
          {showAccounts ? <EyeOff size={12} strokeWidth={2.5} /> : <Eye size={12} strokeWidth={2.5} />}
          <span>{showAccounts ? 'Sembunyikan Akun' : 'Lihat Detail Akun'}</span>
        </button>
        <button 
          onClick={() => setActiveView && setActiveView('strategi-pengaturan')}
          className="neumorphic-btn px-4 py-2 text-[8px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 flex items-center gap-2"
        >
          <Activity size={12} strokeWidth={2.5} />
          <span>Atur Strategi Bot</span>
        </button>
      </div>

      {/* 3. Stats Grid (Full-width, clean border columns, bg-transparent) */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 border-t border-b border-white/10 divide-y md:divide-y-0 md:divide-x divide-white/10 bg-transparent">
        
        {/* Stat 1: Capital In Use */}
        <div className="py-4 px-4 flex flex-col justify-between bg-transparent min-h-[100px]">
          <div>
            <p className="text-slate-500 text-[8px] font-black uppercase tracking-widest mb-1">Modal Utama (Capital In Use)</p>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-white tracking-tight">
                {`Rp ${data?.total_capital?.toLocaleString('id-ID') || '0'}`}
              </span>
              <span className="text-[8px] font-black text-slate-400">
                {`+${data?.connected_accounts?.length || 0} Akun`}
              </span>
            </div>
          </div>
          
          <div className="mt-2 h-[1px] w-full bg-white/5">
            <div className="h-full bg-blue-500 w-2/3 opacity-30" />
          </div>
        </div>

        {/* Stat 2: Bot Strategy */}
        <div className="py-4 px-4 flex flex-col justify-between bg-transparent min-h-[100px]">
          <div>
            <p className="text-slate-500 text-[8px] font-black uppercase tracking-widest mb-1">Bot Strategi</p>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-white tracking-tight">
                {`${(data?.active_bots || 0) + (data?.inactive_bots || 0)} Total`}
              </span>
              <span className="text-[8px] font-black text-slate-400">
                {`${data?.active_bots || 0} Aktif | ${data?.inactive_bots || 0} Off`}
              </span>
            </div>
          </div>
          
          <div className="mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Sistem Trading Aktif</span>
          </div>
        </div>

      </div>

      {/* Connected Accounts Dropdown/List (Full-width, compact, border only) */}
      {showAccounts && (
        <div className="w-full border-b border-white/10 py-3 px-4 space-y-2 bg-transparent animate-in slide-in-from-top-2">
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Daftar Akun Terhubung</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data?.connected_accounts?.map((acc: any, i: number) => (
              <div key={i} className="flex justify-between items-center py-2 px-3 border border-white/5 bg-transparent rounded-[6px]">
                <div className="flex items-center gap-2">
                  <Wallet size={12} className="text-blue-400" />
                  <div>
                    <p className="text-[9px] font-bold text-white uppercase">{acc.label}</p>
                    <p className="text-[8px] text-slate-500 uppercase font-medium">{acc.platform}</p>
                  </div>
                </div>
                <p className="text-[9px] font-bold text-blue-400">Rp {acc.balance.toLocaleString('id-ID')}</p>
              </div>
            ))}
          </div>
          {data?.connected_accounts?.length === 0 && (
            <p className="text-[8px] text-slate-600 uppercase font-bold italic">Belum ada API Key terhubung</p>
          )}
        </div>
      )}
    </div>
  );
}
