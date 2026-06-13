"use client";

import React from 'react';
import { Sun, Moon, LogOut, Settings, MessageSquare, Share2, CreditCard, Activity } from 'lucide-react';

interface ProfileDropdownProps {
  user: any;
  theme: string;
  toggleTheme: () => void;
  handleLogout: () => void;
  setActiveView: (view: string) => void;
  setShowProfileDropdown: (show: boolean) => void;
}

export default function ProfileDropdown({ 
  user, 
  theme, 
  toggleTheme, 
  handleLogout, 
  setActiveView, 
  setShowProfileDropdown 
}: ProfileDropdownProps) {
  return (
    <>
      {/* Backdrop for closing when click-outside - aligned below navbar */}
      <div 
        onClick={() => setShowProfileDropdown(false)}
        className="fixed inset-0 top-14 bg-black/50 backdrop-blur-sm z-[1999] animate-in fade-in duration-300"
      />

      {/* Right Sidebar Drawer - aligned below navbar */}
      <div className={`fixed right-0 top-14 bottom-0 h-[calc(100vh-56px)] w-full sm:w-80 md:w-96 z-[2000] p-4 shadow-2xl border-l flex flex-col justify-between animate-in slide-in-from-right duration-300 ${
        theme === 'light' 
          ? 'bg-white/95 border-black/10 text-slate-900 shadow-slate-200/50' 
          : 'bg-black/95 border-white/10 text-white shadow-black/50'
      }`}>
        <div className="space-y-4">
          {/* Navigation Links - langsung menu */}
          <div className="space-y-1">
            {/* Account Settings */}
            <button 
              onClick={() => {
                setActiveView('pengaturan-akun');
                setShowProfileDropdown(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px] transition-all text-[10px] font-black uppercase tracking-wider cursor-pointer ${
                theme === 'light' ? 'text-slate-700 hover:bg-black/5' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <Settings size={14} className="text-indigo-400" />
              <span>Pengaturan Akun</span>
            </button>

            {/* Forum Komunitas */}
            <button 
              onClick={() => {
                setActiveView('forum');
                setShowProfileDropdown(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[6px] transition-all text-[10px] font-black uppercase tracking-wider cursor-pointer ${
                theme === 'light' ? 'text-slate-700 hover:bg-black/5' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-3">
                <MessageSquare size={14} className="text-indigo-400" />
                <span>Forum Komunitas</span>
              </span>
              <span className={`text-[8px] font-bold lowercase tracking-normal px-1.5 py-0.5 rounded border ${
                theme === 'light' 
                  ? 'bg-black/[0.04] border-black/5 text-slate-500' 
                  : 'bg-white/5 border-white/5 text-[#86868b]'
              }`}>(akan hadir)</span>
            </button>

            {/* Program Afiliasi */}
            <button 
              onClick={() => {
                setActiveView('afiliasi');
                setShowProfileDropdown(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[6px] transition-all text-[10px] font-black uppercase tracking-wider cursor-pointer ${
                theme === 'light' ? 'text-slate-700 hover:bg-black/5' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-3">
                <Share2 size={14} className="text-indigo-400" />
                <span>Program Afiliasi</span>
              </span>
              <span className={`text-[8px] font-bold lowercase tracking-normal px-1.5 py-0.5 rounded border ${
                theme === 'light' 
                  ? 'bg-black/[0.04] border-black/5 text-slate-500' 
                  : 'bg-white/5 border-white/5 text-[#86868b]'
              }`}>(akan hadir)</span>
            </button>

            {/* Berlangganan */}
            <button 
              onClick={() => {
                setActiveView('berlangganan');
                setShowProfileDropdown(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[6px] transition-all text-[10px] font-black uppercase tracking-wider cursor-pointer ${
                theme === 'light' ? 'text-slate-700 hover:bg-black/5' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-3">
                <CreditCard size={14} className="text-indigo-400" />
                <span>Berlangganan</span>
              </span>
              <span className={`text-[8px] font-bold lowercase tracking-normal px-1.5 py-0.5 rounded border ${
                theme === 'light' 
                  ? 'bg-black/[0.04] border-black/5 text-slate-500' 
                  : 'bg-white/5 border-white/5 text-[#86868b]'
              }`}>(akan hadir)</span>
            </button>

            {/* Status Layanan */}
            <button 
              onClick={() => {
                setActiveView('status-akun');
                setShowProfileDropdown(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[6px] transition-all text-[10px] font-black uppercase tracking-wider cursor-pointer ${
                theme === 'light' ? 'text-slate-700 hover:bg-black/5' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-3">
                <Activity size={14} className="text-indigo-400" />
                <span>Status Layanan</span>
              </span>
              <span className={`text-[8px] font-bold lowercase tracking-normal px-1.5 py-0.5 rounded border ${
                theme === 'light' 
                  ? 'bg-black/[0.04] border-black/5 text-slate-500' 
                  : 'bg-white/5 border-white/5 text-[#86868b]'
              }`}>(akan hadir)</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="space-y-4">
          {/* Theme Mode Toggle Button */}
          <button 
            onClick={toggleTheme} 
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[6px] transition-all text-[10px] font-black uppercase tracking-wider cursor-pointer ${
              theme === 'light' 
                ? 'bg-black/5 text-slate-700 hover:bg-black/10' 
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <span className="flex items-center gap-3">
              {theme === 'light' ? <Sun size={14} className="text-amber-500" /> : <Moon size={14} className="text-indigo-400" />}
              <span>Mode: {theme}</span>
            </span>
            <span className="text-[8px] opacity-60">Ubah</span>
          </button>

          <div className={`border-t ${theme === 'light' ? 'border-black/5' : 'border-white/5'}`} />

          {/* Logout Button */}
          <button 
            onClick={handleLogout} 
            className={`w-full flex items-center justify-center gap-3 py-3 rounded-[6px] transition-all text-[10px] font-black uppercase tracking-wider cursor-pointer text-white bg-rose-600 hover:bg-rose-700 active:scale-95`}
          >
            <LogOut size={14} /> Logout Account
          </button>
        </div>
      </div>
    </>
  );
}
