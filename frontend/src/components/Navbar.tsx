"use client";

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Globe, 
  Menu, 
  TrendingUp, 
  LogOut, 
  ChevronDown,
  X,
  Sun,
  Moon
} from 'lucide-react';
import AuthModal from './AuthModal';
import { useLanguage } from '@/lang/LanguageContext';

export default function Navbar({ toggleSidebar, isSidebarOpen, setActiveView, activeView }: any) {
  const { lang, changeLanguage } = useLanguage();
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: 'login' });
  const [user, setUser] = useState<any>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showGetStartedDropdown, setShowGetStartedDropdown] = useState(false);
  const [theme, setTheme] = useState<string>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }

    // Auto open auth modal if redirected from landing page
    const trigger = localStorage.getItem('open_auth_modal');
    if (trigger === 'login' || trigger === 'register') {
      setAuthModal({ isOpen: true, mode: trigger });
      localStorage.removeItem('open_auth_modal');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const apiHost = window.location.hostname;
          const response = await fetch(`http://${apiHost}:8080/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setUser(data);
          } else {
            localStorage.removeItem('token');
          }
        } catch (e) {
          console.error("Failed to fetch user");
        }
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setShowProfileDropdown(false);
    window.location.reload();
  };

  const getViewTitle = (view: string) => {
    switch (view) {
      case 'overview': return 'Overview';
      case 'api-key': return 'API Settings';
      case 'tester': return 'Simulation Lab';
      case 'cari-bot': return 'Cari Asisten';
      case 'get-data': return 'Data Acquisition';
      case 'strategi-pengaturan': return 'Bot Configurations';
      case 'jurnal': return 'History Journal';
      case 'chat': return 'Concierge Support';
      default: return '';
    }
  };

  return (
    <nav className="h-14 px-4 sm:px-6 flex items-center justify-between fixed top-0 left-0 right-0 bg-black/40 backdrop-blur-xl border-b border-white/5 z-[999] w-full">
      <div className="flex items-center gap-4">
        {/* Interactive Hamburger button: turns into X icon when sidebar is open */}
        <button onClick={toggleSidebar} className="p-2 text-[#86868b] hover:text-white transition-all duration-300 transform active:scale-95">
          {isSidebarOpen ? <X size={18} className="animate-in spin-in duration-300" /> : <Menu size={18} className="animate-in fade-in duration-300" />}
        </button>
        
        <div 
          onClick={() => window.location.href = '/home'}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-7 h-7 bg-white text-black rounded-[6px] flex items-center justify-center shadow-lg shadow-white/5 group-hover:scale-105 transition-all">
            <TrendingUp size={16} strokeWidth={2.5} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-white tracking-[0.2em] uppercase hidden sm:block group-hover:text-[#F1BF0A] transition-all">tradingsafe</span>
            {activeView && (
              <span className="text-[10px] font-black text-[#86868b] tracking-[0.1em] uppercase hidden md:inline-flex items-center before:content-['/'] before:mx-2 before:opacity-30 before:text-white">
                {getViewTitle(activeView)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Rearranged Right side panel: Notification -> Language -> Profile (far right) */}
      <div className="flex items-center gap-4">
        
        {/* 1. Notification Bell - Next to Language switcher on desktop */}
        <button className="p-2 text-[#86868b] hover:text-white transition-colors relative hidden lg:block">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full border border-black"></span>
        </button>

        {/* 2. Language Switcher Dropdown - Minimalist Apple Style */}
        <div className="relative hidden lg:block">
          <button 
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/10 text-[#86868b] hover:text-white rounded-[6px] transition-all border border-white/5 text-[10px] font-bold uppercase tracking-wider"
          >
            <Globe size={12} />
            <span>{lang}</span>
            <ChevronDown size={10} className={`transition-transform duration-200 ${showLangDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showLangDropdown && (
            <div className="absolute right-0 mt-2 w-28 bg-[#1c1c1e]/90 backdrop-blur-md rounded-[6px] p-1 shadow-2xl border border-white/10 z-[110] animate-in fade-in zoom-in-95 duration-150">
              {['id', 'en', 'ms'].map((l) => (
                <button 
                  key={l}
                  onClick={() => {
                    changeLanguage(l);
                    setShowLangDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider transition-all ${lang === l ? 'bg-white/10 text-white' : 'text-[#86868b] hover:text-white hover:bg-white/5'}`}
                >
                  {l === 'id' ? 'ID' : l === 'en' ? 'EN' : 'MS'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3. Login Ball / Profile Button - Paling Pojok Kanan */}
        {user ? (
          <div className="flex items-center gap-3 relative">
            <div className="text-right hidden sm:block select-none">
                <p className="text-[10px] font-bold text-white leading-tight">{user.username}</p>
                <p className="text-[8px] text-[#86868b] font-bold uppercase tracking-widest">Pro Member</p>
            </div>
            {/* Custom vector user avatar icon instead of letter */}
            <button 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition-all overflow-hidden border border-white/20"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>

            {/* Profile Dropdown - Apple Style */}
            {showProfileDropdown && (
              <div className="absolute right-0 top-9 w-60 bg-black/95 backdrop-blur-md rounded-[6px] p-1 shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-200 z-[110]">
                <div className="p-4 border-b border-white/5">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1">{user.username}</h4>
                  <p className="text-[9px] text-[#86868b] font-medium">{user.email}</p>
                </div>
                <div className="p-1.5 space-y-1">
                  {/* Theme Mode Toggle Button */}
                  <button 
                    onClick={toggleTheme} 
                    className="w-full flex items-center justify-between px-3 py-2 rounded-[4px] text-slate-300 hover:bg-white/5 transition-all text-[9px] font-black uppercase tracking-wider cursor-pointer"
                  >
                    <span className="flex items-center gap-3">
                      {theme === 'light' ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-indigo-400" />}
                      <span>Mode: {theme}</span>
                    </span>
                    <span className="text-[8px] opacity-60">Ubah</span>
                  </button>

                  <div className="border-t border-white/5 my-1" />

                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-[4px] text-rose-500 hover:bg-rose-500/10 transition-all text-[9px] font-black uppercase tracking-wider cursor-pointer">
                    <LogOut size={14} /> Logout Account
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="relative">
            <button 
              onClick={() => setShowGetStartedDropdown(!showGetStartedDropdown)}
              className="flex items-center gap-1 px-4 py-1.5 bg-white text-black rounded-[6px] text-[10px] font-black uppercase tracking-wider hover:bg-[#f5f5f7] transition-all shadow-lg shadow-white/5 cursor-pointer"
            >
              <span>Get Started</span>
              <ChevronDown size={12} className={`transition-transform duration-200 ${showGetStartedDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showGetStartedDropdown && (
              <div className="absolute right-0 mt-2 w-44 bg-[#1c1c1e]/90 backdrop-blur-md rounded-[6px] p-1 shadow-2xl border border-white/10 z-[110] animate-in fade-in zoom-in-95 duration-150">
                <button 
                  onClick={() => {
                    setAuthModal({ isOpen: true, mode: 'login' });
                    setShowGetStartedDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 rounded-[4px] text-[10px] font-bold text-[#86868b] hover:text-white hover:bg-white/5 transition-all uppercase tracking-wider cursor-pointer"
                >
                  Masuk Akun
                </button>
                <button 
                  onClick={() => {
                    setAuthModal({ isOpen: true, mode: 'register' });
                    setShowGetStartedDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 rounded-[4px] text-[10px] font-bold text-[#86868b] hover:text-white hover:bg-white/5 transition-all uppercase tracking-wider cursor-pointer"
                >
                  Daftar Akun
                </button>

                <div className="border-t border-white/5 my-1" />

                {/* Guest Theme Toggle Option */}
                <button 
                  onClick={toggleTheme}
                  className="w-full text-left px-4 py-2 rounded-[4px] text-[10px] font-bold text-[#86868b] hover:text-white hover:bg-white/5 transition-all uppercase tracking-wider cursor-pointer flex items-center justify-between"
                >
                  <span>Mode: {theme}</span>
                  {theme === 'light' ? <Sun size={12} className="text-amber-400" /> : <Moon size={12} className="text-indigo-400" />}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <AuthModal 
        isOpen={authModal.isOpen} 
        initialMode={authModal.mode} 
        onClose={() => setAuthModal({ ...authModal, isOpen: false })} 
      />
    </nav>
  );
}
