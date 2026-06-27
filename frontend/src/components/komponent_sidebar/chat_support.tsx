"use client";

import { Cpu } from 'lucide-react';

export default function ChatSupportItem({ activeView, setActiveView }: any) {
  return (
    <button
      onClick={() => setActiveView('bots')}
      className={`w-full sidebar-item ${activeView === 'bots' ? 'active' : ''}`}
    >
      <Cpu size={18} />
      <span className="truncate">Daftar Bots</span>
    </button>
  );
}
