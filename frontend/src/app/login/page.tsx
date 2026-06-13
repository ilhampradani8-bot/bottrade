"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import { ArrowLeft, Mail, Lock, User, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Sync theme on initial load
  useEffect(() => {
    const savedTheme = (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, []);

  // Check if user already has NextAuth session and sync token
  useEffect(() => {
    const syncSession = async () => {
      const session = await getSession();
      if (session && (session as any).backendToken) {
        localStorage.setItem('token', (session as any).backendToken);
        window.location.href = '/dashboard';
      }
    };
    syncSession();
  }, []);

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
          // Instant direct redirect
          window.location.href = '/dashboard';
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

  // NextAuth Social Login handlers
  const handleSocialLogin = async (provider: string) => {
    setSocialLoading(provider);
    setMessage({ type: '', text: '' });
    try {
      await signIn(provider, { callbackUrl: '/login' });
    } catch (err) {
      setMessage({ type: 'error', text: `Gagal menghubungkan ke ${provider}` });
      setSocialLoading(null);
    }
  };

  // Handle Demo Account Login
  const handleDemoLogin = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const demoId = Math.floor(1000 + Math.random() * 9000);
      const demoData = {
        email: `guest_demo_${demoId}@tradingsafe.com`,
        name: `Guest Demo ${demoId}`,
        provider: 'demo',
        provider_id: `demo_${demoId}`
      };
      
      const apiHost = window.location.hostname;
      const res = await fetch(`http://${apiHost}:8080/api/auth/social`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(demoData),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('token', data.token);
          // Instant direct login
          window.location.href = '/dashboard';
        }
      } else {
        setMessage({ type: 'error', text: 'Gagal inisialisasi akun demo.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Gagal terhubung ke server demo.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center relative w-full overflow-hidden font-sans p-4 select-none bg-cover bg-center"
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2000&auto=format&fit=crop')"
      }}
    >
      {/* Background overlay adapting to theme */}
      <div className="absolute inset-0 bg-[#030303]/85 dark:bg-black/90 light:bg-white/45 backdrop-blur-[6px] pointer-events-none transition-all duration-300" />

      {/* Floating Card: Return Home Button (Top Left) */}
      <button 
        onClick={() => router.push('/home')}
        className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-slate-900/60 dark:bg-black/50 border border-sky-400/30 hover:border-sky-400/80 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider text-sky-400 hover:text-white transition-all cursor-pointer group shadow-lg shadow-sky-500/5 hover:shadow-sky-500/15 active:scale-95 z-20"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-all" />
        <span>Beranda</span>
      </button>

      {/* Main glass card container with Gradient */}
      <div className={`w-full max-w-lg border backdrop-blur-2xl rounded-2xl overflow-hidden p-6 sm:p-8 space-y-6 relative z-10 transition-all duration-300 ${
        theme === 'light'
          ? 'bg-gradient-to-br from-white/95 via-sky-50/90 to-sky-100/85 border-sky-300/30 shadow-[0_0_40px_rgba(0,188,255,0.08)] text-slate-800'
          : 'bg-gradient-to-br from-[#0c1020]/95 via-[#080b11]/95 to-[#0b1d30]/90 border-sky-400/20 shadow-[0_0_50px_rgba(0,188,255,0.15)] text-[#f5f5f7]'
      }`}>
        
        {/* Top Header */}
        <div className="text-center space-y-2">
          {/* Logo is always pure white */}
          <h1 className="text-3xl font-black uppercase tracking-[0.2em] text-white drop-shadow-[0_2px_10px_rgba(0,188,255,0.3)]">
            TradingSafe
          </h1>
          <p className={`text-xs uppercase tracking-widest font-bold ${
            theme === 'light' ? 'text-slate-500' : 'text-sky-400/80'
          }`}>
            Platform Trading Kuantitatif Otonom
          </p>
        </div>

        {/* Tab switch between Sign In and Sign Up */}
        <div className={`flex border-b w-full gap-2 ${
          theme === 'light' ? 'border-slate-200' : 'border-white/10'
        }`}>
          <button
            onClick={() => { setMode('login'); setMessage({ type: '', text: '' }); }}
            className={`flex-1 text-center py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              mode === 'login' 
                ? 'border-sky-400 text-sky-400 font-extrabold' 
                : theme === 'light' 
                  ? 'border-transparent text-slate-400 hover:text-slate-700'
                  : 'border-transparent text-[#86868b] hover:text-white'
            }`}
          >
            Masuk Akun
          </button>
          <button
            onClick={() => { setMode('register'); setMessage({ type: '', text: '' }); }}
            className={`flex-1 text-center py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              mode === 'register' 
                ? 'border-sky-400 text-sky-400 font-extrabold' 
                : theme === 'light' 
                  ? 'border-transparent text-slate-400 hover:text-slate-700'
                  : 'border-transparent text-[#86868b] hover:text-white'
            }`}
          >
            Daftar Akun
          </button>
        </div>

        {/* Status Message Display */}
        {message.text && (
          <div className={`p-4 rounded-[6px] text-xs font-bold text-center ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}>
            {message.text}
          </div>
        )}

        {/* Auth Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className={`text-[10px] font-black uppercase tracking-wider block ${
                theme === 'light' ? 'text-slate-500' : 'text-[#86868b]'
              }`}>
                Username
              </label>
              <div className="relative">
                <span className={`absolute inset-y-0 left-0 pl-3 flex items-center ${
                  theme === 'light' ? 'text-slate-400' : 'text-[#86868b]'
                }`}>
                  <User size={14} />
                </span>
                <input 
                  type="text" 
                  required
                  placeholder="Masukkan nama pengguna" 
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className={`w-full border rounded-[6px] text-xs py-2.5 pl-9 pr-3 outline-none transition-all ${
                    theme === 'light'
                      ? 'bg-white border-slate-200 text-slate-800 focus:border-sky-400 focus:ring-1 focus:ring-sky-400'
                      : 'bg-[#030303] border-white/10 text-white focus:border-sky-400 focus:ring-1 focus:ring-sky-400'
                  }`}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className={`text-[10px] font-black uppercase tracking-wider block ${
              theme === 'light' ? 'text-slate-500' : 'text-[#86868b]'
            }`}>
              Alamat Email
            </label>
            <div className="relative">
              <span className={`absolute inset-y-0 left-0 pl-3 flex items-center ${
                theme === 'light' ? 'text-slate-400' : 'text-[#86868b]'
              }`}>
                <Mail size={14} />
              </span>
              <input 
                type="email" 
                required
                placeholder="nama@email.com" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className={`w-full border rounded-[6px] text-xs py-2.5 pl-9 pr-3 outline-none transition-all ${
                  theme === 'light'
                    ? 'bg-white border-slate-200 text-slate-800 focus:border-sky-400 focus:ring-1 focus:ring-sky-400'
                    : 'bg-[#030303] border-white/10 text-white focus:border-sky-400 focus:ring-1 focus:ring-sky-400'
                }`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={`text-[10px] font-black uppercase tracking-wider block ${
              theme === 'light' ? 'text-slate-500' : 'text-[#86868b]'
            }`}>
              Kata Sandi
            </label>
            <div className="relative">
              <span className={`absolute inset-y-0 left-0 pl-3 flex items-center ${
                theme === 'light' ? 'text-slate-400' : 'text-[#86868b]'
              }`}>
                <Lock size={14} />
              </span>
              <input 
                type="password" 
                required
                placeholder="Masukkan kata sandi" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className={`w-full border rounded-[6px] text-xs py-2.5 pl-9 pr-3 outline-none transition-all ${
                  theme === 'light'
                    ? 'bg-white border-slate-200 text-slate-800 focus:border-sky-400 focus:ring-1 focus:ring-sky-400'
                    : 'bg-[#030303] border-white/10 text-white focus:border-sky-400 focus:ring-1 focus:ring-sky-400'
                }`}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-[6px] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            <span>{loading ? "Memproses..." : mode === 'login' ? "Masuk ke Akun" : "Daftar Akun Baru"}</span>
            {!loading && <ArrowRight size={14} />}
          </button>

          {/* Guest/Demo Account Button */}
          <button 
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className={`w-full py-3 bg-transparent border rounded-[6px] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50 ${
              theme === 'light'
                ? 'border-sky-400 text-sky-600 hover:bg-sky-50'
                : 'border-sky-400/50 text-sky-400 hover:bg-sky-500/10'
            }`}
          >
            Coba Akun Demo (Instan)
          </button>
        </form>

        {/* Separator */}
        <div className="flex items-center gap-3 py-1">
          <div className={`flex-1 h-[1px] ${theme === 'light' ? 'bg-slate-200' : 'bg-white/10'}`}></div>
          <span className={`text-[9px] font-black uppercase tracking-widest ${
            theme === 'light' ? 'text-slate-400' : 'text-[#86868b]'
          }`}>
            atau masuk dengan
          </span>
          <div className={`flex-1 h-[1px] ${theme === 'light' ? 'bg-slate-200' : 'bg-white/10'}`}></div>
        </div>

        {/* Social Login 3-Button Grid */}
        <div className="grid grid-cols-3 gap-3">
          
          {/* Google Button */}
          <button 
            onClick={() => handleSocialLogin('google')}
            disabled={socialLoading === 'google'}
            className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 border rounded-[6px] transition-all cursor-pointer disabled:opacity-50 hover:border-sky-400/50 ${
              theme === 'light'
                ? 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
            }`}
          >
            {socialLoading === 'google' ? (
              <div className="w-4 h-4 border-2 border-sky-400/30 border-t-sky-400 animate-spin rounded-full" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            )}
            <span className="text-[10px] font-bold">Google</span>
          </button>

          {/* GitHub Button */}
          <button 
            onClick={() => handleSocialLogin('github')}
            disabled={socialLoading === 'github'}
            className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 border rounded-[6px] transition-all cursor-pointer disabled:opacity-50 hover:border-sky-400/50 ${
              theme === 'light'
                ? 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
            }`}
          >
            {socialLoading === 'github' ? (
              <div className="w-4 h-4 border-2 border-sky-400/30 border-t-sky-400 animate-spin rounded-full" />
            ) : (
              <svg className="w-4 h-4 fill-current text-slate-700 dark:text-white" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            )}
            <span className="text-[10px] font-bold">GitHub</span>
          </button>

          {/* Discord Button */}
          <button 
            onClick={() => handleSocialLogin('discord')}
            disabled={socialLoading === 'discord'}
            className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 border rounded-[6px] transition-all cursor-pointer disabled:opacity-50 hover:border-sky-400/50 ${
              theme === 'light'
                ? 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
            }`}
          >
            {socialLoading === 'discord' ? (
              <div className="w-4 h-4 border-2 border-sky-400/30 border-t-sky-400 animate-spin rounded-full" />
            ) : (
              <svg className="w-4 h-4 fill-[#5865F2]" viewBox="0 0 127.14 96.36">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.4-5c.87-.64,1.71-1.32,2.51-2a75.76,75.76,0,0,0,72.64,0c.8.7,1.64,1.37,2.51,2a68.43,68.43,0,0,1-10.4,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31.06-18.83C129.87,54.65,123.72,31.58,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z" />
              </svg>
            )}
            <span className="text-[10px] font-bold">Discord</span>
          </button>
        </div>

      </div>
    </div>
  );
}
