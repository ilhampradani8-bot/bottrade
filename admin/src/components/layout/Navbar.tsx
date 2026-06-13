"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, User, Command, LogOut, ChevronDown, Shield, Mail, Globe, RefreshCcw } from 'lucide-react';
import { AdminProfile } from '@/types/AdminProfile';

const translations = {
  en: {
    search: "Quick search",
    authSession: "Authenticated Session",
    roleAuthority: "Role Authority",
    logout: "Log Out Sesi",
    notLoggedIn: "Not Logged In",
    guestAccess: "Guest Access"
  },
  id: {
    search: "Pencarian cepat",
    authSession: "Sesi Terautentikasi",
    roleAuthority: "Otoritas Peran",
    logout: "Keluar Sesi",
    notLoggedIn: "Belum Masuk",
    guestAccess: "Akses Tamu"
  }
};

export default function Navbar() {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [lang, setLang] = useState<'id' | 'en'>('en');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Read saved language preference
    const savedLang = localStorage.getItem('admin_lang') as 'id' | 'en';
    if (savedLang) setLang(savedLang);

    const handleLoadingStart = () => setIsRefreshing(true);
    const handleLoadingEnd = () => setIsRefreshing(false);
    window.addEventListener('admin_loading_start', handleLoadingStart);
    window.addEventListener('admin_loading_end', handleLoadingEnd);

    const fetchProfile = async () => {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const apiHost = window.location.hostname;
        const res = await fetch(`http://${apiHost}:8080/api/admin/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const profile = await res.json();
          setAdmin(profile);
        } else {
          // Token expired or invalid
          localStorage.removeItem('admin_token');
        }
      } catch (err) {
        console.error("Failed to fetch admin profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      window.removeEventListener('admin_loading_start', handleLoadingStart);
      window.removeEventListener('admin_loading_end', handleLoadingEnd);
    };
  }, []);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.profile-dropdown-container')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [dropdownOpen]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setAdmin(null);
    setDropdownOpen(false);
    router.push('/login');
  };

  const toggleLanguage = () => {
    const newLang = lang === 'en' ? 'id' : 'en';
    setLang(newLang);
    localStorage.setItem('admin_lang', newLang);
    // Dispatch event to notify other components (e.g. Sidebar)
    window.dispatchEvent(new Event('admin_lang_changed'));
  };

  const triggerRefresh = () => {
    window.dispatchEvent(new Event('admin_refresh'));
  };

  const getTabsForPath = (path: string) => {
    switch (path) {
      case '/':
        return [
          { key: 'datalab', label: 'Data Lab', active: true }
        ];
      case '/users':
        return [
          { key: 'users', label: lang === 'en' ? 'Users Directory' : 'Direktori Pengguna', active: true }
        ];
      case '/bots':
        return [
          { key: 'bots', label: 'Bots Management', active: true }
        ];
      case '/apikeys':
        return [
          { key: 'apikeys', label: 'API Keys', active: true }
        ];
      case '/engine':
        return [
          { key: 'engine', label: lang === 'en' ? 'Engine Control' : 'Kontrol Mesin', active: true }
        ];
      case '/notifications':
        return [
          { key: 'notifications', label: lang === 'en' ? 'Alerts & Broadcast Center' : 'Pusat Alert & Broadcast', active: true }
        ];
      default:
        return [
          { key: 'system', label: 'TradingSafe Admin', active: true }
        ];
    }
  };

  const t = translations[lang];

  return (
    <nav className="h-20 px-10 flex items-center justify-between sticky top-0 z-30 bg-black/40 backdrop-blur-xl border-b border-white/5">
      {/* Page Title Text (Replaces button tabs) */}
      <div className="flex items-center">
        <h1 className="text-sm font-extrabold tracking-widest uppercase text-white">
          {getTabsForPath(pathname)[0]?.label}
        </h1>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
            {/* Language Toggle Button */}
            <button 
              onClick={toggleLanguage}
              className="p-2.5 text-[#86868b] hover:text-sky-400 hover:bg-white/5 rounded-xl transition-all flex items-center gap-1.5 font-bold text-xs cursor-pointer border border-transparent hover:border-white/5"
              title={lang === 'en' ? 'Switch to Indonesian' : 'Ubah ke Bahasa Inggris'}
            >
              <Globe size={16} />
              <span>{lang.toUpperCase()}</span>
            </button>

            {/* Refresh Button */}
            <button 
              onClick={triggerRefresh}
              className="p-2.5 text-[#86868b] hover:text-[#00f2ff] hover:bg-white/5 rounded-xl transition-all flex items-center justify-center cursor-pointer border border-transparent hover:border-white/5"
              title="Refresh Data"
            >
              <RefreshCcw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            </button>

            <button className="p-2.5 text-[#86868b] hover:text-white transition-colors relative cursor-pointer">
                <Bell size={20} />
                <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-sky-400 rounded-full border-2 border-black"></div>
            </button>
        </div>
        
        <div className="h-8 w-px bg-white/10 mx-2"></div>
        
        {loading ? (
          <div className="flex items-center gap-3 animate-pulse">
            <div className="text-right">
              <div className="h-3 w-16 bg-white/10 rounded mb-1.5"></div>
              <div className="h-2 w-12 bg-white/5 rounded"></div>
            </div>
            <div className="w-10 h-10 bg-white/5 rounded-full"></div>
          </div>
        ) : admin ? (
          <div className="relative profile-dropdown-container">
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 p-1.5 px-3 rounded-2xl hover:bg-white/5 active:bg-white/10 transition-all border border-transparent hover:border-white/5 cursor-pointer"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white transition-colors">{admin.username}</p>
                <p className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">{admin.role || 'Admin'}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-sky-500/20 ring-2 ring-sky-400/20">
                <User size={20} />
              </div>
              <ChevronDown size={14} className={`text-[#86868b] transition-transform duration-300 ${dropdownOpen ? 'rotate-180 text-sky-400' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-64 bg-[#090d16]/95 backdrop-blur-xl border border-sky-500/20 rounded-2xl shadow-2xl shadow-sky-950/50 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                {/* Admin Info Header */}
                <div className="space-y-1 pb-3 border-b border-white/5">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-[#6a6a75]">{t.authSession}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Shield size={14} className="text-sky-400" />
                    <span className="text-sm font-bold text-white">{admin.username}</span>
                  </div>
                  {admin.email && (
                    <div className="flex items-center gap-2 text-xs text-[#86868b] mt-1">
                      <Mail size={12} className="text-[#86868b]" />
                      <span className="truncate">{admin.email}</span>
                    </div>
                  )}
                </div>

                {/* Dropdown Actions */}
                <div className="space-y-1.5">
                  <div className="px-2 py-1.5 rounded-xl bg-sky-500/5 border border-sky-500/10 flex flex-col gap-0.5">
                    <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider text-left">{t.roleAuthority}</span>
                    <span className="text-xs text-white font-semibold text-left">{admin.role ? admin.role.toUpperCase() : 'SYSTEM ADMINISTRATOR'}</span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-semibold text-xs border border-transparent hover:border-red-500/20 cursor-pointer"
                  >
                    <LogOut size={16} />
                    {t.logout}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/login')}
              className="flex items-center gap-3 p-1.5 px-3 rounded-2xl hover:bg-white/5 active:bg-white/10 transition-all border border-transparent hover:border-white/5 cursor-pointer text-left"
            >
              <div className="text-right">
                  <p className="text-xs font-bold text-[#86868b]">{t.notLoggedIn}</p>
                  <p className="text-[10px] font-bold text-sky-400/70 uppercase tracking-wider">{t.guestAccess}</p>
              </div>
              <div className="w-10 h-10 bg-white/5 border border-white/10 hover:border-sky-500/20 rounded-full flex items-center justify-center text-white transition-all">
                <User size={20} className="text-[#86868b]" />
              </div>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
