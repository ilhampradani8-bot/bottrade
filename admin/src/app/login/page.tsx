"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://139.59.122.230:8080/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem('admin_token', data.token);
        router.push('/');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Connection to security server failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[420px] space-y-8 animate-in fade-in zoom-in duration-700">
        {/* Branding */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white text-black rounded-[2.5rem] shadow-2xl shadow-white/10 mb-2">
            <ShieldCheck size={42} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">BotTrade <span className="text-[#6a6a75] font-light">Admin</span></h1>
            <p className="text-[#6a6a75] text-sm mt-2 font-medium">Restricted access kernel. Authorization required.</p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="bg-white/[0.03] border border-white/5 p-10 rounded-[3rem] space-y-6 shadow-2xl">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold animate-shake">
              <AlertCircle size={18} />
              {error.toUpperCase()}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6a6a75] group-focus-within:text-white transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Access ID (Username)" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-2xl text-sm text-white focus:outline-none focus:border-white/20 transition-all placeholder:text-[#3a3a44] font-medium"
                required
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6a6a75] group-focus-within:text-white transition-colors" size={18} />
              <input 
                type="password" 
                placeholder="Secure Key (Password)" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-2xl text-sm text-white focus:outline-none focus:border-white/20 transition-all placeholder:text-[#3a3a44] font-medium"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-white text-black py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#e0e0e6] active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
          >
            {loading ? 'AUTHORIZING...' : 'INITIATE ACCESS'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="text-center">
            <p className="text-[10px] text-[#3a3a44] font-bold uppercase tracking-[0.2em]">
                System Secure • IP Logged • v2.4.0
            </p>
        </div>
      </div>
    </div>
  );
}
