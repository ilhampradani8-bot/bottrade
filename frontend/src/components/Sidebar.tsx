"use client";

import { useEffect } from 'react';
import { 
  Download, 
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
        : '-translate-x-full lg:translate-x-0 w-0 opacity-0 border-r-0 pointer-events-none lg:pointer-events-auto'
    } fixed lg:relative top-14 lg:top-0 left-0 h-[calc(100vh-56px)] bg-[#06070b]/95 backdrop-blur-xl lg:bg-transparent flex flex-col z-40 transition-all duration-300 ease-in-out overflow-hidden`}>
      
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
          
          <div style={{ transitionDelay: isOpen ? '320ms' : '0ms' }} className={`transition-all duration-300 transform pt-2 mt-2 border-t border-white/5 ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}`}>
            <button
              onClick={() => setActiveView('get-data')}
              className={`w-full sidebar-item rounded-[6px] ${activeView === 'get-data' ? 'active' : ''}`}
            >
              <Download size={18} />
              <span className="truncate">Sync Hub</span>
            </button>
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
            <div className="flex bg-white/5 border border-white/5 p-1 rounded-[6px] w-full">
              {['id', 'en', 'ms'].map((l) => (
                <button
                  key={l}
                  onClick={() => changeLanguage(l)}
                  className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-[4px] transition-all ${lang === l ? 'bg-indigo-600 text-white shadow-md' : 'text-[#86868b] hover:text-white'}`}
                >
                  {l === 'id' ? 'ID' : l === 'en' ? 'EN' : 'MS'}
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
