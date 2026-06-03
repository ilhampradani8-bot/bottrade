"use client";

import React from 'react';
import { Search, Bell, User, Command } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="h-20 px-10 flex items-center justify-between sticky top-0 z-30 bg-black/40 backdrop-blur-xl border-b border-white/5">
      <div className="flex items-center gap-4 w-96 group">
        <div className="relative w-full">
            <input 
                type="text" 
                placeholder="Quick search" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-12 pr-12 text-sm font-medium text-white placeholder:text-[#86868b] outline-none focus:bg-white/10 focus:border-white/20 transition-all"
            />
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868b] group-focus-within:text-white transition-colors" />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-md text-[10px] font-bold text-[#86868b]">
                <Command size={10} /> K
            </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
            <button className="p-2.5 text-[#86868b] hover:text-white transition-colors relative">
                <Bell size={20} />
                <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-black"></div>
            </button>
        </div>
        
        <div className="h-8 w-px bg-white/10 mx-2"></div>
        
        <div className="flex items-center gap-4 cursor-pointer group">
            <div className="text-right">
                <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">Dani Dev</p>
                <p className="text-[10px] font-bold text-[#86868b] uppercase tracking-tighter">Root Admin</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <User size={20} />
            </div>
        </div>
      </div>
    </nav>
  );
}
