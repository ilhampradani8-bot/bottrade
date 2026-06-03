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
  Filter,
  ExternalLink
} from 'lucide-react';

interface AdminBot {
  id: number;
  user_id: number;
  name: string;
  bot_type: string;
  pair: string;
  status: string | null;
  username: string;
}

export default function BotsPage() {
  const [bots, setBots] = useState<AdminBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const fetchBots = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://139.59.122.230:8080/api/admin/bots');
      const data = await res.json();
      setBots(data);
    } catch (err) {
      console.error("Failed to fetch bots:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBots();
  }, []);

  const toggleStatus = async (id: number, currentStatus: string | null) => {
    const nextStatus = currentStatus === 'Running' ? 'Stopped' : 'Running';
    try {
      await fetch(`http://139.59.122.230:8080/api/admin/bots/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      fetchBots();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const filteredBots = bots.filter(bot => {
    const matchesSearch = bot.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          bot.pair.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          bot.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || bot.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Bots (Global Fleet)</h1>
          <p className="text-[#6a6a75] text-sm mt-1">Full management of all trading engines across the platform.</p>
        </div>
        <button 
          onClick={fetchBots}
          className="bg-white/5 border border-white/10 p-2 text-white hover:text-[#00f2ff] transition-all rounded-xl"
        >
          <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Controls: Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6a6a75]" size={18} />
          <input 
            type="text" 
            placeholder="Search by Bot Name, Pair, or Owner..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/5 pl-12 pr-4 py-3 rounded-2xl text-sm focus:outline-none focus:border-[#00f2ff] transition-all text-white"
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white/[0.03] border border-white/5 px-6 py-3 rounded-2xl text-sm text-white focus:outline-none focus:border-[#00f2ff]"
          >
            <option value="All">All Status</option>
            <option value="Running">Running</option>
            <option value="Stopped">Stopped</option>
            <option value="Paused">Paused</option>
          </select>
        </div>
      </div>

      {/* Bots Table */}
      {loading ? (
        <div className="h-64 flex items-center justify-center text-[#6a6a75] animate-pulse font-bold tracking-widest uppercase text-xs">
          Syncing with SQL Engine...
        </div>
      ) : (
        <div className="bg-white/[0.03] border border-white/5 rounded-3xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[1000px]">
            <thead>
              <tr className="text-[#6a6a75] border-b border-white/5 uppercase text-[10px] font-bold tracking-widest bg-white/[0.02]">
                <th className="px-8 py-5">Bot Engine</th>
                <th className="px-8 py-5">Owner</th>
                <th className="px-8 py-5">Pair / Symbol</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredBots.map((bot) => (
                <tr key={bot.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bot.status === 'Running' ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'bg-white/5 text-[#6a6a75]'}`}>
                            <Activity size={20} />
                        </div>
                        <div>
                            <div className="font-bold text-white tracking-tight">{bot.name}</div>
                            <div className="text-[10px] text-[#6a6a75] font-mono mt-0.5">ID: #ENGINE-{bot.id}</div>
                        </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-white/80">
                        <UserIcon size={14} className="text-[#00f2ff]" />
                        <span className="font-semibold">{bot.username}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#00f2ff]">{bot.pair}</span>
                        <div className="px-2 py-0.5 bg-white/5 text-[9px] font-bold rounded-md text-[#6a6a75]">{bot.bot_type.toUpperCase()}</div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold ${
                        bot.status === 'Running' 
                        ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20' 
                        : 'bg-white/5 text-[#6a6a75] border border-white/10'
                    }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${bot.status === 'Running' ? 'bg-[#00ff88] animate-pulse' : 'bg-[#6a6a75]'}`}></div>
                        {bot.status ? bot.status.toUpperCase() : 'STOPPED'}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => toggleStatus(bot.id, bot.status)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-white hover:bg-[#00f2ff] hover:text-black transition-all"
                        >
                            {bot.status === 'Running' ? <Pause size={16} /> : <Play size={16} />}
                        </button>
                        <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-white hover:bg-[#ff0055] transition-all">
                            <Square size={16} />
                        </button>
                        <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-white hover:bg-white hover:text-black transition-all">
                            <Settings2 size={16} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBots.length === 0 && (
                <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-[#6a6a75] uppercase text-[10px] font-bold tracking-widest">
                        Zero engines detected matching criteria
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
