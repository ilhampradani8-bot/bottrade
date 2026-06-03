"use client";

import { LayoutDashboard } from 'lucide-react';
import { useLanguage } from '@/lang/LanguageContext';

export default function OverviewItem({ activeView, setActiveView }: any) {
  const { t } = useLanguage();
  return (
    <button
      onClick={() => setActiveView('overview')}
      className={`w-full sidebar-item ${activeView === 'overview' ? 'active' : ''}`}
    >
      <LayoutDashboard size={18} />
      <span className="truncate">Dashboard</span>
    </button>
  );
}
