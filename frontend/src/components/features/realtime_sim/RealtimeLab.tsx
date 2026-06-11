"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, Settings, Target, BarChart2, Zap, ShieldCheck, 
  ChevronRight, Play, Info, Plus, Trash2, AlertTriangle, 
  Clock, Globe, Layers, Square, Activity, Cpu, CircleDot,
  RefreshCw, Power, CheckCircle, Database
} from 'lucide-react';
import axios from 'axios';

declare global {
  interface Window {
    TradingView: any;
  }
}

const RUST_API = "http://139.59.122.230:8080/api";

const COIN_OPTIONS = [
  { value: "BTCUSDT", label: "BTC/USDT (Bitcoin)" },
  { value: "ETHUSDT", label: "ETH/USDT (Ethereum)" },
  { value: "SOLUSDT", label: "SOL/USDT (Solana)" },
  { value: "BNBUSDT", label: "BNB/USDT (Binance Coin)" },
  { value: "ADAUSDT", label: "ADA/USDT (Cardano)" },
  { value: "XRPUSDT", label: "XRP/USDT (Ripple)" },
  { value: "DOTUSDT", label: "DOT/USDT (Polkadot)" },
  { value: "DOGEUSDT", label: "DOGE/USDT (Dogecoin)" },
  { value: "LTCUSDT", label: "LTC/USDT (Litecoin)" },
  { value: "LINKUSDT", label: "LINK/USDT (Chainlink)" },
  { value: "NEARUSDT", label: "NEAR/USDT (Near)" },
  { value: "AVAXUSDT", label: "AVAX/USDT (Avalanche)" },
  { value: "OPUSDT", label: "OP/USDT (Optimism)" },
  { value: "ARBUSDT", label: "ARB/USDT (Arbitrum)" },
  { value: "TRXUSDT", label: "TRX/USDT (Tron)" }
];

const getCurrencySymbol = (currency: string) => {
  switch (currency) {
    case 'IDR': return 'Rp';
    case 'USD': return '$';
    case 'USDT': return 'USDT';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'JPY': return '¥';
    case 'SGD': return 'S$';
    case 'MYR': return 'RM';
    case 'AUD': return 'A$';
    case 'CAD': return 'C$';
    case 'INR': return '₹';
    case 'PHP': return '₱';
    case 'THB': return '฿';
    case 'VND': return '₫';
    default: return currency;
  }
};

const formatCurrencyValue = (value: number, currency: string) => {
  const symbol = getCurrencySymbol(currency);
  const formattedNum = ['IDR', 'VND', 'JPY'].includes(currency) 
    ? Math.round(value).toLocaleString() 
    : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  if (currency === 'USDT') {
    return `${formattedNum} USDT`;
  }
  return `${symbol} ${formattedNum}`;
};

interface RealtimeLabProps {
  activeTab: 'chart' | 'riwayat' | 'daftar_bot';
  setActiveTab: (tab: 'chart' | 'riwayat' | 'daftar_bot') => void;
}

export default function RealtimeLab({ activeTab, setActiveTab }: RealtimeLabProps) {
  const container = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  
  // Realtime Simulation Engine State
  const [userBots, setUserBots] = useState<any[]>([]);
  const [tradeLogs, setTradeLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Currency selection & custom coin pair states
  const [selectedCurrency, setSelectedCurrency] = useState<string>('IDR');
  const [customCoin, setCustomCoin] = useState('BTCUSDT');
  const [simBalanceInput, setSimBalanceInput] = useState('10,000,000');
  const [binancePairs, setBinancePairs] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Strategy Selected
  const [activeBot, setActiveBot] = useState('dca_lite');
  const [selectedCoin, setSelectedCoin] = useState('BTCUSDT');
  const [intervalState, setIntervalState] = useState('60'); // Default 1H
  
  // Form fields
  const [dcaNominal, setDcaNominal] = useState('1,000,000');
  const [dcaSafetyNominal, setDcaSafetyNominal] = useState('500,000');
  const [dcaTakeProfit, setDcaTakeProfit] = useState('1.5');
  const [dcaStopLoss, setDcaStopLoss] = useState('5.0');

  // Smart DCA specifics
  const [dcaMaxSafety, setDcaMaxSafety] = useState('5');
  const [dcaPriceDev, setDcaPriceDev] = useState('2.0');

  // Grid Bot specifics
  const [gridLowerPrice, setGridLowerPrice] = useState('60000');
  const [gridUpperPrice, setGridUpperPrice] = useState('75000');
  const [gridNumber, setGridNumber] = useState('10');
  const [gridMode, setGridMode] = useState<'arithmetic' | 'geometric'>('arithmetic');

  // Combo Bot specifics
  const [comboMargin, setComboMargin] = useState('1,000,000');
  const [comboLeverage, setComboLeverage] = useState('5');
  const [comboTp, setComboTp] = useState('1.5');
  const [comboSl, setComboSl] = useState('5.0');

  // Trailing Bot specifics
  const [trailingTp, setTrailingTp] = useState('2.0');
  const [trailingSlValue, setTrailingSlValue] = useState('2.0');

  // Initialize TradingView Widget
  const initWidget = (symbol: string, interval: string) => {
    if (container.current && window.TradingView) {
      container.current.innerHTML = "";
      widgetRef.current = new window.TradingView.widget({
        "autosize": true,
        "symbol": symbol.includes(":") ? symbol : `BINANCE:${symbol}`,
        "interval": interval,
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "toolbar_bg": "#020408",
        "enable_publishing": false,
        "hide_top_toolbar": false,
        "save_image": false,
        "container_id": "tv_chart_container_realtime",
        "backgroundColor": "#05070a",
        "gridColor": "rgba(255, 255, 255, 0.03)",
      });
    }
  };

  // Fetch Bots & Trade logs from server
  const fetchUserBots = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.get(`${RUST_API}/simulations/user`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUserBots(res.data);
    } catch (e) {
      console.error("Failed to fetch user simulation bots", e);
    }
  };

  const fetchTradeHistory = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.get(`${RUST_API}/simulations/trades`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setTradeLogs(res.data);
    } catch (e) {
      console.error("Failed to fetch trade logs", e);
    }
  };

  // Fetch real-time coin pairs from Binance Exchange Info on component mount
  useEffect(() => {
    axios.get("https://api.binance.com/api/v3/exchangeInfo")
      .then(res => {
        if (res.data && res.data.symbols) {
          const pairs = res.data.symbols
            .filter((s: any) => s.status === "TRADING" && (s.symbol.endsWith("USDT") || s.symbol.endsWith("BIDR") || s.symbol.endsWith("USDC") || s.symbol.endsWith("BTC")))
            .map((s: any) => s.symbol);
          setBinancePairs(pairs.sort());
        }
      })
      .catch(err => {
        console.error("Error fetching Binance pairs:", err);
      });
  }, []);

  // Initialize TradingView, Fetch Data, & Set up Polling
  useEffect(() => {
    fetchUserBots();
    fetchTradeHistory();

    const interval = setInterval(() => {
      fetchUserBots();
      fetchTradeHistory();
    }, 3000);

    const finalCoin = selectedCoin;

    if (!window.TradingView) {
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/tv.js";
      script.type = "text/javascript";
      script.async = true;
      script.onload = () => {
        if (activeTab === 'chart') {
          initWidget(finalCoin, intervalState);
        }
      };
      document.head.appendChild(script);
    } else if (activeTab === 'chart') {
      initWidget(finalCoin, intervalState);
    }

    return () => {
      clearInterval(interval);
    };
  }, [selectedCoin, customCoin, intervalState, activeTab]);

  // Handle creating new Simulation Bot (Mulai Simulasi)
  const handleStartSimulation = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Silakan login terlebih dahulu.");
      return;
    }

    setLoading(true);
    try {
      let settings: any = {};
      const targetTp = activeBot === 'combo_lite' ? comboTp : activeBot === 'trailing_lite' ? trailingTp : dcaTakeProfit;
      const targetSl = activeBot === 'combo_lite' ? comboSl : activeBot === 'trailing_lite' ? trailingSlValue : dcaStopLoss;

      let parsedNominal = 1000000;
      if (activeBot.startsWith('dca')) {
        parsedNominal = Number(dcaNominal.replace(/,/g, ""));
      } else if (activeBot === 'combo_lite') {
        parsedNominal = Number(comboMargin.replace(/,/g, ""));
      }

      const initialBalance = Number(simBalanceInput.replace(/,/g, ""));

      settings = {
        nominal: parsedNominal.toString(),
        take_profit: targetTp,
        stop_loss: targetSl,
        sim_balance: isNaN(initialBalance) || initialBalance <= 0 
          ? (['VND', 'IDR'].includes(selectedCurrency) ? 10000000.0 : ['JPY', 'KRW'].includes(selectedCurrency) ? 100000.0 : 1000.0) 
          : initialBalance, 
        sim_position: 0.0,
        sim_entry_price: 0.0,
        sim_safety_count: 0,
        currency: selectedCurrency
      };

      if (activeBot === 'dca_lite' || activeBot === 'dca_pro') {
        settings.safety_nominal = dcaSafetyNominal;
        if (activeBot === 'dca_pro') {
          settings.max_safety = dcaMaxSafety;
          settings.price_deviation = dcaPriceDev;
        }
      } else if (activeBot === 'grid_lite') {
        settings.lower_price = gridLowerPrice;
        settings.upper_price = gridUpperPrice;
        settings.grid_levels = gridNumber;
        settings.grid_mode = gridMode;
      } else if (activeBot === 'combo_lite') {
        settings.leverage = comboLeverage;
      }

      const finalCoin = selectedCoin;
      
      let displayPair = finalCoin;
      if (finalCoin.endsWith("USDT")) {
        displayPair = finalCoin.replace("USDT", "/USDT");
      } else if (finalCoin.endsWith("BIDR")) {
        displayPair = finalCoin.replace("BIDR", "/BIDR");
      } else if (finalCoin.endsWith("IDR")) {
        displayPair = finalCoin.replace("IDR", "/IDR");
      } else if (finalCoin.endsWith("USD")) {
        displayPair = finalCoin.replace("USD", "/USD");
      } else if (finalCoin.length > 4) {
        displayPair = finalCoin.slice(0, -4) + "/" + finalCoin.slice(-4);
      }

      await axios.post(`${RUST_API}/simulations/save`, {
        name: `${activeBot.toUpperCase().replace('_', ' ')} ${displayPair} Sim`,
        bot_type: activeBot,
        pair: displayPair,
        take_profit_percentage: parseFloat(targetTp),
        stop_loss_percentage: parseFloat(targetSl),
        status: "active",
        settings: settings
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Switch to active bots tab to see the newly created bot
      setActiveTab('daftar_bot');
      fetchUserBots();
      fetchTradeHistory();
    } catch (e) {
      console.error(e);
      alert("Gagal memulai simulasi. Cek parameter Anda.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (botId: number, currentStatus: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setActionLoading(botId);
    const newStatus = currentStatus === "active" ? "inactive" : "active";

    try {
      await axios.post(`${RUST_API}/simulations/${botId}/status`, {
        status: newStatus
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchUserBots();
    } catch (e) {
      console.error("Failed to toggle status", e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteBot = async (botId: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (!confirm("Apakah Anda yakin ingin menghapus bot simulasi ini?")) return;

    setActionLoading(botId);
    try {
      await axios.delete(`${RUST_API}/simulations/${botId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchUserBots();
    } catch (e) {
      console.error("Failed to delete bot", e);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full animate-in fade-in duration-500">
      
      {/* LEFT COLUMN: Unified View (Chart, Riwayat, Daftar Bot Control) - Flat / Borderless */}
      <div className="xl:col-span-8 flex flex-col gap-4">
        
        {activeTab === 'chart' && (
          <div className="flex justify-end items-center mb-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mr-2">Interval</span>
            <select 
              value={intervalState}
              onChange={(e) => setIntervalState(e.target.value)}
              className="bg-black border border-white/10 px-3 py-1.5 rounded-[6px] text-[10px] font-bold text-slate-300 transition-all outline-none"
            >
              <option value="1">1m</option>
              <option value="5">5m</option>
              <option value="15">15m</option>
              <option value="60">1h</option>
              <option value="D">1D</option>
            </select>
          </div>
        )}

        {/* Tab Contents Area (Flat & Borderless) */}
        <div className="w-full min-h-[500px]">
          {activeTab === 'chart' && (
            <div className="w-full h-[600px] relative overflow-hidden bg-black/30 border border-white/5 rounded-[8px]">
              <div className="absolute inset-0 w-full h-full" id="tv_chart_container_realtime" ref={container} />
            </div>
          )}

          {activeTab === 'riwayat' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {tradeLogs.length === 0 ? (
                <div className="py-20 text-center text-slate-500 font-mono text-xs uppercase tracking-widest">
                  Belum ada transaksi simulasi yang tercatat di database.
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-xs text-slate-300 border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 uppercase tracking-widest font-black text-[10px]">
                        <th className="py-3 px-4">Waktu</th>
                        <th className="py-3 px-4">Pasangan Koin</th>
                        <th className="py-3 px-4">Tipe Strategi</th>
                        <th className="py-3 px-4">Aksi</th>
                        <th className="py-3 px-4">Harga Eksekusi</th>
                        <th className="py-3 px-4">Jumlah Aset</th>
                        <th className="py-3 px-4 text-right">Profit / Loss</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tradeLogs.map((t, idx) => {
                        const isBuy = t.side === "BUY";
                        const pnlVal = parseFloat(t.pnl || "0");
                        const currency = t.currency || "IDR";

                        const formattedPrice = formatCurrencyValue(parseFloat(t.price), currency);
                        const formattedPnl = pnlVal === 0 
                          ? "-" 
                          : `${pnlVal > 0 ? "+" : ""}${formatCurrencyValue(pnlVal, currency)}`;

                        return (
                          <tr key={t.id || idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-all font-semibold uppercase tracking-wider">
                            <td className="py-3 px-4 text-slate-500 font-mono">{new Date(t.created_at).toLocaleTimeString()}</td>
                            <td className="py-3 px-4 text-white font-bold">{t.pair}</td>
                            <td className="py-3 px-4 text-indigo-400 font-mono">{t.strategy_type.replace('_', ' ')}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-[4px] font-black text-[9px] ${
                                isBuy ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              }`}>
                                {t.side}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-white font-mono">{formattedPrice}</td>
                            <td className="py-3 px-4 text-slate-400 font-mono">{parseFloat(t.amount).toFixed(5)}</td>
                            <td className={`py-3 px-4 text-right font-mono font-black ${pnlVal > 0 ? "text-emerald-400" : pnlVal < 0 ? "text-rose-450" : "text-slate-500"}`}>
                              {formattedPnl}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'daftar_bot' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {userBots.length === 0 ? (
                <div className="py-20 text-center text-slate-500 font-mono text-xs uppercase tracking-widest">
                  Belum ada bot simulasi. Atur parameter strategi di sebelah kanan untuk memulai.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userBots.map((bot) => {
                    const isActive = bot.status === "active";
                    const isActionLoading = actionLoading === bot.id;
                    const settingsJson = bot.settings || {};
                    const currency = settingsJson.currency || 'IDR';
                    
                    const balance = settingsJson.sim_balance || (currency === 'IDR' ? 10000000 : 1000);
                    const position = settingsJson.sim_position || 0;

                    const formattedBalance = formatCurrencyValue(parseFloat(balance), currency);

                    return (
                      <div key={bot.id} className="p-4 border border-white/5 bg-white/[0.01] rounded-[8px] hover:border-white/10 transition-all flex flex-col justify-between gap-3 relative group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/20 group-hover:bg-indigo-600 transition-all"></div>
                        
                        <div className="flex justify-between items-start pl-2">
                          <div>
                            <h4 className="text-xs font-black text-white uppercase tracking-wider">{bot.name}</h4>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{bot.bot_type.replace('_', ' ')} • {bot.pair}</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleStatus(bot.id, bot.status)}
                              disabled={isActionLoading}
                              className={`p-2 rounded-[4px] border transition-all cursor-pointer ${
                                isActive 
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white" 
                                  : "bg-slate-500/10 border-slate-500/20 text-slate-400 hover:bg-slate-500 hover:text-white"
                              }`}
                              title={isActive ? "Hentikan Bot" : "Aktifkan Bot"}
                            >
                              <Power size={12} className={isActionLoading ? "animate-spin" : ""} />
                            </button>

                            <button
                              onClick={() => handleDeleteBot(bot.id)}
                              disabled={isActionLoading}
                              className="p-2 rounded-[4px] border border-rose-500/20 bg-rose-500/10 text-rose-450 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                              title="Hapus Bot"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center border-t border-white/5 pt-3 pl-2 text-[10px] font-black text-slate-450 uppercase tracking-widest font-mono">
                          <span>Balance: {formattedBalance}</span>
                          <span>Posisi: {parseFloat(position).toFixed(4)}</span>
                          <span className={`flex items-center gap-1 font-bold ${isActive ? "text-emerald-400" : "text-slate-500"}`}>
                            <span className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-600"}`}></span>
                            {bot.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* RIGHT COLUMN: Strategy Parameter Settings (No Outer Box Cards - Totally Flat & Clean) */}
      <div className="xl:col-span-4 flex flex-col gap-6">
        
        {/* Flat Parameter Inputs */}
        <div className="space-y-6">
          
          {/* Header */}
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
            <Cpu size={16} className="text-indigo-400" />
            <span className="text-xs font-black uppercase tracking-wider text-white">STRATEGI PARAMETERS</span>
          </div>

          {/* TAB SELECTOR FOR STRATEGIES (Styled like card buttons) */}
          <div className="grid grid-cols-5 gap-1 bg-[#040508] border border-white/5 p-1 rounded-[6px] shadow-inner">
            <button 
              onClick={() => setActiveBot('dca_lite')}
              className={`py-2.5 text-[8px] font-black uppercase tracking-wider transition-all rounded-[4px] flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                activeBot === 'dca_lite' 
                  ? 'bg-gradient-to-br from-[#1e2942] to-[#0f172a] text-blue-400 border border-blue-500/35 scale-[1.02] shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.01]'
              }`}
            >
              <Target size={10} className={activeBot === 'dca_lite' ? 'text-blue-400' : 'text-slate-500'} />
              <span className="truncate">DCA Lite</span>
            </button>
            
            <button 
              onClick={() => setActiveBot('dca_pro')}
              className={`py-2.5 text-[8px] font-black uppercase tracking-wider transition-all rounded-[4px] flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                activeBot === 'dca_pro' 
                  ? 'bg-gradient-to-br from-[#1e2942] to-[#0f172a] text-blue-400 border border-blue-500/35 scale-[1.02] shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.01]'
              }`}
            >
              <Zap size={10} className={activeBot === 'dca_pro' ? 'text-blue-400' : 'text-slate-500'} />
              <span className="truncate">Smart DCA</span>
            </button>

            <button 
              onClick={() => setActiveBot('grid_lite')}
              className={`py-2.5 text-[8px] font-black uppercase tracking-wider transition-all rounded-[4px] flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                activeBot === 'grid_lite' 
                  ? 'bg-gradient-to-br from-[#1e2942] to-[#0f172a] text-blue-400 border border-blue-500/35 scale-[1.02] shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.01]'
              }`}
            >
              <BarChart2 size={10} className={activeBot === 'grid_lite' ? 'text-blue-400' : 'text-slate-500'} />
              <span className="truncate">Grid Master</span>
            </button>

            <button 
              onClick={() => setActiveBot('combo_lite')}
              className={`py-2.5 text-[8px] font-black uppercase tracking-wider transition-all rounded-[4px] flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                activeBot === 'combo_lite' 
                  ? 'bg-gradient-to-br from-[#1e2942] to-[#0f172a] text-blue-400 border border-blue-500/35 scale-[1.02] shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.01]'
              }`}
            >
              <Layers size={10} className={activeBot === 'combo_lite' ? 'text-blue-400' : 'text-slate-500'} />
              <span className="truncate">Hybrid</span>
            </button>

            <button 
              onClick={() => setActiveBot('trailing_lite')}
              className={`py-2.5 text-[8px] font-black uppercase tracking-wider transition-all rounded-[4px] flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                activeBot === 'trailing_lite' 
                  ? 'bg-gradient-to-br from-[#1e2942] to-[#0f172a] text-blue-400 border border-blue-500/35 scale-[1.02] shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.01]'
              }`}
            >
              <ShieldCheck size={10} className={activeBot === 'trailing_lite' ? 'text-blue-400' : 'text-slate-500'} />
              <span className="truncate">Trailing</span>
            </button>
          </div>

          {/* Dynamic Inputs (Clean, borderless flat layout) */}
          <div className="space-y-4">
            
            {/* Currency Selector */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Mata Uang Jurnal (Base Currency)</label>
              <select 
                value={selectedCurrency} 
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedCurrency(val);
                  if (['IDR', 'VND'].includes(val)) {
                    setSimBalanceInput('10,000,000');
                    setDcaNominal('1,000,000');
                    setDcaSafetyNominal('500,000');
                    setComboMargin('1,000,000');
                  } else if (['JPY', 'KRW'].includes(val)) {
                    setSimBalanceInput('100,000');
                    setDcaNominal('10,000');
                    setDcaSafetyNominal('5,000');
                    setComboMargin('10,000');
                  } else if (val === 'INR') {
                    setSimBalanceInput('50,000');
                    setDcaNominal('5,000');
                    setDcaSafetyNominal('2,500');
                    setComboMargin('5,000');
                  } else {
                    setSimBalanceInput('1,000');
                    setDcaNominal('100');
                    setDcaSafetyNominal('50');
                    setComboMargin('100');
                  }
                }}
                className="w-full bg-black border border-white/10 p-2.5 text-xs font-bold text-white rounded-[6px] transition-all outline-none cursor-pointer"
              >
                <option value="IDR">IDR (Indonesian Rupiah - Rp)</option>
                <option value="USDT">USDT (Tether USD)</option>
                <option value="USD">USD (US Dollar - $)</option>
                <option value="EUR">EUR (Euro - €)</option>
                <option value="GBP">GBP (British Pound - £)</option>
                <option value="JPY">JPY (Japanese Yen - ¥)</option>
                <option value="SGD">SGD (Singapore Dollar - S$)</option>
                <option value="MYR">MYR (Malaysian Ringgit - RM)</option>
                <option value="AUD">AUD (Australian Dollar - A$)</option>
                <option value="CAD">CAD (Canadian Dollar - C$)</option>
                <option value="INR">INR (Indian Rupee - ₹)</option>
                <option value="PHP">PHP (Philippine Peso - ₱)</option>
                <option value="THB">THB (Thai Baht - ฿)</option>
                <option value="VND">VND (Vietnamese Dong - ₫)</option>
              </select>
            </div>

            {/* Real-time Searchable Coin Selector */}
            <div className="space-y-1 relative">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Pilih Koin (Binance Real-time Pairs)</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={customCoin}
                  onChange={(e) => {
                    const typed = e.target.value.toUpperCase();
                    setCustomCoin(typed);
                    setShowDropdown(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const typed = customCoin.trim().toUpperCase();
                      if (typed) {
                        setSelectedCoin(typed);
                        setCustomCoin(typed);
                        setShowDropdown(false);
                      }
                    }
                  }}
                  onFocus={() => {
                    setCustomCoin(''); // Clear search on focus so they can see all options immediately
                    setShowDropdown(true);
                  }}
                  placeholder="Ketik koin (contoh: BTC, ETH, SOL, SHIB)"
                  className="w-full bg-black border border-white/10 p-2.5 text-xs font-bold text-white rounded-[6px] outline-none font-mono"
                />
                {showDropdown && (
                  <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-[#07090e] border border-white/10 rounded-[6px] shadow-2xl divide-y divide-white/5 scrollbar-thin scrollbar-thumb-white/10">
                    {(() => {
                      const POPULAR_PAIRS = [
                        'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 
                        'DOGEUSDT', 'SHIBUSDT', 'PEPEUSDT', 'BONKUSDT', 'FLOKIUSDT', 'WIFUSDT',
                        'ADAUSDT', 'DOTUSDT', 'NEARUSDT', 'AVAXUSDT', 'LINKUSDT', 'SUIUSDT'
                      ];
                      const query = (customCoin || '').trim().toUpperCase();
                      const pairsToSearch = binancePairs.length > 0 ? binancePairs : COIN_OPTIONS.map(c => c.value);
                      
                      let filtered = [];
                      if (query === '') {
                        // Prioritize popular and meme coins first
                        const defaultList = [];
                        for (const p of POPULAR_PAIRS) {
                          if (binancePairs.includes(p)) {
                            defaultList.push(p);
                          }
                        }
                        for (const p of binancePairs) {
                          if (!defaultList.includes(p)) {
                            defaultList.push(p);
                          }
                        }
                        filtered = defaultList.length > 0 ? defaultList.slice(0, 100) : COIN_OPTIONS.map(c => c.value);
                      } else {
                        filtered = pairsToSearch.filter(p => p.includes(query)).slice(0, 100);
                      }
                      
                      if (filtered.length === 0) {
                        return <div className="p-2.5 text-xs text-slate-500 font-mono">Tidak ada hasil matching</div>;
                      }

                      return filtered.map(pair => (
                        <div 
                          key={pair}
                          onClick={() => {
                            setSelectedCoin(pair);
                            setCustomCoin(pair);
                            setShowDropdown(false);
                          }}
                          className="p-2.5 text-xs text-white hover:bg-indigo-600/25 cursor-pointer font-bold font-mono transition-all flex justify-between items-center"
                        >
                          <span>{pair}</span>
                          <span className="text-[8px] text-slate-400 bg-white/5 px-1 py-0.5 rounded">Real-time</span>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
              {showDropdown && (
                <div 
                  className="fixed inset-0 z-40 cursor-default" 
                  onClick={() => {
                    setShowDropdown(false);
                    setCustomCoin(selectedCoin); // Reset customCoin back to currently active symbol on close
                  }}
                />
              )}
            </div>

            {/* Virtual Starting Balance Input */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Modal Awal Virtual ({selectedCurrency})</label>
              <input 
                type="text" 
                value={simBalanceInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/,/g, "");
                  if (!isNaN(Number(val)) || val === "") {
                    if (selectedCurrency === 'IDR' && val !== "") {
                      setSimBalanceInput(Number(val).toLocaleString());
                    } else {
                      setSimBalanceInput(val);
                    }
                  }
                }}
                className="w-full bg-black border border-white/10 p-2.5 text-xs font-bold text-white rounded-[6px] outline-none"
              />
            </div>

            {activeBot.startsWith('dca') ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Fixed Nominal ({selectedCurrency})</label>
                    <input 
                      type="text" 
                      value={dcaNominal}
                      onChange={(e) => setDcaNominal(e.target.value)}
                      className="w-full bg-black border border-white/10 p-2.5 text-xs text-white rounded-[6px] font-bold outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Safety Order ({selectedCurrency})</label>
                    <input 
                      type="text" 
                      value={dcaSafetyNominal}
                      onChange={(e) => setDcaSafetyNominal(e.target.value)}
                      className="w-full bg-black border border-white/10 p-2.5 text-xs text-white rounded-[6px] font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Target TP (%)</label>
                    <input 
                      type="number" 
                      value={dcaTakeProfit}
                      onChange={(e) => setDcaTakeProfit(e.target.value)}
                      className="w-full bg-black border border-white/10 p-2.5 text-xs text-white rounded-[6px] font-bold outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Stop Loss (%)</label>
                    <input 
                      type="number" 
                      value={dcaStopLoss}
                      onChange={(e) => setDcaStopLoss(e.target.value)}
                      className="w-full bg-black border border-white/10 p-2.5 text-xs text-white rounded-[6px] font-bold outline-none"
                    />
                  </div>
                </div>

                {activeBot === 'dca_pro' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Max Safety Orders</label>
                      <input 
                        type="number" 
                        value={dcaMaxSafety}
                        onChange={(e) => setDcaMaxSafety(e.target.value)}
                        className="w-full bg-black border border-white/10 p-2.5 text-xs text-white rounded-[6px] font-bold outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Price Deviation (%)</label>
                      <input 
                        type="number" 
                        value={dcaPriceDev}
                        onChange={(e) => setDcaPriceDev(e.target.value)}
                        className="w-full bg-black border border-white/10 p-2.5 text-xs text-white rounded-[6px] font-bold outline-none"
                      />
                    </div>
                  </div>
                )}
              </>
            ) : activeBot === 'grid_lite' ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Lower Price</label>
                    <input 
                      type="number" 
                      value={gridLowerPrice}
                      onChange={(e) => setGridLowerPrice(e.target.value)}
                      className="w-full bg-black border border-white/10 p-2.5 text-xs text-white rounded-[6px] font-bold outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Upper Price</label>
                    <input 
                      type="number" 
                      value={gridUpperPrice}
                      onChange={(e) => setGridUpperPrice(e.target.value)}
                      className="w-full bg-black border border-white/10 p-2.5 text-xs text-white rounded-[6px] font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Grid Levels</label>
                    <input 
                      type="number" 
                      value={gridNumber}
                      onChange={(e) => setGridNumber(e.target.value)}
                      className="w-full bg-black border border-white/10 p-2.5 text-xs text-white rounded-[6px] font-bold outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Grid Mode</label>
                    <div className="flex bg-[#040508] border border-white/5 p-0.5 rounded-[6px] h-9">
                      <button 
                        onClick={() => setGridMode('arithmetic')}
                        className={`flex-1 text-[9px] font-bold uppercase tracking-wider rounded-[4px] transition-all cursor-pointer ${
                          gridMode === 'arithmetic' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Arithmetic
                      </button>
                      <button 
                        onClick={() => setGridMode('geometric')}
                        className={`flex-1 text-[9px] font-bold uppercase tracking-wider rounded-[4px] transition-all cursor-pointer ${
                          gridMode === 'geometric' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Geometric
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : activeBot === 'combo_lite' ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Margin Size ({selectedCurrency})</label>
                    <input 
                      type="text" 
                      value={comboMargin}
                      onChange={(e) => setComboMargin(e.target.value)}
                      className="w-full bg-black border border-white/10 p-2.5 text-xs text-white rounded-[6px] font-bold outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Leverage (x)</label>
                    <input 
                      type="number" 
                      value={comboLeverage}
                      onChange={(e) => setComboLeverage(e.target.value)}
                      className="w-full bg-black border border-white/10 p-2.5 text-xs text-white rounded-[6px] font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Take Profit (%)</label>
                    <input 
                      type="number" 
                      value={comboTp}
                      onChange={(e) => setComboTp(e.target.value)}
                      className="w-full bg-black border border-white/10 p-2.5 text-xs text-white rounded-[6px] font-bold outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Stop Loss (%)</label>
                    <input 
                      type="number" 
                      value={comboSl}
                      onChange={(e) => setComboSl(e.target.value)}
                      className="w-full bg-black border border-white/10 p-2.5 text-xs text-white rounded-[6px] font-bold outline-none"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Trailing TP (%)</label>
                    <input 
                      type="number" 
                      value={trailingTp}
                      onChange={(e) => setTrailingTp(e.target.value)}
                      className="w-full bg-black border border-white/10 p-2.5 text-xs text-white rounded-[6px] font-bold outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Callback SL (%)</label>
                    <input 
                      type="number" 
                      value={trailingSlValue}
                      onChange={(e) => setTrailingSlValue(e.target.value)}
                      className="w-full bg-black border border-white/10 p-2.5 text-xs text-white rounded-[6px] font-bold outline-none"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Action Button styled like a card button */}
          <button
            onClick={handleStartSimulation}
            disabled={loading}
            className="w-full py-4 text-xs font-black uppercase tracking-wider transition-all rounded-[6px] flex items-center justify-center gap-2 border bg-indigo-600 border-indigo-500 hover:bg-indigo-550 text-white hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 shadow-lg shadow-indigo-650/15"
          >
            {loading ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <Play size={12} fill="currentColor" />
                <span>Simpan & Mulai Simulasi</span>
              </>
            )}
          </button>

        </div>

      </div>

    </div>
  );
}
