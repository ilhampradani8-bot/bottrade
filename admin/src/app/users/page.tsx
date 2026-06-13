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
  Clock,
  X,
  ArrowUpDown,
  Trash2,
  Edit,
  Info,
  Check,
  Bell,
  Volume2
} from 'lucide-react';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string | null;
  status: string | null;
  notif_signal_enabled: boolean | null;
  notif_marketing_enabled: boolean | null;
  email_verified: boolean | null;
  created_at: string;
  whatsapp_number: string | null;
  telegram: string | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtering states
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [signalFilter, setSignalFilter] = useState('all');
  const [marketingFilter, setMarketingFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState('all');

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: keyof AdminUser | 'none'; direction: 'asc' | 'desc' }>({
    key: 'none',
    direction: 'asc'
  });

  // Modal states
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'info' | 'edit' | 'tindakan'>('info');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states for Add User
  const [addUsername, setAddUsername] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addWhatsappNumber, setAddWhatsappNumber] = useState('');
  const [addTelegramId, setAddTelegramId] = useState('');
  const [addRole, setAddRole] = useState('trader');
  const [addStatus, setAddStatus] = useState('Aktif');
  const [addSignalNotif, setAddSignalNotif] = useState(true);
  const [addMarketingNotif, setAddMarketingNotif] = useState(false);
  const [addEmailVerified, setAddEmailVerified] = useState(false);

  // Form states for Edit User
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editWhatsappNumber, setEditWhatsappNumber] = useState('');
  const [editTelegramId, setEditTelegramId] = useState('');
  const [editRole, setEditRole] = useState('trader');
  const [editStatus, setEditStatus] = useState('Aktif');
  const [editSignalNotif, setEditSignalNotif] = useState(true);
  const [editMarketingNotif, setEditMarketingNotif] = useState(false);
  const [editEmailVerified, setEditEmailVerified] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const apiHost = window.location.hostname;
      const res = await fetch(`http://${apiHost}:8080/api/admin/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSort = (key: keyof AdminUser) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleOpenDetail = (user: AdminUser) => {
    setSelectedUser(user);
    setEditUsername(user.username);
    setEditEmail(user.email);
    setEditPassword('');
    setEditWhatsappNumber(user.whatsapp_number || '');
    setEditTelegramId(user.telegram || '');
    setEditRole(user.role || 'trader');
    setEditStatus(user.status || 'Aktif');
    setEditSignalNotif(user.notif_signal_enabled ?? true);
    setEditMarketingNotif(user.notif_marketing_enabled ?? false);
    setEditEmailVerified(user.email_verified ?? false);
    setActiveModalTab('info');
    setIsDetailModalOpen(true);
  };

  const changeStatusDirectly = async (id: number, nextStatus: string) => {
    try {
      const apiHost = window.location.hostname;
      const res = await fetch(`http://${apiHost}:8080/api/admin/users/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        fetchUsers();
        if (selectedUser && selectedUser.id === id) {
          setSelectedUser(prev => prev ? { ...prev, status: nextStatus } : null);
          setEditStatus(nextStatus);
        }
      } else {
        alert("Gagal merubah status pengguna");
      }
    } catch (err) {
      alert("Gagal merubah status pengguna");
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUsername || !addEmail) {
      alert("Username dan Email wajib diisi");
      return;
    }
    try {
      const apiHost = window.location.hostname;
      const res = await fetch(`http://${apiHost}:8080/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: addUsername,
          email: addEmail,
          password: addPassword || "123456",
          whatsapp_number: addWhatsappNumber || null,
          telegram: addTelegramId || null,
          role: addRole,
          status: addStatus,
          notif_signal_enabled: addSignalNotif,
          notif_marketing_enabled: addMarketingNotif,
          email_verified: addEmailVerified
        })
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        // Clear fields
        setAddUsername('');
        setAddEmail('');
        setAddPassword('');
        setAddWhatsappNumber('');
        setAddTelegramId('');
        setAddRole('trader');
        setAddStatus('Aktif');
        setAddSignalNotif(true);
        setAddMarketingNotif(false);
        setAddEmailVerified(false);
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal menambah user baru");
      }
    } catch (err) {
      alert("Gagal menghubungi server");
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const apiHost = window.location.hostname;
      const res = await fetch(`http://${apiHost}:8080/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: editUsername,
          email: editEmail,
          password: editPassword || null,
          whatsapp_number: editWhatsappNumber || null,
          telegram: editTelegramId || null,
          role: editRole,
          status: editStatus,
          notif_signal_enabled: editSignalNotif,
          notif_marketing_enabled: editMarketingNotif,
          email_verified: editEmailVerified
        })
      });

      if (res.ok) {
        setIsDetailModalOpen(false);
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal memperbarui user");
      }
    } catch (err) {
      alert("Gagal menghubungi server");
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pengguna ini secara permanen dari database?")) {
      return;
    }
    try {
      const apiHost = window.location.hostname;
      const res = await fetch(`http://${apiHost}:8080/api/admin/users/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setIsDetailModalOpen(false);
        fetchUsers();
      } else {
        alert("Gagal menghapus user");
      }
    } catch (err) {
      alert("Gagal menghubungi server");
    }
  };

  // Filter and Sort users list
  let filteredUsers = [...users];

  if (searchQuery) {
    const term = searchQuery.toLowerCase();
    filteredUsers = filteredUsers.filter(u => 
      u.username.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.id.toString().includes(term)
    );
  }

  if (roleFilter !== 'all') {
    filteredUsers = filteredUsers.filter(u => (u.role || 'trader').toLowerCase() === roleFilter.toLowerCase());
  }

  if (statusFilter !== 'all') {
    filteredUsers = filteredUsers.filter(u => (u.status || 'pending').toLowerCase() === statusFilter.toLowerCase());
  }

  if (signalFilter !== 'all') {
    const val = signalFilter === 'on';
    filteredUsers = filteredUsers.filter(u => (u.notif_signal_enabled ?? true) === val);
  }

  if (marketingFilter !== 'all') {
    const val = marketingFilter === 'on';
    filteredUsers = filteredUsers.filter(u => (u.notif_marketing_enabled ?? false) === val);
  }

  if (verifiedFilter !== 'all') {
    const val = verifiedFilter === 'verified';
    filteredUsers = filteredUsers.filter(u => (u.email_verified ?? false) === val);
  }

  // Apply sorting
  if (sortConfig.key !== 'none') {
    filteredUsers.sort((a, b) => {
      const key = sortConfig.key as keyof AdminUser;
      let valA = a[key];
      let valB = b[key];

      if (valA === null || valA === undefined) valA = '';
      if (valB === null || valB === undefined) valB = '';

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortConfig.direction === 'asc' 
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        return sortConfig.direction === 'asc'
          ? (valA > valB ? 1 : -1)
          : (valB > valA ? 1 : -1);
      }
    });
  }

  return (
    <div className="w-full px-0 space-y-6">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6a6a75]" size={14} />
            <input 
              type="text" 
              placeholder="Search by Name, Email, ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 pl-9 pr-3 py-2 rounded-xl text-xs focus:outline-none focus:border-sky-500/50 transition-all text-white placeholder:text-[#6a6a75]"
            />
          </div>

          <button 
            onClick={() => {
              setSearchQuery('');
              setRoleFilter('all');
              setStatusFilter('all');
              setSignalFilter('all');
              setMarketingFilter('all');
              setVerifiedFilter('all');
              setSortConfig({ key: 'none', direction: 'asc' });
            }}
            className="bg-white/5 border border-white/10 px-3 py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/[0.08] active:scale-[0.97] transition-all rounded-xl cursor-pointer flex items-center gap-1.5"
            title="Reset All Filters"
          >
            <X size={13} />
            Reset Filter
          </button>
        </div>

        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <button 
            onClick={fetchUsers}
            className="bg-white/5 border border-white/10 p-2 text-slate-400 hover:text-sky-400 hover:bg-white/[0.08] active:scale-[0.97] transition-all rounded-xl cursor-pointer"
            title="Refresh List"
          >
            <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.97] transition-all rounded-xl cursor-pointer border border-sky-400/20"
          >
            <UserPlus size={14} />
            Add New User
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-[#6a6a75] animate-pulse font-bold tracking-widest uppercase text-xs">
          Fetching Secure Directory...
        </div>
      ) : (
        <>
          <div className="-mx-8 overflow-x-auto w-[calc(100%+4rem)] border-t border-white/5 pb-3">
          <table className="w-full text-left text-sm border-collapse min-w-[1000px]">
            <thead>
              <tr className="text-[#6a6a75] border-b border-white/5 uppercase text-[10px] font-bold tracking-widest bg-white/[0.01]">
                {/* Index Col */}
                <th className="pl-8 pr-4 py-4 w-12 text-center">#</th>

                {/* ID Col */}
                <th className="px-4 py-4 w-20 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('id')}>
                  <div className="flex items-center gap-1">
                    ID
                    <ArrowUpDown size={12} className="opacity-60" />
                  </div>
                </th>

                {/* Profile Col */}
                <th className="px-4 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('username')}>
                  <div className="flex items-center gap-1">
                    User Profile
                    <ArrowUpDown size={12} className="opacity-60" />
                  </div>
                </th>

                {/* Role Filter Col */}
                <th className="px-4 py-4">
                  <div className="flex flex-col gap-1">
                    <span>Role</span>
                    <select 
                      value={roleFilter} 
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="bg-transparent text-[10px] text-sky-400 font-bold border-none focus:outline-none cursor-pointer p-0"
                    >
                      <option value="all" className="bg-[#0c0d12] text-white">ALL</option>
                      <option value="trader" className="bg-[#0c0d12] text-white">TRADER</option>
                      <option value="admin" className="bg-[#0c0d12] text-white">ADMIN</option>
                    </select>
                  </div>
                </th>

                {/* Verified Filter Col */}
                <th className="px-4 py-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span>Verified</span>
                    <select 
                      value={verifiedFilter} 
                      onChange={(e) => setVerifiedFilter(e.target.value)}
                      className="bg-transparent text-[10px] text-sky-400 font-bold border-none focus:outline-none cursor-pointer p-0"
                    >
                      <option value="all" className="bg-[#0c0d12] text-white">ALL</option>
                      <option value="verified" className="bg-[#0c0d12] text-white">VERIFIED</option>
                      <option value="unverified" className="bg-[#0c0d12] text-white">UNVERIFIED</option>
                    </select>
                  </div>
                </th>

                {/* Status Filter Col */}
                <th className="px-4 py-4">
                  <div className="flex flex-col gap-1">
                    <span>Status</span>
                    <select 
                      value={statusFilter} 
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-transparent text-[10px] text-sky-400 font-bold border-none focus:outline-none cursor-pointer p-0"
                    >
                      <option value="all" className="bg-[#0c0d12] text-white">ALL</option>
                      <option value="aktif" className="bg-[#0c0d12] text-white">AKTIF</option>
                      <option value="blokir" className="bg-[#0c0d12] text-white">BLOKIR</option>
                      <option value="pending" className="bg-[#0c0d12] text-white">PENDING</option>
                    </select>
                  </div>
                </th>

                {/* Signal Filter Col */}
                <th className="px-4 py-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span>Signal Notif</span>
                    <select 
                      value={signalFilter} 
                      onChange={(e) => setSignalFilter(e.target.value)}
                      className="bg-transparent text-[10px] text-sky-400 font-bold border-none focus:outline-none cursor-pointer p-0"
                    >
                      <option value="all" className="bg-[#0c0d12] text-white">ALL</option>
                      <option value="on" className="bg-[#0c0d12] text-white">ON</option>
                      <option value="off" className="bg-[#0c0d12] text-white">OFF</option>
                    </select>
                  </div>
                </th>

                {/* Marketing Filter Col */}
                <th className="px-4 py-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span>Promo Notif</span>
                    <select 
                      value={marketingFilter} 
                      onChange={(e) => setMarketingFilter(e.target.value)}
                      className="bg-transparent text-[10px] text-sky-400 font-bold border-none focus:outline-none cursor-pointer p-0"
                    >
                      <option value="all" className="bg-[#0c0d12] text-white">ALL</option>
                      <option value="on" className="bg-[#0c0d12] text-white">ON</option>
                      <option value="off" className="bg-[#0c0d12] text-white">OFF</option>
                    </select>
                  </div>
                </th>

                {/* Joined Col */}
                <th className="px-4 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('created_at')}>
                  <div className="flex items-center gap-1">
                    Joined Date
                    <ArrowUpDown size={12} className="opacity-60" />
                  </div>
                </th>

                {/* Actions Col */}
                <th className="pl-4 pr-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-[#6a6a75] italic">
                    No users found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-white/[0.02] transition-all cursor-pointer group"
                    onClick={() => handleOpenDetail(user)}
                  >
                    {/* Index */}
                    <td className="pl-8 pr-4 py-5 text-center text-[#6a6a75] font-mono text-xs">
                      {idx + 1}
                    </td>

                    {/* ID */}
                    <td className="px-4 py-5 font-mono text-xs text-sky-400/80">
                      #{user.id}
                    </td>

                    {/* Profile */}
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-sky-400 shrink-0">
                          <UserIcon size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-white tracking-tight truncate">{user.username}</div>
                          <div className="text-[10px] text-[#6a6a75] flex items-center gap-1 mt-0.5 truncate">
                            <Mail size={10} className="shrink-0" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-1.5 text-white/80">
                        <Shield size={12} className={user.role === 'admin' ? 'text-purple-400' : 'text-slate-400'} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{user.role ? user.role : 'TRADER'}</span>
                      </div>
                    </td>

                    {/* Verified */}
                    <td className="px-4 py-5 text-center">
                      <div className="flex justify-center">
                        {user.email_verified ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <Check size={10} className="stroke-[3]" />
                            <span>VERIFIED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-white/5 text-[#6a6a75] text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-white/5">
                            <span>UNVERIFIED</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status (Card layout replaced with pure styled text) */}
                    <td className="px-4 py-5 font-semibold text-xs">
                      <span className={
                        user.status?.toLowerCase() === 'aktif' 
                          ? 'text-emerald-400' 
                          : user.status?.toLowerCase() === 'blokir'
                          ? 'text-red-400'
                          : 'text-amber-400'
                      }>
                        {user.status ? user.status.toUpperCase() : 'PENDING'}
                      </span>
                    </td>

                    {/* Signal Notif */}
                    <td className="px-4 py-5 text-center">
                      <span className={user.notif_signal_enabled ?? true ? 'text-sky-400 font-bold text-xs' : 'text-[#6a6a75] text-xs'}>
                        {user.notif_signal_enabled ?? true ? 'ON' : 'OFF'}
                      </span>
                    </td>

                    {/* Promo Notif */}
                    <td className="px-4 py-5 text-center">
                      <span className={user.notif_marketing_enabled ?? false ? 'text-sky-400 font-bold text-xs' : 'text-[#6a6a75] text-xs'}>
                        {user.notif_marketing_enabled ?? false ? 'ON' : 'OFF'}
                      </span>
                    </td>

                    {/* Joined Date */}
                    <td className="px-4 py-5 text-[#6a6a75] text-xs">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Calendar size={12} />
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td className="pl-4 pr-8 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                          <button 
                              onClick={() => changeStatusDirectly(user.id, 'Aktif')}
                              title="Set to Aktif"
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all cursor-pointer"
                          >
                              <UserCheck size={13} />
                          </button>
                          <button 
                              onClick={() => changeStatusDirectly(user.id, 'Blokir')}
                              title="Set to Blokir"
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-black transition-all cursor-pointer"
                          >
                              <UserX size={13} />
                          </button>
                          <button 
                              onClick={() => handleOpenDetail(user)}
                              title="Detail & Info Lengkap"
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-white hover:bg-white hover:text-black transition-all cursor-pointer"
                          >
                              <Info size={13} />
                          </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Total Users Info Summary Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5 text-xs text-[#6a6a75] font-semibold">
          <div>
            Showing <span className="text-white">{filteredUsers.length}</span> of <span className="text-white">{users.length}</span> total users
          </div>
          <div className="flex gap-4">
            <div>
              Verified: <span className="text-emerald-400">{users.filter(u => u.email_verified).length}</span>
            </div>
            <div>
              Active: <span className="text-emerald-400">{users.filter(u => u.status?.toLowerCase() === 'aktif').length}</span>
            </div>
            <div>
              Blocked: <span className="text-red-400">{users.filter(u => u.status?.toLowerCase() === 'blokir').length}</span>
            </div>
          </div>
        </div>
        </>
      )}
      {/* DETAIL MODAL WITH TABS */}
      {isDetailModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0d0f17] border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-sky-500/15 text-sky-400 rounded-lg flex items-center justify-center">
                  <UserIcon size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Detail Pengguna</h3>
                  <p className="text-[10px] text-[#6a6a75] mt-0.5">{selectedUser.username}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="text-[#6a6a75] hover:text-white transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs Selector */}
            <div className="flex border-b border-white/5 bg-[#0b0c12]">
              <button
                onClick={() => setActiveModalTab('info')}
                className={`flex-1 py-3 text-center text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeModalTab === 'info' 
                    ? 'text-sky-400 border-sky-400 bg-white/[0.01]' 
                    : 'text-[#6a6a75] border-transparent hover:text-white'
                }`}
              >
                Info Lengkap
              </button>
              <button
                onClick={() => setActiveModalTab('edit')}
                className={`flex-1 py-3 text-center text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeModalTab === 'edit' 
                    ? 'text-sky-400 border-sky-400 bg-white/[0.01]' 
                    : 'text-[#6a6a75] border-transparent hover:text-white'
                }`}
              >
                Edit User
              </button>
              <button
                onClick={() => setActiveModalTab('tindakan')}
                className={`flex-1 py-3 text-center text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeModalTab === 'tindakan' 
                    ? 'text-sky-400 border-sky-400 bg-white/[0.01]' 
                    : 'text-[#6a6a75] border-transparent hover:text-white'
                }`}
              >
                Tindakan
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {activeModalTab === 'info' && (
                <div className="space-y-1 font-semibold text-xs text-white">
                  <div className="flex justify-between py-3 border-b border-white/5">
                    <span className="text-[#86868b] uppercase tracking-wider text-[10px]">User ID</span>
                    <span className="font-mono text-slate-200">#{selectedUser.id}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-white/5">
                    <span className="text-[#86868b] uppercase tracking-wider text-[10px]">Username</span>
                    <span className="text-slate-200">{selectedUser.username}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-white/5">
                    <span className="text-[#86868b] uppercase tracking-wider text-[10px]">Email Address</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-200">{selectedUser.email}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${selectedUser.email_verified ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-[#6a6a75] border border-white/10'}`}>
                        {selectedUser.email_verified ? 'VERIFIED' : 'UNVERIFIED'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between py-3 border-b border-white/5">
                    <span className="text-[#86868b] uppercase tracking-wider text-[10px]">WhatsApp Number</span>
                    <span className="font-mono text-slate-200">{selectedUser.whatsapp_number || '-'}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-white/5">
                    <span className="text-[#86868b] uppercase tracking-wider text-[10px]">Telegram ID</span>
                    <span className="font-mono text-slate-200">{selectedUser.telegram || '-'}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-white/5">
                    <span className="text-[#86868b] uppercase tracking-wider text-[10px]">Role Akses</span>
                    <span className="text-slate-200 uppercase">{selectedUser.role || 'TRADER'}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-white/5">
                    <span className="text-[#86868b] uppercase tracking-wider text-[10px]">Status Keanggotaan</span>
                    <span className={
                      selectedUser.status?.toLowerCase() === 'aktif' 
                        ? 'text-emerald-400' 
                        : selectedUser.status?.toLowerCase() === 'blokir'
                        ? 'text-red-400'
                        : 'text-amber-400'
                    }>
                      {selectedUser.status ? selectedUser.status.toUpperCase() : 'PENDING'}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-white/5">
                    <span className="text-[#86868b] uppercase tracking-wider text-[10px]">Signal Notif</span>
                    <span className="text-slate-200">{selectedUser.notif_signal_enabled ?? true ? 'Aktif (ON)' : 'Mati (OFF)'}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-white/5">
                    <span className="text-[#86868b] uppercase tracking-wider text-[10px]">Promo Notif</span>
                    <span className="text-slate-200">{selectedUser.notif_marketing_enabled ?? false ? 'Aktif (ON)' : 'Mati (OFF)'}</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-[#86868b] uppercase tracking-wider text-[10px]">Tanggal Bergabung</span>
                    <div className="text-slate-200 flex items-center gap-1.5">
                      <Calendar size={12} className="text-[#6a6a75]" />
                      {new Date(selectedUser.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {activeModalTab === 'edit' && (
                <form onSubmit={handleEditUser} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#6a6a75] uppercase font-bold tracking-wider">Username</label>
                    <input 
                      type="text" 
                      value={editUsername} 
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[#6a6a75] uppercase font-bold tracking-wider">Email</label>
                    <input 
                      type="email" 
                      value={editEmail} 
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[#6a6a75] uppercase font-bold tracking-wider">Ganti Password (Kosongkan jika tidak diubah)</label>
                    <input 
                      type="password" 
                      placeholder="••••••"
                      value={editPassword} 
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50 placeholder:text-[#6a6a75]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#6a6a75] uppercase font-bold tracking-wider">WhatsApp Number</label>
                      <input 
                        type="text" 
                        placeholder="Contoh: 62812345678"
                        value={editWhatsappNumber} 
                        onChange={(e) => setEditWhatsappNumber(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-[#6a6a75] uppercase font-bold tracking-wider">Telegram ID</label>
                      <input 
                        type="text" 
                        placeholder="Contoh: 123456789"
                        value={editTelegramId} 
                        onChange={(e) => setEditTelegramId(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#6a6a75] uppercase font-bold tracking-wider">Role</label>
                      <select 
                        value={editRole} 
                        onChange={(e) => setEditRole(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50"
                      >
                        <option value="trader" className="bg-[#0d0f17] text-white">TRADER</option>
                        <option value="admin" className="bg-[#0d0f17] text-white">ADMIN</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-[#6a6a75] uppercase font-bold tracking-wider">Status</label>
                      <select 
                        value={editStatus} 
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50"
                      >
                        <option value="Aktif" className="bg-[#0d0f17] text-white">AKTIF</option>
                        <option value="Blokir" className="bg-[#0d0f17] text-white">BLOKIR</option>
                        <option value="Pending" className="bg-[#0d0f17] text-white">PENDING</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <label className="flex items-center gap-1.5 cursor-pointer bg-white/5 border border-white/5 rounded-xl p-2.5 hover:bg-white/[0.08] transition-all">
                      <input 
                        type="checkbox" 
                        checked={editSignalNotif} 
                        onChange={(e) => setEditSignalNotif(e.target.checked)}
                        className="accent-sky-500 rounded"
                      />
                      <span className="text-[10px] text-white font-semibold whitespace-nowrap">Signal Notif</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer bg-white/5 border border-white/5 rounded-xl p-2.5 hover:bg-white/[0.08] transition-all">
                      <input 
                        type="checkbox" 
                        checked={editMarketingNotif} 
                        onChange={(e) => setEditMarketingNotif(e.target.checked)}
                        className="accent-sky-500 rounded"
                      />
                      <span className="text-[10px] text-white font-semibold whitespace-nowrap">Promo Notif</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer bg-white/5 border border-white/5 rounded-xl p-2.5 hover:bg-white/[0.08] transition-all">
                      <input 
                        type="checkbox" 
                        checked={editEmailVerified} 
                        onChange={(e) => setEditEmailVerified(e.target.checked)}
                        className="accent-sky-500 rounded"
                      />
                      <span className="text-[10px] text-white font-semibold whitespace-nowrap">Verified Email</span>
                    </label>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-sky-600 hover:bg-sky-500 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all mt-4 border border-sky-400/20"
                  >
                    Simpan Perubahan
                  </button>
                </form>
              )}

              {activeModalTab === 'tindakan' && (
                <div className="space-y-4">
                  <div className="text-[10px] text-[#6a6a75] uppercase font-bold tracking-wider">Ubah Status Cepat</div>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => changeStatusDirectly(selectedUser.id, 'Aktif')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                        selectedUser.status === 'Aktif' 
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                          : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                      }`}
                    >
                      Aktif
                    </button>
                    <button 
                      onClick={() => changeStatusDirectly(selectedUser.id, 'Pending')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                        selectedUser.status === 'Pending' 
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400' 
                          : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                      }`}
                    >
                      Pending
                    </button>
                    <button 
                      onClick={() => changeStatusDirectly(selectedUser.id, 'Blokir')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                        selectedUser.status === 'Blokir' 
                          ? 'bg-red-500/20 border-red-500 text-red-400' 
                          : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                      }`}
                    >
                      Blokir
                    </button>
                  </div>

                  <div className="border-t border-white/5 pt-4">
                    <div className="text-[10px] text-[#6a6a75] uppercase font-bold tracking-wider">Reset Keamanan</div>
                    <button 
                      onClick={() => {
                        if (confirm("Reset password ke default '123456'?")) {
                          setEditPassword('123456');
                          alert("Password telah dipersiapkan untuk diset ke '123456'. Silakan klik Simpan Perubahan di tab Edit untuk menerapkan.");
                          setActiveModalTab('edit');
                        }
                      }}
                      className="w-full bg-white/5 hover:bg-white/[0.08] text-white py-2.5 rounded-xl text-xs font-semibold mt-2 transition-all border border-white/10"
                    >
                      Set Password Default (123456)
                    </button>
                  </div>

                  <div className="border-t border-white/5 pt-4">
                    <div className="text-[10px] text-[#6a6a75] uppercase font-bold tracking-wider text-red-400">Tindakan Destruktif</div>
                    <button 
                      onClick={() => handleDeleteUser(selectedUser.id)}
                      className="w-full bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all mt-2 border border-red-500/20"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Trash2 size={14} />
                        Hapus Pengguna dari Database
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0d0f17] border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-sky-500/15 text-sky-400 rounded-lg flex items-center justify-center">
                  <UserPlus size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Tambah Pengguna Baru</h3>
                  <p className="text-[10px] text-[#6a6a75] mt-0.5">Masukkan data pengguna baru ke database SQL</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#6a6a75] hover:text-white transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-[#6a6a75] uppercase font-bold tracking-wider">Username</label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: joni_trader"
                  value={addUsername} 
                  onChange={(e) => setAddUsername(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#6a6a75] uppercase font-bold tracking-wider">Email</label>
                <input 
                  type="email" 
                  required
                  placeholder="Contoh: joni@gmail.com"
                  value={addEmail} 
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#6a6a75] uppercase font-bold tracking-wider">Password (Default: 123456)</label>
                <input 
                  type="password" 
                  placeholder="Minimal 6 karakter"
                  value={addPassword} 
                  onChange={(e) => setAddPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50 placeholder:text-[#6a6a75]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#6a6a75] uppercase font-bold tracking-wider">WhatsApp Number</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: 62812345678"
                    value={addWhatsappNumber} 
                    onChange={(e) => setAddWhatsappNumber(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#6a6a75] uppercase font-bold tracking-wider">Telegram ID</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: 123456789"
                    value={addTelegramId} 
                    onChange={(e) => setAddTelegramId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#6a6a75] uppercase font-bold tracking-wider">Role</label>
                  <select 
                    value={addRole} 
                    onChange={(e) => setAddRole(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50"
                  >
                    <option value="trader" className="bg-[#0d0f17] text-white">TRADER</option>
                    <option value="admin" className="bg-[#0d0f17] text-white">ADMIN</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#6a6a75] uppercase font-bold tracking-wider">Status</label>
                  <select 
                    value={addStatus} 
                    onChange={(e) => setAddStatus(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50"
                  >
                    <option value="Aktif" className="bg-[#0d0f17] text-white">AKTIF</option>
                    <option value="Blokir" className="bg-[#0d0f17] text-white">BLOKIR</option>
                    <option value="Pending" className="bg-[#0d0f17] text-white">PENDING</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <label className="flex items-center gap-1.5 cursor-pointer bg-white/5 border border-white/5 rounded-xl p-2.5 hover:bg-white/[0.08] transition-all">
                  <input 
                    type="checkbox" 
                    checked={addSignalNotif} 
                    onChange={(e) => setAddSignalNotif(e.target.checked)}
                    className="accent-sky-500 rounded"
                  />
                  <span className="text-[10px] text-white font-semibold whitespace-nowrap">Signal Notif</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer bg-white/5 border border-white/5 rounded-xl p-2.5 hover:bg-white/[0.08] transition-all">
                  <input 
                    type="checkbox" 
                    checked={addMarketingNotif} 
                    onChange={(e) => setAddMarketingNotif(e.target.checked)}
                    className="accent-sky-500 rounded"
                  />
                  <span className="text-[10px] text-white font-semibold whitespace-nowrap">Promo Notif</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer bg-white/5 border border-white/5 rounded-xl p-2.5 hover:bg-white/[0.08] transition-all">
                  <input 
                    type="checkbox" 
                    checked={addEmailVerified} 
                    onChange={(e) => setAddEmailVerified(e.target.checked)}
                    className="accent-sky-500 rounded"
                  />
                  <span className="text-[10px] text-white font-semibold whitespace-nowrap">Verified Email</span>
                </label>
              </div>

              <button 
                type="submit"
                className="w-full bg-sky-600 hover:bg-sky-500 text-white py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all mt-4 border border-sky-400/20"
              >
                Tambah Pengguna Baru
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
