"use client";

import React, { useEffect, useState, useRef } from 'react';
import { 
  RefreshCcw, 
  Power, 
  Play,
  AlertTriangle,
  Info,
  ShieldAlert,
  Database,
  Search,
  X,
  User,
  Cpu,
  HardDrive,
  Clock
} from 'lucide-react';

interface VpsNodeProcess {
  id: number;
  name: string;
  category: string;
  status: string;
  cpu: number;
  memory: bigint;
  restarts: number;
  uptime: bigint;
}

interface SystemLog {
  id: number;
  process_name: string;
  log_level: string;
  message: string;
  created_at: string;
}

export default function EnginePage() {
  const [activeTab, setActiveTab] = useState<'monitor' | 'logs'>('monitor');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [processes, setProcesses] = useState<VpsNodeProcess[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingLogs, setFetchingLogs] = useState(false);
  const [showDbInfo, setShowDbInfo] = useState(false);
  const [botsCount, setBotsCount] = useState<number>(0);
  const [bots, setBots] = useState<any[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<VpsNodeProcess | null>(null);

  // Filters State
  const [globalSearch, setGlobalSearch] = useState('');
  const [idFilter, setIdFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchProcesses = async () => {
    try {
      const apiHost = window.location.hostname;
      const res = await fetch(`http://${apiHost}:8080/api/admin/vps-nodes`);
      if (res.ok) {
        const data = await res.json();
        setProcesses(data);
      }
    } catch (err) {
      console.error("Failed to fetch PM2 processes:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBots = async () => {
    try {
      const apiHost = window.location.hostname;
      const res = await fetch(`http://${apiHost}:8080/api/admin/bots`);
      if (res.ok) {
        const data = await res.json();
        setBots(data);
        setBotsCount(data.filter((b: any) => b.status === 'Running').length);
      }
    } catch (err) {
      console.error("Failed to fetch bots:", err);
    }
  };

  const fetchSystemLogs = async () => {
    try {
      setFetchingLogs(true);
      const apiHost = window.location.hostname;
      const res = await fetch(`http://${apiHost}:8080/api/admin/vps-logs`);
      if (res.ok) {
        const data = await res.json();
        setSystemLogs(data);
      }
    } catch (err) {
      console.error("Failed to fetch system logs:", err);
    } finally {
      setFetchingLogs(false);
    }
  };

  const controlProcess = async (id: number, action: 'start' | 'stop' | 'restart') => {
    try {
      window.dispatchEvent(new Event('admin_loading_start'));
      const apiHost = window.location.hostname;
      const res = await fetch(`http://${apiHost}:8080/api/admin/vps-nodes/${id}/${action}`, {
        method: 'POST'
      });
      if (res.ok) {
        fetchProcesses();
      } else {
        console.error(`Failed to ${action} process ${id}`);
      }
    } catch (err) {
      console.error(`Error sending ${action} to process ${id}:`, err);
    } finally {
      window.dispatchEvent(new Event('admin_loading_end'));
    }
  };

  // Poll processes and bots count
  useEffect(() => {
    fetchProcesses();
    fetchBots();
    const interval = setInterval(() => {
      fetchProcesses();
      fetchBots();
    }, 5000);

    const handleRefresh = () => {
      fetchProcesses();
      fetchBots();
      if (activeTab === 'logs') {
        fetchSystemLogs();
      }
    };

    window.addEventListener('admin_refresh', handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('admin_refresh', handleRefresh);
    };
  }, [activeTab]);

  // Keep selected process updated live with refreshed details
  useEffect(() => {
    if (selectedProcess) {
      const updated = processes.find(p => p.id === selectedProcess.id);
      if (updated) {
        setSelectedProcess(updated);
      }
    }
  }, [processes]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (uptimeMs: number) => {
    if (uptimeMs === 0) return '-';
    const diff = Date.now() - uptimeMs;
    if (diff <= 0) return '0s';
    const secs = Math.floor(diff / 1000);
    const mins = Math.floor(secs / 60);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${mins % 60}m`;
    if (mins > 0) return `${mins}m ${secs % 60}s`;
    return `${secs}s`;
  };

  const getUserForProcess = (name: string) => {
    switch (name) {
      case 'bottrade-backend':
      case 'bottrade-admin':
      case 'bottrade-db-admin':
        return 'Administrator (Sistem)';
      case 'bottrade-engine':
        return 'System (Trading Engine)';
      case 'engine-user-operator':
        return 'Sistem (Multi-User Operator)';
      case 'whatsapp-bridge':
        return 'Sistem (Notifikasi User)';
      case 'bottrade-frontend':
        return 'Publik (Client Interface)';
      default:
        return 'Administrator';
    }
  };

  const handleResetFilters = () => {
    setGlobalSearch('');
    setIdFilter('');
    setNameFilter('');
    setCatFilter('All');
    setStatusFilter('All');
    setSelectedCategory('Semua');
  };

  const categories = ["Semua", "Bot Trading", "Bot User", "Bot Notifikasi", "Bot Frontend", "Bot Sistem"];

  // Filter Chain
  const filteredProcesses = processes.filter(p => {
    // 1. Tab category filter
    if (selectedCategory !== 'Semua' && p.category !== selectedCategory) return false;

    // 2. Global search filter
    if (globalSearch) {
      const s = globalSearch.toLowerCase();
      const matchSearch = p.name.toLowerCase().includes(s) || 
                          p.category.toLowerCase().includes(s) || 
                          p.status.toLowerCase().includes(s) ||
                          p.id.toString().includes(s);
      if (!matchSearch) return false;
    }

    // 3. Header Column Filters
    if (idFilter && !p.id.toString().includes(idFilter)) return false;
    if (nameFilter && !p.name.toLowerCase().includes(nameFilter.toLowerCase())) return false;
    if (catFilter !== 'All' && p.category !== catFilter) return false;
    if (statusFilter !== 'All' && p.status !== statusFilter) return false;

    return true;
  });

  return (
    <div className="w-[calc(100%+4rem)] -mx-8 -my-8 flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-black/10">
      {/* Sleek Tab Bar & Header Controls */}
      <div className="flex items-center justify-between border-b border-white/5 bg-[#050507]/40 backdrop-blur-md px-8 py-3 shrink-0">
        <div className="flex gap-6">
          <button 
            onClick={() => setActiveTab('monitor')}
            className={`text-[10px] font-bold uppercase tracking-[0.15em] pb-1 border-b-2 cursor-pointer transition-all ${
              activeTab === 'monitor' 
                ? 'text-white border-[#00f2ff]' 
                : 'text-[#6a6a75] border-transparent hover:text-white'
            }`}
          >
            Node Monitor
          </button>
          <button 
            onClick={() => {
              setActiveTab('logs');
              fetchSystemLogs();
            }}
            className={`text-[10px] font-bold uppercase tracking-[0.15em] pb-1 border-b-2 cursor-pointer transition-all ${
              activeTab === 'logs' 
                ? 'text-white border-[#00f2ff]' 
                : 'text-[#6a6a75] border-transparent hover:text-white'
            }`}
          >
            Laporan Logs
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Informasi Jumlah Bot */}
          {activeTab === 'monitor' && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-extrabold text-[#86868b] tracking-wider">
              <span>JUMLAH BOT:</span>
              <span className="text-[#00f2ff]">{botsCount}</span>
            </div>
          )}

          {/* Kolom Pencarian */}
          {activeTab === 'monitor' && (
            <div className="relative flex items-center">
              <Search size={11} className="absolute left-2.5 text-slate-500" />
              <input 
                type="text"
                placeholder="Cari proses..."
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1 text-[9px] text-white placeholder-slate-500 focus:outline-none focus:border-[#00f2ff]/40 w-40 font-semibold"
              />
            </div>
          )}

          {/* Tombol Reset Filter */}
          {activeTab === 'monitor' && (
            <button 
              onClick={handleResetFilters}
              className="bg-white/5 border border-white/10 text-[#86868b] hover:text-white px-2.5 py-1 text-[9px] font-extrabold rounded-lg cursor-pointer transition-all uppercase tracking-wider"
            >
              Reset Filter
            </button>
          )}

          <button 
            onClick={() => setShowDbInfo(true)}
            className="w-7 h-7 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 flex items-center justify-center font-black text-xs cursor-pointer transition-all"
            title="Database Schema Relations"
          >
            !
          </button>

          {activeTab === 'logs' && (
            <button 
              onClick={fetchSystemLogs}
              disabled={fetchingLogs}
              className="bg-white/5 border border-white/10 text-white px-3 py-1 text-[10px] font-bold flex items-center gap-1.5 hover:bg-white hover:text-black transition-all rounded-lg cursor-pointer"
            >
              <RefreshCcw size={11} className={fetchingLogs ? 'animate-spin' : ''} />
              REFRESH LOGS
            </button>
          )}
        </div>
      </div>

      {/* Category Sub Tabs for Node Monitor */}
      {activeTab === 'monitor' && (
        <div className="flex gap-2 px-8 py-2.5 bg-[#050507]/20 border-b border-white/5 overflow-x-auto custom-scrollbar shrink-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-[9px] font-extrabold uppercase tracking-widest rounded transition-all cursor-pointer border ${
                selectedCategory === cat
                  ? 'bg-[#00f2ff]/10 text-[#00f2ff] border-[#00f2ff]/30'
                  : 'bg-white/5 text-[#86868b] border-white/5 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Main Split Layout Container */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Container: Table / Logs */}
        <div className="flex-1 overflow-auto min-h-0 custom-scrollbar border-r border-white/5">
          {activeTab === 'monitor' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-[#050507]/60 sticky top-0 backdrop-blur-md z-10">
                  <th className="px-8 py-4 text-[#86868b] uppercase tracking-wider text-[10px] font-extrabold w-16">ID</th>
                  <th className="px-8 py-4 text-[#86868b] uppercase tracking-wider text-[10px] font-extrabold">Service Name</th>
                  <th className="px-8 py-4 text-[#86868b] uppercase tracking-wider text-[10px] font-extrabold w-32 text-center">Category</th>
                  <th className="px-8 py-4 text-[#86868b] uppercase tracking-wider text-[10px] font-extrabold w-32 text-center">Status</th>
                  <th className="px-8 py-4 text-[#86868b] uppercase tracking-wider text-[10px] font-extrabold w-24 text-right">CPU</th>
                  <th className="px-8 py-4 text-[#86868b] uppercase tracking-wider text-[10px] font-extrabold w-28 text-right">Memory</th>
                  <th className="px-8 py-4 text-[#86868b] uppercase tracking-wider text-[10px] font-extrabold w-24 text-right">Restarts</th>
                  <th className="px-8 py-4 text-[#86868b] uppercase tracking-wider text-[10px] font-extrabold w-24 text-right">Uptime</th>
                  <th className="px-8 py-4 text-[#86868b] uppercase tracking-wider text-[10px] font-extrabold w-28 text-center">Actions</th>
                </tr>

                {/* Column Filters Row */}
                <tr className="border-b border-white/5 bg-[#050507]/20 sticky top-[45px] backdrop-blur-md z-10">
                  <td className="px-8 py-2">
                    <input 
                      type="text" 
                      placeholder="Filter ID..." 
                      value={idFilter}
                      onChange={e => setIdFilter(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-[9px] font-mono text-white placeholder-slate-600 focus:outline-none focus:border-[#00f2ff]/50"
                    />
                  </td>
                  <td className="px-8 py-2">
                    <input 
                      type="text" 
                      placeholder="Filter Service..." 
                      value={nameFilter}
                      onChange={e => setNameFilter(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-[9px] text-white placeholder-slate-600 focus:outline-none focus:border-[#00f2ff]/50"
                    />
                  </td>
                  <td className="px-8 py-2">
                    <select 
                      value={catFilter}
                      onChange={e => setCatFilter(e.target.value)}
                      className="w-full bg-[#0d0d11] border border-white/10 rounded px-2 py-1 text-[9px] text-white focus:outline-none focus:border-[#00f2ff]/50"
                    >
                      <option value="All">Semua Kategori</option>
                      {categories.filter(c => c !== "Semua").map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-8 py-2">
                    <select 
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="w-full bg-[#0d0d11] border border-white/10 rounded px-2 py-1 text-[9px] text-white focus:outline-none focus:border-[#00f2ff]/50"
                    >
                      <option value="All">Semua Status</option>
                      <option value="online">ONLINE</option>
                      <option value="stopped">STOPPED</option>
                      <option value="errored">ERRORED</option>
                    </select>
                  </td>
                  <td className="px-8 py-2"></td>
                  <td className="px-8 py-2"></td>
                  <td className="px-8 py-2"></td>
                  <td className="px-8 py-2"></td>
                  <td className="px-8 py-2"></td>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-black/5">
                {filteredProcesses.map(p => (
                  <tr 
                    key={p.id}
                    onClick={() => setSelectedProcess(p)}
                    className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${
                      selectedProcess?.id === p.id ? 'bg-white/[0.03] border-l-2 border-[#00f2ff]' : ''
                    }`}
                  >
                    <td className="px-8 py-3.5 font-mono text-[11px] text-[#6a6a75] font-semibold">
                      #{p.id}
                    </td>
                    <td className="px-8 py-3.5">
                      <span className="text-white font-semibold text-[11px]">{p.name}</span>
                    </td>
                    <td className="px-8 py-3.5 text-center">
                      <span className="inline-flex items-center text-[#00f2ff] text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#00f2ff]/5 rounded border border-[#00f2ff]/10">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-8 py-3.5 text-center">
                      {p.status === 'online' ? (
                        <span className="inline-flex items-center gap-1 text-[#00ff88] text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-[#00ff88]/10 rounded border border-[#00ff88]/20">
                          ONLINE
                        </span>
                      ) : p.status === 'stopped' ? (
                        <span className="inline-flex items-center gap-1 text-slate-400 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-white/5 rounded border border-white/10">
                          STOPPED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-rose-500/10 rounded border border-rose-500/20 animate-pulse">
                          {p.status.toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-3.5 text-right font-mono text-[11px] font-semibold text-slate-300">
                      {p.cpu.toFixed(1)}%
                    </td>
                    <td className="px-8 py-3.5 text-right font-mono text-[11px] font-semibold text-slate-300">
                      {formatBytes(Number(p.memory))}
                    </td>
                    <td className="px-8 py-3.5 text-right font-mono text-[11px] font-semibold text-[#86868b]">
                      {p.restarts}
                    </td>
                    <td className="px-8 py-3.5 text-right font-mono text-[11px] font-semibold text-slate-300">
                      {formatUptime(Number(p.uptime))}
                    </td>
                    <td className="px-8 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        {p.status === 'online' ? (
                          <button 
                            onClick={() => controlProcess(p.id, 'stop')}
                            title="Stop Process"
                            className="p-1 text-[#ff0055] hover:bg-[#ff0055]/10 rounded border border-transparent hover:border-[#ff0055]/20 transition-all cursor-pointer"
                          >
                            <Power size={11} />
                          </button>
                        ) : (
                          <button 
                            onClick={() => controlProcess(p.id, 'start')}
                            title="Start Process"
                            className="p-1 text-[#00ff88] hover:bg-[#00ff88]/10 rounded border border-transparent hover:border-[#00ff88]/20 transition-all cursor-pointer"
                          >
                            <Play size={11} />
                          </button>
                        )}
                        <button 
                          onClick={() => controlProcess(p.id, 'restart')}
                          title="Restart Process"
                          className="p-1 text-[#00f2ff] hover:bg-[#00f2ff]/10 rounded border border-transparent hover:border-[#00f2ff]/20 transition-all cursor-pointer"
                        >
                          <RefreshCcw size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProcesses.length === 0 && !loading && (
                  <tr>
                    <td colSpan={9} className="px-8 py-20 text-center text-[#6a6a75] uppercase text-[10px] font-bold tracking-widest">
                      No active node processes found in this category
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            /* Logs Tab */
            <div className="flex flex-col min-h-full bg-black/20">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-[#050507]/60 sticky top-0 backdrop-blur-md z-10">
                    <th className="px-8 py-4 text-[#86868b] uppercase tracking-wider text-[10px] font-extrabold w-48">Timestamp</th>
                    <th className="px-8 py-4 text-[#86868b] uppercase tracking-wider text-[10px] font-extrabold w-44">Service</th>
                    <th className="px-8 py-4 text-[#86868b] uppercase tracking-wider text-[10px] font-extrabold w-28 text-center">Level</th>
                    <th className="px-8 py-4 text-[#86868b] uppercase tracking-wider text-[10px] font-extrabold">Log Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-[11px] bg-black/10">
                  {systemLogs.map((log) => {
                    const isError = log.log_level === 'ERROR';
                    const isWarn = log.log_level === 'WARN';

                    return (
                      <tr key={log.id} className="hover:bg-white/[0.01] transition-colors leading-relaxed">
                        <td className="px-8 py-3 text-slate-400 font-semibold">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-8 py-3 text-white font-semibold">
                          {log.process_name}
                        </td>
                        <td className="px-8 py-3 text-center">
                          {isError ? (
                            <span className="inline-flex items-center gap-1 text-rose-400 font-bold px-2 py-0.5 bg-rose-500/10 rounded border border-rose-500/20">
                              <ShieldAlert size={10} />
                              ERROR
                            </span>
                          ) : isWarn ? (
                            <span className="inline-flex items-center gap-1 text-amber-400 font-bold px-2 py-0.5 bg-amber-500/10 rounded border border-amber-500/20">
                              <AlertTriangle size={10} />
                              WARN
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[#00f2ff] font-bold px-2 py-0.5 bg-[#00f2ff]/10 rounded border border-[#00f2ff]/20">
                              <Info size={10} />
                              INFO
                            </span>
                          )}
                        </td>
                        <td className={`px-8 py-3 break-all ${isError ? 'text-rose-300' : isWarn ? 'text-amber-200' : 'text-slate-300'}`}>
                          {log.message}
                        </td>
                      </tr>
                    );
                  })}
                  {systemLogs.length === 0 && !fetchingLogs && (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center text-[#6a6a75] uppercase text-[10px] font-bold tracking-widest">
                        No system logs recorded yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Container: Details Panel */}
        {activeTab === 'monitor' && (
          <div className="w-[320px] bg-[#060608]/90 border-l border-white/5 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
            {selectedProcess ? (
              <div className="p-6 flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[#00f2ff] font-mono text-[10px] font-bold uppercase tracking-widest">PM2 Process details</span>
                    <h2 className="text-white text-base font-extrabold tracking-tight break-all">{selectedProcess.name}</h2>
                  </div>
                  <button 
                    onClick={() => setSelectedProcess(null)}
                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-[#86868b] hover:text-white cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </div>

                {/* Status Card */}
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex items-center justify-between">
                  <span className="text-[10px] text-[#86868b] font-bold uppercase tracking-wider">Status Node</span>
                  {selectedProcess.status === 'online' ? (
                    <span className="flex items-center gap-1.5 text-[#00ff88] text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 bg-[#00ff88]/10 rounded-full border border-[#00ff88]/20 shadow-[0_0_12px_rgba(0,255,136,0.15)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
                      ONLINE
                    </span>
                  ) : selectedProcess.status === 'stopped' ? (
                    <span className="flex items-center gap-1.5 text-slate-400 text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 bg-white/5 rounded-full border border-white/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                      STOPPED
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-rose-400 text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 bg-rose-500/10 rounded-full border border-rose-500/20 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      {selectedProcess.status.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Details Section */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-white text-[10px] font-extrabold uppercase tracking-widest border-b border-white/5 pb-2">Informasi Umum</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/[0.01] border border-white/5 rounded-lg p-3">
                      <span className="text-[9px] text-[#86868b] font-bold uppercase tracking-wider block mb-1">PM2 ID</span>
                      <span className="text-white font-mono font-bold text-xs">#{selectedProcess.id}</span>
                    </div>

                    <div className="bg-white/[0.01] border border-white/5 rounded-lg p-3">
                      <span className="text-[9px] text-[#86868b] font-bold uppercase tracking-wider block mb-1">Kategori</span>
                      <span className="text-[#00f2ff] font-bold text-[10px] uppercase tracking-wider">{selectedProcess.category}</span>
                    </div>
                  </div>

                  {/* Owner/User */}
                  <div className="bg-white/[0.01] border border-white/5 rounded-lg p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#00f2ff]/10 border border-[#00f2ff]/20 flex items-center justify-center text-[#00f2ff]">
                      <User size={13} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-[#86868b] font-bold uppercase tracking-wider">Pemilik / User</span>
                      <span className="text-white font-bold text-[10px] mt-0.5">{getUserForProcess(selectedProcess.name)}</span>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-white text-[10px] font-extrabold uppercase tracking-widest border-b border-white/5 pb-2">Performa Node</h3>
                  
                  <div className="space-y-4">
                    {/* CPU */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-[#86868b] uppercase tracking-wider flex items-center gap-1"><Cpu size={10} /> CPU Usage</span>
                        <span className="text-white font-mono">{selectedProcess.cpu.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#00f2ff] to-[#00ff88] rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(selectedProcess.cpu, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Memory */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-[#86868b] uppercase tracking-wider flex items-center gap-1"><HardDrive size={10} /> Memory RAM</span>
                        <span className="text-white font-mono">{formatBytes(Number(selectedProcess.memory))}</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#00f2ff] to-[#7000ff] rounded-full" 
                          style={{ width: `${Math.min((Number(selectedProcess.memory) / (1024 * 1024 * 512)) * 100, 100)}%` }} // normalized to 512MB max for visuals
                        />
                      </div>
                    </div>

                    {/* Uptime & Restarts */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="flex items-center gap-2">
                        <Clock size={11} className="text-[#86868b]" />
                        <div className="flex flex-col">
                          <span className="text-[9px] text-[#86868b] font-bold uppercase tracking-wider">Uptime</span>
                          <span className="text-white font-mono text-[10px] font-bold">{formatUptime(Number(selectedProcess.uptime))}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <RefreshCcw size={11} className="text-[#86868b]" />
                        <div className="flex flex-col">
                          <span className="text-[9px] text-[#86868b] font-bold uppercase tracking-wider">Restarts</span>
                          <span className="text-white font-mono text-[10px] font-bold">{selectedProcess.restarts} kali</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* List of Active User Bots in orchestrator */}
                {(selectedProcess.name === 'engine-user-operator' || selectedProcess.name === 'bottrade-engine') && (
                  <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
                    <span className="text-[9px] text-[#86868b] font-extrabold uppercase tracking-wider block mb-1">Daftar User Bot</span>
                    <div className="space-y-1.5 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                      {bots.map((b: any) => (
                        <div key={b.id} className="flex justify-between items-center text-[10px] py-1 border-b border-white/[0.02]">
                          <div className="flex flex-col">
                            <span className="text-white font-medium">{b.name} <span className="text-slate-500 font-mono text-[9px]">({b.pair})</span></span>
                            <span className="text-[#86868b] text-[9px] mt-0.5">User: <span className="text-slate-300">{b.username}</span></span>
                          </div>
                          <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider font-extrabold ${
                            b.status === 'Running' || b.status === 'active'
                              ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20' 
                              : 'bg-white/5 text-slate-500 border border-white/10'
                          }`}>
                            {b.status}
                          </span>
                        </div>
                      ))}
                      {bots.length === 0 && (
                        <div className="text-[9px] text-slate-500 italic py-2">
                          Tidak ada bot pengguna terdaftar.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Node Controls */}
                <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
                  <span className="text-[9px] text-[#86868b] font-bold uppercase tracking-wider">Aksi Cepat Node</span>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedProcess.status === 'online' ? (
                      <button 
                        onClick={() => controlProcess(selectedProcess.id, 'stop')}
                        className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-3 py-2 text-[10px] font-bold uppercase rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5"
                      >
                        <Power size={11} />
                        Stop Node
                      </button>
                    ) : (
                      <button 
                        onClick={() => controlProcess(selectedProcess.id, 'start')}
                        className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3 py-2 text-[10px] font-bold uppercase rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5"
                      >
                        <Play size={11} />
                        Start Node
                      </button>
                    )}
                    <button 
                      onClick={() => controlProcess(selectedProcess.id, 'restart')}
                      className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 px-3 py-2 text-[10px] font-bold uppercase rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5"
                    >
                      <RefreshCcw size={11} />
                      Restart Node
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-[#6a6a75] p-6 gap-2">
                <Info className="w-7 h-7 text-[#6a6a75]/40" />
                <p className="text-[9px] font-extrabold uppercase tracking-widest">Pilih proses untuk melihat detail</p>
                <span className="text-[8px] text-[#55555d] leading-relaxed max-w-[200px] mt-1">
                  Klik baris manapun pada tabel di sebelah kiri untuk memunculkan detail performa & konfigurasi lengkap.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Database Schema Relation Modal */}
      {showDbInfo && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#070709] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-white/5 bg-[#0e0e12] flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400">
                <Database size={15} />
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-white">Database Schema Relations</h3>
              </div>
              <button 
                onClick={() => setShowDbInfo(false)}
                className="text-[#86868b] hover:text-white text-[10px] font-extrabold uppercase tracking-widest cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="p-6 space-y-5 text-xs text-[#86868b]">
              <div>
                <h4 className="text-white font-bold mb-1.5 uppercase text-[10px] tracking-wider text-amber-500">1. system_logs_by_admin</h4>
                <p className="leading-relaxed mb-2">
                  Menyimpan rekaman log kesalahan (error/warning) yang dipindai dari log PM2 VPS secara berkala.
                </p>
                <ul className="list-disc pl-4 space-y-1 font-mono text-[10px]">
                  <li><span className="text-white">id</span> (SERIAL, Primary Key) - Kunci log unik</li>
                  <li><span className="text-white">process_name</span> (VARCHAR) - Nama proses PM2 (misal: bottrade-backend)</li>
                  <li><span className="text-white">log_level</span> (VARCHAR) - Tingkat keparahan (ERROR, WARN, INFO)</li>
                  <li><span className="text-white">message</span> (TEXT) - Pesan log kesalahan</li>
                  <li><span className="text-white">created_at</span> (TIMESTAMPTZ) - Waktu log dicatat ke database</li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-bold mb-1.5 uppercase text-[10px] tracking-wider text-amber-500">2. strategies_by_strategysettings & simulations_by_simsettings</h4>
                <p className="leading-relaxed mb-2">
                  Tabel ini dipantau secara periodik oleh daemon orkestrator bot (`engine-user-operator`) untuk memperbarui status proses trading yang sedang dikendalikan.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
