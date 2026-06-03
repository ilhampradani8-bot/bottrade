"use client";

import React, { useEffect, useState } from 'react';
import { 
  UserPlus, 
  Search, 
  MoreVertical, 
  Shield, 
  User as UserIcon,
  Mail,
  Calendar,
  RefreshCcw,
  UserCheck,
  UserX,
  Clock
} from 'lucide-react';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string | null;
  status: string | null;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://139.59.122.230:8080/api/admin/users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const changeStatus = async (id: number, nextStatus: string) => {
    try {
      await fetch(`http://139.59.122.230:8080/api/admin/users/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      fetchUsers();
    } catch (err) {
      alert("Failed to update user status");
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">User Directory</h1>
          <p className="text-[#6a6a75] text-sm mt-1">Manage trader access levels and security status from SQL database.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchUsers}
            className="bg-white/5 border border-white/10 p-2 text-white hover:text-[#00f2ff] transition-all rounded-xl"
          >
            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button className="bg-[#00f2ff] text-[#050507] px-4 py-2 text-sm font-bold flex items-center gap-2 hover:bg-[#00d8e6] transition-all rounded-xl">
            <UserPlus size={18} />
            ADD NEW USER
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6a6a75]" size={18} />
          <input 
            type="text" 
            placeholder="Search by Name, Email, or ID..." 
            className="w-full bg-white/[0.03] border border-white/5 pl-12 pr-4 py-3 rounded-2xl text-sm focus:outline-none focus:border-[#00f2ff] transition-all text-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-[#6a6a75] animate-pulse font-bold tracking-widest uppercase text-xs">
          Fetching Secure Directory...
        </div>
      ) : (
        <div className="bg-white/[0.03] border border-white/5 rounded-3xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[#6a6a75] border-b border-white/5 uppercase text-[10px] font-bold tracking-widest bg-white/[0.02]">
                <th className="px-8 py-5">User Profile</th>
                <th className="px-8 py-5">System Role</th>
                <th className="px-8 py-5">Joined Date</th>
                <th className="px-8 py-5">Account Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-[#00f2ff]">
                        <UserIcon size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-white tracking-tight">{user.username}</div>
                        <div className="text-[10px] text-[#6a6a75] flex items-center gap-1 mt-0.5">
                          <Mail size={10} />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-white/80">
                      <Shield size={14} className={user.role === 'admin' ? 'text-[#7000ff]' : 'text-[#00f2ff]'} />
                      <span className="text-[11px] font-bold uppercase tracking-wider">{user.role ? user.role : 'TRADER'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-[#6a6a75]">
                    <div className="flex items-center gap-2 text-[11px] font-medium">
                      <Calendar size={14} />
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold border ${
                      user.status === 'Aktif' 
                        ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20' 
                        : user.status === 'Blokir'
                        ? 'bg-[#ff0055]/10 text-[#ff0055] border-[#ff0055]/20'
                        : 'bg-[#ffcc00]/10 text-[#ffcc00] border-[#ffcc00]/20'
                    }`}>
                        {user.status === 'Aktif' ? <UserCheck size={12} /> : user.status === 'Blokir' ? <UserX size={12} /> : <Clock size={12} />}
                        {user.status ? user.status.toUpperCase() : 'PENDING'}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => changeStatus(user.id, 'Aktif')}
                            title="Set to Aktif"
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black transition-all"
                        >
                            <UserCheck size={16} />
                        </button>
                        <button 
                            onClick={() => changeStatus(user.id, 'Blokir')}
                            title="Set to Blokir"
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-black transition-all"
                        >
                            <UserX size={16} />
                        </button>
                        <button 
                             onClick={() => changeStatus(user.id, 'Pending')}
                             title="Set to Pending"
                             className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black transition-all"
                        >
                            <Clock size={16} />
                        </button>
                        <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-white hover:bg-white hover:text-black transition-all">
                            <MoreVertical size={16} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
