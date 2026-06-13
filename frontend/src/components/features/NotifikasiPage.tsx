"use client";

import React, { useState, useEffect } from 'react';
import { Bell, Zap, ShieldCheck, TrendingUp, Check, Trash2, Clock } from 'lucide-react';
import { UserNotification } from '@/types/UserNotification';

export default function NotifikasiPage() {
  const [filter, setFilter] = useState('Semua');
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = ['Semua', 'info', 'alert', 'promo'];

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const apiHost = window.location.hostname;
      const res = await fetch(`http://${apiHost}:8080/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const apiHost = window.location.hostname;
      const res = await fetch(`http://${apiHost}:8080/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const unreadNotifications = notifications.filter(n => !n.is_read);
    try {
      const apiHost = window.location.hostname;
      await Promise.all(
        unreadNotifications.map(n => 
          fetch(`http://${apiHost}:8080/api/notifications/${n.id}/read`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          })
        )
      );
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const apiHost = window.location.hostname;
      const res = await fetch(`http://${apiHost}:8080/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const apiHost = window.location.hostname;
      await Promise.all(
        notifications.map(n => 
          fetch(`http://${apiHost}:8080/api/notifications/${n.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          })
        )
      );
      setNotifications([]);
    } catch (err) {
      console.error(err);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'alert':
        return <Zap size={16} className="text-amber-400 animate-pulse" />;
      case 'promo':
        return <TrendingUp size={16} className="text-emerald-400" />;
      default:
        return <ShieldCheck size={16} className="text-indigo-400" />;
    }
  };

  const filteredNotif = filter === 'Semua' 
    ? notifications 
    : notifications.filter(n => n.category.toLowerCase() === filter.toLowerCase());

  return (
    <div className="w-full px-4 sm:px-8 py-4 space-y-6">
      
      {/* Top Action Buttons - Align with borderless layout */}
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-[6px] text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                filter === cat 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                  : 'bg-white/5 border-white/5 text-[#86868b] hover:text-white hover:bg-white/10'
              }`}
            >
              {cat === 'Semua' ? 'Semua' : cat}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleMarkAllRead}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-[6px] text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer border border-white/5 transition-all"
          >
            <Check size={12} />
            <span>Tandai Dibaca</span>
          </button>
          <button 
            onClick={handleClearAll}
            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-[6px] text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer border border-rose-500/20 transition-all"
          >
            <Trash2 size={12} />
            <span>Hapus Semua</span>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-xs text-[#86868b] font-bold uppercase tracking-widest animate-pulse">
            Memuat notifikasi...
          </div>
        ) : filteredNotif.length === 0 ? (
          <div className="border border-white/10 p-12 text-center flex flex-col items-center justify-center space-y-3 rounded-[6px] bg-[#09090b]">
            <div className="p-4 bg-white/5 rounded-full border border-white/5 text-[#86868b]">
              <Bell size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Tidak ada notifikasi</h3>
              <p className="text-xs text-[#86868b] mt-1">Semua notifikasi baru atau alerts aktivitas akan muncul di sini.</p>
            </div>
          </div>
        ) : (
          filteredNotif.map((notif) => (
            <div 
              key={notif.id} 
              className={`border border-white/10 bg-[#09090b] p-4 transition-all flex items-start gap-4 rounded-[6px] hover:border-white/20 relative group ${
                !notif.is_read ? 'border-indigo-500/30 bg-indigo-500/[0.01]' : ''
              }`}
            >
              <div className="p-2.5 bg-white/5 rounded-[6px] border border-white/5 self-start">
                {getCategoryIcon(notif.category)}
              </div>

              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    {notif.title}
                    {!notif.is_read && (
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
                    )}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-white/5 border border-white/5 rounded text-[#86868b]">
                      {notif.category}
                    </span>
                    {!notif.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="text-[9px] text-indigo-400 hover:text-indigo-300 font-black uppercase tracking-wider cursor-pointer"
                      >
                        Tandai Dibaca
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notif.id)}
                      className="p-1 hover:bg-white/5 rounded text-[#86868b] hover:text-rose-400 cursor-pointer transition-all"
                      title="Hapus"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">{notif.message}</p>
                
                <div className="flex items-center gap-1.5 text-[10px] text-[#86868b] font-bold">
                  <Clock size={12} />
                  <span>{new Date(notif.created_at).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
