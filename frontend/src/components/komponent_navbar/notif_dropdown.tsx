"use client";

import React from 'react';
import { Bell, ShieldCheck, Zap, TrendingUp, ChevronRight } from 'lucide-react';

interface NotifDropdownProps {
  theme: string;
  setActiveView: (view: string) => void;
  setShowNotifDropdown: (show: boolean) => void;
}

export default function NotifDropdown({ theme, setActiveView, setShowNotifDropdown }: NotifDropdownProps) {
  const notifications = [
    {
      id: 1,
      title: "Eksekusi DCA Buy XRP",
      desc: "Membeli XRP pada harga $0.4850 (Serok Bawah 1)",
      time: "5 menit yang lalu",
      icon: <Zap size={14} className="text-amber-400" />
    },
    {
      id: 2,
      title: "Sinyal Baru Terdeteksi",
      desc: "Koin PEPE V2 menunjukkan pola bullish breakout",
      time: "2 jam yang lalu",
      icon: <TrendingUp size={14} className="text-emerald-400" />
    },
    {
      id: 3,
      title: "Koneksi API Sukses",
      desc: "API Key Binance tersambung & sinkronisasi aktif",
      time: "1 hari yang lalu",
      icon: <ShieldCheck size={14} className="text-indigo-400" />
    }
  ];

  return (
    <div className={`absolute right-0 top-[44px] w-72 backdrop-blur-md rounded-[6px] p-1 shadow-2xl border animate-in fade-in zoom-in-95 duration-200 z-[110] ${
      theme === 'light' 
        ? 'bg-white/95 border-black/10 text-slate-900 shadow-slate-200/50' 
        : 'bg-black/95 border-white/10 text-white shadow-black/50'
    }`}>
      <div className={`p-3 border-b flex items-center justify-between ${theme === 'light' ? 'border-black/5' : 'border-white/5'}`}>
        <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
          <Bell size={12} className="text-indigo-500" />
          <span>Notifikasi Terkini</span>
        </h4>
        <span className="text-[8px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-black">3 BARU</span>
      </div>

      <div className="p-1 space-y-1">
        {notifications.map((notif) => (
          <div 
            key={notif.id}
            className={`p-2.5 rounded-[4px] transition-all flex items-start gap-2.5 cursor-pointer ${
              theme === 'light' ? 'hover:bg-black/5' : 'hover:bg-white/5'
            }`}
          >
            <div className={`p-1.5 rounded bg-white/5 border border-white/5`}>
              {notif.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="text-[10px] font-black text-white uppercase tracking-wide leading-tight line-clamp-1">{notif.title}</h5>
              <p className="text-[9px] text-[#86868b] leading-tight mt-0.5">{notif.desc}</p>
              <span className="text-[8px] text-[#86868b] font-bold block mt-1">{notif.time}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={`border-t my-1 ${theme === 'light' ? 'border-black/5' : 'border-white/5'}`} />

      <button 
        onClick={() => {
          setActiveView('notifikasi');
          setShowNotifDropdown(false);
        }}
        className={`w-full py-2 rounded-[4px] text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
          theme === 'light' ? 'text-indigo-600 hover:bg-black/5' : 'text-indigo-400 hover:bg-white/5'
        }`}
      >
        <span>Lihat Semua</span>
        <ChevronRight size={10} />
      </button>
    </div>
  );
}
