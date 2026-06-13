"use client";

import React, { useState, useEffect } from 'react';
import { ShieldCheck, HardDrive, Key, User, Calendar, Activity, Zap } from 'lucide-react';

export default function StatusAkun() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const apiHost = window.location.hostname;
        const res = await fetch(`http://${apiHost}:8080/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUsername(data.username || '');
          setEmail(data.email || '');
        }
      } catch (err) {
        console.error("Failed to load user profile");
      }
    };
    fetchProfile();
  }, []);

  return (
    <div className="w-full px-4 sm:px-8 py-6 max-w-5xl mx-auto space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col gap-2">
        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">Status Layanan & Akun</h1>
        <p className="text-xs text-[#86868b]">Informasi status real-time akun Anda, API kunci terhubung, dan diagnostik engine robot.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Info Card */}
        <div className="apple-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <User size={16} className="text-indigo-400" />
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Akun Pengguna</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#86868b] font-bold">Username</span>
              <span className="font-black text-white">{username || 'User'}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#86868b] font-bold">Email</span>
              <span className="font-medium text-slate-300">{email || 'guest@tradingsafe.com'}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#86868b] font-bold">Tipe Keanggotaan</span>
              <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded font-black uppercase tracking-wider text-[9px]">Pro Member</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#86868b] font-bold">Masa Aktif</span>
              <span className="font-black text-white">31 Des 2026</span>
            </div>
          </div>
        </div>

        {/* Engine Connectivity Status */}
        <div className="apple-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Activity size={16} className="text-indigo-400" />
            <h2 className="text-sm font-black text-white uppercase tracking-widest">TradingSafe Engine</h2>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#86868b] font-bold">Status Koneksi Engine</span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                <span>Aktif (24/7)</span>
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#86868b] font-bold">Lokasi Server VPS</span>
              <span className="font-black text-white">Singapura (SG-1)</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#86868b] font-bold">Waktu Sinkronisasi</span>
              <span className="font-bold text-slate-300">Setiap 10 detik</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#86868b] font-bold">Versi Engine</span>
              <span className="font-black text-white">V2.4-stable</span>
            </div>
          </div>
        </div>

        {/* API Credentials Health Card */}
        <div className="apple-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Key size={16} className="text-indigo-400" />
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Kredensial API Bursa</h2>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#86868b] font-bold">Binance API Key</span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span>Terhubung</span>
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#86868b] font-bold">Kucoin API Key</span>
              <span className="text-[#86868b] font-bold">Tidak Terhubung</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#86868b] font-bold">Bybit API Key</span>
              <span className="text-[#86868b] font-bold">Tidak Terhubung</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#86868b] font-bold">Izin Transaksi</span>
              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded font-black uppercase tracking-wider text-[9px]">Trading Aktif</span>
            </div>
          </div>
        </div>

      </div>

      {/* Resource Health Diagnostic card */}
      <div className="apple-card p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
          <Zap size={16} className="text-indigo-400" />
          <h2 className="text-sm font-black text-white uppercase tracking-widest">Kuota Penggunaan Layanan</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-[#86868b]">DCA & Grid Bot Aktif</span>
              <span className="text-white">4 / Tanpa Batas</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/5">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: '40%' }}></div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-[#86868b]">Permintaan API (Panggilan/Min)</span>
              <span className="text-white">120 / 1200 req</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/5">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: '10%' }}></div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-[#86868b]">Sinyal Alert Whatsapp/Telegram</span>
              <span className="text-white">821 / 2000 pemicu</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/5">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: '41%' }}></div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
