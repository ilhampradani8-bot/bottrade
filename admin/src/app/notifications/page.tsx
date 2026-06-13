"use client";

import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  Send, 
  History, 
  Settings2, 
  Save, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCcw,
  X,
  Volume2,
  Users,
  Search,
  Flame,
  ShieldAlert,
  Bot,
  UserCheck,
  ChevronRight,
  Info,
  Calendar,
  MessageSquare,
  Sparkles,
  FileText
} from 'lucide-react';
import { NotificationSettings } from '@/types/NotificationSettings';
import { BroadcastLog } from '@/types/BroadcastLog';
import { AdminUser } from '@/types/AdminUser';
import { TelegramBotUpdate } from '@/types/TelegramBotUpdate';
import { UserNotificationLog } from '@/types/UserNotificationLog';

type TabType = 'broadcast' | 'special_notif' | 'logs' | 'subscribers' | 'emergency' | 'settings';
type SubTabType = 'all' | 'wa' | 'tele' | 'bot_updates';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('broadcast');
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('all');
  
  const [settings, setSettings] = useState<NotificationSettings>({
    telegram_bot_token: '',
    telegram_chat_id_up: '',
    telegram_chat_id_down: '',
    whatsapp_group_id_up: '',
    whatsapp_group_id_down: '',
    whatsapp_port: '5001',
    cooldown_minutes: '15',
    alert_on_errors: 'true',
    emergency_template_down: '',
    emergency_template_hacked: '',
    emergency_template_maintenance: '',
  });

  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [targetChannels, setTargetChannels] = useState<string[]>([]);
  const [logs, setLogs] = useState<BroadcastLog[]>([]);
  const [userNotificationLogs, setUserNotificationLogs] = useState<UserNotificationLog[]>([]);
  const [logsSubTab, setLogsSubTab] = useState<'broadcast' | 'general'>('broadcast');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [botUpdates, setBotUpdates] = useState<TelegramBotUpdate[]>([]);
  
  // Loading & Saving states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [loadingBotUpdates, setLoadingBotUpdates] = useState(false);
  
  // Search & Filters for subscribers
  const [searchQuery, setSearchQuery] = useState('');

  // User Management filtering inside Broadcast tab
  const [broadcastSubTab, setBroadcastSubTab] = useState<'write' | 'recipients'>('write');
  const [broadcastRoleFilter, setBroadcastRoleFilter] = useState<'all' | 'admin' | 'premium' | 'trader'>('all');
  const [broadcastStatusFilter, setBroadcastStatusFilter] = useState<'all' | 'aktif' | 'pending' | 'blokir'>('all');
  const [broadcastUsernameQuery, setBroadcastUsernameQuery] = useState('');
  const [broadcastEmailQuery, setBroadcastEmailQuery] = useState('');
  const [broadcastTelegramQuery, setBroadcastTelegramQuery] = useState('');
  const [broadcastWhatsAppQuery, setBroadcastWhatsAppQuery] = useState('');
  const [selectedUserIdsForBroadcast, setSelectedUserIdsForBroadcast] = useState<number[]>([]);
  const [settingsSubTab, setSettingsSubTab] = useState<'api' | 'templates'>('api');

  // Selected Detail views
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedBotUpdate, setSelectedBotUpdate] = useState<TelegramBotUpdate | null>(null);
  const [selectedLog, setSelectedLog] = useState<BroadcastLog | null>(null);

  // Special Notification states (Direct to 1 or 2 users)
  const [specialSearchQuery, setSpecialSearchQuery] = useState('');
  const [specialSelectedUsers, setSpecialSelectedUsers] = useState<AdminUser[]>([]);
  const [specialMessage, setSpecialMessage] = useState('');
  const [specialViaTelegram, setSpecialViaTelegram] = useState(true);
  const [specialViaWhatsApp, setSpecialViaWhatsApp] = useState(false);
  const [specialViaEmail, setSpecialViaEmail] = useState(false);
  const [sendingSpecial, setSendingSpecial] = useState(false);

  // Emergency Mode states
  const [emergencyMessage, setEmergencyMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<'down' | 'hacked' | 'maintenance' | 'custom'>('custom');
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);
  const [emergencyBroadcasting, setEmergencyBroadcasting] = useState(false);

  // Toast Notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const apiHost = window.location.hostname;
      const res = await fetch(`http://${apiHost}:8080/api/admin/notification-settings`);
      if (res.ok) {
        const data = await res.json();
        setSettings({
          ...data,
          emergency_template_down: data.emergency_template_down || '',
          emergency_template_hacked: data.emergency_template_hacked || '',
          emergency_template_maintenance: data.emergency_template_maintenance || '',
        });
      } else {
        showToast('Failed to load notification settings', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to backend API', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const apiHost = window.location.hostname;
      const res = await fetch(`http://${apiHost}:8080/api/admin/broadcast-logs`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
      const resNotifications = await fetch(`http://${apiHost}:8080/api/admin/user-notifications-logs`);
      if (resNotifications.ok) {
        const dataNotif = await resNotifications.json();
        setUserNotificationLogs(dataNotif);
      }
    } catch (err) {
      console.error(err);
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
      console.error(err);
    }
  };

  const fetchBotUpdates = async () => {
    try {
      setLoadingBotUpdates(true);
      const apiHost = window.location.hostname;
      const res = await fetch(`http://${apiHost}:8080/api/admin/telegram-bot-updates`);
      if (res.ok) {
        const data = await res.json();
        setBotUpdates(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBotUpdates(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchLogs();
    fetchUsers();
    fetchBotUpdates();

    // Auto-polling: Refresh users, logs, and bot updates every 15 seconds, only when tab is visible
    const interval = setInterval(() => {
      if (document.hidden) return; // Skip API calls if the tab is running in the background
      fetchLogs();
      fetchUsers();
      fetchBotUpdates();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (users.length > 0 && selectedUserIdsForBroadcast.length === 0) {
      setSelectedUserIdsForBroadcast(users.map(u => u.id));
    }
  }, [users]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const apiHost = window.location.hostname;
      const res = await fetch(`http://${apiHost}:8080/api/admin/notification-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        showToast('Notification settings saved successfully', 'success');
      } else {
        showToast('Failed to save settings', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) {
      showToast('Please enter a message to broadcast', 'error');
      return;
    }
    if (targetChannels.length === 0) {
      showToast('Select at least one destination channel', 'error');
      return;
    }
    if (selectedUserIdsForBroadcast.length === 0) {
      showToast('Select at least one recipient user', 'error');
      return;
    }

    try {
      setBroadcasting(true);
      const apiHost = window.location.hostname;
      const res = await fetch(`http://${apiHost}:8080/api/admin/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channels: targetChannels,
          message: broadcastMessage,
          user_ids: selectedUserIdsForBroadcast,
        }),
      });

      const result = await res.json();
      if (res.ok && (result.status === 'success' || result.status === 'partial_success')) {
        showToast(
          result.status === 'success' 
            ? 'Message broadcasted successfully' 
            : 'Broadcast partially completed. Check logs.', 
            'success'
        );
        setBroadcastMessage('');
        // Don't reset selectedUserIdsForBroadcast completely to make it convenient, but reset channels
        setTargetChannels([]);
        fetchLogs();
      } else {
        showToast('Broadcast execution failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error sending broadcast request', 'error');
    } finally {
      setBroadcasting(false);
    }
  };

  const handleSendSpecialNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (specialSelectedUsers.length === 0) {
      showToast('Select at least 1 user to send direct message', 'error');
      return;
    }
    if (!specialMessage.trim()) {
      showToast('Message content cannot be empty', 'error');
      return;
    }
    if (!specialViaTelegram && !specialViaWhatsApp && !specialViaEmail) {
      showToast('Select at least one media (Telegram / WhatsApp / Email)', 'error');
      return;
    }

    try {
      setSendingSpecial(true);
      const apiHost = window.location.hostname;
      let sentCount = 0;
      let failCount = 0;

      for (const u of specialSelectedUsers) {
        const res = await fetch(`http://${apiHost}:8080/api/admin/special-notification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: u.id,
            message: specialMessage,
            via_telegram: specialViaTelegram,
            via_whatsapp: specialViaWhatsApp,
            via_email: specialViaEmail,
          }),
        });
        if (res.ok) {
          sentCount++;
        } else {
          failCount++;
        }
      }

      if (sentCount > 0) {
        showToast(`Direct message sent to ${sentCount} users successfully!`, 'success');
        setSpecialMessage('');
        setSpecialSelectedUsers([]);
        fetchLogs();
      } else {
        showToast('Failed to send direct notifications', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error sending special notification', 'error');
    } finally {
      setSendingSpecial(false);
    }
  };

  const handleEmergencyBroadcast = async () => {
    if (!emergencyMessage.trim()) {
      showToast('Emergency message content is empty', 'error');
      return;
    }

    try {
      setEmergencyBroadcasting(true);
      const apiHost = window.location.hostname;
      const res = await fetch(`http://${apiHost}:8080/api/admin/emergency-broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: emergencyMessage,
        }),
      });

      const result = await res.json();
      if (res.ok && (result.status === 'success' || result.status === 'partial_success')) {
        showToast('EMERGENCY BROADCAST SENT TO ALL SUBSCRIBERS!', 'success');
        setEmergencyMessage('');
        setSelectedTemplate('custom');
        setShowEmergencyConfirm(false);
        fetchLogs();
      } else {
        showToast('Failed to execute emergency broadcast', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error triggering emergency broadcast', 'error');
    } finally {
      setEmergencyBroadcasting(false);
    }
  };

  const toggleChannel = (channel: string) => {
    if (targetChannels.includes(channel)) {
      setTargetChannels(targetChannels.filter(c => c !== channel));
    } else {
      setTargetChannels([...targetChannels, channel]);
    }
  };

  const selectEmergencyTemplate = (type: 'down' | 'hacked' | 'maintenance' | 'custom') => {
    setSelectedTemplate(type);
    if (type === 'down') {
      setEmergencyMessage(settings.emergency_template_down || '🚨 *SISTEM DOWN*: Kami mendeteksi gangguan pada server. Tim kami sedang menangani pemulihan.');
    } else if (type === 'hacked') {
      setEmergencyMessage(settings.emergency_template_hacked || '⚠️ *SISTEM DIRETAS (EMERGENCY)*: Harap segera amankan akun Anda. Fitur penarikan dana/trading sementara ditangguhkan.');
    } else if (type === 'maintenance') {
      setEmergencyMessage(settings.emergency_template_maintenance || '🔧 *PEMELIHARAAN (MAINTENANCE)*: Sistem akan dimatikan sementara untuk pembaruan terjadwal.');
    } else {
      setEmergencyMessage('');
    }
  };

  // Filter subscribers list
  const getFilteredSubscribers = () => {
    const term = searchQuery.toLowerCase();
    let baseList = users;
    if (activeSubTab === 'wa') {
      baseList = users.filter(u => u.whatsapp_number && u.whatsapp_number.trim().length > 0);
    } else if (activeSubTab === 'tele') {
      baseList = users.filter(u => u.telegram && u.telegram.trim().length > 0);
    }

    return baseList.filter(user => {
      return (
        user.username.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        (user.whatsapp_number && user.whatsapp_number.includes(term)) ||
        (user.telegram && user.telegram.toLowerCase().includes(term))
      );
    });
  };

  const getFilteredBotUpdates = () => {
    const term = searchQuery.toLowerCase();
    return botUpdates.filter(up => {
      return (
        up.chat_id.includes(term) ||
        (up.username && up.username.toLowerCase().includes(term)) ||
        (up.first_name && up.first_name.toLowerCase().includes(term)) ||
        (up.last_message && up.last_message.toLowerCase().includes(term))
      );
    });
  };

  // Special direct message search options
  const getSpecialUserOptions = () => {
    if (!specialSearchQuery) return [];
    const term = specialSearchQuery.toLowerCase();
    return users
      .filter(u => !specialSelectedUsers.some(sel => sel.id === u.id))
      .filter(u => 
        u.username.toLowerCase().includes(term) || 
        u.email.toLowerCase().includes(term) ||
        (u.telegram && u.telegram.includes(term)) ||
        (u.whatsapp_number && u.whatsapp_number.includes(term))
      )
      .slice(0, 5);
  };

  const allSubscribers = users.filter(u => u.telegram || u.whatsapp_number);
  const waSubscribers = users.filter(u => u.whatsapp_number && u.whatsapp_number.trim().length > 0);
  const teleSubscribers = users.filter(u => u.telegram && u.telegram.trim().length > 0);

  const filteredUsersForBroadcast = users.filter(user => {
    // role filter
    if (broadcastRoleFilter !== 'all') {
      if (user.role?.toLowerCase() !== broadcastRoleFilter.toLowerCase()) return false;
    }
    // status filter
    if (broadcastStatusFilter !== 'all') {
      if (user.status?.toLowerCase() !== broadcastStatusFilter.toLowerCase()) return false;
    }
    // username filter
    if (broadcastUsernameQuery.trim()) {
      if (!user.username.toLowerCase().includes(broadcastUsernameQuery.toLowerCase())) return false;
    }
    // email filter
    if (broadcastEmailQuery.trim()) {
      if (!user.email.toLowerCase().includes(broadcastEmailQuery.toLowerCase())) return false;
    }
    // telegram filter
    if (broadcastTelegramQuery.trim()) {
      if (!user.telegram?.toLowerCase().includes(broadcastTelegramQuery.toLowerCase())) return false;
    }
    // whatsapp filter
    if (broadcastWhatsAppQuery.trim()) {
      if (!user.whatsapp_number?.toLowerCase().includes(broadcastWhatsAppQuery.toLowerCase())) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCcw className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-xs uppercase tracking-widest text-[#86868b] font-extrabold animate-pulse">Loading Configurations...</p>
      </div>
    );
  }

  return (
    <div className="w-full px-0 space-y-5 -mt-5 bg-transparent text-white">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border transition-all duration-300 animate-in slide-in-from-top-5 ${
          toast.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`} />
          <span className="text-xs font-bold uppercase tracking-wider">{toast.message}</span>
          <button onClick={() => setToast(null)} className="hover:text-white ml-2 cursor-pointer bg-transparent border-none">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-1.5 border-b border-white/5 pb-px overflow-x-auto scrollbar-none">
        {[
          { id: 'broadcast', label: 'Broadcast Utama', icon: Volume2 },
          { id: 'special_notif', label: 'Notifikasi Khusus', icon: Sparkles },
          { id: 'logs', label: `Log & Riwayat (${logs.length})`, icon: History },
          { id: 'subscribers', label: `Daftar Akun (${allSubscribers.length})`, icon: Users },
          { id: 'emergency', label: 'Mode Darurat', icon: Flame, color: 'text-red-400' },
          { id: 'settings', label: 'Pengaturan', icon: Settings2 },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-wider font-extrabold border-b-2 transition-all cursor-pointer whitespace-nowrap bg-transparent ${
                isActive 
                  ? `${tab.color || 'text-sky-400'} border-current bg-white/[0.01]` 
                  : 'text-[#86868b] border-transparent hover:text-white hover:bg-white/[0.005]'
              }`}
            >
              <Icon size={12} className={isActive ? (tab.color || 'text-sky-400') : 'text-slate-500'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: BROADCAST */}
      {activeTab === 'broadcast' && (
        <div className="space-y-6 w-full animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Send size={14} className="text-sky-400" />
              <h2 className="font-bold text-white text-xs uppercase tracking-wider">Kirim Broadcast Baru</h2>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-sky-500/10 bg-sky-500/5 font-mono text-[9px] text-sky-400">
              <span className="font-black">! Relasi DB:</span>
              <span className="opacity-80">admin_notification_settings, users_by_usermanagement, broadcast_logs_by_admin, notifications</span>
            </div>
          </div>

          {/* Broadcast Sub-Tabs Navigation */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBroadcastSubTab('write')}
                className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-extrabold transition-all cursor-pointer border-none ${
                  broadcastSubTab === 'write' ? 'bg-sky-505 text-black bg-sky-400' : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                1. Tulis &amp; Kirim
              </button>
              <button
                type="button"
                onClick={() => setBroadcastSubTab('recipients')}
                className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-extrabold transition-all cursor-pointer border-none ${
                  broadcastSubTab === 'recipients' ? 'bg-sky-505 text-black bg-sky-400' : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                2. Pilih Penerima ({selectedUserIdsForBroadcast.length} Terpilih)
              </button>
            </div>

            {/* Selection stats & controls next to the sub-tabs */}
            {broadcastSubTab === 'recipients' && (
              <div className="flex flex-wrap items-center gap-2 text-[11px] lg:justify-end">
                <div className="text-slate-400 mr-2">
                  Menampilkan <span className="text-white font-bold">{filteredUsersForBroadcast.length}</span> user cocok filter. Terpilih untuk broadcast: <span className="text-sky-400 font-bold">{selectedUserIdsForBroadcast.length}</span> user.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const filteredIds = filteredUsersForBroadcast.map(u => u.id);
                    setSelectedUserIdsForBroadcast(prev => {
                      const union = new Set([...prev, ...filteredIds]);
                      return Array.from(union);
                    });
                  }}
                  className="text-sky-400 hover:text-sky-300 font-bold bg-transparent border-none cursor-pointer text-[11px] hover:underline"
                >
                  Pilih Semua yang Tampil
                </button>
                <span className="text-white/10">|</span>
                <button
                  type="button"
                  onClick={() => {
                    const filteredIds = filteredUsersForBroadcast.map(u => u.id);
                    setSelectedUserIdsForBroadcast(prev => prev.filter(id => !filteredIds.includes(id)));
                  }}
                  className="text-slate-400 hover:text-white font-bold bg-transparent border-none cursor-pointer text-[11px] hover:underline"
                >
                  Batal Pilih Semua yang Tampil
                </button>
                <span className="text-white/10">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedUserIdsForBroadcast([])}
                  className="text-red-400 hover:text-red-300 font-bold bg-transparent border-none cursor-pointer text-[11px] hover:underline"
                >
                  Kosongkan Pilihan
                </button>
              </div>
            )}
          </div>

          {broadcastSubTab === 'write' ? (
            <form onSubmit={handleBroadcast} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Side: Message Input */}
              <div className="lg:col-span-2 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-[#86868b] tracking-wider block">Isi Pesan Broadcast (HTML / Markdown didukung)</label>
                  <textarea
                    value={broadcastMessage}
                    onChange={e => setBroadcastMessage(e.target.value)}
                    className="w-full h-[400px] bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50 transition-all custom-scrollbar resize-none font-mono"
                    placeholder="Ketik pesan broadcast disini..."
                  />
                </div>

                {/* Broadcast Action Button */}
                <button
                  type="submit"
                  disabled={broadcasting}
                  className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-500/50 text-black font-extrabold text-xs uppercase tracking-wider py-4 rounded-xl transition-all cursor-pointer shadow-lg shadow-sky-500/10 active:scale-[0.99] border-none"
                >
                  {broadcasting ? (
                    <>
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                      Memproses Kiriman...
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Kirim Broadcast Sekarang Ke {selectedUserIdsForBroadcast.length} Penerima
                    </>
                  )}
                </button>
              </div>

              {/* Right Side: Options Summary & Channels */}
              <div className="space-y-6 bg-[#0c0d12]/60 border border-white/5 p-4 rounded-2xl">
                {/* Destination Channels Selection */}
                <div className="space-y-3">
                  <span className="text-[10px] uppercase font-black text-sky-400 tracking-wider block">Pilih Saluran Kirim</span>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { key: 'telegram', label: 'Telegram (DM)', color: 'border-sky-500/20 text-sky-400 bg-sky-500/5' },
                      { key: 'whatsapp', label: 'WhatsApp (DM)', color: 'border-green-500/20 text-green-400 bg-green-500/5' },
                      { key: 'email', label: 'Email', color: 'border-fuchsia-500/20 text-fuchsia-400 bg-fuchsia-500/5' },
                      { key: 'web', label: 'Web (Dasbor)', color: 'border-amber-500/20 text-amber-400 bg-amber-500/5' },
                    ].map(ch => {
                      const isSelected = targetChannels.includes(ch.key);
                      return (
                        <button
                          key={ch.key}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setTargetChannels(prev => prev.filter(k => k !== ch.key));
                            } else {
                              setTargetChannels(prev => [...prev, ch.key]);
                            }
                          }}
                          className={`px-3 py-3 rounded-xl border text-left text-[11px] font-bold transition-all flex items-center justify-between cursor-pointer bg-transparent ${
                            isSelected ? ch.color + ' border-opacity-100' : 'border-white/5 text-[#86868b]'
                          }`}
                        >
                          <span>{ch.label}</span>
                          <div className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center transition-all ${
                            isSelected ? 'border-sky-400 bg-sky-400/20' : 'border-white/20'
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Recipient summary indicator */}
                <div className="pt-4 border-t border-white/5 space-y-2">
                  <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider block">Ringkasan Target</span>
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Total Target Terpilih:</span>
                    <span className="text-xs font-bold text-sky-400 font-mono">{selectedUserIdsForBroadcast.length} User</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Untuk mengubah, memfilter, atau memilih target penerima pesan secara spesifik, silakan buka tab <strong className="text-sky-400 cursor-pointer hover:underline" onClick={() => setBroadcastSubTab('recipients')}>"2. Pilih Penerima"</strong> di atas.
                  </p>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-4 animate-in fade-in-50 duration-200 w-full">
              {/* Excel-style table UI */}
              <div className="overflow-x-auto border border-white/10 rounded-xl bg-black/40 w-full">
                <table className="w-full border-collapse text-left text-xs text-slate-300">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02]">
                      <th className="p-3 w-10 text-center border-r border-white/10">
                        <input
                          type="checkbox"
                          checked={filteredUsersForBroadcast.length > 0 && filteredUsersForBroadcast.every(u => selectedUserIdsForBroadcast.includes(u.id))}
                          onChange={() => {
                            const filteredIds = filteredUsersForBroadcast.map(u => u.id);
                            const isAllSelected = filteredIds.length > 0 && filteredIds.every(id => selectedUserIdsForBroadcast.includes(id));
                            if (isAllSelected) {
                              setSelectedUserIdsForBroadcast(prev => prev.filter(id => !filteredIds.includes(id)));
                            } else {
                              setSelectedUserIdsForBroadcast(prev => {
                                const union = new Set([...prev, ...filteredIds]);
                                return Array.from(union);
                              });
                            }
                          }}
                          className="rounded bg-black border-white/20 text-sky-500 w-3.5 h-3.5 cursor-pointer"
                        />
                      </th>
                      <th className="p-3 w-16 border-r border-white/10 font-bold uppercase tracking-wider text-[10px] text-slate-400">ID</th>
                      <th className="p-3 border-r border-white/10 font-bold uppercase tracking-wider text-[10px] text-slate-400">Username</th>
                      <th className="p-3 border-r border-white/10 font-bold uppercase tracking-wider text-[10px] text-slate-400">Email</th>
                      <th className="p-3 w-28 border-r border-white/10 font-bold uppercase tracking-wider text-[10px] text-slate-400">Role</th>
                      <th className="p-3 w-28 border-r border-white/10 font-bold uppercase tracking-wider text-[10px] text-slate-400">Status</th>
                      <th className="p-3 border-r border-white/10 font-bold uppercase tracking-wider text-[10px] text-slate-400">Telegram</th>
                      <th className="p-3 font-bold uppercase tracking-wider text-[10px] text-slate-400">WhatsApp</th>
                    </tr>
                    {/* Header Row 2: In-Column Spreadsheet Filters */}
                    <tr className="border-b border-white/10 bg-white/[0.01]">
                      <td className="p-2 text-center border-r border-white/10"></td>
                      <td className="p-2 border-r border-white/10"></td>
                      <td className="p-2 border-r border-white/10">
                        <input
                          type="text"
                          value={broadcastUsernameQuery}
                          onChange={e => setBroadcastUsernameQuery(e.target.value)}
                          placeholder="Filter username..."
                          className="w-full bg-black border border-white/5 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-sky-500/50 placeholder-slate-700 font-sans"
                        />
                      </td>
                      <td className="p-2 border-r border-white/10">
                        <input
                          type="text"
                          value={broadcastEmailQuery}
                          onChange={e => setBroadcastEmailQuery(e.target.value)}
                          placeholder="Filter email..."
                          className="w-full bg-black border border-white/5 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-sky-500/50 placeholder-slate-700 font-sans"
                        />
                      </td>
                      <td className="p-2 border-r border-white/10">
                        <select
                          value={broadcastRoleFilter}
                          onChange={e => setBroadcastRoleFilter(e.target.value as any)}
                          className="w-full bg-black border border-white/5 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-sky-500/50 font-sans"
                        >
                          <option value="all">Semua</option>
                          <option value="admin">Admin</option>
                          <option value="premium">Premium</option>
                          <option value="trader">Trader</option>
                        </select>
                      </td>
                      <td className="p-2 border-r border-white/10">
                        <select
                          value={broadcastStatusFilter}
                          onChange={e => setBroadcastStatusFilter(e.target.value as any)}
                          className="w-full bg-black border border-white/5 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-sky-500/50 font-sans"
                        >
                          <option value="all">Semua</option>
                          <option value="aktif">Aktif</option>
                          <option value="pending">Pending</option>
                          <option value="blokir">Blokir</option>
                        </select>
                      </td>
                      <td className="p-2 border-r border-white/10">
                        <input
                          type="text"
                          value={broadcastTelegramQuery}
                          onChange={e => setBroadcastTelegramQuery(e.target.value)}
                          placeholder="Filter tele..."
                          className="w-full bg-black border border-white/5 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-sky-500/50 placeholder-slate-700 font-sans"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={broadcastWhatsAppQuery}
                          onChange={e => setBroadcastWhatsAppQuery(e.target.value)}
                          placeholder="Filter WA..."
                          className="w-full bg-black border border-white/5 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-sky-500/50 placeholder-slate-700 font-sans"
                        />
                      </td>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                    {filteredUsersForBroadcast.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-500 font-sans">
                          Tidak ada data user yang cocok dengan filter saat ini.
                        </td>
                      </tr>
                    ) : (
                      filteredUsersForBroadcast.map(user => {
                        const isChecked = selectedUserIdsForBroadcast.includes(user.id);
                        return (
                          <tr 
                            key={user.id} 
                            onClick={() => {
                              if (isChecked) {
                                setSelectedUserIdsForBroadcast(prev => prev.filter(id => id !== user.id));
                              } else {
                                setSelectedUserIdsForBroadcast(prev => [...prev, user.id]);
                              }
                            }}
                            className={`hover:bg-white/[0.02] transition-all cursor-pointer ${
                              isChecked ? 'bg-white/[0.01]' : 'opacity-50 hover:opacity-80'
                            }`}
                          >
                            <td className="p-3 text-center border-r border-white/5" onClick={e => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedUserIdsForBroadcast(prev => prev.filter(id => id !== user.id));
                                  } else {
                                    setSelectedUserIdsForBroadcast(prev => [...prev, user.id]);
                                  }
                                }}
                                className="rounded bg-black border-white/20 text-sky-500 w-3.5 h-3.5 cursor-pointer"
                              />
                            </td>
                            <td className="p-3 border-r border-white/5 text-slate-500">{user.id}</td>
                            <td className="p-3 border-r border-white/5 font-bold text-white">@{user.username}</td>
                            <td className="p-3 border-r border-white/5 text-slate-400 font-sans">{user.email}</td>
                            <td className="p-3 border-r border-white/5">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                user.role?.toLowerCase() === 'admin' ? 'bg-red-500/10 text-red-400' :
                                user.role?.toLowerCase() === 'premium' ? 'bg-sky-500/10 text-sky-400' :
                                'bg-slate-500/10 text-slate-400'
                              }`}>
                                {user.role ? user.role.toUpperCase() : 'TRADER'}
                              </span>
                            </td>
                            <td className="p-3 border-r border-white/5">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                user.status?.toLowerCase() === 'aktif' ? 'bg-emerald-500/10 text-emerald-400' :
                                user.status?.toLowerCase() === 'blokir' ? 'bg-red-500/10 text-red-400' :
                                'bg-amber-500/10 text-amber-400'
                              }`}>
                                {user.status ? user.status.toUpperCase() : 'PENDING'}
                              </span>
                            </td>
                            <td className="p-3 border-r border-white/5">
                              {user.telegram ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                                  <span className="text-sky-400 font-bold">{user.telegram}</span>
                                </div>
                              ) : (
                                <span className="text-slate-600">-</span>
                              )}
                            </td>
                            <td className="p-3">
                              {user.whatsapp_number ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                  <span className="text-green-400 font-bold">{user.whatsapp_number}</span>
                                </div>
                              ) : (
                                <span className="text-slate-600">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: SPECIAL DIRECT NOTIFICATION (1-2 Users) */}
      {activeTab === 'special_notif' && (
        <div className="w-full animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-6">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-indigo-400" />
              <h2 className="font-bold text-white text-xs uppercase tracking-wider">Kirim Notifikasi Khusus (Individual Target)</h2>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-indigo-500/10 bg-indigo-500/5 font-mono text-[9px] text-indigo-400">
              <span className="font-black">! Relasi DB:</span>
              <span className="opacity-80">users_by_usermanagement (id, telegram, whatsapp_number, email), broadcast_logs_by_admin</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={handleSendSpecialNotification} className="lg:col-span-2 space-y-5">
              {/* User Search & Selection */}
              <div className="space-y-2 relative">
                <label className="text-[10px] uppercase font-bold text-[#86868b] tracking-wider block">Cari & Pilih Target Penerima (Maks. 2)</label>
                
                {/* Selected List */}
                {specialSelectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {specialSelectedUsers.map(u => (
                      <div key={u.id} className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-lg text-xs font-bold">
                        <span>{u.username} ({u.email})</span>
                        <button 
                          type="button" 
                          onClick={() => setSpecialSelectedUsers(specialSelectedUsers.filter(item => item.id !== u.id))}
                          className="hover:text-white cursor-pointer bg-transparent border-none p-0 text-indigo-400"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {specialSelectedUsers.length < 2 && (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Ketik username atau email user..."
                        value={specialSearchQuery}
                        onChange={e => setSpecialSearchQuery(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-mono"
                      />
                    </div>

                    {/* Search suggestions dropdown */}
                    {getSpecialUserOptions().length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-40 bg-[#111218] border border-white/10 rounded-xl mt-1 overflow-hidden shadow-2xl divide-y divide-white/5">
                        {getSpecialUserOptions().map(u => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setSpecialSelectedUsers([...specialSelectedUsers, u]);
                              setSpecialSearchQuery('');
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer block bg-transparent border-none"
                          >
                            <span className="font-extrabold text-white">{u.username}</span>
                            <span className="text-[#86868b] font-mono ml-2">({u.email})</span>
                            {u.telegram && <span className="text-sky-400 text-[10px] ml-2 border border-sky-500/20 bg-sky-500/5 px-1 rounded">TG</span>}
                            {u.whatsapp_number && <span className="text-teal-400 text-[10px] ml-1 border border-teal-500/20 bg-teal-500/5 px-1 rounded">WA</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Custom Direct Message */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-[#86868b] tracking-wider">Isi Notifikasi Pribadi</label>
                <textarea
                  value={specialMessage}
                  onChange={e => setSpecialMessage(e.target.value)}
                  className="w-full h-32 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all custom-scrollbar resize-none font-mono"
                  placeholder="Tulis pesan personal disini..."
                />
              </div>

              {/* Selection Checkboxes */}
              <div className="flex flex-wrap items-center gap-4 py-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={specialViaTelegram}
                    onChange={e => setSpecialViaTelegram(e.target.checked)}
                    className="rounded border-white/15 bg-black/40 text-indigo-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-300">Kirim via Telegram</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={specialViaWhatsApp}
                    onChange={e => setSpecialViaWhatsApp(e.target.checked)}
                    className="rounded border-white/15 bg-black/40 text-indigo-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-300">Kirim via WhatsApp</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={specialViaEmail}
                    onChange={e => setSpecialViaEmail(e.target.checked)}
                    className="rounded border-white/15 bg-black/40 text-indigo-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-300">Kirim via Email</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={sendingSpecial}
                className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white font-extrabold text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-500/10 active:scale-[0.99] border-none"
              >
                {sendingSpecial ? (
                  <>
                    <RefreshCcw className="w-4 h-4 animate-spin" />
                    Mengirimkan Pesan...
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Kirim Notifikasi Khusus
                  </>
                )}
              </button>
            </form>

            {/* Connection status detail view */}
            <div className="space-y-4 border-l border-white/10 pl-6">
              <div className="border-b border-white/5 pb-2">
                <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Status Koneksi Media Target</span>
              </div>
              
              {specialSelectedUsers.length === 0 ? (
                <p className="text-[11px] text-[#86868b] italic">Pilih user untuk melihat status koneksi media (Telegram, WhatsApp, Email)...</p>
              ) : (
                <div className="space-y-5">
                  {specialSelectedUsers.map(u => {
                    const hasTelegram = !!u.telegram && u.telegram.trim().length > 0;
                    const hasWhatsApp = !!u.whatsapp_number && u.whatsapp_number.trim().length > 0;
                    const hasEmail = !!u.email && u.email.trim().length > 0;
                    const emailVerified = !!u.email_verified;
                    
                    return (
                      <div key={u.id} className="space-y-2.5 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-white text-xs">{u.username}</span>
                          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-white/10 text-slate-400 bg-white/5">{u.role || 'user'}</span>
                        </div>
                        
                        <div className="space-y-2 font-mono text-[10px]">
                          {/* Telegram connection status */}
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Telegram:</span>
                            {hasTelegram ? (
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 size={10} className="text-emerald-400" />
                                Terhubung ({u.telegram})
                              </span>
                            ) : (
                              <span className="text-red-400 font-bold flex items-center gap-1">
                                <XCircle size={10} className="text-red-400" />
                                Belum Terhubung
                              </span>
                            )}
                          </div>
                          
                          {/* WhatsApp connection status */}
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">WhatsApp:</span>
                            {hasWhatsApp ? (
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 size={10} className="text-emerald-400" />
                                Terhubung ({u.whatsapp_number})
                              </span>
                            ) : (
                              <span className="text-red-400 font-bold flex items-center gap-1">
                                <XCircle size={10} className="text-red-400" />
                                Belum Terhubung
                              </span>
                            )}
                          </div>

                          {/* Email connection status */}
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Email:</span>
                            {hasEmail ? (
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 size={10} className="text-emerald-400" />
                                {u.email} {emailVerified ? '(Verified)' : '(Unverified)'}
                              </span>
                            ) : (
                              <span className="text-red-400 font-bold flex items-center gap-1">
                                <XCircle size={10} className="text-red-400" />
                                Belum Terhubung
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: NOTIFICATION LOGS & HISTORY */}
      {activeTab === 'logs' && (
        <div className="space-y-6 w-full animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <History size={14} className="text-slate-400" />
              <h2 className="font-bold text-white text-xs uppercase tracking-wider">Seluruh Log Notifikasi & Siaran</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-white/10 bg-white/5 font-mono text-[9px] text-slate-400">
                <span className="font-black">! Relasi DB:</span>
                <span className="opacity-80">broadcast_logs_by_admin (SELECT), notifications (SELECT)</span>
              </div>
              <button 
                onClick={fetchLogs} 
                className="p-1 rounded-lg hover:bg-white/5 text-[#86868b] hover:text-white transition-colors cursor-pointer bg-transparent border-none"
                title="Refresh Logs"
              >
                <RefreshCcw size={12} />
              </button>
            </div>
          </div>

          {/* Logs Sub-Tabs */}
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            {[
              { id: 'broadcast', label: `Siaran & Broadcast (${logs.length})` },
              { id: 'general', label: `Notifikasi Umum User (${userNotificationLogs.length})` }
            ].map(sub => (
              <button
                key={sub.id}
                type="button"
                onClick={() => {
                  setLogsSubTab(sub.id as 'broadcast' | 'general');
                  setSelectedLog(null);
                }}
                className={`px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider font-extrabold transition-all cursor-pointer bg-transparent border ${
                  logsSubTab === sub.id 
                    ? 'border-sky-500/20 text-sky-400 bg-sky-500/5' 
                    : 'border-transparent text-[#86868b] hover:text-white hover:bg-white/5'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {logsSubTab === 'broadcast' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Logs Table column */}
              <div className={`${selectedLog ? 'lg:col-span-8' : 'lg:col-span-12'} transition-all duration-300 overflow-x-auto w-full bg-transparent`}>
                <table className="min-w-full divide-y divide-white/5 text-xs">
                  <thead className="bg-white/[0.01]">
                    <tr>
                      <th scope="col" className="px-4 py-3.5 text-left font-extrabold uppercase tracking-wider text-[#86868b] text-[10px]">ID Log</th>
                      <th scope="col" className="px-4 py-3.5 text-left font-extrabold uppercase tracking-wider text-[#86868b] text-[10px]">Pesan</th>
                      <th scope="col" className="px-4 py-3.5 text-left font-extrabold uppercase tracking-wider text-[#86868b] text-[10px]">Penerima / Kategori</th>
                      <th scope="col" className="px-4 py-3.5 text-left font-extrabold uppercase tracking-wider text-[#86868b] text-[10px]">Status</th>
                      <th scope="col" className="px-4 py-3.5 text-right font-extrabold uppercase tracking-wider text-[#86868b] text-[10px]">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-transparent">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-[#6a6a75] font-semibold">
                          Tidak ada catatan log notifikasi yang ditemukan.
                        </td>
                      </tr>
                    ) : (
                      logs.map(log => {
                        const isSelected = selectedLog?.id === log.id;
                        return (
                          <tr 
                            key={log.id} 
                            onClick={() => setSelectedLog(log)}
                            className={`transition-all cursor-pointer ${
                              isSelected ? 'bg-sky-500/5' : 'hover:bg-white/[0.005]'
                            }`}
                          >
                            <td className="px-4 py-3 font-mono text-[11px] text-slate-400">#LOG-{log.id}</td>
                            <td className="px-4 py-3 font-mono text-[11px] text-white max-w-sm truncate" title={log.message}>
                              {log.message}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {log.channels.map(ch => {
                                  const isSpecial = ch.startsWith('personal_telegram:') || ch.startsWith('personal_whatsapp:') || ch.startsWith('personal_email:');
                                  return (
                                    <span 
                                      key={ch} 
                                      className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide border ${
                                        isSpecial
                                          ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                                          : ch.includes('telegram')
                                            ? 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                                            : ch.includes('whatsapp')
                                              ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                                              : 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400'
                                      }`}
                                    >
                                      {ch.replace('personal_', 'Direct: ').replace(':', ' ')}
                                    </span>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                {log.status === 'success' ? (
                                  <span className="text-emerald-400 font-extrabold text-[9px] uppercase">SUCCESS</span>
                                ) : log.status === 'partial_success' ? (
                                  <span className="text-amber-400 font-extrabold text-[9px] uppercase">PARTIAL</span>
                                ) : (
                                  <span className="text-red-400 font-extrabold text-[9px] uppercase">FAILED</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-all bg-transparent border-none">
                                <ChevronRight size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Log details view */}
              {selectedLog && (
                <div className="lg:col-span-4 border-l border-white/10 pl-6 space-y-4 animate-in slide-in-from-right-5 duration-200 bg-transparent">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-300">Rincian Log</span>
                    <button 
                      onClick={() => setSelectedLog(null)}
                      className="p-1 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white cursor-pointer bg-transparent border-none"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">ID & Waktu Kirim</span>
                      <span className="text-white font-mono font-bold">#LOG-{selectedLog.id} ({selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString() : '-'})</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Kanal / Target Penerima</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedLog.channels.map(ch => (
                          <span key={ch} className="px-2 py-0.5 rounded text-[9px] font-bold border border-white/10 bg-white/5">
                            {ch}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/5">
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block mb-1">Isi Pesan Notifikasi</span>
                      <div className="bg-black/35 p-3 rounded-lg border border-white/5 max-h-40 overflow-y-auto custom-scrollbar font-mono text-[11px] text-slate-300 whitespace-pre-wrap">
                        {selectedLog.message}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/5">
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Status Eksekusi</span>
                      <span className={`text-[10px] font-black uppercase ${
                        selectedLog.status === 'success' ? 'text-emerald-400' : selectedLog.status === 'partial_success' ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {selectedLog.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto w-full bg-transparent">
              <table className="min-w-full divide-y divide-white/5 text-xs">
                <thead className="bg-white/[0.01]">
                  <tr>
                    <th scope="col" className="px-4 py-3.5 text-left font-extrabold uppercase tracking-wider text-[#86868b] text-[10px]">ID Notif</th>
                    <th scope="col" className="px-4 py-3.5 text-left font-extrabold uppercase tracking-wider text-[#86868b] text-[10px]">Target User</th>
                    <th scope="col" className="px-4 py-3.5 text-left font-extrabold uppercase tracking-wider text-[#86868b] text-[10px]">Judul & Kategori</th>
                    <th scope="col" className="px-4 py-3.5 text-left font-extrabold uppercase tracking-wider text-[#86868b] text-[10px]">Pesan</th>
                    <th scope="col" className="px-4 py-3.5 text-left font-extrabold uppercase tracking-wider text-[#86868b] text-[10px]">Status</th>
                    <th scope="col" className="px-4 py-3.5 text-right font-extrabold uppercase tracking-wider text-[#86868b] text-[10px]">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-transparent">
                  {userNotificationLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-[#6a6a75] font-semibold">
                        Tidak ada catatan notifikasi umum yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    userNotificationLogs.map(notif => (
                      <tr key={notif.id} className="hover:bg-white/[0.005] transition-all">
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-400">#NOTIF-{notif.id}</td>
                        <td className="px-4 py-3 font-bold text-white">
                          {notif.target_username || (
                            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded border border-sky-500/20 bg-sky-500/5 text-sky-400">Semua User</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-white font-medium">{notif.title}</span>
                            <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">{notif.category}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-300 font-mono text-[11px] max-w-sm truncate" title={notif.message}>
                          {notif.message}
                        </td>
                        <td className="px-4 py-3">
                          {notif.is_read ? (
                            <span className="text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/5 text-emerald-400">Read</span>
                          ) : (
                            <span className="text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-slate-400">Unread</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500 font-mono text-[10px]">
                          {notif.created_at ? new Date(notif.created_at).toLocaleString('id-ID') : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: SUBSCRIBERS LIST */}
      {activeTab === 'subscribers' && (
        <div className="space-y-6 w-full animate-in fade-in-50 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-3">
            {/* Sub-Tabs Navigation for Subscriber types */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              {[
                { id: 'all', label: `Semua (${allSubscribers.length})` },
                { id: 'wa', label: `WhatsApp (${waSubscribers.length})` },
                { id: 'tele', label: `Telegram (${teleSubscribers.length})` },
                { id: 'bot_updates', label: `Interaksi Bot (${botUpdates.length})`, icon: Bot },
              ].map(sub => {
                const isActive = activeSubTab === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setActiveSubTab(sub.id as SubTabType);
                      setSelectedUser(null);
                      setSelectedBotUpdate(null);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border transition-all cursor-pointer bg-transparent ${
                      isActive 
                        ? 'border-sky-500/50 text-sky-400 bg-sky-500/5' 
                        : 'border-white/5 text-[#86868b] hover:text-white hover:border-white/10'
                    }`}
                  >
                    {sub.icon && <sub.icon size={10} />}
                    {sub.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-white/10 bg-white/5 font-mono text-[9px] text-slate-400">
                <span className="font-black">! Relasi DB:</span>
                <span className="opacity-80">
                  {activeSubTab === 'bot_updates' ? 'Telegram getUpdates API' : 'users_by_usermanagement (SELECT)'}
                </span>
              </div>
              
              {/* Search Input */}
              <div className="relative max-w-sm w-full sm:w-60">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder={
                    activeSubTab === 'bot_updates' 
                      ? "Cari chat ID, username..."
                      : "Cari username, email..."
                  }
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Table Container - Left column */}
            <div className={`${(selectedUser || selectedBotUpdate) ? 'lg:col-span-8' : 'lg:col-span-12'} transition-all duration-300 overflow-x-auto w-full bg-transparent`}>
              
              {activeSubTab !== 'bot_updates' ? (
                // TABLE A: USER SUBSCRIBERS
                <table className="min-w-full divide-y divide-white/5 text-xs">
                  <thead className="bg-white/[0.01]">
                    <tr>
                      <th scope="col" className="px-4 py-3.5 text-left font-extrabold uppercase tracking-wider text-[#86868b] text-[10px]">User</th>
                      <th scope="col" className="px-4 py-3.5 text-left font-extrabold uppercase tracking-wider text-[#86868b] text-[10px]">Telegram</th>
                      <th scope="col" className="px-4 py-3.5 text-left font-extrabold uppercase tracking-wider text-[#86868b] text-[10px]">WhatsApp</th>
                      <th scope="col" className="px-4 py-3.5 text-left font-extrabold uppercase tracking-wider text-[#86868b] text-[10px]">Notif Signals</th>
                      <th scope="col" className="px-4 py-3.5 text-right font-extrabold uppercase tracking-wider text-[#86868b] text-[10px]">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-transparent">
                    {getFilteredSubscribers().length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-[#6a6a75] font-semibold">
                          Tidak ada pengguna terdaftar untuk tipe berlangganan ini.
                        </td>
                      </tr>
                    ) : (
                      getFilteredSubscribers().map(user => {
                        const isSelected = selectedUser?.id === user.id;
                        return (
                          <tr 
                            key={user.id} 
                            onClick={() => {
                              setSelectedUser(user);
                              setSelectedBotUpdate(null);
                            }}
                            className={`transition-all cursor-pointer ${
                              isSelected ? 'bg-sky-500/5' : 'hover:bg-white/[0.005]'
                            }`}
                          >
                            <td className="px-4 py-3">
                              <div>
                                <span className="font-bold text-white block">{user.username}</span>
                                <span className="text-[10px] text-[#86868b] font-mono">{user.email}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {user.telegram ? (
                                <span className="font-mono text-white text-[11px]">{user.telegram}</span>
                              ) : (
                                <span className="text-[#6a6a75] text-[10px] italic">Tidak Ada</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {user.whatsapp_number ? (
                                <span className="font-mono text-white text-[11px]">{user.whatsapp_number}</span>
                              ) : (
                                <span className="text-[#6a6a75] text-[10px] italic">Tidak Ada</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${
                                user.notif_signal_enabled
                                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                  : 'bg-white/5 text-[#6a6a75] border-white/5'
                              }`}>
                                {user.notif_signal_enabled ? 'Aktif' : 'Mati'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-all bg-transparent border-none">
                                <ChevronRight size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              ) : (
                // TABLE B: TELEGRAM BOT UPDATES (/start interaction)
                <table className="min-w-full divide-y divide-white/5 text-xs">
                  <thead className="bg-white/[0.01]">
                    <tr>
                      <th scope="col" className="px-4 py-3.5 text-left font-extrabold uppercase tracking-wider text-[#86868b] text-[10px]">Chat ID</th>
                      <th scope="col" className="px-4 py-3.5 text-left font-extrabold uppercase tracking-wider text-[#86868b] text-[10px]">Username</th>
                      <th scope="col" className="px-4 py-3.5 text-left font-extrabold uppercase tracking-wider text-[#86868b] text-[10px]">Nama Depan</th>
                      <th scope="col" className="px-4 py-3.5 text-left font-extrabold uppercase tracking-wider text-[#86868b] text-[10px]">Pesan Terakhir</th>
                      <th scope="col" className="px-4 py-3.5 text-right font-extrabold uppercase tracking-wider text-[#86868b] text-[10px]">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-transparent">
                    {loadingBotUpdates ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                          <RefreshCcw className="w-4 h-4 animate-spin inline mr-2" /> Memuat data dari Bot Telegram...
                        </td>
                      </tr>
                    ) : getFilteredBotUpdates().length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-[#6a6a75] font-semibold">
                          Belum ada aktivitas interaksi baru (/start) pada Bot ini.
                        </td>
                      </tr>
                    ) : (
                      getFilteredBotUpdates().map(update => {
                        const isSelected = selectedBotUpdate?.chat_id === update.chat_id;
                        return (
                          <tr 
                            key={update.chat_id}
                            onClick={() => {
                              setSelectedBotUpdate(update);
                              setSelectedUser(null);
                            }}
                            className={`transition-all cursor-pointer ${
                              isSelected ? 'bg-sky-500/5' : 'hover:bg-white/[0.005]'
                            }`}
                          >
                            <td className="px-4 py-3 font-mono text-white text-[11px]">
                              {update.chat_id}
                            </td>
                            <td className="px-4 py-3 font-bold text-sky-400">
                              {update.username ? `@${update.username}` : <span className="text-slate-600 font-normal italic">Tidak Ada</span>}
                            </td>
                            <td className="px-4 py-3 text-white">
                              {update.first_name || '-'}
                            </td>
                            <td className="px-4 py-3 text-slate-400 max-w-xs truncate" title={update.last_message || ''}>
                              {update.last_message || <span className="text-slate-600 italic">Interaksi non-teks</span>}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-all bg-transparent border-none">
                                <ChevronRight size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Details Panel - Right Column */}
            {(selectedUser || selectedBotUpdate) && (
              <div className="lg:col-span-4 border-l border-white/10 pl-6 space-y-5 animate-in slide-in-from-right-5 duration-200 bg-transparent">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <Info size={14} className="text-sky-400" />
                    <span className="font-bold text-white text-xs uppercase tracking-wider">Detail Informasi</span>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedUser(null);
                      setSelectedBotUpdate(null);
                    }}
                    className="p-1 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
                  >
                    <X size={14} />
                  </button>
                </div>

                {selectedUser && (
                  <div className="space-y-4 text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Username</span>
                      <span className="text-white font-extrabold text-sm block">{selectedUser.username}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Email Address</span>
                      <span className="text-white font-mono block">{selectedUser.email}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">ID Akun</span>
                        <span className="text-white font-mono font-bold block">#USR-{selectedUser.id}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Role</span>
                        <span className="text-white font-bold uppercase block">{selectedUser.role || 'user'}</span>
                      </div>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-white/5">
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Telegram Chat ID</span>
                      {selectedUser.telegram ? (
                        <div className="flex items-center gap-1.5">
                          <UserCheck size={12} className="text-sky-400" />
                          <span className="text-white font-mono font-bold">{selectedUser.telegram}</span>
                        </div>
                      ) : (
                        <span className="text-red-400 italic font-semibold">Belum Terhubung ke Bot</span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">WhatsApp Number</span>
                      {selectedUser.whatsapp_number ? (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 size={12} className="text-emerald-400" />
                          <span className="text-white font-mono font-bold">{selectedUser.whatsapp_number}</span>
                        </div>
                      ) : (
                        <span className="text-red-400 italic font-semibold">Belum Terverifikasi OTP</span>
                      )}
                    </div>

                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block font-bold">Preferensi Notifikasi</span>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg text-center">
                          <span className="text-[9px] text-[#86868b] block font-bold">SIGNAL NOTIF</span>
                          <span className={`text-[10px] font-black ${selectedUser.notif_signal_enabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {selectedUser.notif_signal_enabled ? 'ON' : 'OFF'}
                          </span>
                        </div>
                        <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg text-center">
                          <span className="text-[9px] text-[#86868b] block font-bold">MARKETING</span>
                          <span className={`text-[10px] font-black ${selectedUser.notif_marketing_enabled ? 'text-[#86868b]' : 'text-slate-500'}`}>
                            {selectedUser.notif_marketing_enabled ? 'ON' : 'OFF'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-white/5 flex items-center gap-1.5 text-slate-500">
                      <Calendar size={12} />
                      <span className="text-[9px]">Terdaftar pada: {new Date(selectedUser.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}

                {selectedBotUpdate && (
                  <div className="space-y-4 text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Chat ID (Telegram)</span>
                      <span className="text-white font-mono font-bold text-sm block">{selectedBotUpdate.chat_id}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Username Telegram</span>
                      {selectedBotUpdate.username ? (
                        <span className="text-sky-400 font-extrabold block">@{selectedBotUpdate.username}</span>
                      ) : (
                        <span className="text-slate-500 italic block">Tidak ada username</span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">First / Last Name</span>
                      <span className="text-white block">{selectedBotUpdate.first_name || '-'} {selectedBotUpdate.last_name || ''}</span>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-white/5">
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block flex items-center gap-1">
                        <MessageSquare size={11} /> Pesan Terakhir Ke Bot
                      </span>
                      <div className="bg-black/30 p-2.5 rounded-lg border border-white/5 max-h-24 overflow-y-auto font-mono text-[11px] text-slate-300 whitespace-pre-wrap">
                        {selectedBotUpdate.last_message || <span className="text-slate-600 italic">Interaksi non-teks</span>}
                      </div>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-white/5 flex items-center gap-1.5 text-slate-500">
                      <Calendar size={12} />
                      <span className="text-[9px]">
                        Waktu Kirim: {selectedBotUpdate.date ? new Date(Number(selectedBotUpdate.date) * 1000).toLocaleString() : '-'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: EMERGENCY MODE */}
      {activeTab === 'emergency' && (
        <div className="space-y-6 w-full animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Flame size={14} className="text-red-400 animate-pulse" />
              <h2 className="font-bold text-white text-xs uppercase tracking-wider">Mode Penyiaran Darurat (Emergency Mode)</h2>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-red-500/10 bg-red-500/5 font-mono text-[9px] text-red-400">
              <span className="font-black">! Relasi DB:</span>
              <span className="opacity-80">admin_notification_settings (emergency_template_*), users_by_usermanagement, broadcast_logs_by_admin</span>
            </div>
          </div>

          {/* Danger Alert Warning Banner */}
          <div className="bg-red-955/20 border border-red-500/30 p-4 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5 animate-bounce" />
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-red-400 block">PERINGATAN PENTING</span>
              <p className="text-[11px] text-[#c9c9d4] leading-relaxed">
                Fitur ini akan mengirimkan pesan darurat instan secara paralel ke <strong>SELURUH KANAL</strong> sekaligus: Grup Telegram UP & DOWN, Grup WhatsApp UP & DOWN, serta seluruh chat Telegram personal dan nomor WhatsApp pribadi trader yang terdaftar di database. Gunakan hanya saat keadaan darurat yang kritis (misalnya server mati, peretasan, atau maintenance mendadak).
              </p>
            </div>
          </div>

          <div className="space-y-6 pt-4 bg-transparent">
            {/* Quick Template Picker */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-[#86868b] tracking-wider block">Pilih Template Pesan Darurat</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'down', label: 'Sistem Down', style: 'border-red-500/20 text-red-400 hover:bg-red-500/5' },
                  { id: 'hacked', label: 'Sistem Diretas', style: 'border-rose-500/20 text-rose-400 hover:bg-rose-500/5' },
                  { id: 'maintenance', label: 'Pemeliharaan', style: 'border-amber-500/20 text-amber-400 hover:bg-amber-500/5' },
                  { id: 'custom', label: 'Kustom Kosong', style: 'border-white/10 text-white hover:bg-white/5' }
                ].map(tmpl => {
                  const isSelected = selectedTemplate === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => selectEmergencyTemplate(tmpl.id as any)}
                      className={`px-3 py-2 rounded-lg border text-center text-xs font-bold transition-all cursor-pointer bg-transparent ${
                        isSelected 
                          ? 'bg-red-600 text-white border-red-600 font-extrabold scale-[1.02] shadow-lg shadow-red-500/10' 
                          : tmpl.style
                      }`}
                    >
                      {tmpl.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Emergency Message Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-[#86868b] tracking-wider">Isi Notifikasi Darurat (Markdown / HTML didukung)</label>
              <textarea
                value={emergencyMessage}
                onChange={e => {
                  setEmergencyMessage(e.target.value);
                  setSelectedTemplate('custom');
                }}
                className="w-full h-40 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500/50 transition-all custom-scrollbar resize-none font-mono"
                placeholder="Tulis pesan darurat kustom di sini..."
              />
            </div>

            {/* Submit Trigger button */}
            <button
              type="button"
              onClick={() => {
                if (!emergencyMessage.trim()) {
                  showToast('Please write or select an emergency message first', 'error');
                  return;
                }
                setShowEmergencyConfirm(true);
              }}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-widest py-4 rounded-xl transition-all cursor-pointer shadow-lg shadow-red-600/20 active:scale-[0.99] border-none"
            >
              <ShieldAlert size={14} />
              Aktifkan Siaran Darurat (Broadcast ke Semua)
            </button>
          </div>

          {/* Confirm Dialog Modal Overlay */}
          {showEmergencyConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in-50 duration-200">
              <div className="bg-[#111218] border border-red-500/30 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                <div className="flex items-center gap-3 text-red-500">
                  <AlertTriangle className="w-6 h-6 shrink-0 animate-bounce" />
                  <span className="text-sm font-black uppercase tracking-wider">KONFIRMASI TINDAKAN DARURAT</span>
                </div>
                
                <p className="text-xs text-[#c9c9d4] leading-relaxed">
                  Apakah Anda benar-benar yakin ingin mengirimkan broadcast darurat ini ke <strong>SEMUA PENGGUNA</strong>? Tindakan ini tidak dapat dibatalkan.
                </p>

                <div className="bg-black/30 border border-white/5 p-3 rounded-lg max-h-32 overflow-y-auto custom-scrollbar">
                  <p className="font-mono text-[10px] text-white whitespace-pre-wrap">{emergencyMessage}</p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setShowEmergencyConfirm(false)}
                    disabled={emergencyBroadcasting}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-lg border border-white/5 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleEmergencyBroadcast}
                    disabled={emergencyBroadcasting}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-black text-xs uppercase tracking-wider py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer border-none"
                  >
                    {emergencyBroadcasting ? (
                      <>
                        <RefreshCcw size={12} className="animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      'Ya, Kirim Sekarang'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* TAB CONTENT: GENERAL NOTIFICATION SETTINGS */}
      {activeTab === 'settings' && (
        <div className="w-full space-y-6 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Settings2 size={14} className="text-sky-400" />
              <h2 className="font-bold text-white text-xs uppercase tracking-wider">Konfigurasi &amp; Parameter Notifikasi</h2>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-sky-500/10 bg-sky-500/5 font-mono text-[9px] text-sky-400">
              <span className="font-black">! Relasi DB:</span>
              <span className="opacity-80">admin_notification_settings (SELECT, INSERT, UPDATE)</span>
            </div>
          </div>

          {/* Settings Sub-Tabs Navigation */}
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <button
              type="button"
              onClick={() => setSettingsSubTab('api')}
              className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-extrabold transition-all cursor-pointer border-none ${
                settingsSubTab === 'api' ? 'bg-sky-505 text-black bg-sky-400' : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              1. API &amp; Koneksi
            </button>
            <button
              type="button"
              onClick={() => setSettingsSubTab('templates')}
              className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-extrabold transition-all cursor-pointer border-none ${
                settingsSubTab === 'templates' ? 'bg-sky-505 text-black bg-sky-400' : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              2. Template Darurat
            </button>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6 pt-2 bg-transparent font-sans">
            <fieldset disabled={saving} className="space-y-6 border-none p-0 m-0">
              {settingsSubTab === 'api' ? (
                <div className="space-y-6 animate-in fade-in-50 duration-200">
                  {/* API Settings */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-sky-400 tracking-widest">Telegram &amp; WhatsApp API Config</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] uppercase font-bold text-[#86868b] tracking-wider">Telegram Bot Token</label>
                        <input
                          type="password"
                          value={settings.telegram_bot_token}
                          onChange={e => setSettings({ ...settings, telegram_bot_token: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50 transition-all font-mono"
                          placeholder="Enter Telegram bot token..."
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-[#86868b] tracking-wider">Group ID UP Signals</label>
                        <input
                          type="text"
                          value={settings.telegram_chat_id_up}
                          onChange={e => setSettings({ ...settings, telegram_chat_id_up: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50 transition-all font-mono"
                          placeholder="-100xxxxxxxxxx"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-[#86868b] tracking-wider">Group ID DOWN Signals</label>
                        <input
                          type="text"
                          value={settings.telegram_chat_id_down}
                          onChange={e => setSettings({ ...settings, telegram_chat_id_down: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50 transition-all font-mono"
                          placeholder="-100xxxxxxxxxx"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-[#86868b] tracking-wider">WhatsApp Group ID UP</label>
                        <input
                          type="text"
                          value={settings.whatsapp_group_id_up}
                          onChange={e => setSettings({ ...settings, whatsapp_group_id_up: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50 transition-all font-mono"
                          placeholder="group_id_up@g.us"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-[#86868b] tracking-wider">WhatsApp Group ID DOWN</label>
                        <input
                          type="text"
                          value={settings.whatsapp_group_id_down}
                          onChange={e => setSettings({ ...settings, whatsapp_group_id_down: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50 transition-all font-mono"
                          placeholder="group_id_down@g.us"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-[#86868b] tracking-wider">WhatsApp Bridge Port</label>
                        <input
                          type="text"
                          value={settings.whatsapp_port}
                          onChange={e => setSettings({ ...settings, whatsapp_port: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50 transition-all font-mono"
                          placeholder="5001"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-[#86868b] tracking-wider">Cooldown Minutes (Anti-Spam)</label>
                        <input
                          type="text"
                          value={settings.cooldown_minutes}
                          onChange={e => setSettings({ ...settings, cooldown_minutes: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50 transition-all font-mono"
                          placeholder="15"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Error alerts toggle */}
                  <div className="flex items-center justify-between bg-white/[0.01] border border-white/5 p-4 rounded-xl">
                    <div>
                      <span className="text-xs font-bold text-white block">Laporkan Gangguan Mesin (Error Alerts)</span>
                      <span className="text-[10px] text-[#6a6a75]">Kirim pesan otomatis saat engine terdeteksi terputus atau mengalami error.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettings({ 
                        ...settings, 
                        alert_on_errors: settings.alert_on_errors === 'true' ? 'false' : 'true' 
                      })}
                      className={`w-11 h-6 rounded-full transition-all duration-300 relative bg-transparent border-none ${
                        settings.alert_on_errors === 'true' ? 'bg-sky-500' : 'bg-white/10'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all duration-300 ${
                        settings.alert_on_errors === 'true' ? 'left-6' : 'left-1'
                      }`} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in-50 duration-200">
                  {/* Emergency Templates configuration */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-sky-400 tracking-widest">Emergency Message Templates (SQL Persisted)</h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-[#86868b] tracking-wider block">Template: Sistem Down</label>
                        <textarea
                          value={settings.emergency_template_down || ''}
                          onChange={e => setSettings({ ...settings, emergency_template_down: e.target.value })}
                          className="w-full h-24 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50 transition-all font-mono resize-none"
                          placeholder="Tulis template sistem down..."
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-[#86868b] tracking-wider block">Template: Sistem Diretas</label>
                        <textarea
                          value={settings.emergency_template_hacked || ''}
                          onChange={e => setSettings({ ...settings, emergency_template_hacked: e.target.value })}
                          className="w-full h-24 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50 transition-all font-mono resize-none"
                          placeholder="Tulis template sistem diretas..."
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-[#86868b] tracking-wider block">Template: Pemeliharaan (Maintenance)</label>
                        <textarea
                          value={settings.emergency_template_maintenance || ''}
                          onChange={e => setSettings({ ...settings, emergency_template_maintenance: e.target.value })}
                          className="w-full h-24 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50 transition-all font-mono resize-none"
                          placeholder="Tulis template pemeliharaan..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-500/50 text-black font-extrabold text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-sky-500/10 active:scale-[0.99] border-none"
              >
                {saving ? (
                  <>
                    <RefreshCcw className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    Simpan Pengaturan
                  </>
                )}
              </button>
            </fieldset>
          </form>
        </div>
      )}
    </div>
  );
}
