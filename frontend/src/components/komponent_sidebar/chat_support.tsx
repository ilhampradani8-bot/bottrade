"use client";

import { MessageSquare } from 'lucide-react';
import { useLanguage } from '@/lang/LanguageContext';

export default function ChatSupportItem({ activeView, setActiveView }: any) {
  const { t } = useLanguage();
  return (
    <button
      onClick={() => setActiveView('chat')}
      className={`w-full sidebar-item ${activeView === 'chat' ? 'active' : ''}`}
    >
      <MessageSquare size={18} />
      <span className="truncate">Concierge</span>
    </button>
  );
}
