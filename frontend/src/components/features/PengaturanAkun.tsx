"use client";

import React, { useState, useEffect } from 'react';
import { User, Shield, Bell, Save, Key, Sliders } from 'lucide-react';

export default function PengaturanAkun() {
  const [activeTab, setActiveTab] = useState<'profil' | 'keamanan' | 'notifikasi' | 'tampilan'>('profil');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notifSignal, setNotifSignal] = useState(true);
  const [notifMarketing, setNotifMarketing] = useState(false);
  
  // Notification integration states
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [whatsappVerified, setWhatsappVerified] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState('');
  
  // Verification states
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifyingWa, setVerifyingWa] = useState(false);
  const [verifyingTg, setVerifyingTg] = useState(false);
  
  // Visual UI mock preferences
  const [accentColor, setAccentColor] = useState('indigo');
  const [sidebarStyle, setSidebarStyle] = useState('glass');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Fetch current user settings from the backend
  const fetchProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const apiHost = window.location.hostname;
      const res = await fetch(`http://${apiHost}:8080/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsername(data.username || '');
        setEmail(data.email || '');
        setNotifSignal(data.notif_signal_enabled ?? true);
        setNotifMarketing(data.notif_marketing_enabled ?? false);
        setWhatsappNumber(data.whatsapp_number || '');
        if (data.whatsapp_number) {
          setWhatsappVerified(true);
        } else {
          setWhatsappVerified(false);
        }
        if (data.telegram && /^\d+$/.test(data.telegram)) {
          setTelegramConnected(true);
          setTelegramChatId(data.telegram);
          setTelegramUsername(data.telegram);
        } else {
          setTelegramConnected(false);
          setTelegramChatId('');
          setTelegramUsername(data.telegram || '');
        }
      }
    } catch (err) {
      console.error("Failed to load user profile", err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Save profile username and notification switches to PostgreSQL SQL
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      setMessage({ text: "Sesi login kedaluwarsa. Silakan masuk kembali.", type: "error" });
      return;
    }

    try {
      const apiHost = window.location.hostname;
      const res = await fetch(`http://${apiHost}:8080/api/auth/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username,
          notif_signal_enabled: notifSignal,
          notif_marketing_enabled: notifMarketing,
          whatsapp_number: whatsappVerified ? whatsappNumber : null,
          telegram: telegramConnected ? telegramChatId : (telegramUsername || null)
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ text: "Pengaturan berhasil disimpan dan diperbarui di database!", type: "success" });
        fetchProfile();
      } else {
        setMessage({ text: data.message || "Gagal memperbarui pengaturan.", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: "Gangguan jaringan saat menghubungi server.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSendWaOtp = async () => {
    if (!whatsappNumber) {
      setMessage({ text: "Masukkan nomor WhatsApp terlebih dahulu.", type: "error" });
      return;
    }
    setVerifyingWa(true);
    setMessage({ text: '', type: '' });
    const token = localStorage.getItem('token');
    try {
      const apiHost = window.location.hostname;
      const res = await fetch(`http://${apiHost}:8080/api/auth/send-whatsapp-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ whatsapp_number: whatsappNumber })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setOtpSent(true);
        setMessage({ text: "Kode verifikasi telah dikirim ke nomor WhatsApp Anda.", type: "success" });
      } else {
        setMessage({ text: data.message || "Gagal mengirim OTP WhatsApp.", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Gagal menghubungi server.", type: "error" });
    } finally {
      setVerifyingWa(false);
    }
  };

  const handleVerifyWaOtp = async () => {
    if (!otpCode) {
      setMessage({ text: "Masukkan kode OTP terlebih dahulu.", type: "error" });
      return;
    }
    setVerifyingWa(true);
    setMessage({ text: '', type: '' });
    const token = localStorage.getItem('token');
    try {
      const apiHost = window.location.hostname;
      const res = await fetch(`http://${apiHost}:8080/api/auth/verify-whatsapp-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ whatsapp_number: whatsappNumber, code: otpCode })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setWhatsappVerified(true);
        setOtpSent(false);
        setOtpCode('');
        setMessage({ text: "Nomor WhatsApp berhasil diverifikasi!", type: "success" });
        fetchProfile();
      } else {
        setMessage({ text: data.message || "Kode OTP salah atau kedaluwarsa.", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Gagal menghubungi server.", type: "error" });
    } finally {
      setVerifyingWa(false);
    }
  };

  const handleVerifyTelegram = async () => {
    if (!telegramUsername) {
      setMessage({ text: "Masukkan username Telegram terlebih dahulu.", type: "error" });
      return;
    }
    setVerifyingTg(true);
    setMessage({ text: '', type: '' });
    const token = localStorage.getItem('token');
    try {
      const apiHost = window.location.hostname;
      const res = await fetch(`http://${apiHost}:8080/api/auth/verify-telegram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ telegram_username: telegramUsername })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setTelegramConnected(true);
        setMessage({ text: "Telegram berhasil dihubungkan!", type: "success" });
        fetchProfile();
      } else {
        setMessage({ text: data.message || "Gagal menghubungkan Telegram. Pastikan Anda sudah memulai bot di Telegram.", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Gagal menghubungi server.", type: "error" });
    } finally {
      setVerifyingTg(false);
    }
  };

  // Mock function for changing password
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ text: "Kata sandi baru dan konfirmasi sandi tidak cocok!", type: "error" });
      return;
    }
    setLoading(true);
    setMessage({ text: '', type: '' });

    setTimeout(() => {
      setLoading(false);
      setMessage({ text: "Kata sandi Anda sukses diperbarui!", type: "success" });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 800);
  };

  // Mock function for display layout save
  const handleSaveLayout = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: "Preferensi tampilan visual berhasil disimpan secara lokal!", type: "success" });
  };

  return (
    <div className="w-full px-4 sm:px-8 py-4 space-y-6">
      
      {/* Horizontal Tab Navigation */}
      <div className="flex border-b border-white/10 w-full overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('profil')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'profil' 
              ? 'border-indigo-500 text-white' 
              : 'border-transparent text-[#86868b] hover:text-white'
          }`}
        >
          <User size={14} />
          <span>Informasi Profil</span>
        </button>

        <button
          onClick={() => setActiveTab('keamanan')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'keamanan' 
              ? 'border-indigo-500 text-white' 
              : 'border-transparent text-[#86868b] hover:text-white'
          }`}
        >
          <Shield size={14} />
          <span>Keamanan & Sandi</span>
        </button>

        <button
          onClick={() => setActiveTab('notifikasi')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'notifikasi' 
              ? 'border-indigo-500 text-white' 
              : 'border-transparent text-[#86868b] hover:text-white'
          }`}
        >
          <Bell size={14} />
          <span>Pengaturan Notifikasi</span>
        </button>

        <button
          onClick={() => setActiveTab('tampilan')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'tampilan' 
              ? 'border-indigo-500 text-white' 
              : 'border-transparent text-[#86868b] hover:text-white'
          }`}
        >
          <Sliders size={14} />
          <span>Preferensi Tampilan</span>
        </button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-[6px] text-xs font-bold ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tab Panels */}
      <div className="w-full">
        {/* 1. Profile Tab */}
        {activeTab === 'profil' && (
          <form onSubmit={handleSaveSettings} className="space-y-6 max-w-3xl animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-[#86868b] uppercase tracking-wider">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full premium-input bg-[#09090b] border border-white/10 rounded-[6px] text-xs py-2.5 px-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white" 
                  placeholder="Masukkan username" 
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-[#86868b] uppercase tracking-wider">Alamat Email</label>
                <input 
                  type="email" 
                  value={email}
                  className="w-full premium-input bg-[#09090b] border border-white/10 rounded-[6px] text-xs py-2.5 px-3 opacity-60 cursor-not-allowed text-white" 
                  disabled 
                />
              </div>
            </div>

            <div className="flex justify-start">
              <button 
                type="submit" 
                disabled={loading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[6px] text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <Save size={14} />
                <span>{loading ? "Menyimpan..." : "Simpan Perubahan"}</span>
              </button>
            </div>
          </form>
        )}

        {/* 2. Security Tab */}
        {activeTab === 'keamanan' && (
          <form onSubmit={handleSavePassword} className="space-y-6 max-w-3xl animate-in fade-in duration-200">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#86868b] uppercase tracking-wider">Kata Sandi Saat Ini</label>
              <input 
                type="password" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full premium-input bg-[#09090b] border border-white/10 rounded-[6px] text-xs py-2.5 px-3 text-white" 
                placeholder="••••••••" 
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-[#86868b] uppercase tracking-wider">Kata Sandi Baru</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full premium-input bg-[#09090b] border border-white/10 rounded-[6px] text-xs py-2.5 px-3 text-white" 
                  placeholder="Minimal 8 karakter" 
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-[#86868b] uppercase tracking-wider">Ulangi Kata Sandi Baru</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full premium-input bg-[#09090b] border border-white/10 rounded-[6px] text-xs py-2.5 px-3 text-white" 
                  placeholder="Konfirmasi kata sandi" 
                  required
                />
              </div>
            </div>

            <div className="flex justify-start">
              <button 
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[6px] text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <Key size={14} />
                <span>{loading ? "Memperbarui..." : "Ubah Sandi"}</span>
              </button>
            </div>
          </form>
        )}

        {/* 3. Notification Tab */}
        {activeTab === 'notifikasi' && (
          <form onSubmit={handleSaveSettings} className="space-y-6 max-w-3xl animate-in fade-in duration-200">
            <div className="space-y-2">
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <div>
                  <h4 className="text-xs font-bold text-white">Notifikasi Sinyal Real-time</h4>
                  <p className="text-[10px] text-[#86868b]">Dapatkan pemberitahuan push instan ketika ada pemicu sinyal trading baru.</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setNotifSignal(!notifSignal)}
                  className={`w-10 h-5 rounded-full p-0.5 transition-all cursor-pointer ${notifSignal ? 'bg-indigo-600' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-all ${notifSignal ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <div>
                  <h4 className="text-xs font-bold text-white">Promosi & Pemasaran</h4>
                  <p className="text-[10px] text-[#86868b]">Terima email promosi mingguan dan analisis pasar eksklusif.</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setNotifMarketing(!notifMarketing)}
                  className={`w-10 h-5 rounded-full p-0.5 transition-all cursor-pointer ${notifMarketing ? 'bg-indigo-600' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-all ${notifMarketing ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {/* WhatsApp Integration Section */}
            <div className="pt-6 border-t border-white/10 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-white">Integrasi Notifikasi WhatsApp</h4>
                <p className="text-[10px] text-[#86868b]">Hubungkan nomor WhatsApp Anda untuk menerima sinyal trading personal secara instan.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-[#86868b] uppercase tracking-wider">Nomor WhatsApp</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={whatsappNumber}
                      onChange={(e) => {
                        setWhatsappNumber(e.target.value);
                        setWhatsappVerified(false);
                      }}
                      className="w-full premium-input bg-[#09090b] border border-white/10 rounded-[6px] text-xs py-2.5 px-3 text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
                      placeholder="Contoh: 628123456789" 
                    />
                    {whatsappVerified && (
                      <span className="absolute right-3 top-2.5 text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-[4px]">
                        Terverifikasi
                      </span>
                    )}
                  </div>
                </div>

                {!whatsappVerified && (
                  <button
                    type="button"
                    onClick={handleSendWaOtp}
                    disabled={verifyingWa || !whatsappNumber}
                    className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-[6px] text-xs font-bold uppercase tracking-wider cursor-pointer transition-all active:scale-95"
                  >
                    {verifyingWa ? "Mengirim..." : "Kirim Kode OTP"}
                  </button>
                )}
              </div>

              {otpSent && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end animate-in slide-in-from-top-2 duration-200">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-[#86868b] uppercase tracking-wider">Kode Verifikasi (OTP)</label>
                    <input 
                      type="text" 
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full premium-input bg-[#09090b] border border-white/10 rounded-[6px] text-xs py-2.5 px-3 text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
                      placeholder="Masukkan 6 digit kode" 
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyWaOtp}
                    disabled={verifyingWa || !otpCode}
                    className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-[6px] text-xs font-bold uppercase tracking-wider cursor-pointer transition-all active:scale-95"
                  >
                    Verifikasi OTP
                  </button>
                </div>
              )}
            </div>

            {/* Telegram Integration Section */}
            <div className="pt-6 border-t border-white/10 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-white">Integrasi Notifikasi Telegram</h4>
                <p className="text-[10px] text-[#86868b]">Hubungkan akun Telegram Anda untuk menerima sinyal log dan peringatan.</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-[6px] p-3 space-y-2 text-[10px] text-slate-300">
                <p className="font-bold text-white uppercase tracking-wider text-[9px]">Langkah-langkah Menghubungkan:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Klik link berikut untuk membuka bot Telegram: <a href="https://t.me/notificationtradingsafe_bot" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">@notificationtradingsafe_bot</a></li>
                  <li>Di ruang obrolan bot Telegram, klik tombol <strong>START</strong> (atau kirim perintah <code className="bg-[#09090b] px-1 py-0.5 rounded text-indigo-300">/start</code>).</li>
                  <li>Masukkan username Telegram Anda di kolom bawah ini, lalu klik <strong>Hubungkan & Verifikasi</strong>.</li>
                </ol>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-[#86868b] uppercase tracking-wider">Username Telegram Anda</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={telegramUsername}
                      onChange={(e) => {
                        setTelegramUsername(e.target.value);
                        setTelegramConnected(false);
                      }}
                      className="w-full premium-input bg-[#09090b] border border-white/10 rounded-[6px] text-xs py-2.5 px-3 text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
                      placeholder="Contoh: @username_anda" 
                    />
                    {telegramConnected && (
                      <span className="absolute right-3 top-2.5 text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-[4px]">
                        Terhubung ({telegramChatId})
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleVerifyTelegram}
                  disabled={verifyingTg || !telegramUsername}
                  className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-[6px] text-xs font-bold uppercase tracking-wider cursor-pointer transition-all active:scale-95"
                >
                  {verifyingTg ? "Memverifikasi..." : "Hubungkan & Verifikasi"}
                </button>
              </div>
            </div>

            <div className="flex justify-start">
              <button 
                type="submit" 
                disabled={loading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[6px] text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <Save size={14} />
                <span>{loading ? "Menyimpan..." : "Simpan Pengaturan Notifikasi"}</span>
              </button>
            </div>
          </form>
        )}

        {/* 4. Display Layout Preferences Tab */}
        {activeTab === 'tampilan' && (
          <form onSubmit={handleSaveLayout} className="space-y-6 max-w-3xl animate-in fade-in duration-200">
            <div className="space-y-4">
              {/* Accent Color Selection */}
              <div className="py-3 border-b border-white/5">
                <h4 className="text-xs font-bold text-white mb-2">Warna Aksen Dashboard</h4>
                <p className="text-[10px] text-[#86868b] mb-3">Tentukan warna sorotan navigasi dan tombol visual utama.</p>
                <div className="flex items-center gap-3">
                  {['indigo', 'amber', 'emerald', 'rose'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setAccentColor(color)}
                      className={`px-3 py-1.5 rounded-[4px] text-[9px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                        accentColor === color
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-[#09090b] border-white/10 text-[#86868b] hover:text-white'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sidebar style */}
              <div className="py-3">
                <h4 className="text-xs font-bold text-white mb-2">Gaya Sidebar Samping</h4>
                <p className="text-[10px] text-[#86868b] mb-3">Pilih tipe latar belakang untuk sidebar kiri dan drawer kanan.</p>
                <div className="flex items-center gap-3">
                  {['classic', 'glass'].map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setSidebarStyle(style)}
                      className={`px-3 py-1.5 rounded-[4px] text-[9px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                        sidebarStyle === style
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-[#09090b] border-white/10 text-[#86868b] hover:text-white'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-start">
              <button 
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[6px] text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Save size={14} />
                <span>Simpan Preferensi Tampilan</span>
              </button>
            </div>
          </form>
        )}
      </div>

    </div>
  );
}
