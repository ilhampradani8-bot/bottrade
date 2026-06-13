"use client";

import { Beaker } from 'lucide-react';
import { useLanguage } from '@/lang/LanguageContext';

export default function LabSimulasiItem({ activeView, setActiveView }: any) {
  const { t } = useLanguage();
  return (
    <button
      onClick={() => setActiveView('tester')}
      className={`w-full sidebar-item ${activeView === 'tester' ? 'active' : ''}`}
    >
      <Beaker size={18} />
      <span className="truncate">{t('sidebar.lab_simulation')}</span>
    </button>
  );
}
