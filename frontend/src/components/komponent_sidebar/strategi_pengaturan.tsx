"use client";

import { Settings } from 'lucide-react';
import { useLanguage } from '@/lang/LanguageContext';

export default function StrategiPengaturanItem({ activeView, setActiveView }: any) {
  const { t } = useLanguage();
  return (
    <button
      onClick={() => setActiveView('strategi-pengaturan')}
      className={`w-full sidebar-item ${activeView === 'strategi-pengaturan' ? 'active' : ''}`}
    >
      <Settings size={18} />
      <span className="truncate">Bot Terminal</span>
    </button>
  );
}
