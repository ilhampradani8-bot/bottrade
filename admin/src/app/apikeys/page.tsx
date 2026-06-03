"use client";

import React, { useEffect, useState } from 'react';
import { 
  Key, 
  Search, 
  RefreshCcw,
  User as UserIcon,
  ShieldCheck,
  Calendar,
  ExternalLink
} from 'lucide-react';

interface AdminApiKey {
  id: number;
  username: string;
  platform_name: string;
  label: string;
  created_at: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<AdminApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://139.59.122.230:8080/api/admin/api-keys');
      const data = await res.json();
      setKeys(data);
    } catch (err) {
      console.error("Failed to fetch API keys:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Global API Gateway</h1>
          <p className="text-[#6a6a75] text-sm mt-1">Audit of connected exchange accounts and credential metadata.</p>
        </div>
        <button 
          onClick={fetchKeys}
          className="bg-white/5 border border-white/10 p-2 text-white hover:text-[#00f2ff] transition-all rounded-xl"
        >
          <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-[#6a6a75] animate-pulse font-bold tracking-widest uppercase text-xs">
          Verifying Credential Chains...
        </div>
      ) : (
        <div className="bg-white/[0.03] border border-white/5 rounded-3xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead>
              <tr className="text-[#6a6a75] border-b border-white/5 uppercase text-[10px] font-bold tracking-widest bg-white/[0.02]">
                <th className="px-8 py-5">Credential ID</th>
                <th className="px-8 py-5">Account Owner</th>
                <th className="px-8 py-5">Platform / Label</th>
                <th className="px-8 py-5">Added On</th>
                <th className="px-8 py-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {keys.map((key) => (
                <tr key={key.id} className="hover:bg-white/[0.02] transition-colors">
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
                    <div className="inline-flex items-center gap-1.5 text-emerald-500 text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                        <ShieldCheck size={12} />
                        ENCRYPTED
                    </div>
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
  );
}
