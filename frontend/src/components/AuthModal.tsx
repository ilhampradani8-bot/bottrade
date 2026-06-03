"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: any) {
  const [mode, setMode] = useState(initialMode);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setMessage({ type: '', text: '' });
    }
  }, [initialMode, isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const apiHost = window.location.hostname;
      const response = await fetch(`http://${apiHost}:8080${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        if (data.token) {
          localStorage.setItem('token', data.token);
          setTimeout(() => window.location.reload(), 1000);
        }
        if (mode === 'register') {
          setTimeout(() => setMode('login'), 1500);
        }
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal terhubung ke server' });
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#0a0c14] border border-white/10 shadow-2xl relative rounded-2xl overflow-hidden my-auto cursor-default"
      >
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-700/5 blur-3xl rounded-none pointer-events-none"></div>
        
        {/* Header */}
        <div className="py-5 px-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
           <div className="flex items-center gap-3">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white">
                 {mode === 'login' ? 'Masuk Akun' : 'Daftar Akun'}
              </h2>
           </div>
           <button 
             onClick={onClose} 
             className="text-[10px] font-black uppercase tracking-widest text-[#86868b] hover:text-white transition-all py-1 px-3 border border-white/5 bg-[#0a0c14] shadow-[-2px_-2px_6px_rgba(255,255,255,0.01),2px_2px_6px_rgba(0,0,0,0.4)] rounded-lg active:shadow-[inset_-1px_-1px_2px_rgba(255,255,255,0.01),inset_1px_1px_2px_rgba(0,0,0,0.4)]"
           >
              TUTUP
           </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
           {message.text && (
              <div className="p-3 text-[9px] font-bold uppercase tracking-widest border bg-black/40 border-white/5 rounded-xl shadow-[inset_1px_1px_3px_rgba(0,0,0,0.8)] text-center text-slate-300">
                 {message.text}
              </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'register' && (
                 <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Username</label>
                    <input 
                       type="text" 
                       required
                       placeholder="Masukkan username"
                       className="w-full px-4 py-2.5 bg-[#06070a] shadow-[inset_-1px_-1px_3px_rgba(255,255,255,0.02),inset_1px_1px_3px_rgba(0,0,0,0.8)] border border-white/5 focus:border-blue-500/30 rounded-xl font-bold text-xs text-white placeholder-slate-600 transition-all outline-none"
                       value={formData.username}
                       onChange={(e) => setFormData({...formData, username: e.target.value})}
                    />
                 </div>
              )}

              <div className="space-y-1.5">
                 <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Alamat Email</label>
                 <input 
                    type="email" 
                    required
                    placeholder="email@anda.com"
                    className="w-full px-4 py-2.5 bg-[#06070a] shadow-[inset_-1px_-1px_3px_rgba(255,255,255,0.02),inset_1px_1px_3px_rgba(0,0,0,0.8)] border border-white/5 focus:border-blue-500/30 rounded-xl font-bold text-xs text-white placeholder-slate-600 transition-all outline-none"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                 />
              </div>

              <div className="space-y-1.5">
                 <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Kata Sandi</label>
                 <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-[#06070a] shadow-[inset_-1px_-1px_3px_rgba(255,255,255,0.02),inset_1px_1px_3px_rgba(0,0,0,0.8)] border border-white/5 focus:border-blue-500/30 rounded-xl font-bold text-xs text-white placeholder-slate-600 transition-all outline-none"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                 />
              </div>

              <button 
                 type="submit" 
                 disabled={loading}
                 className="w-full font-bold uppercase tracking-widest text-xs py-3.5 mt-4 rounded-xl transition-all flex items-center justify-center gap-2 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 border border-blue-400/10 text-white shadow-[-3px_-3px_8px_rgba(255,255,255,0.04),3px_3px_8px_rgba(0,0,0,0.8)] active:shadow-[inset_-1px_-1px_3px_rgba(255,255,255,0.04),inset_1px_1px_3px_rgba(0,0,0,0.8)] cursor-pointer"
              >
                 {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full"></div>
                 ) : (
                    mode === 'login' ? 'MASUK' : 'DAFTAR'
                 )}
              </button>
           </form>

           {/* Footer / Switch Mode */}
           <div className="pt-4 border-t border-white/5 text-center">
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                 {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}
                 <button 
                    onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                    className="ml-2 text-blue-400 hover:text-white transition-colors"
                  >
                    {mode === 'login' ? 'DAFTAR SEKARANG' : 'MASUK DISINI'}
                 </button>
              </p>
           </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
