"use client";

import { useEffect, useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight, 
  DollarSign, 
  Activity,
  Cpu,
  Clock,
  ChevronRight,
  Eye,
  EyeOff,
  Wallet,
  Sliders,
  AlertTriangle,
  Award,
  X,
  ShieldCheck,
  ArrowRight,
  Info
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { useLanguage } from '@/lang/LanguageContext';

export default function Overview({ setActiveView }: { setActiveView?: (view: string) => void }) {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<any>(null);
  const [showAccounts, setShowAccounts] = useState(false);
  const [loading, setLoading] = useState(true);

  // Drawer for bot strategies list
  const [isStrategiesDrawerOpen, setIsStrategiesDrawerOpen] = useState(false);
  const [selectedDrawerBot, setSelectedDrawerBot] = useState<any>(null);

  // Live and Simulation states
  const [realTrades, setRealTrades] = useState<any[]>([]);
  const [simTrades, setSimTrades] = useState<any[]>([]);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);

  // Filter and tab states
  const [activeTab, setActiveTab] = useState<'bot-charts' | 'progress-charts'>('bot-charts');
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedBot, setSelectedBot] = useState<string>('ALL');
  const [selectedCoin, setSelectedCoin] = useState<string>('ALL');
  const [selectedApiKey, setSelectedApiKey] = useState<string>('ALL');

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiHost = window.location.hostname;
        
        // 1. Fetch overview summary stats
        const overviewRes = await fetch(`http://${apiHost}:8080/api/overview`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (overviewRes.ok) {
          const result = await overviewRes.json();
          setData(result);
        }

        // 2. Fetch real trades
        const tradesRes = await fetch(`http://${apiHost}:8080/api/trades`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (tradesRes.ok) {
          const tradesData = await tradesRes.json();
          if (Array.isArray(tradesData)) {
            setRealTrades(tradesData);
          }
        }

        // 3. Fetch simulation trades
        const simTradesRes = await fetch(`http://${apiHost}:8080/api/simulations/trades`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (simTradesRes.ok) {
          const simTradesData = await simTradesRes.json();
          if (Array.isArray(simTradesData)) {
            setSimTrades(simTradesData);
          }
        }

        // 4. Fetch user strategies
        const stratRes = await fetch(`http://${apiHost}:8080/api/strategies/user`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (stratRes.ok) {
          const stratData = await stratRes.json();
          if (Array.isArray(stratData)) {
            setStrategies(stratData);
          }
        }

        // 5. Fetch API Keys
        const apiKeysRes = await fetch(`http://${apiHost}:8080/api/api-keys`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (apiKeysRes.ok) {
          const apiKeysData = await apiKeysRes.json();
          if (Array.isArray(apiKeysData)) {
            setApiKeys(apiKeysData);
          }
        }
      } catch (e) {
        console.error("Failed to fetch overview dashboard data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Compute base capitals
  const realBaseCapital = useMemo(() => {
    return data?.total_capital || 10000000; // default 10M IDR
  }, [data]);

  const simBaseCapital = useMemo(() => {
    return 10000000; // default 10M IDR
  }, []);

  const isIDR = realBaseCapital > 100000;

  // Filter option lists
  const coinOptions = useMemo(() => {
    const coins = new Set<string>();
    realTrades.forEach(t => t.pair && coins.add(t.pair));
    simTrades.forEach(t => t.pair && coins.add(t.pair));
    return Array.from(coins);
  }, [realTrades, simTrades]);

  const botTypeOptions = useMemo(() => {
    const types = new Set<string>();
    realTrades.forEach(t => t.strategy_type && types.add(t.strategy_type.toUpperCase()));
    simTrades.forEach(t => t.strategy_type && types.add(t.strategy_type.toUpperCase()));
    return Array.from(types);
  }, [realTrades, simTrades]);

  // Filtering Logic
  const filteredRealTrades = useMemo(() => {
    return realTrades.filter(trade => {
      // Bot Type filter
      if (selectedBot !== 'ALL') {
        const type = (trade.strategy_type || '').toUpperCase();
        if (type !== selectedBot) return false;
      }
      // Coin filter
      if (selectedCoin !== 'ALL' && trade.pair !== selectedCoin) {
        return false;
      }
      // API Key filter
      if (selectedApiKey !== 'ALL') {
        const keyId = parseInt(selectedApiKey);
        // Find if this trade corresponds to a strategy linked to selectedApiKey
        const matchesApiKey = strategies.some(strat => {
          const platformIds = strat.settings?.platforms;
          const isLinked = Array.isArray(platformIds) && platformIds.includes(keyId);
          if (!isLinked) return false;
          
          const botTypeMatch = (strat.bot_type || '').toLowerCase() === (trade.strategy_type || '').toLowerCase();
          const pairMatch = (strat.pair || '').replace('/', '').toUpperCase() === (trade.pair || '').replace('/', '').toUpperCase();
          return botTypeMatch && pairMatch;
        });
        if (!matchesApiKey) return false;
      }
      return true;
    });
  }, [realTrades, selectedBot, selectedCoin, selectedApiKey, strategies]);

  const filteredSimTrades = useMemo(() => {
    return simTrades.filter(trade => {
      // Bot Type filter
      if (selectedBot !== 'ALL') {
        const type = (trade.strategy_type || '').toUpperCase();
        if (type !== selectedBot) return false;
      }
      // Coin filter
      if (selectedCoin !== 'ALL' && trade.pair !== selectedCoin) {
        return false;
      }
      // API Key filter does not apply to simulation
      return true;
    });
  }, [simTrades, selectedBot, selectedCoin]);

  // Helper to convert USD PnL values if the main base capital is in IDR
  const convertPnl = (pnlVal: number) => {
    if (isIDR && Math.abs(pnlVal) < 10000) {
      return pnlVal * 16000; // scale USD to IDR
    }
    return pnlVal;
  };

  // Recharts bot chart data computation
  const botChartData = useMemo(() => {
    const sortedReal = [...filteredRealTrades].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const sortedSim = [...filteredSimTrades].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const getPeriodKey = (dateStr: string) => {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      if (timeframe === 'monthly') {
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      } else if (timeframe === 'weekly') {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date.setDate(diff));
        return 'W/O ' + monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    };

    const allPeriodsSet = new Set<string>();
    sortedReal.forEach(t => allPeriodsSet.add(getPeriodKey(t.created_at)));
    sortedSim.forEach(t => allPeriodsSet.add(getPeriodKey(t.created_at)));

    if (allPeriodsSet.size === 0) {
      const mockData = [];
      const count = timeframe === 'daily' ? 7 : timeframe === 'weekly' ? 4 : 6;
      for (let i = count - 1; i >= 0; i--) {
        const d = new Date();
        if (timeframe === 'daily') d.setDate(d.getDate() - i);
        else if (timeframe === 'weekly') d.setDate(d.getDate() - i * 7);
        else d.setMonth(d.getMonth() - i);

        mockData.push({
          date: getPeriodKey(d.toISOString()),
          real_balance: realBaseCapital,
          sim_balance: simBaseCapital
        });
      }
      return mockData;
    }

    const periodTimestamps: Record<string, number> = {};
    sortedReal.forEach(t => {
      const key = getPeriodKey(t.created_at);
      const ts = new Date(t.created_at).getTime();
      if (!periodTimestamps[key] || ts < periodTimestamps[key]) {
        periodTimestamps[key] = ts;
      }
    });
    sortedSim.forEach(t => {
      const key = getPeriodKey(t.created_at);
      const ts = new Date(t.created_at).getTime();
      if (!periodTimestamps[key] || ts < periodTimestamps[key]) {
        periodTimestamps[key] = ts;
      }
    });

    const sortedPeriods = Array.from(allPeriodsSet).sort((a, b) => periodTimestamps[a] - periodTimestamps[b]);

    const realPnLByPeriod: Record<string, number> = {};
    const simPnLByPeriod: Record<string, number> = {};

    sortedReal.forEach(t => {
      const key = getPeriodKey(t.created_at);
      const pnl = convertPnl(parseFloat(t.pnl || '0'));
      realPnLByPeriod[key] = (realPnLByPeriod[key] || 0) + pnl;
    });

    sortedSim.forEach(t => {
      const key = getPeriodKey(t.created_at);
      const pnl = convertPnl(parseFloat(t.pnl || '0'));
      simPnLByPeriod[key] = (simPnLByPeriod[key] || 0) + pnl;
    });

    const chartPoints = [];
    let currentRealBalance = realBaseCapital;
    let currentSimBalance = simBaseCapital;

    for (const periodKey of sortedPeriods) {
      if (realPnLByPeriod[periodKey] !== undefined) {
        currentRealBalance += realPnLByPeriod[periodKey];
      }
      if (simPnLByPeriod[periodKey] !== undefined) {
        currentSimBalance += simPnLByPeriod[periodKey];
      }
      chartPoints.push({
        date: periodKey,
        real_balance: Math.round(currentRealBalance),
        sim_balance: Math.round(currentSimBalance)
      });
    }

    if (chartPoints.length > 0) {
      const firstTs = periodTimestamps[sortedPeriods[0]];
      const startD = new Date(firstTs);
      if (timeframe === 'daily') startD.setDate(startD.getDate() - 1);
      else if (timeframe === 'weekly') startD.setDate(startD.getDate() - 7);
      else startD.setMonth(startD.getMonth() - 1);
      
      chartPoints.unshift({
        date: getPeriodKey(startD.toISOString()),
        real_balance: realBaseCapital,
        sim_balance: simBaseCapital
      });
    }

    return chartPoints;
  }, [filteredRealTrades, filteredSimTrades, timeframe, realBaseCapital, simBaseCapital]);

  // Recharts progress/emotional panic loss chart data computation
  const panicLossChartData = useMemo(() => {
    const manualTrades = filteredRealTrades.filter(t => t.is_manual_intervention && t.intervention_pnl_diff);
    const sortedManual = [...manualTrades].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const getPeriodKey = (dateStr: string) => {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      if (timeframe === 'monthly') {
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      } else if (timeframe === 'weekly') {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date.setDate(diff));
        return 'W/O ' + monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    };

    const periodsSet = new Set<string>();
    sortedManual.forEach(t => periodsSet.add(getPeriodKey(t.created_at)));

    if (periodsSet.size === 0) {
      const mockData = [];
      const count = timeframe === 'daily' ? 7 : timeframe === 'weekly' ? 4 : 6;
      for (let i = count - 1; i >= 0; i--) {
        const d = new Date();
        if (timeframe === 'daily') d.setDate(d.getDate() - i);
        else if (timeframe === 'weekly') d.setDate(d.getDate() - i * 7);
        else d.setMonth(d.getMonth() - i);

        mockData.push({
          date: getPeriodKey(d.toISOString()),
          panic_loss: 0
        });
      }
      return mockData;
    }

    const periodTimestamps: Record<string, number> = {};
    sortedManual.forEach(t => {
      const key = getPeriodKey(t.created_at);
      const ts = new Date(t.created_at).getTime();
      if (!periodTimestamps[key] || ts < periodTimestamps[key]) {
        periodTimestamps[key] = ts;
      }
    });

    const sortedPeriods = Array.from(periodsSet).sort((a, b) => periodTimestamps[a] - periodTimestamps[b]);

    const panicLossByPeriod: Record<string, number> = {};
    sortedManual.forEach(t => {
      const key = getPeriodKey(t.created_at);
      const loss = convertPnl(Math.abs(parseFloat(t.intervention_pnl_diff || '0')));
      panicLossByPeriod[key] = (panicLossByPeriod[key] || 0) + loss;
    });

    const chartPoints = [];
    let cumulativeLoss = 0;

    if (sortedPeriods.length > 0) {
      const firstTs = periodTimestamps[sortedPeriods[0]];
      const startD = new Date(firstTs);
      if (timeframe === 'daily') startD.setDate(startD.getDate() - 1);
      else if (timeframe === 'weekly') startD.setDate(startD.getDate() - 7);
      else startD.setMonth(startD.getMonth() - 1);
      chartPoints.push({
        date: getPeriodKey(startD.toISOString()),
        panic_loss: 0
      });
    }

    for (const periodKey of sortedPeriods) {
      cumulativeLoss += panicLossByPeriod[periodKey];
      chartPoints.push({
        date: periodKey,
        panic_loss: Math.round(cumulativeLoss)
      });
    }

    return chartPoints;
  }, [filteredRealTrades, timeframe, realBaseCapital]);

  // Emotional statistics calculation
  const emotionalStats = useMemo(() => {
    const manualTrades = filteredRealTrades.filter(t => t.is_manual_intervention);
    const panicLossSum = manualTrades.reduce((acc, t) => acc + convertPnl(Math.abs(parseFloat(t.intervention_pnl_diff || '0'))), 0);
    return {
      count: manualTrades.length,
      panicLoss: panicLossSum,
      avgPanicLoss: manualTrades.length > 0 ? Math.round(panicLossSum / manualTrades.length) : 0
    };
  }, [filteredRealTrades]);

  // Calculate current balances to show in stats cards
  const latestRealBalance = useMemo(() => {
    if (botChartData.length > 0) {
      return botChartData[botChartData.length - 1].real_balance;
    }
    return realBaseCapital;
  }, [botChartData, realBaseCapital]);

  const latestSimBalance = useMemo(() => {
    if (botChartData.length > 0) {
      return botChartData[botChartData.length - 1].sim_balance;
    }
    return simBaseCapital;
  }, [botChartData, simBaseCapital]);

  const botStrategiesList = [
    {
      id: 'dca',
      name: 'DCA BOT (DCA Lite)',
      description: 'Dollar Cost Averaging otomatis untuk investasi jangka panjang tanpa emosi.',
      longDescription: 'Dollar Cost Averaging (DCA) Bot mempermudah investasi aset kripto dengan membeli secara berkala pada interval tertentu atau saat terjadi penurunan harga (market dip). Strategi ini sangat efektif untuk mengurangi dampak volatilitas harga serta menghindari emosi FOMO saat trading.',
      stats: '85% Success Rate',
      color: 'blue',
      risk: 'Low',
      market: 'Spot / Futures',
      parameters: [
        { label: 'Nominal Awal', value: '$10 / Rp 150.000' },
        { label: 'Penyimpangan Harga (Deviation)', value: '1.5% - 2.0%' },
        { label: 'Target Take Profit', value: '1.2% - 1.5%' },
        { label: 'Maksimal Safety Order', value: '5 Level' }
      ],
      isComingSoon: false
    },
    {
      id: 'grid',
      name: 'GRIDBOT (Grid Master)',
      description: 'Profit dari volatilitas pasar dengan buy low dan sell high secara otomatis.',
      longDescription: 'Grid Bot bekerja dengan memasang jaring order beli dan jual pada rentang harga tertentu secara sistematis. Saat harga bergerak naik-turun dalam koridor sideways, bot secara instan merealisasikan profit dari fluktuasi mikro tanpa memerlukan tebakan arah tren.',
      stats: 'High Volatility Proof',
      color: 'emerald',
      risk: 'Medium',
      market: 'Spot Only',
      parameters: [
        { label: 'Grid Level Count', value: '15 - 30 Grid' },
        { label: 'Jarak Antar Grid', value: '0.8% - 1.2%' },
        { label: 'Rentang Harga Atas/Bawah', value: 'Auto-Calculated ATR' },
        { label: 'Stop Loss Threshold', value: 'Manual / Auto-Breakout' }
      ],
      isComingSoon: false
    },
    {
      id: 'combo',
      name: 'COMBO (Hybrid/Combo)',
      description: 'Gabungan indikator RSI dan EMA untuk sinyal beli/jual yang lebih akurat.',
      longDescription: 'Combo Bot menggabungkan kekuatan indikator momentum (RSI) dan tren rata-rata bergerak (EMA). Bot hanya akan masuk ke pasar saat terjadi pembalikan tren terkonfirmasi (trend reversal), sehingga meminimalisir risiko tersangkut saat tren turun panjang.',
      stats: 'Stable Returns',
      color: 'purple',
      risk: 'Medium',
      market: 'Spot / Futures',
      parameters: [
        { label: 'Trigger RSI Overbought', value: '>= 70' },
        { label: 'Trigger RSI Oversold', value: '<= 30' },
        { label: 'Trend Filter', value: 'EMA 50 & EMA 200' },
        { label: 'Leverage Futures Limit', value: '3x - 5x Max' }
      ],
      isComingSoon: false
    },
    {
      id: 'trailing',
      name: 'TRAILING (Trailing Bot)',
      description: 'Maksimalkan profit dengan mengunci harga saat naik dan keluar cepat.',
      longDescription: 'Trailing Bot adalah bot pelacak profit yang dinamis. Begitu target profit dasar tercapai, bot tidak langsung menutup posisi melainkan menaikkan batas stop-loss mengikuti pergerakan naik harga. Saat tren berbalik turun melampaui toleransi, profit langsung dikunci seketika.',
      stats: 'Profit Lock Engine',
      color: 'amber',
      risk: 'High',
      market: 'Futures Only',
      parameters: [
        { label: 'Activation Target', value: '+1.0% Profit' },
        { label: 'Trailing Callback', value: '0.2% - 0.5%' },
        { label: 'Max Trailing Scale', value: 'Unlimited' },
        { label: 'Slippage Protection', value: 'Enabled (Market order)' }
      ],
      isComingSoon: false
    },
    {
      id: 'bollinger',
      name: 'BOLLINGER BAND BOT',
      description: 'Eksekusi transaksi saat harga menyentuh pita luar Bollinger Bands.',
      longDescription: 'Bollinger Band Bot memanfaatkan deviasi standar harga untuk memprediksi kejenuhan pasar. Bot akan melakukan pembelian saat harga menyentuh Lower Band (Oversold) dan melakukan penjualan di Upper Band (Overbought). Sangat cocok untuk kondisi pasar ranging.',
      stats: 'Coming Soon',
      color: 'slate',
      risk: 'Medium',
      market: 'Spot / Futures',
      parameters: [
        { label: 'BB Period', value: '20' },
        { label: 'Standard Deviation', value: '2.0' },
        { label: 'Confirmation Candle', value: '15m / 1h' }
      ],
      isComingSoon: true
    },
    {
      id: 'rsi_scalper',
      name: 'RSI SCALPER',
      description: 'Scalping kilat berskala detik berdasarkan osilasi RSI cepat.',
      longDescription: 'RSI Scalper dirancang khusus untuk trader dengan frekuensi transaksi super tinggi. Bot mengeksploitasi momentum jenuh beli dan jenuh jual dalam hitungan menit untuk mengamankan margin profit mikro secara kumulatif.',
      stats: 'Coming Soon',
      color: 'slate',
      risk: 'High',
      market: 'Futures Only',
      parameters: [
        { label: 'Timeframe', value: '1m / 5m' },
        { label: 'RSI Period', value: '7' },
        { label: 'Execution Speed', value: '< 200ms' }
      ],
      isComingSoon: true
    },
    {
      id: 'macd_oscillator',
      name: 'MACD OSCILLATOR',
      description: 'Trading mengikuti persilangan garis MACD signal line.',
      longDescription: 'MACD Oscillator mengidentifikasi pergantian tren pasar jangka menengah berdasarkan persilangan (crossover) garis MACD dengan signal line. Menjamin entri di awal tren kuat dan keluar sebelum momentum melemah sepenuhnya.',
      stats: 'Coming Soon',
      color: 'slate',
      risk: 'Low',
      market: 'Spot / Futures',
      parameters: [
        { label: 'Fast EMA', value: '12' },
        { label: 'Slow EMA', value: '26' },
        { label: 'Signal Line', value: '9' }
      ],
      isComingSoon: true
    }
  ];

  const renderStrategiesDrawer = () => {
    if (!isStrategiesDrawerOpen) return null;

    return (
      <>
        {/* Backdrop */}
        <div 
          onClick={() => {
            setIsStrategiesDrawerOpen(false);
            setSelectedDrawerBot(null);
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9990] animate-in fade-in duration-300"
        />

        {/* Drawer Panel */}
        <div className="fixed top-0 right-0 h-full w-full sm:max-w-md bg-[#090a0f] border-l border-white/10 z-[9991] flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-350 text-white">
          
          {selectedDrawerBot ? (
            /* BOT DETAIL VIEW */
            <>
              {/* Drawer Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <button 
                  onClick={() => setSelectedDrawerBot(null)}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-white transition-all cursor-pointer bg-transparent border-0 outline-none"
                >
                  &larr; Kembali
                </button>
                <button 
                  onClick={() => {
                    setIsStrategiesDrawerOpen(false);
                    setSelectedDrawerBot(null);
                  }}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer border-0"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 ${
                    selectedDrawerBot.color === 'blue' ? 'text-blue-400' : 
                    selectedDrawerBot.color === 'emerald' ? 'text-emerald-400' :
                    selectedDrawerBot.color === 'purple' ? 'text-purple-400' : 'text-amber-400'
                  }`}>
                    {selectedDrawerBot.id === 'dca' ? <TrendingUp size={18} /> : 
                     selectedDrawerBot.id === 'grid' ? <Cpu size={18} /> :
                     selectedDrawerBot.id === 'combo' ? <ShieldCheck size={18} /> : <Sliders size={18} />}
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white uppercase tracking-wider">{selectedDrawerBot.name}</h2>
                    <span className="text-[8px] font-black uppercase tracking-widest text-[#86868b]">{selectedDrawerBot.market}</span>
                  </div>
                </div>

                <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 space-y-2">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tentang Strategi</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                    {selectedDrawerBot.longDescription}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Tingkat Risiko</span>
                    <p className={`text-xs font-black uppercase tracking-wider mt-1 ${
                      selectedDrawerBot.risk === 'Low' ? 'text-emerald-400' :
                      selectedDrawerBot.risk === 'Medium' ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {selectedDrawerBot.risk} RISK
                    </p>
                  </div>
                  <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Histori Sukses</span>
                    <p className="text-xs font-black uppercase tracking-wider mt-1 text-white">
                      {selectedDrawerBot.stats}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Parameter Konfigurasi</h3>
                  <div className="bg-[#040406] border border-white/5 rounded-2xl divide-y divide-white/5">
                    {selectedDrawerBot.parameters.map((param: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-4">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{param.label}</span>
                        <span className="text-[10px] font-bold text-white font-mono">{param.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 flex gap-3">
                  <ShieldCheck size={18} className="text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-indigo-300">Emotional Safeguard Active</h4>
                    <p className="text-[10px] text-slate-450 leading-relaxed font-semibold mt-1">
                      Strategi ini diproteksi oleh TradingSafe untuk mengontrol Panic Loss akibat intervensi manual.
                    </p>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-white/5 bg-black/40">
                <button 
                  onClick={() => setSelectedDrawerBot(null)}
                  className="w-full py-3 bg-white text-black font-black uppercase tracking-widest rounded-xl text-xs hover:bg-slate-200 transition-all cursor-pointer border-0"
                >
                  Kembali ke Daftar
                </button>
              </div>
            </>
          ) : (
            /* STRATEGIES LIST VIEW */
            <>
              {/* Drawer Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-wider">Daftar Strategi &amp; Bot</h2>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#86868b] mt-0.5 font-semibold">Daftar bot simulasi &amp; strategi aktif</p>
                </div>
                <button 
                  onClick={() => setIsStrategiesDrawerOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer border-0"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {botStrategiesList.map((bot) => {
                  const isComing = bot.isComingSoon;
                  return (
                    <div 
                      key={bot.id} 
                      onClick={() => !isComing && setSelectedDrawerBot(bot)}
                      className={`p-4 border rounded-xl flex items-center justify-between text-left transition-all ${
                        isComing 
                          ? 'opacity-40 border-dashed border-white/5 cursor-not-allowed bg-transparent' 
                          : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/10 cursor-pointer active:scale-[0.98]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 ${
                          isComing ? 'text-slate-500' :
                          bot.color === 'blue' ? 'text-blue-400' : 
                          bot.color === 'emerald' ? 'text-emerald-400' :
                          bot.color === 'purple' ? 'text-purple-400' : 'text-amber-400'
                        }`}>
                          {bot.id === 'dca' ? <TrendingUp size={16} /> : 
                           bot.id === 'grid' ? <Cpu size={16} /> :
                           bot.id === 'combo' ? <ShieldCheck size={16} /> : <Sliders size={16} />}
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black text-white uppercase tracking-wider">{bot.name}</h4>
                          <p className="text-[9px] text-slate-400 truncate max-w-[180px] leading-relaxed mt-0.5 font-medium">{bot.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                          isComing 
                            ? 'bg-slate-900 border-white/10 text-slate-500' 
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        }`}>
                          {isComing ? 'Nanti' : 'Detail'}
                        </span>
                        {!isComing && <ChevronRight size={12} className="text-slate-500" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-white/5 bg-black/40">
                <button 
                  onClick={() => setIsStrategiesDrawerOpen(false)}
                  className="w-full py-3 border border-white/10 text-slate-300 font-black uppercase tracking-widest rounded-xl text-xs hover:bg-white/5 transition-all cursor-pointer bg-transparent"
                >
                  Tutup Laci
                </button>
              </div>
            </>
          )}

        </div>
      </>
    );
  };

  if (!mounted || loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent animate-spin rounded-full"></div>
    </div>
  );

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-500 bg-transparent text-[#f5f5f7]">
      
      {/* 1. TABS SYSTEM */}
      <div className="flex border-b border-white/10 px-4 gap-2 bg-[#05070a] pt-2">
        <button 
          onClick={() => setActiveTab('bot-charts')} 
          className={`px-4 py-2.5 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'bot-charts' 
              ? 'border-blue-500 text-white' 
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Cpu size={12} className={activeTab === 'bot-charts' ? 'text-blue-500' : 'text-slate-500'} />
          Grafik Bot (Real vs Sim)
        </button>
        <button 
          onClick={() => setActiveTab('progress-charts')} 
          className={`px-4 py-2.5 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'progress-charts' 
              ? 'border-amber-500 text-white' 
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Sliders size={12} className={activeTab === 'progress-charts' ? 'text-amber-500' : 'text-slate-500'} />
          Grafik Perkembangan (Audit Emosi)
        </button>
      </div>

      {/* 2. FILTER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-2 border-b border-white/5 bg-black/20">
        
        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Bot Filter */}
          <div className="flex flex-col">
            <span className="text-[7px] text-slate-500 uppercase font-black tracking-widest mb-1">Daftar Bot</span>
            <select
              value={selectedBot}
              onChange={(e) => setSelectedBot(e.target.value)}
              className="px-2 py-1 bg-[#090b11] border border-white/5 rounded text-[9px] font-bold text-slate-300 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">ALL BOTS</option>
              {botTypeOptions.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Coin Filter */}
          <div className="flex flex-col">
            <span className="text-[7px] text-slate-500 uppercase font-black tracking-widest mb-1">Aset Koin</span>
            <select
              value={selectedCoin}
              onChange={(e) => setSelectedCoin(e.target.value)}
              className="px-2 py-1 bg-[#090b11] border border-white/5 rounded text-[9px] font-bold text-slate-300 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">ALL COINS</option>
              {coinOptions.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* API Key Filter (only for Live Bot) */}
          <div className="flex flex-col">
            <span className="text-[7px] text-slate-500 uppercase font-black tracking-widest mb-1">API Key / Platform</span>
            <select
              value={selectedApiKey}
              onChange={(e) => setSelectedApiKey(e.target.value)}
              className="px-2 py-1 bg-[#090b11] border border-white/5 rounded text-[9px] font-bold text-slate-300 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">ALL API KEYS</option>
              {apiKeys.map(k => (
                <option key={k.id} value={k.id.toString()}>{k.label} ({k.platform_name.toUpperCase()})</option>
              ))}
            </select>
          </div>

        </div>

        {/* Timeframe selector (daily, weekly, monthly) */}
        <div className="flex items-center gap-1.5 self-end">
          <button 
            onClick={() => setTimeframe('daily')}
            className={`px-3 py-1 text-[8px] font-black uppercase tracking-wider rounded-[3px] transition-all cursor-pointer ${
              timeframe === 'daily' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'border border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Harian
          </button>
          <button 
            onClick={() => setTimeframe('weekly')}
            className={`px-3 py-1 text-[8px] font-black uppercase tracking-wider rounded-[3px] transition-all cursor-pointer ${
              timeframe === 'weekly' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'border border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Mingguan
          </button>
          <button 
            onClick={() => setTimeframe('monthly')}
            className={`px-3 py-1 text-[8px] font-black uppercase tracking-wider rounded-[3px] transition-all cursor-pointer ${
              timeframe === 'monthly' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'border border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Bulanan
          </button>
        </div>

      </div>

      {/* 3. CHART CONTAINER */}
      <div className="w-full px-4 pt-2 pb-4 bg-transparent border-b border-white/10">
        
        {activeTab === 'bot-charts' ? (
          <div className="space-y-4">
            
            {/* Legend indicators */}
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-350">Bot Asli</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-350">Bot Simulasi</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest rounded-[3px]">
                  {timeframe.toUpperCase()}
                </span>
                <span className="px-2 py-0.5 border border-white/10 text-slate-400 text-[8px] font-black uppercase tracking-widest rounded-[3px]">
                  REAL TIME
                </span>
              </div>
            </div>

            {/* Line Chart for Bot Asli vs Sim */}
            <div className="h-[240px] sm:h-[340px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={botChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
                    tickFormatter={(val) => isIDR ? `Rp ${(val / 1000000).toFixed(1)}J` : `$${val}`}
                    dx={-5}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }}
                    itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                    labelStyle={{ color: '#64748b', fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}
                    cursor={{ stroke: '#3b82f6', strokeWidth: 1 }}
                    formatter={(value: any, name: any) => {
                      const formattedVal = isIDR ? `Rp ${value.toLocaleString('id-ID')}` : `$${value.toLocaleString()}`;
                      const label = name === 'real_balance' ? 'Bot Asli' : 'Bot Simulasi';
                      return [formattedVal, label];
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="real_balance" 
                    stroke="#3b82f6" 
                    strokeWidth={2.5} 
                    dot={false}
                    activeDot={{ r: 6 }}
                    animationDuration={800}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sim_balance" 
                    stroke="#eab308" 
                    strokeWidth={2.5} 
                    dot={false}
                    activeDot={{ r: 6 }}
                    animationDuration={800}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Legend indicators */}
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-350">Akumulasi Panic Loss (Intervensi Emosi)</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-rose-600 text-white text-[8px] font-black uppercase tracking-widest rounded-[3px]">
                  EMOTION INDEX
                </span>
              </div>
            </div>

            {/* Line Chart for Panic Loss */}
            <div className="h-[240px] sm:h-[340px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={panicLossChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
                    tickFormatter={(val) => isIDR ? `Rp ${(val / 1000).toFixed(0)}K` : `$${val}`}
                    dx={-5}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }}
                    itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                    labelStyle={{ color: '#64748b', fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}
                    cursor={{ stroke: '#ef4444', strokeWidth: 1 }}
                    formatter={(value: any) => {
                      const formattedVal = isIDR ? `Rp ${value.toLocaleString('id-ID')}` : `$${value.toLocaleString()}`;
                      return [formattedVal, 'Panic Loss Kumulatif'];
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="panic_loss" 
                    stroke="#f43f5e" 
                    strokeWidth={2.5} 
                    dot={false}
                    activeDot={{ r: 6 }}
                    animationDuration={800}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>

      {/* 4. CONTROL BUTTONS BAR */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-2 w-full justify-start">
        <button 
          onClick={() => setShowAccounts(!showAccounts)}
          className="neumorphic-btn px-4 py-2 text-[8px] font-black uppercase tracking-widest text-[#f5f5f7] flex items-center gap-2"
        >
          {showAccounts ? <EyeOff size={12} strokeWidth={2.5} /> : <Eye size={12} strokeWidth={2.5} />}
          <span>{showAccounts ? t('overview.hide_accounts') : t('overview.show_accounts')}</span>
        </button>
        <button 
          onClick={() => setActiveView && setActiveView('strategi-pengaturan')}
          className="neumorphic-btn px-4 py-2 text-[8px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 flex items-center gap-2"
        >
          <Activity size={12} strokeWidth={2.5} />
          <span>{t('overview.setup_bot_strategy')}</span>
        </button>
      </div>

      {/* 5. STATS GRID */}
      {activeTab === 'bot-charts' ? (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-b border-white/10 divide-y md:divide-y-0 md:divide-x divide-white/10 bg-transparent">
          
          {/* Stat 1: Capital In Use */}
          <div className="py-4 px-4 flex flex-col justify-between bg-transparent min-h-[100px]">
            <div>
              <p className="text-slate-500 text-[8px] font-black uppercase tracking-widest mb-1">{t('overview.capital_in_use')}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-white tracking-tight">
                  {isIDR 
                    ? `Rp ${latestRealBalance.toLocaleString('id-ID')}`
                    : `$${latestRealBalance.toLocaleString()}`
                  }
                </span>
                <span className="text-[8px] font-black text-slate-400">
                  {`+${apiKeys.length} ${t('overview.accounts')}`}
                </span>
              </div>
            </div>
            <div className="mt-2 h-[1.5px] w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-2/3" />
            </div>
          </div>

          {/* Stat 2: Simulation Lab Balance */}
          <div className="py-4 px-4 flex flex-col justify-between bg-transparent min-h-[100px]">
            <div>
              <p className="text-slate-500 text-[8px] font-black uppercase tracking-widest mb-1">Saldo Lab Simulasi</p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-amber-400 tracking-tight">
                  {isIDR 
                    ? `Rp ${latestSimBalance.toLocaleString('id-ID')}`
                    : `$${latestSimBalance.toLocaleString()}`
                  }
                </span>
                <span className="text-[8px] font-black text-slate-400">
                  Simulasi
                </span>
              </div>
            </div>
            <div className="mt-2 h-[1.5px] w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 w-1/2" />
            </div>
          </div>

          {/* Stat 3: Bot Strategy */}
          <div 
            onClick={() => setIsStrategiesDrawerOpen(true)}
            className="py-4 px-4 flex flex-col justify-between bg-transparent min-h-[100px] md:col-span-2 lg:col-span-1 cursor-pointer hover:bg-white/[0.02] active:scale-[0.98] transition-all border border-transparent hover:border-white/5 rounded-xl group relative"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-slate-500 text-[8px] font-black uppercase tracking-widest">{t('overview.bot_strategy')}</p>
                <Info size={10} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-white tracking-tight">
                  {`${(data?.active_bots || 0) + (data?.inactive_bots || 0)} ${t('overview.total')}`}
                </span>
                <span className="text-[8px] font-black text-slate-400">
                  {`${data?.active_bots || 0} ${t('overview.active')} | ${data?.inactive_bots || 0} ${t('overview.off')}`}
                </span>
              </div>
            </div>
            
            <div className="mt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">{t('overview.trading_system_active')}</span>
            </div>
          </div>

        </div>
      ) : (
        <div className="w-full grid grid-cols-1 md:grid-cols-3 border-t border-b border-white/10 divide-y md:divide-y-0 md:divide-x divide-white/10 bg-transparent">
          
          {/* Stat 1: Total Emotional Exit */}
          <div className="py-4 px-4 flex flex-col justify-between bg-transparent min-h-[100px]">
            <div>
              <p className="text-rose-500 text-[8px] font-black uppercase tracking-widest mb-1">Total Intervensi Emosi</p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-white tracking-tight">
                  {emotionalStats.count} Kali
                </span>
                <span className="text-[8px] font-black text-rose-400">
                  Exit Manual
                </span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <AlertTriangle size={10} className="text-rose-500" />
              <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider">Memicu Penyimpangan Logika Bot</span>
            </div>
          </div>

          {/* Stat 2: Total Panic Loss */}
          <div className="py-4 px-4 flex flex-col justify-between bg-transparent min-h-[100px]">
            <div>
              <p className="text-rose-500 text-[8px] font-black uppercase tracking-widest mb-1">Total Panic Loss</p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-rose-500 tracking-tight">
                  {isIDR 
                    ? `Rp ${emotionalStats.panicLoss.toLocaleString('id-ID')}`
                    : `$${emotionalStats.panicLoss.toLocaleString()}`
                  }
                </span>
                <span className="text-[8px] font-black text-slate-400">
                  Kerugian Akibat Exit Lebih Awal
                </span>
              </div>
            </div>
            <div className="mt-2 h-[1.5px] w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 w-full animate-pulse" />
            </div>
          </div>

          {/* Stat 3: Avg Panic Loss */}
          <div className="py-4 px-4 flex flex-col justify-between bg-transparent min-h-[100px]">
            <div>
              <p className="text-rose-500 text-[8px] font-black uppercase tracking-widest mb-1">Rata-Rata Kerugian Emosi</p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-white tracking-tight">
                  {isIDR 
                    ? `Rp ${emotionalStats.avgPanicLoss.toLocaleString('id-ID')}`
                    : `$${emotionalStats.avgPanicLoss.toLocaleString()}`
                  }
                </span>
                <span className="text-[8px] font-black text-slate-400">
                  Per Intervensi
                </span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <Award size={10} className="text-emerald-400" />
              <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider">Mematuhi Bot Menurunkan Panic Loss</span>
            </div>
          </div>

        </div>
      )}

      {/* 6. CONNECTED ACCOUNTS LIST */}
      {showAccounts && (
        <div className="w-full border-b border-white/10 py-3 px-4 space-y-2 bg-transparent animate-in slide-in-from-top-2">
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{t('overview.connected_accounts_list')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {apiKeys.map((acc: any, i: number) => (
              <div key={i} className="flex justify-between items-center py-2 px-3 border border-white/5 bg-transparent rounded-[6px]">
                <div className="flex items-center gap-2">
                  <Wallet size={12} className="text-blue-400" />
                  <div>
                    <p className="text-[9px] font-bold text-white uppercase">{acc.label}</p>
                    <p className="text-[8px] text-slate-500 uppercase font-medium">{acc.platform_name}</p>
                  </div>
                </div>
                <p className="text-[9px] font-bold text-blue-400">
                  {isIDR ? 'Rp 10.000.000' : '$10,000'}
                </p>
              </div>
            ))}
          </div>
          {apiKeys.length === 0 && (
            <p className="text-[8px] text-slate-600 uppercase font-bold italic">{t('overview.no_api_keys')}</p>
          )}
        </div>
      )}

      {/* 7. EMOTIONAL EXIT / MANUAL INTERVENTION LOGS (ONLY SHOW IN TAB 2) */}
      {activeTab === 'progress-charts' && (
        <div className="w-full px-4 space-y-2.5 pb-6">
          <div className="flex items-center gap-2">
            <Sliders size={12} className="text-rose-500" />
            <h3 className="text-[10px] font-black tracking-widest text-white uppercase">Jurnal Intervensi Emosi / Exit Manual</h3>
          </div>
          <div className="w-full overflow-x-auto border border-white/5 rounded-[4px] bg-[#05060a]/40">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#090b11] text-[8px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Aset</th>
                  <th className="py-2.5 px-3">Strategi</th>
                  <th className="py-2.5 px-3">Aksi</th>
                  <th className="py-2.5 px-3 text-right">Panic Loss</th>
                  <th className="py-2.5 px-3">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[9px] text-slate-350">
                {filteredRealTrades.filter(t => t.is_manual_intervention).map((tr, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-3 text-slate-400">
                      {new Date(tr.created_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-white">{tr.pair}</td>
                    <td className="py-2.5 px-3">{tr.strategy_type}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-1 rounded-[3px] text-[7.5px] font-bold ${tr.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {tr.side}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-rose-400 font-bold">
                      {tr.intervention_pnl_diff 
                        ? (isIDR ? `Rp ${convertPnl(Math.abs(parseFloat(tr.intervention_pnl_diff))).toLocaleString('id-ID')}` : `$${Math.abs(parseFloat(tr.intervention_pnl_diff)).toFixed(2)}`)
                        : '0.00'
                      }
                    </td>
                    <td className="py-2.5 px-3 text-[8.5px] text-slate-400 font-sans max-w-[200px] truncate">{tr.notes || '-'}</td>
                  </tr>
                ))}
                {filteredRealTrades.filter(t => t.is_manual_intervention).length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500 font-sans italic">
                      Luar Biasa! Tidak ada catatan intervensi emosi dalam trade sheet Anda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {renderStrategiesDrawer()}
    </div>
  );
}
