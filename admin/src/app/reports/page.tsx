"use client";

import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Database, 
  HelpCircle,
  FileText,
  CreditCard,
  Settings,
  ShieldCheck,
  TrendingUp,
  Activity
} from 'lucide-react';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'financial' | 'operational'>('financial');
  const [lang, setLang] = useState<'id' | 'en'>('en');

  useEffect(() => {
    // Read language preference
    const savedLang = localStorage.getItem('admin_lang') as 'id' | 'en';
    if (savedLang) setLang(savedLang);

    const handleLangChange = () => {
      const currentLang = localStorage.getItem('admin_lang') as 'id' | 'en';
      if (currentLang) setLang(currentLang);
    };
    window.addEventListener('admin_lang_changed', handleLangChange);
    return () => window.removeEventListener('admin_lang_changed', handleLangChange);
  }, []);

  const t = {
    en: {
      title: 'Audit & System Ledger Reports',
      subtitle: 'Analyze financial records and operational node health',
      finTab: 'Financial Reports',
      opsTab: 'Operational Reports',
      noGatewayTitle: 'Payment Gateway Integration Inactive',
      noGatewayDesc: 'Arus kas deposit, penarikan (withdraw), dan faktur pembayaran otomatis belum aktif karena payment gateway belum terintegrasi di sistem.',
      actionBtn: 'Configure Payment Gateway',
      lockedTitle: 'Operational Logs Locked',
      lockedDesc: 'Data audit harian dan riwayat aktivitas transaksi operasional akan ditayangkan secara detail setelah server operasional terhubung sepenuhnya.',
      status: 'Status Gateway: Offline',
      totalCashflow: 'Net Cashflow: $0.00',
      totalDeposits: 'Total Deposits: $0.00',
      totalWithdraws: 'Total Withdrawals: $0.00',
      nodeStatus: 'Operational Nodes: 0 Active',
      apiHealth: 'API Health Score: N/A',
      backupStatus: 'System Backup: Safe (Idle)'
    },
    id: {
      title: 'Laporan Audit & Sistem Ledger',
      subtitle: 'Analisis catatan keuangan dan kesehatan operasional node',
      finTab: 'Laporan Keuangan',
      opsTab: 'Laporan Operasional',
      noGatewayTitle: 'Integrasi Payment Gateway Belum Aktif',
      noGatewayDesc: 'Arus kas deposit, penarikan (withdraw), dan faktur pembayaran otomatis belum aktif karena payment gateway belum terintegrasi di sistem.',
      actionBtn: 'Konfigurasi Payment Gateway',
      lockedTitle: 'Log Operasional Terkunci',
      lockedDesc: 'Data audit harian dan riwayat aktivitas transaksi operasional akan ditayangkan secara detail setelah server operasional terhubung sepenuhnya.',
      status: 'Status Gateway: Offline',
      totalCashflow: 'Arus Kas Bersih: Rp 0',
      totalDeposits: 'Total Deposit: Rp 0',
      totalWithdraws: 'Total Penarikan (WD): Rp 0',
      nodeStatus: 'Node Operasional: 0 Aktif',
      apiHealth: 'Skor Kesehatan API: N/A',
      backupStatus: 'Pencadangan Sistem: Aman (Idle)'
    }
  }[lang];

  return (
    <div className="w-[calc(100%+4rem)] -mx-8 -my-8 flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-black/10 animate-in fade-in duration-300">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-white/5 bg-[#050507]/40 backdrop-blur-md px-8 py-3 shrink-0">
        <div>
          <h2 className="text-[10px] font-extrabold tracking-[0.2em] uppercase text-white">{t.title}</h2>
          <p className="text-[11px] text-[#86868b] mt-0.5">{t.subtitle}</p>
        </div>
      </div>

      {/* Tabs Selector Bar */}
      <div className="flex border-b border-white/5 bg-[#050507]/20 px-8 shrink-0">
        <button
          onClick={() => setActiveTab('financial')}
          className={`py-4 px-6 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'financial'
              ? 'border-[#00f2ff] text-white'
              : 'border-transparent text-[#6a6a75] hover:text-white'
          }`}
        >
          <CreditCard size={14} className={activeTab === 'financial' ? 'text-[#00f2ff]' : ''} />
          {t.finTab}
        </button>
        <button
          onClick={() => setActiveTab('operational')}
          className={`py-4 px-6 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'operational'
              ? 'border-[#00f2ff] text-white'
              : 'border-transparent text-[#6a6a75] hover:text-white'
          }`}
        >
          <Activity size={14} className={activeTab === 'operational' ? 'text-[#00f2ff]' : ''} />
          {t.opsTab}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar flex items-center justify-center">
        {activeTab === 'financial' ? (
          /* Financial Reports Locked/Empty State */
          <div className="max-w-xl w-full bg-white/[0.02] border border-white/5 rounded-3xl p-8 flex flex-col items-center text-center relative overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f2ff]/5 rounded-full blur-3xl"></div>
            
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-slate-400">
              <Lock size={28} className="text-[#00f2ff] animate-pulse" />
            </div>

            <h3 className="text-base font-extrabold text-white mb-2 uppercase tracking-wider">{t.noGatewayTitle}</h3>
            <p className="text-xs text-[#86868b] leading-relaxed mb-8 max-w-md">
              {t.noGatewayDesc}
            </p>

            {/* Quick Metrics Placeholders */}
            <div className="w-full grid grid-cols-3 gap-3 mb-8 text-[10px] font-extrabold uppercase font-mono tracking-wider">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
                <span className="text-[#86868b] block mb-1">{lang === 'en' ? 'Cashflow' : 'Arus Kas'}</span>
                <span className="text-slate-400 block">$0.00</span>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
                <span className="text-[#86868b] block mb-1">Deposits</span>
                <span className="text-slate-400 block">$0.00</span>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
                <span className="text-[#86868b] block mb-1">Withdrawals</span>
                <span className="text-slate-400 block">$0.00</span>
              </div>
            </div>

            <button className="px-6 py-3 bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/30 text-xs font-bold uppercase tracking-wider rounded-2xl transition-all cursor-pointer flex items-center gap-2">
              <Settings size={14} />
              {t.actionBtn}
            </button>
          </div>
        ) : (
          /* Operational Reports Locked/Empty State */
          <div className="max-w-xl w-full bg-white/[0.02] border border-white/5 rounded-3xl p-8 flex flex-col items-center text-center relative overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl"></div>
            
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-slate-400">
              <Database size={28} className="text-purple-400 animate-pulse" />
            </div>

            <h3 className="text-base font-extrabold text-white mb-2 uppercase tracking-wider">{t.lockedTitle}</h3>
            <p className="text-xs text-[#86868b] leading-relaxed mb-8 max-w-md">
              {t.lockedDesc}
            </p>

            {/* Quick Metrics Placeholders */}
            <div className="w-full grid grid-cols-3 gap-3 text-[10px] font-extrabold uppercase font-mono tracking-wider">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
                <span className="text-[#86868b] block mb-1">{lang === 'en' ? 'Node Status' : 'Status Node'}</span>
                <span className="text-slate-400 block">Offline</span>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
                <span className="text-[#86868b] block mb-1">{lang === 'en' ? 'API Health' : 'Kesehatan API'}</span>
                <span className="text-slate-400 block">N/A</span>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
                <span className="text-[#86868b] block mb-1">Backups</span>
                <span className="text-[#00ff88] block">Safe</span>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
