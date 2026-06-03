"use client";

import { Search } from 'lucide-react';
import { useLanguage } from '@/lang/LanguageContext';

export default function CariBotItem({ activeView, setActiveView }: any) {
  const { t } = useLanguage();
  return (
    <button
      onClick={() => setActiveView('cari-bot')}
      className={`w-full sidebar-item ${activeView === 'cari-bot' ? 'active' : ''}`}
    >
      <Search size={18} />
      <span className="truncate">Marketplace</span>
    </button>
  );
}
