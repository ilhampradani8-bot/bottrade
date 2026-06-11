import React, { useState } from 'react';
import { languages, translations } from '../lang';

export default function Header({ lang = 'en', onChangeLang }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const t = translations[lang] || translations.en;

  const handleLangSelect = (code) => {
    if (onChangeLang) {
      onChangeLang(code);
    }
    setDropdownOpen(false);
  };

  const activeLangObj = languages.find(l => l.code === lang) || languages[0];

  return (
    <>
      {/* 1. Full-Width Inset Neumorphic Navbar Header */}
      <nav className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 md:px-12 lg:px-20 py-3 bg-[#e6effb]/95 border-b border-slate-300/40 backdrop-blur-md shadow-sm">
        
        {/* Logo Left */}
        <div 
          className="flex items-center gap-2 px-4 py-1.5 rounded-full nm-button cursor-pointer" 
          onClick={() => window.location.href = '/home'}
        >
          <div className="w-5 h-5 bg-[#F1BF0A] text-black rounded-[5px] flex items-center justify-center shadow-md">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="text-black">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
              <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
          </div>
          <span className="font-anton select-none text-[11px] tracking-[0.15em] text-slate-800 uppercase">TRADINGSAFE</span>
        </div>

        {/* Buttons & Links Group Right */}
        <div className="flex items-center gap-3">
          
          {/* Navigation Links */}
          <ul className="hidden md:flex items-center gap-1.5">
            <li><a href="#home" className="px-3 py-1.5 rounded-full text-slate-600 hover:text-black font-bold text-[11px] uppercase tracking-wider transition-colors hover:bg-slate-200/40">{t.nav_home}</a></li>
            <li><a href="#bots" className="px-3 py-1.5 rounded-full text-slate-600 hover:text-black font-bold text-[11px] uppercase tracking-wider transition-colors hover:bg-slate-200/40">{t.nav_bots}</a></li>
            <li><a href="#features" className="px-3 py-1.5 rounded-full text-slate-600 hover:text-black font-bold text-[11px] uppercase tracking-wider transition-colors hover:bg-slate-200/40">{t.nav_terminal}</a></li>
            <li><a href="#security" className="px-3 py-1.5 rounded-full text-slate-600 hover:text-black font-bold text-[11px] uppercase tracking-wider transition-colors hover:bg-slate-200/40">{t.nav_security}</a></li>
          </ul>

          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="px-3 py-2 rounded-full nm-button text-[10px] font-black uppercase tracking-wider text-slate-800 border border-white/50 flex items-center gap-1.5 select-none"
            >
              <span>🌐</span>
              <span>{activeLangObj.short}</span>
              <span className="text-[8px] opacity-60">▼</span>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-2xl nm-flat p-2 border border-white/60 shadow-xl z-55 max-h-64 overflow-y-auto">
                {languages.map((item) => (
                  <button
                    key={item.code}
                    onClick={() => handleLangSelect(item.code)}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${lang === item.code ? 'nm-inset text-[#0071e3]' : 'hover:bg-slate-200/50 text-slate-700'}`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[9px] opacity-60 uppercase">{item.short}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dashboard Button */}
          <button 
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 rounded-full nm-button text-[10px] font-black uppercase tracking-wider text-slate-800 border border-white/50"
          >
            {t.nav_dashboard}
          </button>
          
        </div>
      </nav>

      {/* 2. Hero Section with ID="home" (Adjusted for top navbar) */}
      <header id="home" className="w-full text-slate-800 px-6 md:px-12 lg:px-20 pb-12 pt-28 sm:pt-36 relative z-0 overflow-hidden bg-[#e6effb]">
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full nm-inset border border-white/20 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
            <span>{t.hero_badge}</span>
          </div>
          
          <h1 className="font-anton text-4xl sm:text-5xl md:text-6xl uppercase tracking-wider text-black max-w-4xl leading-tight">
            {t.hero_title_1}<span className="text-[#0071e3]">{t.hero_title_accent_1}</span>{t.hero_title_2}<span className="text-[#0071e3]">{t.hero_title_accent_2}</span>
          </h1>
          
          <p className="text-slate-600 text-sm sm:text-base font-medium max-w-2xl leading-relaxed">
            {t.hero_subtitle}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button 
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 rounded-full nm-button bg-[#0071e3] text-white font-black text-xs uppercase tracking-widest border border-white/20 hover:text-indigo-600 hover:bg-[#e6effb]"
            >
              {t.hero_cta_trial}
            </button>
            <button 
              onClick={() => {
                const target = document.getElementById('bots');
                if (target) target.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3 rounded-full nm-button text-slate-800 font-black text-xs uppercase tracking-widest border border-white/30"
            >
              {t.hero_cta_explore}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
