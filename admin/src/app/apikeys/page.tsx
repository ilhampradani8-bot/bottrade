"use client";

import React, { useEffect, useState } from 'react';
import { 
  Key, 
  Search, 
  RefreshCcw,
  User as UserIcon,
  ShieldCheck,
  Calendar,
  ExternalLink,
  X
} from 'lucide-react';

interface AdminApiKey {
  id: number;
  username: string;
  platform_name: string;
  label: string;
  created_at: string;
  status: string | null;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<AdminApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<AdminApiKey | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  const getStatusBadge = (status: string | null | undefined) => {
    const s = status ? status.toLowerCase() : 'terverifikasi';
    if (s === 'blokir') {
      return (
        <div className="inline-flex items-center gap-1.5 text-red-500 text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-red-500/10 rounded-full border border-red-500/20">
            <X size={12} />
            BLOKIR
        </div>
      );
    }
    if (s === 'izin trade salah' || s === 'izin_trade_salah') {
      return (
        <div className="inline-flex items-center gap-1.5 text-amber-500 text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
            <ShieldCheck size={12} className="text-amber-500" />
            IZIN TRADE SALAH
        </div>
      );
    }
    if (s === 'apikey kadaluarsa' || s === 'apikey_kadaluarsa' || s === 'kadaluarsa' || s === 'expired') {
      return (
        <div className="inline-flex items-center gap-1.5 text-rose-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-rose-500/10 rounded-full border border-rose-500/20">
            <Calendar size={12} />
            EXPIRED
        </div>
      );
    }
    // Default / Terverifikasi
    return (
      <div className="inline-flex items-center gap-1.5 text-emerald-500 text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
          <ShieldCheck size={12} />
          {s.toUpperCase()}
      </div>
    );
  };

  const fetchKeys = async () => {
    try {
      setLoading(true);
      window.dispatchEvent(new Event('admin_loading_start'));
      const apiHost = window.location.hostname;
      const res = await fetch(`http://${apiHost}:8080/api/admin/api-keys`);
      const data = await res.json();
      setKeys(data);
    } catch (err) {
      console.error("Failed to fetch API keys:", err);
    } finally {
      setLoading(false);
      window.dispatchEvent(new Event('admin_loading_end'));
    }
  };

  const fetchUsers = async () => {
    try {
      const apiHost = window.location.hostname;
      const res = await fetch(`http://${apiHost}:8080/api/admin/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const updateKeyStatus = async (keyId: number, newStatus: string) => {
    try {
      const apiHost = window.location.hostname;
      const res = await fetch(`http://${apiHost}:8080/api/admin/api-keys/${keyId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setKeys(prev => prev.map(k => k.id === keyId ? { ...k, status: newStatus } : k));
        setSelectedKey(prev => prev && prev.id === keyId ? { ...prev, status: newStatus } : prev);
      } else {
        console.error("Failed to update status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  useEffect(() => {
    fetchKeys();
    fetchUsers();

    const handleRefresh = () => {
      fetchKeys();
      fetchUsers();
    };

    window.addEventListener('admin_refresh', handleRefresh);
    return () => {
      window.removeEventListener('admin_refresh', handleRefresh);
    };
  }, []);

  return (
    <div className="w-[calc(100%+4rem)] -mx-8 -my-8 flex flex-col lg:flex-row h-[calc(100vh-80px)] overflow-hidden">
      {/* Table Container */}
      <div className={`flex flex-col h-full min-w-0 transition-all duration-300 ${selectedKey ? 'lg:w-[62%] w-full' : 'w-full'}`}>
        {loading ? (
          <div className="flex-grow flex items-center justify-center text-[#6a6a75] animate-pulse font-bold tracking-widest uppercase text-xs">
            Verifying Credential Chains...
          </div>
        ) : (
          <div className="flex-grow overflow-y-auto overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm border-collapse min-w-[800px]">
              <thead>
                <tr className="text-[#6a6a75] border-b border-white/5 uppercase text-[10px] font-bold tracking-widest bg-[#050507] sticky top-0 z-10">
                  <th className="px-8 py-5 bg-[#050507]">Credential ID</th>
                  <th className="px-8 py-5 bg-[#050507]">Account Owner</th>
                  <th className="px-8 py-5 bg-[#050507]">Platform / Label</th>
                  <th className="px-8 py-5 bg-[#050507]">Added On</th>
                  <th className="px-8 py-5 text-right bg-[#050507]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {keys.map((key) => (
                  <tr 
                    key={key.id} 
                    onClick={() => setSelectedKey(key)}
                    className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${
                      selectedKey?.id === key.id ? 'bg-white/[0.03] text-white' : ''
                    }`}
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#00f2ff]">
                              <Key size={18} />
                          </div>
                          <div className="font-mono text-white text-xs">
                              #KEY-{key.id.toString().padStart(5, '0')}
                          </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-white font-semibold">
                          <UserIcon size={14} className="text-[#6a6a75]" />
                          {key.username}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                          <div className="px-2 py-1 bg-[#00f2ff]/10 text-[#00f2ff] text-[10px] font-bold rounded-md uppercase tracking-wider border border-[#00f2ff]/20">
                              {key.platform_name}
                          </div>
                          <span className="text-[#6a6a75] text-[11px] font-medium">{key.label}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-[#6a6a75]">
                      <div className="flex items-center gap-2 text-[11px] font-medium">
                          <Calendar size={12} />
                          {new Date(key.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      {getStatusBadge(key.status)}
                    </td>
                  </tr>
                ))}
                {keys.length === 0 && (
                  <tr>
                      <td colSpan={5} className="px-8 py-20 text-center text-[#6a6a75] uppercase text-[10px] font-bold tracking-widest">
                          No API credentials detected in database
                      </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selectedKey && (() => {
        const selectedUser = users.find(
          (u) => u.username.toLowerCase() === selectedKey.username.toLowerCase()
        );

        return (
          <div className="lg:w-[38%] w-full h-full border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#00f2ff]/10 flex items-center justify-center text-[#00f2ff] border border-[#00f2ff]/20">
                  <Key size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Key Details</h3>
                  <p className="text-[10px] text-[#6a6a75] mt-0.5">Credential Metadata & Ownership</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedKey(null)}
                className="text-[#86868b] hover:text-white transition-colors cursor-pointer p-1"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Details */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* API Key Credentials */}
              <div className="space-y-3">
                <h4 className="text-[10px] uppercase font-extrabold text-[#86868b] tracking-wider">Credential Info</h4>
                <div className="space-y-1 font-semibold text-xs text-white">
                  <div className="flex justify-between py-2.5 border-b border-white/5">
                    <span className="text-[#86868b] uppercase tracking-wider text-[10px]">Credential ID</span>
                    <span className="font-mono text-slate-200">#KEY-{selectedKey.id.toString().padStart(5, '0')}</span>
                  </div>
                  <div className="flex justify-between py-2.5 border-b border-white/5">
                    <span className="text-[#86868b] uppercase tracking-wider text-[10px]">Platform</span>
                    <span className="px-2 py-0.5 bg-[#00f2ff]/10 text-[#00f2ff] text-[10px] font-bold rounded uppercase tracking-wider border border-[#00f2ff]/20">
                      {selectedKey.platform_name}
                    </span>
                  </div>
                  <div className="flex justify-between py-2.5 border-b border-white/5">
                    <span className="text-[#86868b] uppercase tracking-wider text-[10px]">Label</span>
                    <span className="text-slate-200">{selectedKey.label || '-'}</span>
                  </div>
                   <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                    <span className="text-[#86868b] uppercase tracking-wider text-[10px]">Status</span>
                    <div className="flex flex-col items-end gap-1.5">
                      <select
                        value={['terverifikasi', 'blokir', 'izin trade salah', 'apikey kadaluarsa'].includes((selectedKey.status || '').toLowerCase()) ? selectedKey.status || 'Terverifikasi' : 'Custom'}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val !== 'Custom') {
                            updateKeyStatus(selectedKey.id, val);
                          } else {
                            const customVal = prompt("Masukkan status custom:", selectedKey.status || "");
                            if (customVal !== null && customVal.trim() !== "") {
                              updateKeyStatus(selectedKey.id, customVal);
                            }
                          }
                        }}
                        className="bg-[#050507] text-slate-200 border border-white/10 rounded px-2 py-0.5 text-xs font-semibold focus:outline-none focus:border-[#00f2ff] cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <option value="Terverifikasi">Terverifikasi</option>
                        <option value="Blokir">Blokir</option>
                        <option value="Izin Trade Salah">Izin Trade Salah</option>
                        <option value="API Key Kadaluarsa">API Key Kadaluarsa</option>
                        <option value="Custom">Custom...</option>
                      </select>
                      {!['terverifikasi', 'blokir', 'izin trade salah', 'apikey kadaluarsa'].includes((selectedKey.status || '').toLowerCase()) && selectedKey.status && (
                        <input 
                          type="text" 
                          value={selectedKey.status}
                          onChange={(e) => updateKeyStatus(selectedKey.id, e.target.value)}
                          className="bg-[#050507] text-slate-200 border border-white/10 rounded px-2 py-0.5 text-xs font-semibold focus:outline-none focus:border-[#00f2ff] max-w-[150px] text-right"
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span className="text-[#86868b] uppercase tracking-wider text-[10px]">Added On</span>
                    <span className="text-slate-200">{new Date(selectedKey.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Owner Profile */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] uppercase font-extrabold text-[#86868b] tracking-wider">Owner Profile</h4>
                {selectedUser ? (
                  <div className="space-y-1 font-semibold text-xs text-white">
                    <div className="flex justify-between py-2.5 border-b border-white/5">
                      <span className="text-[#86868b] uppercase tracking-wider text-[10px]">Username</span>
                      <span className="text-slate-200">{selectedUser.username}</span>
                    </div>
                    <div className="flex justify-between py-2.5 border-b border-white/5">
                      <span className="text-[#86868b] uppercase tracking-wider text-[10px]">Email</span>
                      <span className="text-slate-200 truncate max-w-[180px]" title={selectedUser.email}>{selectedUser.email}</span>
                    </div>
                    <div className="flex justify-between py-2.5 border-b border-white/5">
                      <span className="text-[#86868b] uppercase tracking-wider text-[10px]">WhatsApp</span>
                      <span className="font-mono text-slate-200">{selectedUser.whatsapp_number || '-'}</span>
                    </div>
                    <div className="flex justify-between py-2.5 border-b border-white/5">
                      <span className="text-[#86868b] uppercase tracking-wider text-[10px]">Telegram</span>
                      <span className="font-mono text-slate-200">{selectedUser.telegram || '-'}</span>
                    </div>
                    <div className="flex justify-between py-2.5 border-b border-white/5">
                      <span className="text-[#86868b] uppercase tracking-wider text-[10px]">Role</span>
                      <span className="text-slate-200 uppercase">{selectedUser.role || 'TRADER'}</span>
                    </div>
                    <div className="flex justify-between py-2.5">
                      <span className="text-[#86868b] uppercase tracking-wider text-[10px]">Account Status</span>
                      <span className={
                        selectedUser.status?.toLowerCase() === 'aktif'
                          ? 'text-emerald-400 font-bold'
                          : selectedUser.status?.toLowerCase() === 'blokir'
                          ? 'text-red-400 font-bold'
                          : 'text-amber-400 font-bold'
                      }>
                        {selectedUser.status ? selectedUser.status.toUpperCase() : 'PENDING'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[#6a6a75] text-xs italic py-2">
                    Profile information not found in directory.
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
