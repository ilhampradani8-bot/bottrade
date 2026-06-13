"use client";

import React from 'react';

interface LangDropdownProps {
  lang: string;
  changeLanguage: (lang: string) => void;
  setShowLangDropdown: (show: boolean) => void;
  theme: string;
}

const getFlagSvg = (code: string) => {
  switch (code) {
    case 'id':
      return (
        <svg className="w-4 h-3 rounded-sm shadow-sm border border-white/10 inline-block" viewBox="0 0 3 2" style={{ minWidth: '16px' }}>
          <rect width="3" height="1" fill="#FF0000" />
          <rect y={1} width="3" height="1" fill="#FFFFFF" />
        </svg>
      );
    case 'en':
      return (
        <svg className="w-4 h-3 rounded-sm shadow-sm border border-white/10 inline-block" viewBox="0 0 50 30" style={{ minWidth: '16px' }}>
          <clipPath id="uk-flag-dropdown">
            <path d="M0 0v30h50V0z" />
          </clipPath>
          <path d="M0 0v30h50V0z" fill="#012169" />
          <path d="M0 0l50 30M50 0L0 30" stroke="#fff" strokeWidth={6} clipPath="url(#uk-flag-dropdown)" />
          <path d="M0 0l50 30M50 0L0 30" stroke="#c8102e" strokeWidth={4} clipPath="url(#uk-flag-dropdown)" />
          <path d="M25 0v30M0 15h50" stroke="#fff" strokeWidth={10} />
          <path d="M25 0v30M0 15h50" stroke="#c8102e" strokeWidth={6} />
        </svg>
      );
    case 'fr':
      return (
        <svg className="w-4 h-3 rounded-sm shadow-sm border border-white/10 inline-block" viewBox="0 0 3 2" style={{ minWidth: '16px' }}>
          <rect width="1" height="2" fill="#00209F" />
          <rect x="1" width="1" height="2" fill="#FFFFFF" />
          <rect x="2" width="1" height="2" fill="#F42C3E" />
        </svg>
      );
    case 'zh':
      return (
        <svg className="w-4 h-3 rounded-sm shadow-sm border border-white/10 inline-block" viewBox="0 0 30 20" fill="#ee1c25" style={{ minWidth: '16px' }}>
          <rect width={30} height={20} />
          <circle cx={5} cy={5} r={3} fill="#ffde00" />
          <polygon points="5,2.5 5.6,4.1 7.2,4.1 5.9,5.1 6.4,6.7 5,5.7 3.6,6.7 4.1,5.1 2.8,4.1 4.4,4.1" fill="#ffde00" />
        </svg>
      );
    default:
      return null;
  }
};

export default function LangDropdown({ lang, changeLanguage, setShowLangDropdown, theme }: LangDropdownProps) {
  return (
    <div className={`absolute right-0 top-[44px] w-32 backdrop-blur-md rounded-[6px] p-1 shadow-2xl border z-[110] animate-in fade-in zoom-in-95 duration-150 ${
      theme === 'light' 
        ? 'bg-white/95 border-black/10 text-slate-900 shadow-slate-200/50' 
        : 'bg-[#1c1c1e]/90 border-white/10 text-white shadow-black/50'
    }`}>
      {['id', 'en', 'fr', 'zh'].map((l) => (
        <button 
          key={l}
          onClick={() => {
            changeLanguage(l);
            setShowLangDropdown(false);
          }}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[4px] text-[9px] font-bold uppercase tracking-wider transition-all ${
            lang === l 
              ? (theme === 'light' ? 'bg-black/5 text-black' : 'bg-white/10 text-white') 
              : (theme === 'light' ? 'text-slate-600 hover:text-black hover:bg-black/5' : 'text-[#86868b] hover:text-white hover:bg-white/5')
          }`}
        >
          <div className="flex items-center gap-1.5">
            {getFlagSvg(l)}
            <span>{l === 'id' ? 'IND' : l === 'en' ? 'ENG' : l === 'fr' ? 'FRA' : 'ZHO'}</span>
          </div>
          {lang === l && <span className="text-[8px] text-indigo-500">✓</span>}
        </button>
      ))}
    </div>
  );
}
