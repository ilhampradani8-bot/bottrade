"use client";

import { Key } from 'lucide-react';
import { useLanguage } from '@/lang/LanguageContext';

export default function ApiSettingsItem({ activeView, setActiveView }: any) {
  const { t } = useLanguage();
  return (
    <button
      onClick={() => setActiveView('api-key')}
      className={`w-full sidebar-item ${activeView === 'api-key' ? 'active' : ''}`}
    >
      <Key size={18} />
      <span className="truncate">{t('sidebar.api_settings')}</span>
    </button>
  );
}
