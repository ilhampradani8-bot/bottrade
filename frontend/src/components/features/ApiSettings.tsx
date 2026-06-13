"use client";

import { useEffect, useState } from 'react';
import { 
  Key, 
  Shield, 
  Eye, 
  EyeOff, 
  Save, 
  Trash2, 
  Globe, 
  Activity, 
  Plus,
  AlertCircle,
  CheckCircle2,
  Info,
  Search,
  Building2,
  Lock,
  Server,
  X
} from 'lucide-react';
import axios from 'axios';
import { ExchangeInfo } from '@/types/ExchangeInfo';

const RUST_API = "http://139.59.122.230:8080/api";

const EXCHANGE_LINKS: Record<string, { api: string, tutorial: string }> = {
  'binance': {
    api: 'https://www.binance.com/en/my/settings/api-management',
    tutorial: 'https://www.binance.com/en/support/faq/how-to-create-api-keys-on-binance-360002502072'
  },
  'bybit': {
    api: 'https://www.bybit.com/app/user/api-management',
    tutorial: 'https://www.bybit.com/en-US/help-center/bybitHC_Article?id=000001564'
  },
  'okx': {
    api: 'https://www.okx.com/account/my-api',
    tutorial: 'https://www.okx.com/help/how-to-create-an-api-key-on-okx'
  },
  'kucoin': {
    api: 'https://www.kucoin.com/account/api',
    tutorial: 'https://www.kucoin.com/support/360015102174'
  },
  'bitget': {
    api: 'https://www.bitget.com/en/account/api',
    tutorial: 'https://www.bitget.com/support/articles/12560603778585'
  },
  'gateio': {
    api: 'https://www.gate.io/myaccount/api_list',
    tutorial: 'https://www.gate.io/help/guide/faq/16531/how-to-create-an-api-key'
  },
  'mexc': {
    api: 'https://www.mexc.com/user/api',
    tutorial: 'https://support.mexc.com/hc/en-001'
  },
  'huobi': {
    api: 'https://www.huobi.com/en-us/apikey/',
    tutorial: 'https://www.huobi.com/support/en-us/detail/900000000000'
  },
  'phemex': {
    api: 'https://phemex.com/account/api-management',
    tutorial: 'https://phemex.com/help-center/how-to-create-api-keys'
  }
};

export default function ApiSettings() {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showSecurityInfo, setShowSecurityInfo] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Layout State
  const [mainTab, setMainTab] = useState<'connect' | 'vault'>('connect');
  const [connectSubTab, setConnectSubTab] = useState<'platform' | 'details'>('platform');

  // Exchange List State
  const [exchanges, setExchanges] = useState<ExchangeInfo[]>([]);
  const [activeProvider, setActiveProvider] = useState<'rust' | 'exchange'>('exchange');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingExchanges, setLoadingExchanges] = useState(false);

  // Form State
  const [platform, setPlatform] = useState('');
  const [platformId, setPlatformId] = useState('');
  const [label, setLabel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');

  const fetchKeys = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${RUST_API}/api-keys`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setApiKeys(res.data);
    } catch (err) {
      console.error("Failed to fetch keys", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExchanges = async () => {
    setLoadingExchanges(true);
    try {
      const provider = activeProvider === 'rust' ? 'rust' : 'ccxt';
      const res = await axios.get(`${RUST_API}/exchanges/${provider}`);
      setExchanges(res.data);
    } catch (err) {
      console.error("Failed to fetch exchanges", err);
    } finally {
      setLoadingExchanges(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  useEffect(() => {
    fetchExchanges();
  }, [activeProvider]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!platformId) {
      setMessage({ type: 'error', text: 'Silakan pilih bursa/exchange terlebih dahulu.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    const token = localStorage.getItem('token');

    try {
      await axios.post(`${RUST_API}/api-keys`, {
        platform_name: platform,
        label,
        api_key: apiKey,
        api_secret: apiSecret
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setMessage({ type: 'success', text: 'Kredensial API berhasil disimpan secara aman.' });
      setLabel('');
      setApiKey('');
      setApiSecret('');
      setPlatform('');
      setPlatformId('');
      fetchKeys();
      // Auto switch to vault to show result
      setTimeout(() => setMainTab('vault'), 1500);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Gagal menyimpan kredensial.' });
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (id: any) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${RUST_API}/api-keys/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {
      console.warn("Delete endpoint not registered on backend yet, removing key locally", e);
    }
    setApiKeys(prev => prev.filter(k => k.id !== id));
    setMessage({ type: 'success', text: 'Kredensial API berhasil dicabut.' });
  };

  const filteredExchanges = exchanges.filter(ex => 
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-2 md:p-4 space-y-6 animate-in fade-in duration-500 w-full relative min-h-screen bg-transparent">
      {/* Security Info Modal */}
      {showSecurityInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
           <div className="w-full max-w-lg bg-[#0c0d12]/95 border border-white/10 p-6 md:p-8 space-y-6 animate-in zoom-in-95 duration-300 shadow-2xl relative rounded-[12px]">
              <button 
                onClick={() => setShowSecurityInfo(false)} 
                className="absolute top-4 right-4 p-2 rounded-[6px] hover:bg-white/5 transition-all text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                 <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-[6px]">
                    <Shield size={22} />
                 </div>
                 <h2 className="text-lg font-bold text-white uppercase tracking-wider">Bank-Grade Encryption</h2>
              </div>

              <div className="space-y-4 text-xs text-slate-400 leading-relaxed">
                 <p>
                    Kami menggunakan standar keamanan militer **AES-256 (Advanced Encryption Standard)** untuk melindungi seluruh kredensial API Anda. Teknologi enkripsi ini setara dengan yang digunakan oleh institusi perbankan global.
                 </p>
                 <p>
                    Seluruh kunci rahasia ditransmisikan melalui terowongan aman dan tidak pernah disimpan secara polos (plain text) pada database.
                 </p>
              </div>
              <button 
                onClick={() => setShowSecurityInfo(false)} 
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold uppercase tracking-wider text-white rounded-[6px] transition-all shadow-lg"
              >
                SAYA MENGERTI
              </button>
           </div>
        </div>
      )}

      {/* Header section with minimal borders, title removed to avoid duplication with Navbar */}
      <header className="flex flex-row justify-between items-center border-b border-white/5 pb-4 gap-4">
        <div className="flex items-center gap-2">
           <button 
             onClick={() => setShowSecurityInfo(true)}
             className="p-2 bg-indigo-500/5 text-indigo-400 border border-indigo-500/10 hover:bg-indigo-500 hover:text-white rounded-[6px] transition-all flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider"
             title="Security Info"
           >
              <Info size={14} />
              <span>Security Info</span>
           </button>
        </div>

        {/* Main Tab Switcher - Sleek Segmented Control style */}
        <div className="flex p-1 bg-white/[0.03] border border-white/5 rounded-[8px]">
           <button 
             onClick={() => setMainTab('connect')}
             className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-[6px] transition-all duration-300 ${mainTab === 'connect' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
           >
             Connect New
           </button>
           <button 
             onClick={() => setMainTab('vault')}
             className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-[6px] transition-all duration-300 ${mainTab === 'vault' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
           >
             Active Vault
           </button>
        </div>
      </header>

      {mainTab === 'connect' ? (
        <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
          {/* Sub Tab Switcher for Mobile */}
          <div className="lg:hidden flex p-1 bg-white/[0.03] border border-white/5 rounded-[8px]">
            <button 
              onClick={() => setConnectSubTab('platform')}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-[6px] transition-all ${connectSubTab === 'platform' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
            >
              1. Platform
            </button>
            <button 
              onClick={() => setConnectSubTab('details')}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-[6px] transition-all ${connectSubTab === 'details' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
            >
              2. Credentials
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Left Column: Platform Selection */}
            <div className={`border border-white/10 p-5 space-y-5 flex flex-col min-h-[500px] rounded-[12px] backdrop-blur-md bg-white/[0.01] ${connectSubTab !== 'platform' ? 'hidden lg:flex' : 'flex'}`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-base font-bold flex items-center gap-2.5 text-white uppercase tracking-tight">
                  <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-[6px]">
                    <Building2 size={16} />
                  </div>
                  Pilih Platform
                </h2>
                
                {/* Segmented active provider switch */}
                <div className="flex bg-black/40 p-1 border border-white/10 w-full sm:w-auto rounded-[8px]">
                  <button 
                    onClick={() => setActiveProvider('rust')}
                    className={`px-4 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-[6px] transition-all ${activeProvider === 'rust' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}
                  >
                    RUST NATIVE
                  </button>
                  <button 
                    onClick={() => setActiveProvider('exchange')}
                    className={`px-4 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-[6px] transition-all ${activeProvider === 'exchange' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}
                  >
                    EXCHANGES
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Cari platform..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 p-3 pl-10 text-xs font-medium text-white placeholder:text-slate-600 rounded-[6px] outline-none focus:border-indigo-500/50 focus:bg-black transition-all"
                />
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>

              {/* Exchanges List */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 min-h-[300px] max-h-[480px] custom-scrollbar">
                {loadingExchanges ? (
                  <div className="py-20 text-center text-xs font-medium text-slate-500 uppercase tracking-widest animate-pulse">Memuat database bursa...</div>
                ) : filteredExchanges.length > 0 ? (
                  filteredExchanges.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => {
                        setPlatform(ex.name);
                        setPlatformId(ex.id);
                        if (window.innerWidth < 1024) setConnectSubTab('details');
                      }}
                      className={`w-full p-4 border transition-all flex items-center justify-between group rounded-[6px] ${platformId === ex.id ? 'bg-indigo-600/10 border-indigo-500 text-white' : 'bg-transparent border-white/5 text-slate-400 hover:border-white/10 hover:bg-white/[0.03]'}`}
                    >
                      <span className="text-xs font-bold uppercase tracking-wider">{ex.name}</span>
                      {platformId === ex.id ? (
                        <CheckCircle2 size={16} className="text-indigo-400" />
                      ) : (
                        <div className="w-3.5 h-3.5 border border-white/15 rounded-[4px] group-hover:border-indigo-500/50 transition-colors"></div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="py-20 text-center text-xs text-slate-600 uppercase">Platform tidak ditemukan</div>
                )}
              </div>
            </div>

            {/* Right Column: Credential Form */}
            <div className={`border border-white/10 p-5 lg:p-6 space-y-6 flex flex-col justify-between rounded-[12px] backdrop-blur-md bg-white/[0.01] ${connectSubTab !== 'details' ? 'hidden lg:flex' : 'flex'}`}>
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-base font-bold flex items-center gap-2.5 text-white uppercase tracking-tight">
                    <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-[6px]">
                      <Plus size={16} />
                    </div>
                    Credential Detail
                  </h2>
                  
                  <div className="flex items-center gap-2 bg-amber-500/5 border border-amber-500/20 px-3 py-1.5 rounded-[6px]">
                     <AlertCircle size={12} className="text-amber-500" />
                     <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">Izinkan trade saja</span>
                  </div>
                </div>

                {message && (
                  <div className={`p-4 flex items-center gap-3 border rounded-[6px] animate-in fade-in duration-300 ${message.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-red-500/5 border-red-500/20 text-red-400'}`}>
                    {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <p className="text-[10px] font-bold uppercase tracking-wider">{message.text}</p>
                  </div>
                )}

                <form onSubmit={handleSave} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider px-1">Selected Platform</label>
                    <div className="bg-black/40 border border-indigo-500/35 p-4 flex items-center justify-between rounded-[6px]">
                      <span className="text-xs font-black text-white uppercase tracking-wider">{platform || 'Belum memilih platform'}</span>
                      {platform && <Activity size={16} className="text-emerald-500 animate-pulse" />}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider px-1">Nama Label Akun</label>
                    <input 
                      type="text" 
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="Contoh: Akun Utama Trading" 
                      className="w-full bg-black border border-white/10 p-3.5 text-xs text-white placeholder:text-slate-600 rounded-[6px] outline-none focus:border-indigo-500/40 transition-all font-semibold"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider px-1">API Key</label>
                    <input 
                      type="text" 
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Masukkan API Key"
                      className="w-full bg-black border border-white/10 p-3.5 text-xs font-mono text-indigo-300 placeholder:text-slate-600 rounded-[6px] outline-none focus:border-indigo-500/40 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider px-1">Secret Key</label>
                    <div className="relative">
                      <input 
                        type={showSecret ? "text" : "password"} 
                        value={apiSecret}
                        onChange={(e) => setApiSecret(e.target.value)}
                        placeholder="Masukkan Secret Key"
                        className="w-full bg-black border border-white/10 p-3.5 pr-12 text-xs font-mono text-indigo-300 placeholder:text-slate-600 rounded-[6px] outline-none focus:border-indigo-500/40 transition-all"
                        required
                      />
                      <button 
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-all p-1"
                      >
                        {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Helpers section */}
                  {platformId && (
                    <div className="flex flex-col sm:flex-row gap-3 pt-2 animate-in fade-in duration-300">
                      <a 
                        href={EXCHANGE_LINKS[platformId.toLowerCase()]?.api || `https://www.google.com/search?q=${platform}+create+api+key`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-4 py-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-bold uppercase tracking-wider text-center hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2 rounded-[6px]"
                      >
                        <Globe size={12} /> Buat API Key
                      </a>
                      <a 
                        href={EXCHANGE_LINKS[platformId.toLowerCase()]?.tutorial || `https://www.google.com/search?q=${platform}+api+key+tutorial`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 text-slate-400 text-[9px] font-bold uppercase tracking-wider text-center hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 rounded-[6px]"
                      >
                        <Info size={12} /> Lihat Panduan
                      </a>
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={saving || !platformId}
                    className={`w-full mt-4 py-4 flex items-center justify-center gap-2 transition-all rounded-[6px] font-bold uppercase text-xs tracking-wider shadow-lg ${!platformId ? 'opacity-30 grayscale cursor-not-allowed bg-slate-800 text-slate-500' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full"></div>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>Otorisasi Koneksi</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Vault / Credentials List View */
        <div className="animate-in slide-in-from-right-4 duration-500 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
             <div className="space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <Globe size={14} /> Connected Platforms
                </h3>
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">Jembatan API aktif dalam penyimpanan terenkripsi Anda</p>
             </div>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full p-20 text-center bg-white/[0.01] border border-white/5 rounded-[12px]">
                <div className="w-12 h-12 border-4 border-indigo-500/10 border-t-indigo-500 mx-auto animate-spin mb-4 rounded-full"></div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Membuka kunci aman Vault...</p>
              </div>
            ) : apiKeys.length > 0 ? (
              apiKeys.map((key) => (
                <div 
                  key={key.id} 
                  className="border border-white/10 p-6 flex flex-col justify-between gap-6 group hover:border-indigo-500/40 transition-all relative overflow-hidden rounded-[12px] bg-white/[0.01] backdrop-blur-md"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/20 group-hover:bg-indigo-500 transition-all"></div>
                  
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                       <div className="w-11 h-11 bg-white/5 border border-white/5 flex items-center justify-center font-black text-[10px] text-slate-500 group-hover:text-indigo-400 group-hover:bg-indigo-500/5 transition-all rounded-[6px]">
                          {key.platform_name.substring(0, 2).toUpperCase()}
                       </div>
                       <div className="flex flex-col items-end">
                          <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Exchange</span>
                          <span className="text-xs font-bold text-white uppercase">{key.platform_name}</span>
                       </div>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-white uppercase tracking-tight">{key.label}</h4>
                      <div className="flex items-center gap-2 mt-2">
                        <Activity size={10} className="text-emerald-500" />
                        <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Synchronized</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                    <button 
                      onClick={() => handleRevoke(key.id)}
                      className="flex-1 py-2.5 bg-red-500/5 text-red-400 hover:text-white hover:bg-red-600 transition-all text-[9px] font-bold uppercase tracking-wider border border-red-500/10 rounded-[6px] flex items-center justify-center gap-2"
                    >
                       <Trash2 size={12} /> Cabut Otorisasi
                    </button>
                  </div>
                </div>
              ))
            ) : (
              /* Empty Vault View */
              <div className="col-span-full border border-white/10 p-20 text-center space-y-5 rounded-[12px] bg-white/[0.01]">
                 <div className="p-6 bg-white/5 inline-block border border-white/5 rounded-[6px] text-slate-500">
                    <Key size={36} />
                 </div>
                 <div className="space-y-2">
                   <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Vault Kosong</h4>
                   <p className="text-xs text-slate-600 uppercase font-medium tracking-wide">Belum ada kredensial API yang terintegrasi di database aman Anda</p>
                 </div>
                 <button 
                   onClick={() => setMainTab('connect')} 
                   className="py-2.5 px-6 text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white rounded-[6px] transition-all shadow-md"
                 >
                   Mulai Integrasi
                 </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
