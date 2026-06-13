"use client";

import React, { useEffect, useState } from 'react';
import { 
  Download,
  CheckCircle2,
  AlertCircle,
  History,
  Calendar
} from 'lucide-react';

const BINANCE_SYMBOLS = [
  "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "ADAUSDT", "XRPUSDT", "DOTUSDT", "DOGEUSDT", "AVAXUSDT", "LTCUSDT",
  "MATICUSDT", "LINKUSDT", "UNIUSDT", "BCHUSDT", "FILUSDT", "ATOMUSDT", "TRXUSDT", "ETCUSDT", "XLMUSDT", "FTMUSDT"
];

export default function Dashboard() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [interval, setInterval] = useState('1h');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loadingSync, setLoadingSync] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  const handleSync = async () => {
    setLoadingSync(true);
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
      const apiHost = window.location.hostname;
      const res = await fetch(`http://${apiHost}:8080/api/sync-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          symbol,
          interval,
          start_time: startTimestamp,
          end_time: endTimestamp
        })
      });

      if (res.ok) {
        const resData = await res.json();
        if (resData.status === 'success') {
          setLogs(prev => prev.map(log => 
            log.id === logId 
              ? { ...log, status: 'success', msg: `Berhasil! Sinkronisasi selesai. ${resData.added_count} data baru tersimpan.` } 
              : log
          ));
        } else {
          setLogs(prev => prev.map(log => 
            log.id === logId 
              ? { ...log, status: 'error', msg: `Gagal: ${resData.message}` } 
              : log
          ));
        }
      } else {
        setLogs(prev => prev.map(log => 
          log.id === logId 
            ? { ...log, status: 'error', msg: `Gagal: Server merespon dengan status ${res.status}` } 
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
      setLoadingSync(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      {/* Form Konfigurasi */}
      <div className="lg:col-span-5 space-y-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-[#6a6a75] tracking-widest px-1">Simbol Koin</label>
            <select 
              value={symbol} 
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white p-3.5 rounded-2xl outline-none focus:border-sky-500/50 hover:bg-white/[0.08] transition-all cursor-pointer font-semibold text-sm"
            >
              {BINANCE_SYMBOLS.map(s => <option key={s} value={s} className="bg-[#0a0c14]">{s}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-[#6a6a75] tracking-widest px-1">Waktu Per Lilin (Interval)</label>
            <select 
              value={interval} 
              onChange={(e) => setInterval(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white p-3.5 rounded-2xl outline-none focus:border-sky-500/50 hover:bg-white/[0.08] transition-all cursor-pointer font-semibold text-sm"
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
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-[#6a6a75] tracking-widest px-1">Dari Tanggal</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white p-3 rounded-xl outline-none focus:border-sky-500/50 hover:bg-white/[0.08] transition-all font-semibold text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-[#6a6a75] tracking-widest px-1">Sampai Tanggal</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white p-3 rounded-xl outline-none focus:border-sky-500/50 hover:bg-white/[0.08] transition-all font-semibold text-xs"
              />
            </div>
          </div>

          <button 
            onClick={handleSync}
            disabled={loadingSync}
            className="w-full py-4 bg-sky-600 hover:bg-sky-500 active:scale-[0.98] text-white transition-all font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100 cursor-pointer shadow-lg shadow-sky-500/10 border border-sky-400/20"
          >
            {loadingSync ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" /> : <Download size={16} />}
            {loadingSync ? 'Syncing...' : 'Mulai Sinkronisasi'}
          </button>
        </div>

        <div className="flex gap-3 text-sky-400/70">
          <Calendar className="shrink-0" size={16} />
          <p className="text-[10px] leading-relaxed font-medium">
            Binance membatasi 1000 data per permintaan. Jika rentang waktu terlalu jauh, sistem mengambil 1000 data terakhir.
          </p>
        </div>
      </div>

      {/* Real-time Logs */}
      <div className="lg:col-span-7 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-[#6a6a75]">
          <History size={14} /> Aktivitas Log
        </h3>

        <div className="h-[400px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {logs.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-[#3a3a44]">
              <p className="text-xs italic">Menunggu perintah sinkronisasi...</p>
            </div>
          )}
          {logs.map(log => (
            <div key={log.id} className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 flex gap-4 animate-in slide-in-from-right-4 duration-300">
              <div className="mt-1">
                {log.status === 'success' ? <CheckCircle2 className="text-sky-400" size={14} /> :
                 log.status === 'error' ? <AlertCircle className="text-red-400" size={14} /> :
                 <div className="w-3.5 h-3.5 border-2 border-sky-500/20 border-t-sky-400 rounded-full animate-spin" />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-bold text-slate-500 tracking-tighter">{log.time}</span>
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    log.status === 'success' ? 'bg-sky-500/10 text-sky-400' :
                    log.status === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-sky-500/10 text-sky-400'
                  }`}>{log.status}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-medium">{log.msg}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
