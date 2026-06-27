"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import ProfileDropdown from './komponent_navbar/profile_dropdown';
import LangDropdown from './komponent_navbar/lang_dropdown';
import GetStartedDropdown from './komponent_navbar/get_started_dropdown';
import NotifDropdown from './komponent_navbar/notif_dropdown';

const getFlagSvg = (code: string) => {
  switch (code) {
    case 'id':
      return (
        <svg className="w-4 h-3 rounded-sm" viewBox="0 0 3 2">
          <rect width={3} height={1} fill="#E21C21" />
          <rect width={3} height={1} y={1} fill="#FFFFFF" />
        </svg>
      );
    case 'en':
      return (
        <svg className="w-4 h-3 rounded-sm" viewBox="0 0 60 30">
          <clipPath id="s">
            <path d="M0,0 v30 h60 v-30 z" />
          </clipPath>
          <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
          <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
          <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" />
          <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
          <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
        </svg>
      );
    case 'ms':
      return (
        <svg className="w-4 h-3 rounded-sm" viewBox="0 0 28 14">
          <rect width={28} height={14} fill="#ffde00" />
          <rect width={28} height={7} fill="#ff0000" />
          <rect width={28} height={3.5} fill="#ffffff" />
          <rect width={28} height={1.75} fill="#0000ff" />
          <rect width={28} height={14} fill="none" stroke="#ffffff" strokeWidth="0.5" />
        </svg>
      );
    case 'fr':
      return (
        <svg className="w-4 h-3 rounded-sm" viewBox="0 0 3 2">
          <rect width={1} height={2} fill="#002395" />
          <rect width={1} height={2} x={1} fill="#FFFFFF" />
          <rect width={1} height={2} x={2} fill="#ED2939" />
        </svg>
      );
    case 'zh':
      return (
        <svg className="w-4 h-3 rounded-sm" viewBox="0 0 30 20" fill="#de2910">
          <rect width={30} height={20} />
          <circle cx={5} cy={5} r={3} fill="#ffde00" />
          <polygon points="5,2.5 5.6,4.1 7.2,4.1 5.9,5.1 6.4,6.7 5,5.7 3.6,6.7 4.1,5.1 2.8,4.1 4.4,4.1" fill="#ffde00" />
        </svg>
      );
    default:
      return null;
  }
};

export default function Navbar({ toggleSidebar, isSidebarOpen, setActiveView, activeView }: any) {
  const router = useRouter();
  const { lang, changeLanguage, t } = useLanguage();
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: 'login' });
  const [user, setUser] = useState<any>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showGetStartedDropdown, setShowGetStartedDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [chatSessionName, setChatSessionName] = useState('Pusat Bantuan Utama');

  useEffect(() => {
    const handleSessionChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setChatSessionName(customEvent.detail);
      }
    };
    window.addEventListener('chat:session-change', handleSessionChange);
    return () => {
      window.removeEventListener('chat:session-change', handleSessionChange);
    };
  }, []);

  const [theme, setTheme] = useState<string>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }

    // Auto open auth page if redirected from landing page
    const trigger = localStorage.getItem('open_auth_modal');
    if (trigger === 'login' || trigger === 'register') {
      localStorage.removeItem('open_auth_modal');
      router.push('/login');
    }
  }, []);

  const handleAuthModalCompat = (modal: { isOpen: boolean, mode: string }) => {
    if (modal.isOpen) {
      router.push('/login');
    }
  };

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
      case 'overview': return `${t('overview.performance_growth')} - ${t('overview.realtime_tracking')}`;
      case 'api-key': return 'API Settings';
      case 'tester': return 'Simulation Lab';
      case 'cari-bot': return 'Cari Asisten';
      case 'strategi-pengaturan': return 'Bot Configurations';
      case 'jurnal': return 'Audit & Analitik Trading Sheet';
      case 'bots': return 'Daftar Bots';
      case 'pengaturan-akun': return 'Pengaturan Akun';
      case 'forum': return 'Forum Komunitas';
      case 'afiliasi': return 'Program Afiliasi';
      case 'berlangganan': return 'Paket Berlangganan';
      case 'status-akun': return 'Status Layanan';
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
              <span className="text-[10px] font-black text-[#86868b] tracking-[0.1em] uppercase inline-flex items-center sm:before:content-['/'] sm:before:mx-2 sm:before:opacity-30 sm:before:text-white">
                {getViewTitle(activeView)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Rearranged Right side panel: Notification -> Language -> Profile (far right) */}
      <div className="flex items-center gap-4">
        
        {/* 1. Notification Bell - Next to Language switcher on desktop */}
        <div className="relative hidden lg:block">
          <button 
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-2 text-[#86868b] hover:text-white transition-colors relative"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full border border-black"></span>
          </button>

          {showNotifDropdown && (
            <NotifDropdown 
              theme={theme}
              setActiveView={setActiveView}
              setShowNotifDropdown={setShowNotifDropdown}
            />
          )}
        </div>

        {/* 2. Language Switcher Dropdown - Minimalist Apple Style */}
        <div className="relative hidden lg:block">
          <button 
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="flex items-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 text-[#86868b] hover:text-white rounded-[6px] transition-all border border-white/5 text-[10px] font-bold uppercase tracking-wider"
          >
            {getFlagSvg(lang)}
            <span className="ml-0.5">{lang === 'id' ? 'ID' : lang === 'en' ? 'EN' : lang === 'fr' ? 'FR' : 'ZH'}</span>
            <ChevronDown size={10} className={`transition-transform duration-200 ${showLangDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showLangDropdown && (
            <LangDropdown 
              lang={lang}
              changeLanguage={changeLanguage}
              setShowLangDropdown={setShowLangDropdown}
              theme={theme}
            />
          )}
        </div>

        {/* 3. Login Ball / Profile Button - Paling Pojok Kanan */}
        {user ? (
          <div className="flex items-center gap-3 relative">
            <div className="text-right hidden sm:block select-none">
                <p className="text-[10px] font-bold text-white leading-tight">{user.username}</p>
                <p className="text-[8px] text-indigo-400 font-black uppercase tracking-widest">{user.status || 'Aktif'}</p>
            </div>
            {/* Custom vector user avatar icon or X */}
            <button 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition-all overflow-hidden border border-white/20 cursor-pointer"
            >
              {showProfileDropdown ? (
                <X size={14} className="text-white animate-in spin-in-90 duration-200" />
              ) : (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </button>

            {/* Profile Dropdown - Apple Style */}
            {showProfileDropdown && (
              <ProfileDropdown 
                user={user}
                theme={theme}
                toggleTheme={toggleTheme}
                handleLogout={handleLogout}
                setActiveView={setActiveView}
                setShowProfileDropdown={setShowProfileDropdown}
              />
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
              <GetStartedDropdown 
                theme={theme}
                toggleTheme={toggleTheme}
                setAuthModal={handleAuthModalCompat}
                setShowGetStartedDropdown={setShowGetStartedDropdown}
              />
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
