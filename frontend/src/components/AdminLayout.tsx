"use client";

import React, { useState, useEffect } from 'react';
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import Overview from "@/components/features/Overview";
import ApiSettings from "@/components/features/ApiSettings";
import LabSimulasi from "@/components/features/LabSimulasi";
import CariBot from "@/components/features/CariBot";
import DataAcquisition from "@/components/features/DataAcquisition";
import StrategySettings from "@/components/features/StrategySettings";
import JurnalRiwayat from "@/components/features/JurnalRiwayat";
import ChatSupport from "@/components/features/ChatSupport";
import LandingPage from "@/components/features/LandingPage";
import { LayoutDashboard, Search, Key, Menu, MessageSquare, Settings } from 'lucide-react';
import { useLanguage } from '@/lang/LanguageContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useLanguage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState('landing');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Apply theme from localStorage on initial render
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, []);

  // Close sidebar on mobile when view changes or on initial mount if mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!mounted) return null;

  // Bypasses AdminLayout entirely if viewing the public neoclassic Landing page
  if (activeView === 'landing') {
    return <LandingPage setActiveView={setActiveView} />;
  }

  const renderContent = () => {
    switch (activeView) {
      case 'overview': return <Overview setActiveView={setActiveView} />;
      case 'api-key': return <ApiSettings />;
      case 'tester': return <LabSimulasi />;
      case 'cari-bot': return <CariBot setActiveView={setActiveView} />;
      case 'get-data': return <DataAcquisition />;
      case 'strategi-pengaturan': return <StrategySettings />;
      case 'jurnal': return <JurnalRiwayat />;
      case 'chat': return <ChatSupport />;
      default: return <Overview setActiveView={setActiveView} />;
    }
  };

  return (
    <div className="bg-black min-h-screen text-[#f5f5f7] flex flex-col relative w-full overflow-x-hidden font-sans">
      <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} setActiveView={setActiveView} />
      
      <div className="flex flex-1 min-w-0 relative w-full overflow-x-hidden">
        {/* Mobile Backdrop */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-30 lg:hidden animate-in fade-in duration-500"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <Sidebar 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen} 
          activeView={activeView}
          setActiveView={setActiveView}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24 lg:pb-8 transition-all duration-500 p-0 flex flex-col justify-between min-h-[calc(100vh-56px)]">
          <div className="max-w-none w-full animate-in fade-in slide-in-from-bottom-2 duration-500 flex-1">
            {renderContent()}
          </div>
          <Footer setActiveView={setActiveView} />
        </main>
      </div>

      {/* Mobile Bottom Navigation - Ultra Compact Apple Style */}
      <div className="lg:hidden fixed bottom-5 left-4 right-4 h-14 apple-glass rounded-[28px] flex items-center justify-around px-4 z-40 shadow-2xl shadow-black/40">
        <button 
          onClick={() => setActiveView('overview')}
          className={`flex flex-col items-center gap-0.5 transition-all duration-300 ${activeView === 'overview' ? 'text-[#0071e3] scale-105' : 'text-[#86868b]'}`}
        >
          <LayoutDashboard size={18} strokeWidth={2.5} />
          <span className="text-[8px] font-bold tracking-tight">Dashboard</span>
        </button>
        <button 
          onClick={() => setActiveView('strategi-pengaturan')}
          className={`flex flex-col items-center gap-0.5 transition-all duration-300 ${activeView === 'strategi-pengaturan' ? 'text-[#0071e3] scale-105' : 'text-[#86868b]'}`}
        >
          <Settings size={18} strokeWidth={2.5} />
          <span className="text-[8px] font-bold tracking-tight">Bot</span>
        </button>
        <button 
          onClick={() => setActiveView('chat')}
          className={`flex flex-col items-center gap-0.5 transition-all duration-300 ${activeView === 'chat' ? 'text-[#0071e3] scale-105' : 'text-[#86868b]'}`}
        >
          <MessageSquare size={18} strokeWidth={2.5} />
          <span className="text-[8px] font-bold tracking-tight">Concierge</span>
        </button>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="flex flex-col items-center gap-0.5 transition-all duration-300 text-[#86868b]"
        >
          <Menu size={18} strokeWidth={2.5} />
          <span className="text-[8px] font-bold tracking-tight">Hub</span>
        </button>
      </div>
    </div>
  );
}
