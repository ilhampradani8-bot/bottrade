"use client";

import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface GetStartedDropdownProps {
  theme: string;
  toggleTheme: () => void;
  setAuthModal: (modal: { isOpen: boolean, mode: string }) => void;
  setShowGetStartedDropdown: (show: boolean) => void;
}

export default function GetStartedDropdown({ theme, toggleTheme, setAuthModal, setShowGetStartedDropdown }: GetStartedDropdownProps) {
  return (
    <div className={`absolute right-0 top-[44px] w-44 backdrop-blur-md rounded-[6px] p-1 shadow-2xl border z-[110] animate-in fade-in zoom-in-95 duration-150 ${
      theme === 'light' 
        ? 'bg-white/95 border-black/10 text-slate-900 shadow-slate-200/50' 
        : 'bg-[#1c1c1e]/90 border-white/10 text-white shadow-black/50'
    }`}>
      <button 
        onClick={() => {
          setAuthModal({ isOpen: true, mode: 'login' });
          setShowGetStartedDropdown(false);
        }}
        className={`w-full text-left px-4 py-2 rounded-[4px] text-[10px] font-bold transition-all uppercase tracking-wider cursor-pointer ${
          theme === 'light' ? 'text-slate-600 hover:text-black hover:bg-black/5' : 'text-[#86868b] hover:text-white hover:bg-white/5'
        }`}
      >
        Masuk Akun
      </button>
      <button 
        onClick={() => {
          setAuthModal({ isOpen: true, mode: 'register' });
          setShowGetStartedDropdown(false);
        }}
        className={`w-full text-left px-4 py-2 rounded-[4px] text-[10px] font-bold transition-all uppercase tracking-wider cursor-pointer ${
          theme === 'light' ? 'text-slate-600 hover:text-black hover:bg-black/5' : 'text-[#86868b] hover:text-white hover:bg-white/5'
        }`}
      >
        Daftar Akun
      </button>

      <div className={`border-t my-1 ${theme === 'light' ? 'border-black/5' : 'border-white/5'}`} />

      {/* Guest Theme Toggle Option */}
      <button 
        onClick={toggleTheme}
        className={`w-full text-left px-4 py-2 rounded-[4px] text-[10px] font-bold transition-all uppercase tracking-wider cursor-pointer flex items-center justify-between ${
          theme === 'light' ? 'text-slate-600 hover:text-black hover:bg-black/5' : 'text-[#86868b] hover:text-white hover:bg-white/5'
        }`}
      >
        <span>Mode: {theme}</span>
        {theme === 'light' ? <Sun size={12} className="text-amber-500" /> : <Moon size={12} className="text-indigo-400" />}
      </button>
    </div>
  );
}
