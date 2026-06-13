"use client";

import React, { useEffect, useState } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Search, 
  Activity, 
  Settings2, 
  User as UserIcon,
  RefreshCcw,
  X,
  ArrowUpDown,
  ExternalLink
} from 'lucide-react';

interface AdminBot {
  id: number;
  user_id: number;
  name: string;
  bot_type: string;
  pair: string;
  settings: any;
  status: string | null;
  username: string;
}

export default function BotsPage() {
  const [bots, setBots] = useState<AdminBot[]>([]);
  const [mode, setMode] = useState<'live' | 'simulation'>('live');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [activeTab, setActiveTab] = useState('All'); // Tab-based filtering for Bot Types
  
  // Custom Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Selected Bot details modal
  const [selectedBot, setSelectedBot] = useState<AdminBot | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'json'>('overview');

  // Engine Workflow Modal State
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [workflowTab, setWorkflowTab] = useState<'structure' | 'db' | 'flow'>('structure');

  const fetchBots = async () => {
    try {
      setLoading(true);
      const apiHost = window.location.hostname;
      const endpoint = mode === 'live' ? 'bots' : 'simulations';
      const res = await fetch(`http://${apiHost}:8080/api/admin/${endpoint}`);
      if (res.ok) {
        const data = await res.json();
        setBots(data);
      }
    } catch (err) {
      console.error("Failed to fetch bots:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBots();
  }, [mode]);

  // Show auto-dismissing toast notification
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const isBotRunning = (status: string | null) => {
    if (!status) return false;
    return status === 'Running' || status === 'active';
  };

  const isBotPaused = (status: string | null) => {
    if (!status) return false;
    return status === 'Paused';
  };

  const toggleStatus = async (id: number, currentStatus: string | null) => {
    const isSim = mode === 'simulation';
    const activeVal = isSim ? 'active' : 'Running';
    const inactiveVal = isSim ? 'inactive' : 'Stopped';
    const nextStatus = isBotRunning(currentStatus) ? inactiveVal : activeVal;

    try {
      const apiHost = window.location.hostname;
      const endpoint = isSim ? 'simulations' : 'bots';
      const res = await fetch(`http://${apiHost}:8080/api/admin/${endpoint}/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        showToast(`Bot #${id} state requested: ${nextStatus.toUpperCase()}`, 'success');
        fetchBots();
      } else {
        showToast(`Failed to update status for Bot #${id}`, 'error');
      }
    } catch (err) {
      showToast(`Network error updating Bot #${id}`, 'error');
    }
  };

  const stopBotDirectly = async (id: number) => {
    const isSim = mode === 'simulation';
    const stopStatus = isSim ? 'inactive' : 'Stopped';
    try {
      const apiHost = window.location.hostname;
      const endpoint = isSim ? 'simulations' : 'bots';
      const res = await fetch(`http://${apiHost}:8080/api/admin/${endpoint}/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: stopStatus })
      });
      if (res.ok) {
        showToast(`Bot #${id} stop requested successfully`, 'success');
        fetchBots();
      } else {
        showToast(`Failed to stop Bot #${id}`, 'error');
      }
    } catch (err) {
      showToast(`Network error stopping Bot #${id}`, 'error');
    }
  };

  // Get bot type tabs list dynamically based on database bots plus preset standard types
  const getTabCounts = (type: string) => {
    if (type === 'All') return bots.length;
    return bots.filter(b => b.bot_type?.toLowerCase() === type.toLowerCase()).length;
  };

  const tabs = ['All', 'dca', 'grid', 'rsi', 'macd'];

  // Apply filtering: search, status filter, and tab type filter
  const filteredBots = bots.filter(bot => {
    const matchesSearch = bot.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          bot.pair.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          bot.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          bot.id.toString().includes(searchTerm);
    
    const matchesStatus = filterStatus === 'All' || 
                          (filterStatus === 'Running' && isBotRunning(bot.status)) ||
                          (filterStatus === 'Stopped' && !isBotRunning(bot.status) && !isBotPaused(bot.status)) ||
                          (filterStatus === 'Paused' && isBotPaused(bot.status));

    const matchesTab = activeTab === 'All' || bot.bot_type?.toLowerCase() === activeTab.toLowerCase();
    return matchesSearch && matchesStatus && matchesTab;
  });

  return (
    <div className="w-full px-0 space-y-6">
      {/* Toast Notification Alert Banner */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border transition-all duration-300 animate-in slide-in-from-top-5 ${
          toast.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`} />
          <span className="text-xs font-bold uppercase tracking-wider">{toast.message}</span>
          <button onClick={() => setToast(null)} className="hover:text-white ml-2 cursor-pointer">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Engine Mode Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setMode('live')}
            className={`pb-1.5 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all duration-300 cursor-pointer ${
              mode === 'live'
                ? 'border-sky-500 text-sky-400 font-black'
                : 'border-transparent text-[#86868b] hover:text-white'
            }`}
          >
            Live Trading
          </button>
          <button
            onClick={() => setMode('simulation')}
            className={`pb-1.5 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all duration-300 cursor-pointer ${
              mode === 'simulation'
                ? 'border-indigo-500 text-indigo-400 font-black'
                : 'border-transparent text-[#86868b] hover:text-white'
            }`}
          >
            Simulation Lab
          </button>
        </div>

        {/* Info Workflow Button */}
        <button
          onClick={() => setShowWorkflowModal(true)}
          className="flex items-center justify-center w-7 h-7 rounded-full bg-white/5 border border-white/10 text-[#86868b] hover:text-white hover:bg-sky-500/10 hover:text-sky-400 hover:border-sky-500/20 active:scale-[0.95] transition-all cursor-pointer font-mono font-black text-sm"
          title="Show Engine Workflow Diagram"
        >
          !
        </button>
      </div>

      {/* Top action row */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6a6a75]" size={14} />
            <input 
              type="text" 
              placeholder="Search by Name, Pair, Owner, ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 pl-9 pr-3 py-2 rounded-xl text-xs focus:outline-none focus:border-sky-500/50 transition-all text-white placeholder:text-[#6a6a75]"
            />
          </div>

          {/* Status Dropdown */}
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white/5 border border-white/10 px-3 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl focus:outline-none cursor-pointer"
          >
            <option value="All" className="bg-[#0c0d12] text-white">ALL STATUS</option>
            <option value="Running" className="bg-[#0c0d12] text-white">RUNNING / ACTIVE</option>
            <option value="Stopped" className="bg-[#0c0d12] text-white">STOPPED / INACTIVE</option>
            <option value="Paused" className="bg-[#0c0d12] text-white">PAUSED</option>
          </select>

          {/* Reset button */}
          <button 
            onClick={() => {
              setSearchTerm('');
              setFilterStatus('All');
              setActiveTab('All');
            }}
            className="bg-white/5 border border-white/10 px-3 py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/[0.08] active:scale-[0.97] transition-all rounded-xl cursor-pointer flex items-center gap-1.5"
            title="Reset Filters"
          >
            <X size={13} />
            Reset Filter
          </button>
        </div>

        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <button 
            onClick={fetchBots}
            className="bg-white/5 border border-white/10 p-2 text-slate-400 hover:text-sky-400 hover:bg-white/[0.08] active:scale-[0.97] transition-all rounded-xl cursor-pointer"
            title="Refresh List"
          >
            <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Model Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-white/5">
        {tabs.map((tab) => {
          const count = getTabCounts(tab);
          const isSelected = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer border ${
                isSelected
                  ? mode === 'live'
                    ? 'bg-sky-500/10 text-sky-400 border-sky-500/20 shadow-lg shadow-sky-500/5'
                    : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-lg shadow-indigo-500/5'
                  : 'bg-transparent text-[#86868b] border-transparent hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab === 'All' ? 'ALL BOTS' : `${tab.toUpperCase()} BOT`}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                isSelected 
                  ? mode === 'live' 
                    ? 'bg-sky-500/20 text-sky-300' 
                    : 'bg-indigo-500/20 text-indigo-300'
                  : 'bg-white/5 text-[#6a6a75]'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-[#6a6a75] animate-pulse font-bold tracking-widest uppercase text-xs">
          Syncing with SQL Engine...
        </div>
      ) : (
        <>
          {/* Table Container */}
          <div className="-mx-8 overflow-x-auto w-[calc(100%+4rem)] border-t border-white/5 pb-3">
            <table className="w-full text-left text-sm border-collapse min-w-[1000px]">
              <thead>
                <tr className="text-[#6a6a75] border-b border-white/5 uppercase text-[10px] font-bold tracking-widest bg-white/[0.01]">
                  <th className="pl-8 pr-4 py-4 w-12 text-center">#</th>
                  <th className="px-4 py-4 w-24">ID</th>
                  <th className="px-4 py-4">Bot Engine</th>
                  <th className="px-4 py-4">Owner</th>
                  <th className="px-4 py-4">Pair / Symbol</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="pl-4 pr-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredBots.map((bot, idx) => (
                  <tr 
                    key={bot.id} 
                    onClick={() => setSelectedBot(bot)}
                    className="hover:bg-white/[0.01] transition-colors group cursor-pointer"
                  >
                    {/* Index */}
                    <td className="pl-8 pr-4 py-5 text-center text-[#6a6a75] font-mono text-xs">
                      {idx + 1}
                    </td>

                    {/* ID */}
                    <td className="px-4 py-5 font-mono text-xs text-sky-400/80">
                      #{mode === 'live' ? 'BOT' : 'SIM'}-{bot.id}
                    </td>

                    {/* Bot Engine / Name */}
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          isBotRunning(bot.status)
                            ? mode === 'live'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            : 'bg-white/5 text-[#6a6a75] border-white/10'
                        }`}>
                          <Activity size={16} className={isBotRunning(bot.status) ? 'animate-pulse' : ''} />
                        </div>
                        <div>
                          <div className="font-bold text-white tracking-tight">{bot.name}</div>
                          <div className="text-[10px] text-[#6a6a75] mt-0.5">Strategy: {bot.bot_type.toUpperCase()}</div>
                        </div>
                      </div>
                    </td>

                    {/* Owner */}
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-2 text-white/80">
                        <UserIcon size={13} className="text-[#86868b]" />
                        <span className="font-semibold text-xs">{bot.username}</span>
                      </div>
                    </td>

                    {/* Pair / Symbol */}
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sky-400 text-xs">{bot.pair}</span>
                      </div>
                    </td>

                    {/* Status badge in table */}
                    <td className="px-4 py-5 font-semibold text-xs">
                      <span className={
                        isBotRunning(bot.status)
                          ? 'text-emerald-400' 
                          : isBotPaused(bot.status)
                          ? 'text-amber-400'
                          : 'text-slate-500'
                      }>
                        {bot.status ? bot.status.toUpperCase() : 'STOPPED'}
                      </span>
                    </td>

                    {/* Actions Column */}
                    <td className="pl-4 pr-8 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        {/* Play/Pause Button */}
                        <button 
                          onClick={() => toggleStatus(bot.id, bot.status)}
                          title={isBotRunning(bot.status) ? 'Pause Bot' : 'Start Bot'}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all cursor-pointer ${
                            isBotRunning(bot.status)
                              ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-black'
                              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-black'
                          }`}
                        >
                          {isBotRunning(bot.status) ? <Pause size={13} /> : <Play size={13} />}
                        </button>

                        {/* Stop/Square Button */}
                        <button 
                          onClick={() => stopBotDirectly(bot.id)}
                          title="Stop Bot"
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-black transition-all cursor-pointer"
                        >
                          <Square size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredBots.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-8 py-20 text-center text-[#6a6a75] uppercase text-[10px] font-bold tracking-widest">
                      Zero engines detected matching criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Total Bots Info Summary Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5 text-xs text-[#6a6a75] font-semibold">
            <div>
              Showing <span className="text-white">{filteredBots.length}</span> of <span className="text-white">{bots.length}</span> total {mode === 'live' ? 'live' : 'simulation'} bots
            </div>
            <div className="flex gap-4">
              <div>
                Running/Active: <span className="text-emerald-400">{bots.filter(b => isBotRunning(b.status)).length}</span>
              </div>
              <div>
                Stopped/Inactive: <span className="text-red-400">{bots.filter(b => !isBotRunning(b.status) && !isBotPaused(b.status)).length}</span>
              </div>
              {mode === 'live' && (
                <div>
                  Paused: <span className="text-amber-400">{bots.filter(b => isBotPaused(b.status)).length}</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Strategy Detail Parameters Modal Pop-up */}
      {selectedBot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#0c0d12] border border-white/10 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-white/5 bg-white/[0.01]">
              <div>
                <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                  <Activity size={16} className={`${mode === 'live' ? 'text-sky-400' : 'text-indigo-400'} animate-pulse`} />
                  {mode === 'live' ? 'Live Bot' : 'Simulation Bot'} #{selectedBot.id} Configuration
                </h3>
                <p className="text-[10px] text-[#6a6a75] mt-0.5">{selectedBot.name}</p>
              </div>
              <button 
                onClick={() => setSelectedBot(null)} 
                className="text-[#86868b] hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tab switchers in details modal */}
            <div className="flex border-b border-white/5 bg-[#08090d] px-5">
              <button
                onClick={() => setDetailTab('overview')}
                className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  detailTab === 'overview'
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-[#86868b] hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setDetailTab('json')}
                className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  detailTab === 'json'
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-[#86868b] hover:text-white'
                }`}
              >
                Configuration (JSON)
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6">
              {detailTab === 'overview' ? (
                <div className="space-y-1 font-semibold text-xs text-white">
                  <div className="flex justify-between py-3 border-b border-white/5">
                    <span className="text-[#86868b] uppercase tracking-wider text-[10px]">Strategy Engine</span>
                    <span className="uppercase text-slate-200">{selectedBot.bot_type}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-white/5">
                    <span className="text-[#86868b] uppercase tracking-wider text-[10px]">Trading Pair</span>
                    <span className="font-mono text-sky-400">{selectedBot.pair}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-white/5">
                    <span className="text-[#86868b] uppercase tracking-wider text-[10px]">System Status</span>
                    <span className={`uppercase font-bold ${isBotRunning(selectedBot.status) ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {selectedBot.status || 'STOPPED'}
                    </span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-[#86868b] uppercase tracking-wider text-[10px]">Owner Account</span>
                    <span className="text-slate-200">{selectedBot.username}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-[9px] text-[#6a6a75] uppercase font-bold tracking-wider block">Raw Strategy JSON Settings</span>
                  <div className="bg-black/40 border border-white/5 p-4 rounded-lg max-h-56 overflow-y-auto custom-scrollbar font-mono text-[11px] text-sky-300/90 whitespace-pre-wrap">
                    {JSON.stringify(selectedBot.settings, null, 2)}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-2 p-5 border-t border-white/5 bg-white/[0.01]">
              <button
                onClick={() => {
                  toggleStatus(selectedBot.id, selectedBot.status);
                  setSelectedBot(prev => prev ? { 
                    ...prev, 
                    status: isBotRunning(prev.status) 
                      ? (mode === 'live' ? 'Stopped' : 'inactive') 
                      : (mode === 'live' ? 'Running' : 'active') 
                  } : null);
                }}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer border ${
                  isBotRunning(selectedBot.status)
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500 hover:text-black'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-black'
                }`}
              >
                {isBotRunning(selectedBot.status) ? 'Pause Bot' : 'Start Bot'}
              </button>
              <button 
                onClick={() => setSelectedBot(null)}
                className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors border border-white/10 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Engine Workflow Explanatory Modal */}
      {showWorkflowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#0c0d12] border border-white/10 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
                  <span className="text-sky-400 font-extrabold text-sm">!</span>
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                    Engine-User Orchestrator Workflow
                  </h3>
                  <p className="text-[10px] text-[#6a6a75] mt-0.5">Relasi File ➔ Folder ➔ Tabel Database</p>
                </div>
              </div>
              <button 
                onClick={() => setShowWorkflowModal(false)} 
                className="text-[#86868b] hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tab switchers in workflow modal */}
            <div className="flex border-b border-white/5 bg-[#08090d] px-5">
              <button
                onClick={() => setWorkflowTab('structure')}
                className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  workflowTab === 'structure'
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-[#86868b] hover:text-white'
                }`}
              >
                Struktur File
              </button>
              <button
                onClick={() => setWorkflowTab('db')}
                className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  workflowTab === 'db'
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-[#86868b] hover:text-white'
                }`}
              >
                Relasi DB
              </button>
              <button
                onClick={() => setWorkflowTab('flow')}
                className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  workflowTab === 'flow'
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-[#86868b] hover:text-white'
                }`}
              >
                Aliran Data
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar text-xs">
              {workflowTab === 'structure' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <h4 className="text-[10px] uppercase font-extrabold text-[#86868b] tracking-wider">Folder & File Structure</h4>
                  <div className="bg-black/30 border border-white/5 p-4 rounded-lg font-mono text-[11px] leading-relaxed text-slate-300">
                    <div className="text-emerald-400 font-bold">📁 engine/Engine-User/</div>
                    <div className="pl-4 border-l border-white/10 py-1 space-y-2">
                      <div>
                        <span className="text-sky-400 font-bold">📄 operator/main.rs</span>
                        <span className="text-[#6a6a75] ml-2">— Core loop (polls DB settings every 5s, hot-reloads bots, updates WS stream)</span>
                      </div>
                      <div>
                        <span className="text-sky-400 font-bold">📄 operator/bot.rs</span>
                        <span className="text-[#6a6a75] ml-2">— Bot worker struct. Evaluates strategy tick, logs actions, calculates PnL</span>
                      </div>
                      <div>
                        <span className="text-sky-400 font-bold">📄 operator/hear.rs</span>
                        <span className="text-[#6a6a75] ml-2">— WebSocket listener (Binance wss aggTrade). Handles reconnect & updates state</span>
                      </div>
                      <div>
                        <span className="text-indigo-400 font-bold">📁 strategi/</span>
                        <span className="text-[#6a6a75] ml-2">— Logic blueprints cloned from backend (DCA, Grid, RSI, EMA)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {workflowTab === 'db' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div>
                    <h5 className="font-bold text-sky-400 uppercase text-[10px] tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                      Live Trading Engine
                    </h5>
                    <div className="pl-3 border-l border-white/10 space-y-2 text-slate-300">
                      <div>
                        <span className="text-[#86868b] block text-[9px] uppercase font-bold tracking-wider">Tabel Konfigurasi</span>
                        <code className="text-sky-300 font-mono text-[11px]">strategies_by_strategysettings</code>
                        <span className="text-[#6a6a75] ml-2">(status: <code className="text-white bg-white/5 px-1 py-0.5 rounded text-[10px]">Running</code>)</span>
                      </div>
                      <div>
                        <span className="text-[#86868b] block text-[9px] uppercase font-bold tracking-wider">Tabel Jurnal Transaksi</span>
                        <code className="text-sky-300 font-mono text-[11px]">trades_by_jurnalriwayat</code>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5">
                    <h5 className="font-bold text-indigo-400 uppercase text-[10px] tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                      Simulation Lab Engine
                    </h5>
                    <div className="pl-3 border-l border-white/10 space-y-2 text-slate-300">
                      <div>
                        <span className="text-[#86868b] block text-[9px] uppercase font-bold tracking-wider">Tabel Konfigurasi</span>
                        <code className="text-indigo-300 font-mono text-[11px]">simulations_by_simsettings</code>
                        <span className="text-[#6a6a75] ml-2">(status: <code className="text-white bg-white/5 px-1 py-0.5 rounded text-[10px]">active</code>)</span>
                      </div>
                      <div>
                        <span className="text-[#86868b] block text-[9px] uppercase font-bold tracking-wider">Tabel Jurnal Transaksi</span>
                        <code className="text-indigo-300 font-mono text-[11px]">simulation_trades_by_jurnal</code>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {workflowTab === 'flow' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <h4 className="text-[10px] uppercase font-extrabold text-[#86868b] tracking-wider">System Data Flow Cycle</h4>
                  <div className="space-y-3 text-slate-300 leading-relaxed font-semibold">
                    <div className="flex items-start gap-2 py-2 border-b border-white/5">
                      <span className="font-mono text-sky-400">Step 1:</span>
                      <span>Admin klik toggle status di UI ➔ API Endpoint mengirim status update ke Postgres DB.</span>
                    </div>
                    <div className="flex items-start gap-2 py-2 border-b border-white/5">
                      <span className="font-mono text-sky-400">Step 2:</span>
                      <span><code className="text-white bg-white/5 px-1 py-0.5 rounded text-[10px]">main.rs</code> mendeteksi status baru ➔ Inisialisasi <code className="text-white bg-white/5 px-1 py-0.5 rounded text-[10px]">StrategyBot</code> di thread memory.</span>
                    </div>
                    <div className="flex items-start gap-2 py-2 border-b border-white/5">
                      <span className="font-mono text-sky-400">Step 3:</span>
                      <span><code className="text-white bg-white/5 px-1 py-0.5 rounded text-[10px]">hear.rs</code> WebSocket berlangganan ke exchange ➔ Memberi umpan harga real-time.</span>
                    </div>
                    <div className="flex items-start gap-2 py-2">
                      <span className="font-mono text-sky-400">Step 4:</span>
                      <span>Setiap tick, <code className="text-white bg-white/5 px-1 py-0.5 rounded text-[10px]">bot.rs</code> mencocokkan harga vs settings. Jika signal buy/sell terpicu ➔ Simpan trade jurnal ke tabel database yang sesuai.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end p-5 border-t border-white/5 bg-white/[0.01]">
              <button 
                onClick={() => setShowWorkflowModal(false)}
                className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors border border-white/10 cursor-pointer"
              >
                Tutup Diagram
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
