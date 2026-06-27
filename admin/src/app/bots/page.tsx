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
  const [mode, setMode] = useState<'live' | 'simulation' | 'logs'>('live');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [activeTab, setActiveTab] = useState('All'); // Tab-based filtering for Bot Types
  
  // Custom Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Selected Bot details modal
  const [selectedBot, setSelectedBot] = useState<AdminBot | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'jurnal' | 'errors' | 'json'>('overview');

  // Engine Workflow Modal State
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [workflowTab, setWorkflowTab] = useState<'structure' | 'db' | 'flow'>('structure');

  // Multi-tier Trades state
  const [trades, setTrades] = useState<any[]>([]);
  const [liveTrades, setLiveTrades] = useState<any[]>([]);
  const [simTrades, setSimTrades] = useState<any[]>([]);
  const [liveBots, setLiveBots] = useState<AdminBot[]>([]);
  const [simBots, setSimBots] = useState<AdminBot[]>([]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const apiHost = window.location.hostname;
      
      // Fetch bots
      const resLiveBots = await fetch(`http://${apiHost}:8080/api/admin/bots`);
      const resSimBots = await fetch(`http://${apiHost}:8080/api/admin/simulations`);
      
      let lBots: AdminBot[] = [];
      let sBots: AdminBot[] = [];
      if (resLiveBots.ok) lBots = await resLiveBots.json();
      if (resSimBots.ok) sBots = await resSimBots.json();
      
      setLiveBots(lBots);
      setSimBots(sBots);
      
      // Fetch trades
      const resLiveTrades = await fetch(`http://${apiHost}:8080/api/admin/trades`);
      const resSimTrades = await fetch(`http://${apiHost}:8080/api/admin/simulations/trades`);
      
      let lTrades = [];
      let sTrades = [];
      if (resLiveTrades.ok) lTrades = await resLiveTrades.json();
      if (resSimTrades.ok) sTrades = await resSimTrades.json();
      
      setLiveTrades(lTrades);
      setSimTrades(sTrades);
      
      // Sync list state based on mode
      if (mode === 'live') {
        setBots(lBots);
        setTrades(lTrades);
      } else if (mode === 'simulation') {
        setBots(sBots);
        setTrades(sTrades);
      } else {
        setBots([...lBots, ...sBots]);
        setTrades([...lTrades, ...sTrades]);
      }
    } catch (err) {
      console.error("Failed to fetch all backend log data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBots = fetchAllData;

  useEffect(() => {
    fetchAllData();
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
          <button
            onClick={() => setMode('logs')}
            className={`pb-1.5 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all duration-300 cursor-pointer ${
              mode === 'logs'
                ? 'border-amber-500 text-amber-400 font-black'
                : 'border-transparent text-[#86868b] hover:text-white'
            }`}
          >
            Trade & Error Logs
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

      {mode === 'logs' ? (
        loading ? (
          <div className="h-64 flex items-center justify-center text-[#6a6a75] animate-pulse font-bold tracking-widest uppercase text-xs">
            Syncing with SQL Engine...
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-72 font-semibold">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6a6a75]" size={14} />
                <input 
                  type="text" 
                  placeholder="Filter logs by Bot name or pair..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 pl-9 pr-3 py-2 rounded-xl text-xs focus:outline-none focus:border-amber-500/50 transition-all text-white placeholder:text-[#6a6a75]"
                />
              </div>
              <button 
                onClick={fetchAllData}
                className="bg-white/5 border border-white/10 p-2 text-slate-400 hover:text-amber-400 hover:bg-white/[0.08] active:scale-[0.97] transition-all rounded-xl cursor-pointer"
                title="Refresh Logs"
              >
                <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Live Bots Grouped Logs */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase text-sky-400 tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                  Live Bots Logs & Audits
                </h3>
                
                {liveBots.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()) || b.pair.toLowerCase().includes(searchTerm.toLowerCase())).map(bot => {
                  const botTrades = liveTrades.filter(t => 
                    t.user_id === bot.user_id && 
                    t.pair.toLowerCase() === bot.pair.toLowerCase() &&
                    (t.strategy_type.toLowerCase() === bot.bot_type.toLowerCase() ||
                     (t.strategy_type.toLowerCase().startsWith('dca') && bot.bot_type.toLowerCase().startsWith('dca')) ||
                     (t.strategy_type.toLowerCase().startsWith('grid') && bot.bot_type.toLowerCase().startsWith('grid')))
                  );
                  const botErrors = botTrades.filter(t => t.error_code || t.error_message);
                  
                  return (
                    <BotLogsGroupCard key={`live-${bot.id}`} bot={bot} trades={botTrades} errors={botErrors} type="live" />
                  );
                })}
                {liveBots.length === 0 && (
                  <div className="py-8 text-center text-[#6a6a75] uppercase text-[9px] tracking-widest font-bold">
                    No live bots detected.
                  </div>
                )}
              </div>

              {/* Simulation Bots Grouped Logs */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <h3 className="text-xs font-black uppercase text-indigo-400 tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  Simulation Bots Logs & Audits
                </h3>
                
                {simBots.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()) || b.pair.toLowerCase().includes(searchTerm.toLowerCase())).map(bot => {
                  const botTrades = simTrades.filter(t => 
                    t.user_id === bot.user_id && 
                    t.pair.toLowerCase() === bot.pair.toLowerCase() &&
                    (t.strategy_type.toLowerCase() === bot.bot_type.toLowerCase() ||
                     (t.strategy_type.toLowerCase().startsWith('dca') && bot.bot_type.toLowerCase().startsWith('dca')) ||
                     (t.strategy_type.toLowerCase().startsWith('grid') && bot.bot_type.toLowerCase().startsWith('grid')))
                  );
                  
                  return (
                    <BotLogsGroupCard key={`sim-${bot.id}`} bot={bot} trades={botTrades} errors={[]} type="simulation" />
                  );
                })}
                {simBots.length === 0 && (
                  <div className="py-8 text-center text-[#6a6a75] uppercase text-[9px] tracking-widest font-bold">
                    No simulation bots detected.
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      ) : (
        <>
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
                      <th className="px-4 py-4">Bot Name</th>
                      <th className="px-4 py-4">Strategy Type</th>
                      <th className="px-4 py-4">Symbol / Pair</th>
                      <th className="px-4 py-4">System Status</th>
                      <th className="px-4 py-4">Owner Account</th>
                      <th className="pr-8 pl-4 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs font-semibold text-white">
                    {filteredBots.map((bot) => (
                      <tr 
                        key={bot.id} 
                        className="hover:bg-white/[0.01] transition-colors group cursor-pointer"
                      >
                        <td 
                          onClick={() => setSelectedBot(bot)} 
                          className="pl-8 pr-4 py-4 text-[#6a6a75] font-mono text-center"
                        >
                          {bot.id}
                        </td>
                        <td 
                          onClick={() => setSelectedBot(bot)} 
                          className="px-4 py-4 font-bold text-white uppercase tracking-wider text-[11px]"
                        >
                          {bot.name}
                        </td>
                        <td 
                          onClick={() => setSelectedBot(bot)} 
                          className="px-4 py-4 font-mono text-[#86868b] uppercase text-[10px] tracking-wider"
                        >
                          {bot.bot_type}
                        </td>
                        <td 
                          onClick={() => setSelectedBot(bot)} 
                          className="px-4 py-4 font-mono text-sky-400 text-[10px]"
                        >
                          {bot.pair}
                        </td>
                        <td 
                          onClick={() => setSelectedBot(bot)} 
                          className="px-4 py-4"
                        >
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                            isBotRunning(bot.status)
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : isBotPaused(bot.status)
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 font-black'
                                : 'bg-white/5 text-[#86868b] border-white/5'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              isBotRunning(bot.status) 
                                ? 'bg-emerald-400 animate-pulse' 
                                : isBotPaused(bot.status)
                                  ? 'bg-amber-400'
                                  : 'bg-[#86868b]'
                            }`} />
                            {bot.status || 'STOPPED'}
                          </span>
                        </td>
                        <td 
                          onClick={() => setSelectedBot(bot)} 
                          className="px-4 py-4 text-slate-300 font-mono text-[10px]"
                        >
                          {bot.username}
                        </td>
                        <td className="pr-8 pl-4 py-4 text-right">
                          <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                            {/* Play/Pause Button */}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStatus(bot.id, bot.status);
                              }}
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
                              onClick={(e) => {
                                e.stopPropagation();
                                stopBotDirectly(bot.id);
                              }}
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
        </>
      )}

      {/* Strategy Detail Parameters Modal Pop-up */}
      {selectedBot && (
        <BotDetailsModal 
          selectedBot={selectedBot}
          onClose={() => setSelectedBot(null)}
          mode={mode}
          liveBots={liveBots}
          liveTrades={liveTrades}
          simTrades={simTrades}
          detailTab={detailTab}
          setDetailTab={setDetailTab}
          toggleStatus={toggleStatus}
          isBotRunning={isBotRunning}
        />
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

function BotLogsGroupCard({ bot, trades, errors, type }: { bot: AdminBot; trades: any[]; errors: any[]; type: 'live' | 'simulation' }) {
  const [expanded, setExpanded] = useState(false);
  const [subTab, setSubTab] = useState<'trades' | 'errors'>('trades');

  const closedTrades = trades.filter(t => t.pnl !== null && parseFloat(t.pnl) !== 0);
  const winTrades = closedTrades.filter(t => parseFloat(t.pnl) > 0);
  const lossTrades = closedTrades.filter(t => parseFloat(t.pnl) < 0);
  
  const totalClosed = closedTrades.length;
  const winRate = totalClosed > 0 ? ((winTrades.length / totalClosed) * 100).toFixed(1) : "0.0";
  const lossRate = totalClosed > 0 ? ((lossTrades.length / totalClosed) * 100).toFixed(1) : "0.0";
  const totalPnl = trades.reduce((sum, t) => sum + (t.pnl ? parseFloat(t.pnl) : 0), 0);

  return (
    <div className="border border-white/5 bg-white/[0.01] rounded-xl overflow-hidden transition-all duration-300 hover:border-white/10">
      {/* Header */}
      <div 
        onClick={() => setExpanded(!expanded)}
        className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
            type === 'live' 
              ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' 
              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
          }`}>
            <Activity size={14} />
          </div>
          <div>
            <div className="font-bold text-white text-xs uppercase tracking-wider">{bot.name}</div>
            <div className="text-[10px] text-[#6a6a75] font-mono mt-0.5">{bot.pair} • Strategy: {bot.bot_type.toUpperCase()} • Owner: {bot.username}</div>
          </div>
        </div>

        {/* Stats on the right */}
        <div className="flex items-center gap-4 text-[10px] font-mono font-bold">
          <div className="flex flex-col items-end">
            <span className="text-[#86868b] uppercase tracking-wider text-[8px]">Win / Loss Rate</span>
            <span className="text-white mt-0.5">
              <span className="text-emerald-400">{winRate}%</span> / <span className="text-red-400">{lossRate}%</span>
            </span>
          </div>
          <div className="flex flex-col items-end border-l border-white/5 pl-4">
            <span className="text-[#86868b] uppercase tracking-wider text-[8px]">Total Profit</span>
            <span className={`mt-0.5 ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col items-end border-l border-white/5 pl-4">
            <span className="text-[#86868b] uppercase tracking-wider text-[8px]">Trades / Errors</span>
            <span className="text-slate-300 mt-0.5">
              {trades.length} / <span className={errors.length > 0 ? 'text-red-400 font-black' : 'text-[#6a6a75]'}>{errors.length}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Log Details */}
      {expanded && (
        <div className="border-t border-white/5 bg-black/20 p-4 space-y-4 animate-in fade-in duration-200">
          <div className="flex gap-2 border-b border-white/5 pb-2">
            <button
              onClick={() => setSubTab('trades')}
              className={`px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-all border ${
                subTab === 'trades'
                  ? 'bg-white/5 text-white border-white/10'
                  : 'bg-transparent text-[#86868b] border-transparent hover:text-white'
              }`}
            >
              Trades Log ({trades.length})
            </button>
            <button
              onClick={() => setSubTab('errors')}
              className={`px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-all border ${
                subTab === 'errors'
                  ? 'bg-white/5 text-white border-white/10'
                  : 'bg-transparent text-[#86868b] border-transparent hover:text-white'
              }`}
            >
              Errors Log ({errors.length})
            </button>
          </div>

          {subTab === 'trades' ? (
            <div className="overflow-x-auto">
              {trades.length === 0 ? (
                <div className="py-8 text-center text-[#6a6a75] uppercase text-[9px] tracking-widest font-bold">
                  No trades executed by this bot yet.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-[#6a6a75] border-b border-white/5 uppercase text-[9px] font-bold tracking-widest">
                      <th className="py-2">Time</th>
                      <th className="py-2">Side</th>
                      <th className="py-2 text-right">Price</th>
                      <th className="py-2 text-right">Amount</th>
                      <th className="py-2 text-right">PnL</th>
                      <th className="py-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                    {trades.slice(0, 10).map((t) => (
                      <tr key={t.id} className="hover:bg-white/[0.01]">
                        <td className="py-2 text-slate-400">{new Date(t.created_at).toLocaleString()}</td>
                        <td className="py-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                            t.side.toUpperCase() === 'BUY'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}>
                            {t.side}
                          </span>
                        </td>
                        <td className="py-2 text-right text-slate-200">${parseFloat(t.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</td>
                        <td className="py-2 text-right text-slate-200">{parseFloat(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</td>
                        <td className={`py-2 text-right font-bold ${
                          t.pnl === null ? 'text-slate-500' : parseFloat(t.pnl) >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {t.pnl === null ? '-' : `${parseFloat(t.pnl) >= 0 ? '+' : ''}$${parseFloat(t.pnl).toFixed(2)}`}
                        </td>
                        <td className="py-2 text-right text-slate-400 text-[10px]">{t.status || 'COMPLETED'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {errors.length === 0 ? (
                <div className="py-8 text-center text-emerald-500/80 uppercase text-[9px] tracking-widest font-bold">
                  All systems operating cleanly. Zero error logs.
                </div>
              ) : (
                <div className="divide-y divide-white/5 font-mono text-[11px] max-h-60 overflow-y-auto custom-scrollbar">
                  {errors.map((err) => (
                    <div key={err.id} className="py-2.5 space-y-1">
                      <div className="flex justify-between text-[10px] text-[#6a6a75]">
                        <span>Time: {new Date(err.created_at).toLocaleString()}</span>
                        <span className="text-red-400 font-bold uppercase">Code: {err.error_code || 'EXEC_FAIL'}</span>
                      </div>
                      <div className="text-red-300 bg-red-950/20 border border-red-500/10 p-2 rounded-lg text-xs leading-relaxed">
                        {err.error_message || 'Unknown network or execution failure during strategy execution.'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface BotDetailsModalProps {
  selectedBot: AdminBot;
  onClose: () => void;
  mode: 'live' | 'simulation' | 'logs';
  liveBots: AdminBot[];
  liveTrades: any[];
  simTrades: any[];
  detailTab: 'overview' | 'jurnal' | 'errors' | 'json';
  setDetailTab: (t: 'overview' | 'jurnal' | 'errors' | 'json') => void;
  toggleStatus: (id: number, status: string | null) => void;
  isBotRunning: (s: string | null) => boolean;
}

function BotDetailsModal({
  selectedBot,
  onClose,
  mode,
  liveBots,
  liveTrades,
  simTrades,
  detailTab,
  setDetailTab,
  toggleStatus,
  isBotRunning
}: BotDetailsModalProps) {
  // All computations outside the return block!
  const isLive = mode === 'live' || liveBots.some(b => b.id === selectedBot.id && b.user_id === selectedBot.user_id);
  const tradesToFilter = isLive ? liveTrades : simTrades;
  
  const botTrades = tradesToFilter.filter(t => {
    const sameUser = t.user_id === selectedBot.user_id;
    const samePair = t.pair.toLowerCase() === selectedBot.pair.toLowerCase();
    const strategyMatch = t.strategy_type.toLowerCase() === selectedBot.bot_type.toLowerCase() ||
      (t.strategy_type.toLowerCase().startsWith('dca') && selectedBot.bot_type.toLowerCase().startsWith('dca')) ||
      (t.strategy_type.toLowerCase().startsWith('grid') && selectedBot.bot_type.toLowerCase().startsWith('grid'));
    return sameUser && samePair && strategyMatch;
  });

  const botErrors = botTrades.filter(t => t.error_code || t.error_message);

  const closedTrades = botTrades.filter(t => t.pnl !== null && parseFloat(t.pnl) !== 0);
  const winTrades = closedTrades.filter(t => parseFloat(t.pnl) > 0);
  const lossTrades = closedTrades.filter(t => parseFloat(t.pnl) < 0);
  
  const totalClosed = closedTrades.length;
  const winRate = totalClosed > 0 ? ((winTrades.length / totalClosed) * 100).toFixed(1) : "0.0";
  const lossRate = totalClosed > 0 ? ((lossTrades.length / totalClosed) * 100).toFixed(1) : "0.0";
  const totalPnl = botTrades.reduce((sum, t) => sum + (t.pnl ? parseFloat(t.pnl) : 0), 0);

  const running = isBotRunning(selectedBot.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#0c0d12] border border-white/10 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-white/5 bg-white/[0.01]">
          <div>
            <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
              <Activity size={16} className={`${isLive ? 'text-sky-400' : 'text-indigo-400'} animate-pulse`} />
              {isLive ? 'Live Bot' : 'Simulation Lab Bot'} #{selectedBot.id} Configuration
            </h3>
            <p className="text-[10px] text-[#6a6a75] mt-0.5">{selectedBot.name}</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-[#86868b] hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab switchers in details modal */}
        <div className="flex border-b border-white/5 bg-[#08090d] px-5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setDetailTab('overview')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              detailTab === 'overview'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-[#86868b] hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setDetailTab('jurnal')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              detailTab === 'jurnal'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-[#86868b] hover:text-white'
            }`}
          >
            Logs Jual Beli ({botTrades.length})
          </button>
          <button
            onClick={() => setDetailTab('errors')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              detailTab === 'errors'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-[#86868b] hover:text-white'
            }`}
          >
            Logs Eror ({botErrors.length})
          </button>
          <button
            onClick={() => setDetailTab('json')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              detailTab === 'json'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-[#86868b] hover:text-white'
            }`}
          >
            Configuration (JSON)
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[50vh] overflow-y-auto custom-scrollbar">
          {detailTab === 'overview' && (
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
                <span className={`uppercase font-bold ${running ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {selectedBot.status || 'STOPPED'}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-white/5">
                <span className="text-[#86868b] uppercase tracking-wider text-[10px]">Owner Account</span>
                <span className="text-slate-200">{selectedBot.username}</span>
              </div>
              
              {/* Win / Loss Rates Info */}
              <div className="flex justify-between py-3 border-b border-white/5 font-mono">
                <span className="text-[#86868b] uppercase tracking-wider text-[10px] font-sans">Win Rate / Loss Rate</span>
                <span>
                  <span className="text-emerald-400 font-bold">{winRate}%</span> / <span className="text-red-400 font-bold">{lossRate}%</span>
                </span>
              </div>
              <div className="flex justify-between py-3 font-mono">
                <span className="text-[#86868b] uppercase tracking-wider text-[10px] font-sans">Total Net Profit</span>
                <span className={totalPnl >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                  {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {detailTab === 'jurnal' && (
            <div className="space-y-3">
              <span className="text-[9px] text-[#6a6a75] uppercase font-bold tracking-wider block">Jurnal Riwayat Jual Beli</span>
              {botTrades.length === 0 ? (
                <div className="py-8 text-center text-[#6a6a75] uppercase text-[9px] tracking-widest font-bold">
                  No trades executed by this bot yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-[#6a6a75] border-b border-white/5 uppercase text-[9px] font-bold tracking-widest">
                        <th className="py-2">Time</th>
                        <th className="py-2">Side</th>
                        <th className="py-2 text-right">Price</th>
                        <th className="py-2 text-right">PnL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                      {botTrades.map((t) => {
                        const tradePnl = t.pnl === null ? 0 : parseFloat(t.pnl);
                        return (
                          <tr key={t.id} className="hover:bg-white/[0.01]">
                            <td className="py-2 text-slate-400">{new Date(t.created_at).toLocaleString()}</td>
                            <td className="py-2">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                t.side.toUpperCase() === 'BUY'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-red-500/10 text-red-400'
                              }`}>
                                {t.side}
                              </span>
                            </td>
                            <td className="py-2 text-right text-slate-200">${parseFloat(t.price).toLocaleString()}</td>
                            <td className={`py-2 text-right font-bold ${
                              t.pnl === null ? 'text-slate-500' : tradePnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                              {t.pnl === null ? '-' : `${tradePnl >= 0 ? '+' : ''}$${tradePnl.toFixed(2)}`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {detailTab === 'errors' && (
            <div className="space-y-3">
              <span className="text-[9px] text-[#6a6a75] uppercase font-bold tracking-wider block">Jurnal Log Error Strategi</span>
              {botErrors.length === 0 ? (
                <div className="py-8 text-center text-emerald-500/80 uppercase text-[9px] tracking-widest font-bold">
                  All systems operating cleanly. Zero error logs.
                </div>
              ) : (
                <div className="divide-y divide-white/5 font-mono text-[11px] space-y-3">
                  {botErrors.map((err) => (
                    <div key={err.id} className="py-2 space-y-1">
                      <div className="flex justify-between text-[10px] text-[#6a6a75]">
                        <span>Time: {new Date(err.created_at).toLocaleString()}</span>
                        <span className="text-red-400 font-bold uppercase">Code: {err.error_code || 'EXEC_FAIL'}</span>
                      </div>
                      <div className="text-red-300 bg-red-950/20 border border-red-500/10 p-2 rounded-lg text-xs leading-relaxed">
                        {err.error_message || 'Unknown network or execution failure during strategy execution.'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {detailTab === 'json' && (
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
            }}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer border ${
              running
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500 hover:text-black'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-black'
            }`}
          >
            {running ? 'Pause Bot' : 'Start Bot'}
          </button>
          <button 
            onClick={onClose}
            className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors border border-white/10 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
