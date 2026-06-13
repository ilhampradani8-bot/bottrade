"use client";

import React, { useEffect, useState } from 'react';
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
  Database,
  Menu,
  Bell
} from 'lucide-react';

const menuItems = [
  { key: 'dashboard', icon: LayoutDashboard, path: '/' },
  { key: 'users', icon: Users, path: '/users' },
  { key: 'bots', icon: Activity, path: '/bots' },
  { key: 'notifications', icon: Bell, path: '/notifications' },
  { key: 'apikeys', icon: ShieldCheck, path: '/apikeys' },
  { key: 'engine', icon: Cpu, path: '/engine' },
  { key: 'chat', icon: MessageSquare, path: '/reports/chat' },
  { key: 'reports', icon: FileBarChart, path: '/reports' },
];

const translations = {
  en: {
    dashboard: 'Dashboard',
    users: 'Users',
    bots: 'Bots',
    notifications: 'Notifications',
    apikeys: 'API Keys',
    engine: 'Engine',
    chat: 'Chat',
    reports: 'Reports'
  },
  id: {
    dashboard: 'Dasbor',
    users: 'Pengguna',
    bots: 'Bot',
    notifications: 'Notifikasi',
    apikeys: 'Kunci API',
    engine: 'Mesin Engine',
    chat: 'Obrolan',
    reports: 'Laporan'
  }
};

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [lang, setLang] = useState<'id' | 'en'>('en');

  useEffect(() => {
    // Read collapsed preference
    const savedCollapsed = localStorage.getItem('sidebar_collapsed');
    if (savedCollapsed === 'true') {
      setCollapsed(true);
    }

    // Read language preference
    const savedLang = localStorage.getItem('admin_lang') as 'id' | 'en';
    if (savedLang) {
      setLang(savedLang);
    }

    // Listen to language change events from Navbar
    const handleLangChange = () => {
      const currentLang = localStorage.getItem('admin_lang') as 'id' | 'en';
      if (currentLang) setLang(currentLang);
    };

    window.addEventListener('admin_lang_changed', handleLangChange);
    return () => window.removeEventListener('admin_lang_changed', handleLangChange);
  }, []);

  const t = translations[lang];

  return (
    <aside className={`${collapsed ? 'w-20 p-4' : 'w-72 p-6'} flex flex-col h-screen bg-transparent border-r border-white/5 transition-all duration-300 ease-in-out overflow-hidden`}>
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className={`flex items-center ${collapsed ? 'flex-col gap-4' : 'justify-between'} mb-10 px-2`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center shadow-2xl shadow-white/20 shrink-0">
            <ShieldCheck size={22} strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <span className="text-xl font-bold tracking-tight text-white animate-in fade-in duration-300">TradingSafe</span>
          )}
        </div>
        <button 
          onClick={() => {
            const newVal = !collapsed;
            setCollapsed(newVal);
            localStorage.setItem('sidebar_collapsed', String(newVal));
          }}
          className="p-1.5 rounded-lg hover:bg-white/5 text-[#86868b] hover:text-white transition-all cursor-pointer"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          const label = t[item.key as keyof typeof t];
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center transition-all duration-300 group ${
                collapsed 
                  ? 'w-12 h-12 justify-center rounded-xl mx-auto' 
                  : 'w-full justify-between px-4 py-3.5 rounded-2xl'
              } ${
                isActive 
                  ? 'bg-white/10 text-white shadow-sm' 
                  : 'text-[#86868b] hover:text-white hover:bg-white/5'
              }`}
              title={collapsed ? label : undefined}
            >
              <div className="flex items-center gap-4">
                <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'text-sky-400' : 'group-hover:text-white'}`}>
                    <item.icon size={18} />
                </div>
                {!collapsed && (
                  <span className="text-sm font-semibold tracking-tight animate-in fade-in duration-300">
                    {label}
                  </span>
                )}
              </div>
              {!collapsed && isActive && <ChevronRight size={14} className="text-white/40" />}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
