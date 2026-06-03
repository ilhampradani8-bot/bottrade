"use client";

import { History } from 'lucide-react';
import { useLanguage } from '@/lang/LanguageContext';

export default function JurnalRiwayatItem({ activeView, setActiveView }: any) {
  const { t } = useLanguage();
  return (
    <button
      onClick={() => setActiveView('jurnal')}
      className={`w-full sidebar-item ${activeView === 'jurnal' ? 'active' : ''}`}
    >
      <History size={18} />
      <span className="truncate">Trade Log</span>
    </button>
  );
}
