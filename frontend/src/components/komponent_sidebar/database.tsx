"use client";

import { Database } from 'lucide-react';
import { useLanguage } from '@/lang/LanguageContext';

export default function DatabaseItem({ activeView, setActiveView }: any) {
  const { t } = useLanguage();
  return (
    <button
      onClick={() => setActiveView('database')}
      className={`w-full flex items-center gap-5 px-8 py-7 rounded-none transition-all duration-300 group ${activeView === 'database' ? 'bg-blue-700 text-white shadow-2xl shadow-blue-900/40 scale-[1.02]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
    >
      <div className={`p-4 rounded-none ${activeView === 'database' ? 'bg-white/20' : 'bg-white/10'}`}>
        <Database size={28} />
      </div>
      <span className="text-base font-black tracking-widest">{t('sidebar.database')}</span>
    </button>
  );
}
