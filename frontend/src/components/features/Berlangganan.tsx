"use client";

import React, { useState } from 'react';
import { Check, Flame, Star, Sparkles } from 'lucide-react';

export default function Berlangganan() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const tiers = [
    {
      name: "Lite Member",
      price: { monthly: "$0", yearly: "$0" },
      description: "Untuk trader pemula yang ingin mencoba fitur dasar dan simulasi.",
      features: [
        "Maksimal 1 DCA Bot Aktif",
        "Akses standard Quant Lab",
        "Sinyal Prediksi Tertunda (30 menit)",
        "Dukungan Komunitas standard",
        "Penyimpanan Jurnal 7 Hari"
      ],
      cta: "Plan Aktif Saat Ini",
      popular: false,
      active: true
    },
    {
      name: "Pro Member",
      price: { monthly: "$29", yearly: "$22" },
      description: "Sangat cocok untuk trader harian yang membutuhkan bot 24/7 otonom penuh.",
      features: [
        "Bot DCA & Grid Tanpa Batas",
        "Akses Prioritas Quant Lab",
        "Sinyal WhatsApp & Telegram Instan",
        "Audit Trail Jurnal SQL Permanen",
        "Kecepatan Engine Sinkronisasi 10 detik",
        "Prioritas Dukungan Tiket Konsierge"
      ],
      cta: "Tingkatkan Ke Pro",
      popular: true,
      active: false
    },
    {
      name: "VIP Institutional",
      price: { monthly: "$149", yearly: "$119" },
      description: "Optimasi penuh untuk fund manager atau trader dengan volume tinggi.",
      features: [
        "Semua Fitur Pro Member",
        "Server VPS Engine Terdedikasi",
        "Integrasi API Custom Multi-Akun",
        "Sesi Konsultasi Strategi Mingguan",
        "Laporan Analitik Portofolio Kustom",
        "Manajer Akun Pribadi 24/7"
      ],
      cta: "Hubungi Penjualan",
      popular: false,
      active: false
    }
  ];

  return (
    <div className="w-full px-4 sm:px-8 py-6 max-w-5xl mx-auto space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col items-center text-center gap-2 space-y-1">
        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">Paket Berlangganan</h1>
        <p className="text-xs text-[#86868b] max-w-lg">Buka potensi trading maksimal Anda dengan strategi otonom tanpa batasan kuota.</p>
        
        {/* Toggle billing period */}
        <div className="flex bg-white/5 border border-white/5 p-1 rounded-[6px] w-64 gap-1 mt-4">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`flex-1 py-1 rounded-[4px] text-[10px] font-black uppercase tracking-wider transition-all ${
              billingPeriod === 'monthly' ? 'bg-indigo-600 text-white shadow-md' : 'text-[#86868b] hover:text-white'
            }`}
          >
            Bulanan
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`flex-1 py-1 rounded-[4px] text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              billingPeriod === 'yearly' ? 'bg-indigo-600 text-white shadow-md' : 'text-[#86868b] hover:text-white'
            }`}
          >
            <span>Tahunan</span>
            <span className="px-1 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-[3px] text-[7px] font-black uppercase tracking-wide">Hemat 20%</span>
          </button>
        </div>
      </div>

      {/* Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {tiers.map((tier) => (
          <div 
            key={tier.name} 
            className={`apple-card p-6 flex flex-col justify-between relative transition-all ${
              tier.popular ? 'border-indigo-500/40 ring-1 ring-indigo-500/30' : ''
            }`}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-3 py-1 rounded-[10px] text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={10} />
                <span>Paling Populer</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">{tier.name}</h3>
                <p className="text-[10px] text-[#86868b] mt-1 line-clamp-2">{tier.description}</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black text-white">{billingPeriod === 'monthly' ? tier.price.monthly : tier.price.yearly}</span>
                <span className="text-[10px] text-[#86868b] font-bold">/ bulan</span>
              </div>

              <div className="border-t border-white/5 my-2" />

              <ul className="space-y-2.5">
                {tier.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5 text-xs">
                    <Check size={14} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300 font-bold text-[11px] leading-tight">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button 
              disabled={tier.active}
              className={`w-full py-2.5 rounded-[6px] text-[10px] font-black uppercase tracking-wider transition-all mt-6 cursor-pointer ${
                tier.active
                  ? 'bg-white/5 border border-white/5 text-[#86868b] cursor-not-allowed'
                  : tier.popular
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/10'
                    : 'bg-white text-black hover:bg-[#f5f5f7]'
              }`}
            >
              {tier.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
