"use client";

import { useEffect } from 'react';
import { 
  X,
  Bell,
  Globe
} from 'lucide-react';
import OverviewItem from './komponent_sidebar/overview';
import StrategiPengaturanItem from './komponent_sidebar/strategi_pengaturan';
import ApiSettingsItem from './komponent_sidebar/api_settings';
import LabSimulasiItem from './komponent_sidebar/lab_simulasi';
import CariBotItem from './komponent_sidebar/cari_bot';
import JurnalRiwayatItem from './komponent_sidebar/jurnal_riwayat';
import ChatSupportItem from './komponent_sidebar/chat_support';
import { useLanguage } from '@/lang/LanguageContext';

const getFlagSvg = (code: string) => {
  switch (code) {
    case 'id':
      return (
        <svg className="w-3.5 h-2.5 rounded-sm shadow-sm border border-white/10 inline-block" viewBox="0 0 3 2" style={{ minWidth: '14px' }}>
          <rect width="3" height="1" fill="#FF0000" />
          <rect y={1} width="3" height="1" fill="#FFFFFF" />
        </svg>
      );
    case 'en':
      return (
        <svg className="w-3.5 h-2.5 rounded-sm shadow-sm border border-white/10 inline-block" viewBox="0 0 50 30" style={{ minWidth: '14px' }}>
          <clipPath id="uk-flag-side">
            <path d="M0 0v30h50V0z" />
          </clipPath>
          <path d="M0 0v30h50V0z" fill="#012169" />
          <path d="M0 0l50 30M50 0L0 30" stroke="#fff" strokeWidth={6} clipPath="url(#uk-flag-side)" />
          <path d="M0 0l50 30M50 0L0 30" stroke="#c8102e" strokeWidth={4} clipPath="url(#uk-flag-side)" />
          <path d="M25 0v30M0 15h50" stroke="#fff" strokeWidth={10} />
          <path d="M25 0v30M0 15h50" stroke="#c8102e" strokeWidth={6} />
        </svg>
      );
    case 'fr':
      return (
        <svg className="w-3.5 h-2.5 rounded-sm shadow-sm border border-white/10 inline-block" viewBox="0 0 3 2" style={{ minWidth: '14px' }}>
          <rect width="1" height="2" fill="#00209F" />
          <rect x="1" width="1" height="2" fill="#FFFFFF" />
          <rect x="2" width="1" height="2" fill="#F42C3E" />
        </svg>
      );
    case 'zh':
      return (
        <svg className="w-3.5 h-2.5 rounded-sm shadow-sm border border-white/10 inline-block" viewBox="0 0 30 20" fill="#ee1c25" style={{ minWidth: '14px' }}>
          <rect width={30} height={20} />
          <circle cx={5} cy={5} r={3} fill="#ffde00" />
          <polygon points="5,2.5 5.6,4.1 7.2,4.1 5.9,5.1 6.4,6.7 5,5.7 3.6,6.7 4.1,5.1 2.8,4.1 4.4,4.1" fill="#ffde00" />
        </svg>
      );
    default:
      return null;
  }
};

export default function Sidebar({ isOpen, setIsOpen, activeView, setActiveView }: any) {
  const { lang, changeLanguage } = useLanguage();

  // Auto-hide sidebar on mobile when scrolling occurs
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrInteraction = () => {
      if (window.innerWidth < 1024) {
        setIsOpen(false);
      }
    };

    // Listen on window scroll
    window.addEventListener('scroll', handleScrollOrInteraction, { passive: true });
    
    // Listen on main content element scroll
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.addEventListener('scroll', handleScrollOrInteraction, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', handleScrollOrInteraction);
      if (mainEl) {
        mainEl.removeEventListener('scroll', handleScrollOrInteraction);
      }
    };
  }, [isOpen, setIsOpen]);

  return (
    <aside className={`${
      isOpen 
        ? 'translate-x-0 w-56 opacity-100 border-r border-white/10' 
        : '-translate-x-full lg:translate-x-0 lg:w-0 opacity-0 border-r-0 pointer-events-none'
    } fixed top-14 left-0 h-[calc(100vh-56px)] bg-[#06070b]/95 backdrop-blur-xl flex flex-col z-40 transition-all duration-300 ease-in-out overflow-hidden`}>
      
      {/* Mobile-only Close Top Button */}
      <div className="p-4 flex justify-between items-center lg:hidden border-b border-white/5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#86868b]">Menu Navigasi</span>
        <button 
          onClick={() => setIsOpen(false)} 
          className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-[6px] transition-all border border-white/10"
        >
          <X size={16} />
        </button>
      </div>

      <div className="px-4 flex-1 py-6 overflow-y-auto custom-scrollbar flex flex-col justify-between">
        
        {/* Navigation panel with staggered animation per item for smooth non-laggy entrance */}
        <nav className="space-y-2">
          
          <div style={{ transitionDelay: isOpen ? '40ms' : '0ms' }} className={`transition-all duration-300 transform ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}`}>
            <OverviewItem activeView={activeView} setActiveView={setActiveView} />
          </div>

          <div style={{ transitionDelay: isOpen ? '80ms' : '0ms' }} className={`transition-all duration-300 transform ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}`}>
            <StrategiPengaturanItem activeView={activeView} setActiveView={setActiveView} />
          </div>

          <div style={{ transitionDelay: isOpen ? '120ms' : '0ms' }} className={`transition-all duration-300 transform ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}`}>
            <ApiSettingsItem activeView={activeView} setActiveView={setActiveView} />
          </div>

          <div style={{ transitionDelay: isOpen ? '160ms' : '0ms' }} className={`transition-all duration-300 transform ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}`}>
            <LabSimulasiItem activeView={activeView} setActiveView={setActiveView} />
          </div>

          <div style={{ transitionDelay: isOpen ? '200ms' : '0ms' }} className={`transition-all duration-300 transform ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}`}>
            <CariBotItem activeView={activeView} setActiveView={setActiveView} />
          </div>

          <div style={{ transitionDelay: isOpen ? '240ms' : '0ms' }} className={`transition-all duration-300 transform ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}`}>
            <JurnalRiwayatItem activeView={activeView} setActiveView={setActiveView} />
          </div>

          <div style={{ transitionDelay: isOpen ? '280ms' : '0ms' }} className={`transition-all duration-300 transform ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}`}>
            <ChatSupportItem activeView={activeView} setActiveView={setActiveView} />
          </div>
        </nav>

        {/* Mobile Settings Widget Section (Language & Notifications) - ONLY visible on mobile */}
        <div style={{ transitionDelay: isOpen ? '360ms' : '0ms' }} className={`lg:hidden mt-8 pt-6 border-t border-white/10 space-y-4 pb-4 transition-all duration-300 transform ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}`}>
          <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider px-1">Quick Settings</p>
          
          {/* Language Switcher Widget */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-500 uppercase tracking-widest">
              <Globe size={10} />
              <span>Language / Bahasa</span>
            </div>
            <div className="flex bg-white/5 border border-white/5 p-1 rounded-[6px] w-full gap-1">
              {['id', 'en', 'fr', 'zh'].map((l) => (
                <button
                  key={l}
                  onClick={() => changeLanguage(l)}
                  className={`flex-1 py-1 rounded-[4px] transition-all flex flex-col items-center justify-center gap-1 ${lang === l ? 'bg-indigo-600 text-white shadow-md' : 'text-[#86868b] hover:text-white hover:bg-white/5'}`}
                >
                  {getFlagSvg(l)}
                  <span className="text-[8px] font-bold uppercase tracking-wider">{l === 'id' ? 'ID' : l === 'en' ? 'EN' : l === 'fr' ? 'FR' : 'ZH'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notifications Widget */}
          <div className="pt-1">
            <button className="w-full flex items-center justify-between px-3 py-2 bg-white/5 border border-white/5 rounded-[6px] text-[10px] font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-all">
              <div className="flex items-center gap-2">
                <Bell size={12} className="text-indigo-400" />
                <span>Pemberitahuan</span>
              </div>
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              </span>
            </button>
          </div>
        </div>
      </div>

    </aside>
  );
}
