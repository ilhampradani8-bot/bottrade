"use client";

import React, { useState } from 'react';
import { Share2, Copy, Check, Users, DollarSign, Award, ArrowUpRight } from 'lucide-react';

export default function Afiliasi() {
  const [copied, setCopied] = useState(false);
  const referralCode = "TRADE-SAFE-88";
  const referralLink = `https://tradingsafe.com/register?ref=${referralCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const payouts = [
    { id: 1, date: "10 Juni 2026", amount: "$84.50", status: "Selesai", method: "USDT BEP-20" },
    { id: 2, date: "10 Mei 2026", amount: "$120.00", status: "Selesai", method: "USDT BEP-20" },
    { id: 3, date: "10 April 2026", amount: "$95.10", status: "Selesai", method: "USDT BEP-20" },
  ];

  return (
    <div className="w-full px-4 sm:px-8 py-6 max-w-5xl mx-auto space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col gap-2">
        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">Program Afiliasi</h1>
        <p className="text-xs text-[#86868b]">Undang rekan Anda bergabung ke TradingSafe, dapatkan keuntungan pasif 30% dari biaya langganan mereka.</p>
      </div>

      {/* Referral Link & Code Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="md:col-span-2 apple-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Share2 size={16} className="text-indigo-400" />
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Link Referensi Anda</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#86868b] uppercase tracking-wider">Tautan Unik</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={referralLink} 
                  className="flex-1 premium-input bg-[#09090b] border border-white/10 rounded-[6px] text-xs py-2 px-3"
                />
                <button 
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[6px] text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copied ? "Tersalin" : "Salin"}</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#86868b] uppercase tracking-wider">Kode Afiliasi</label>
              <div className="text-sm font-black text-indigo-400 tracking-wider bg-white/5 border border-white/5 p-3 rounded-[6px] w-fit">
                {referralCode}
              </div>
            </div>
          </div>
        </div>

        {/* Level Reward Details */}
        <div className="apple-card p-6 space-y-4 justify-between flex flex-col">
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Award size={16} className="text-indigo-400" />
              <h2 className="text-sm font-black text-white uppercase tracking-widest">Tingkat Komisi</h2>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#86868b] font-bold">Biaya Komisi Standard</span>
                <span className="font-black text-white">30%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#86868b] font-bold">Metode Pembayaran</span>
                <span className="font-black text-indigo-400">USDT BEP-20 / TRC-20</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#86868b] font-bold">Batas Minimum Cair</span>
                <span className="font-black text-white">$20.00</span>
              </div>
            </div>
          </div>

          <button className="w-full py-2 bg-white text-black hover:bg-[#f5f5f7] rounded-[6px] text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer">
            <span>Panduan Afiliasi</span>
            <ArrowUpRight size={12} />
          </button>
        </div>

      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="apple-card p-6 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-[6px] border border-indigo-500/20 text-indigo-400">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-[#86868b] uppercase tracking-wider">Undangan Bergabung</p>
            <h3 className="text-xl font-black text-white">42 User</h3>
          </div>
        </div>

        <div className="apple-card p-6 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-[6px] border border-indigo-500/20 text-indigo-400">
            <Users size={20} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-black text-[#86868b] uppercase tracking-wider">Referal Aktif</p>
            <h3 className="text-xl font-black text-white">12 Premium</h3>
          </div>
        </div>

        <div className="apple-card p-6 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-[6px] border border-indigo-500/20 text-indigo-400">
            <DollarSign size={20} className="text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] font-black text-[#86868b] uppercase tracking-wider">Komisi Berjalan</p>
            <h3 className="text-xl font-black text-white">$64.80</h3>
          </div>
        </div>
      </div>

      {/* Excel-like Payout Table */}
      <div className="apple-card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-widest text-white">Riwayat Pencairan Komisi</h2>
          <span className="text-[9px] font-bold text-[#86868b]">3 transaksi terkahir</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5 text-[9px] font-black uppercase tracking-wider text-[#86868b]">
                <th className="p-4">Tanggal Pengajuan</th>
                <th className="p-4">Jumlah Komisi</th>
                <th className="p-4">Metode Transfer</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payouts.map((pay) => (
                <tr key={pay.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 font-bold text-white">{pay.date}</td>
                  <td className="p-4 font-black text-emerald-400">{pay.amount}</td>
                  <td className="p-4 text-slate-300">{pay.method}</td>
                  <td className="p-4 text-right">
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-bold uppercase">
                      {pay.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
