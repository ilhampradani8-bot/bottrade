"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Cpu, 
  Activity, 
  FileBarChart, 
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  Database
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Users', icon: Users, path: '/users' },
  { name: 'Bots', icon: Activity, path: '/bots' },
  { name: 'Market Data', icon: Database, path: '/market' },
  { name: 'API Keys', icon: ShieldCheck, path: '/apikeys' },
  { name: 'Engine', icon: Cpu, path: '/engine' },
  { name: 'Chat', icon: MessageSquare, path: '/reports/chat' },
  { name: 'Reports', icon: FileBarChart, path: '/reports' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 flex flex-col h-screen p-6 bg-transparent border-r border-white/5">
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center shadow-2xl shadow-white/20">
          <ShieldCheck size={22} strokeWidth={2.5} />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">BotTrade</span>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-white/10 text-white shadow-sm' 
                  : 'text-[#86868b] hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg transition-colors ${isActive ? 'text-white' : 'group-hover:text-white'}`}>
                    <item.icon size={18} />
                </div>
                <span className="text-sm font-semibold tracking-tight">{item.name}</span>
              </div>
              {isActive && <ChevronRight size={14} className="text-white/40" />}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6">
        <div className="p-5 rounded-3xl bg-white/5 border border-white/5 space-y-3">
            <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">System Secure</span>
            </div>
            <p className="text-[10px] text-[#86868b] font-medium leading-relaxed">
                v2.4.0-STABLE • Verified by Antigravity Protocol
            </p>
        </div>
      </div>
    </aside>
  );
}
