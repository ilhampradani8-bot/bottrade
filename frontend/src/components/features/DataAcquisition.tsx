"use client";

import { useState } from 'react';
import { Download, CheckCircle2, AlertCircle, Clock, Search, History, Calendar } from 'lucide-react';
import axios from 'axios';
import { BINANCE_SYMBOLS } from '@/constants/symbols';

const RUST_API = "http://139.59.122.230:8080/api";

export default function DataAcquisition() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [interval, setInterval] = useState('1h');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  const handleSync = async () => {
    setLoading(true);
    const logId = Date.now();
    
    // Convert dates to timestamps (ms)
    const startTimestamp = startDate ? new Date(startDate).getTime() : null;
    const endTimestamp = endDate ? new Date(endDate).getTime() : null;

    const newLog = { 
      id: logId, 
      time: new Date().toLocaleTimeString(), 
      msg: `Memulai pengambilan data ${symbol} (${interval})...`, 
      status: 'pending' 
    };
    setLogs(prev => [newLog, ...prev]);

    try {
      const res = await axios.post(`${RUST_API}/sync-data`, {
        symbol,
        interval,
        start_time: startTimestamp,
        end_time: endTimestamp
      });

      if (res.data.status === 'success') {
        setLogs(prev => prev.map(log => 
          log.id === logId 
            ? { ...log, status: 'success', msg: `Berhasil! Sinkronisasi selesai. ${res.data.added_count} data baru tersimpan.` } 
            : log
        ));
      } else {
        setLogs(prev => prev.map(log => 
          log.id === logId 
            ? { ...log, status: 'error', msg: `Gagal: ${res.data.message}` } 
            : log
        ));
      }
    } catch (err: any) {
      setLogs(prev => prev.map(log => 
        log.id === logId 
          ? { ...log, status: 'error', msg: `Error Koneksi: ${err.message}` } 
          : log
      ));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-700">
      <header>
        <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
          <Download className="text-emerald-400" /> Data Lab: Acquisition
        </h1>
        <p className="text-slate-400 mt-2">Sinkronisasi data historis dari Binance ke PostgreSQL menggunakan Rust Engine.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Konfigurasi */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-8 space-y-6 border border-white/5 bg-white/[0.01] rounded-3xl">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Search className="text-blue-400" size={20} /> Konfigurasi Penarikan
            </h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1">Simbol Koin</label>
                <select 
                  value={symbol} 
                  onChange={(e) => setSymbol(e.target.value)}
                  className="w-full premium-input focus:border-emerald-500 bg-white/5 border-white/10 p-3 rounded-xl"
                >
                  {BINANCE_SYMBOLS.map(s => <option key={s} value={s} className="bg-[#0a0c14]">{s}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1">Waktu Per Lilin (Interval)</label>
                <select 
                  value={interval} 
                  onChange={(e) => setInterval(e.target.value)}
                  className="w-full premium-input focus:border-emerald-500 bg-white/5 border-white/10 p-3 rounded-xl"
                >
                  <option value="1m" className="bg-[#0a0c14]">1 Menit</option>
                  <option value="5m" className="bg-[#0a0c14]">5 Menit</option>
                  <option value="15m" className="bg-[#0a0c14]">15 Menit</option>
                  <option value="1h" className="bg-[#0a0c14]">1 Jam</option>
                  <option value="4h" className="bg-[#0a0c14]">4 Jam</option>
                  <option value="1d" className="bg-[#0a0c14]">1 Hari</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1">Dari Tanggal</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full premium-input focus:border-emerald-500 bg-white/5 border-white/10 p-3 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1">Sampai Tanggal</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full premium-input focus:border-emerald-500 bg-white/5 border-white/10 p-3 rounded-xl"
                  />
                </div>
              </div>

              <button 
                onClick={handleSync}
                disabled={loading}
                className="w-full premium-button !bg-emerald-600 !py-4 shadow-[0_0_20px_rgba(16,185,129,0.2)] mt-2 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" /> : <Download size={20} />}
                {loading ? 'Processing Rust Request...' : 'Mulai Sinkronisasi'}
              </button>
            </div>
          </div>

          <div className="glass-card p-6 border-l-4 border-blue-500 bg-blue-500/5 rounded-r-xl">
            <h3 className="text-sm font-bold text-blue-400 mb-2 flex items-center gap-2">
              <Calendar size={16} /> Info Rentang Waktu
            </h3>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Binance membatasi 1000 data per permintaan. Jika rentang waktu terlalu jauh, sistem akan mengambil 1000 data terakhir dari rentang tersebut.
            </p>
          </div>
        </div>

        {/* Real-time Logs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-8 h-[600px] flex flex-col border border-white/5 bg-white/[0.01] rounded-3xl">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
              <History className="text-purple-400" size={20} /> Aktivitas Log
            </h2>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {logs.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                  <Clock size={48} className="mb-4" />
                  <p className="text-sm italic">Menunggu perintah sinkronisasi...</p>
                </div>
              )}
              {logs.map(log => (
                <div key={log.id} className="p-4 bg-[#05070a] rounded-xl border border-white/5 flex gap-4 animate-in slide-in-from-right-4 duration-300">
                  <div className="mt-1">
                    {log.status === 'success' ? <CheckCircle2 className="text-emerald-400" size={16} /> :
                     log.status === 'error' ? <AlertCircle className="text-red-400" size={16} /> :
                     <div className="w-4 h-4 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{log.time}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        log.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                        log.status === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                      }`}>{log.status}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">{log.msg}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
