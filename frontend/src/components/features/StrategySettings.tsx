"use client";

import { useEffect, useRef, useState } from 'react';
import { 
  TrendingUp, 
  Settings, 
  Target, 
  BarChart2, 
  Zap, 
  ShieldCheck, 
  ChevronRight,
  Save,
  Play,
  Info,
  Plus,
  Trash2,
  AlertTriangle,
  Clock,
  Globe,
  Layers
} from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '@/lang/LanguageContext';

declare global {
  interface Window {
    TradingView: any;
  }
}

const RUST_API = "http://139.59.122.230:8080/api";

export default function StrategySettings() {
  const { t } = useLanguage();
  const container = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const [activeBot, setActiveBot] = useState('dca_lite');
  const [interval, setIntervalState] = useState('60'); // Default 1H
  const [mounted, setMounted] = useState(false);
  const [availableData, setAvailableData] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  
  // UI States
  const [showSelector, setShowSelector] = useState(true);
  const [showDcaInfo, setShowDcaInfo] = useState(false);
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);
  const [showGridInfo, setShowGridInfo] = useState(false);
  const [showGridModeInfo, setShowGridModeInfo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<'core' | 'logic' | 'risk'>('core');

  // DCA States
  const [dcaNominal, setDcaNominal] = useState('1,000,000');
  const [dcaSafetyNominal, setDcaSafetyNominal] = useState('500,000');
  const [dcaIntervalValue, setDcaIntervalValue] = useState('30');
  const [dcaIntervalUnit, setDcaIntervalUnit] = useState('days');
  const [dcaTakeProfit, setDcaTakeProfit] = useState('1');
  const [dcaStopLoss, setDcaStopLoss] = useState('');
  const [dcaCoins, setDcaCoins] = useState(['BTCUSDT']);
  const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>([]);

  // Grid Bot States
  const [gridLowerPrice, setGridLowerPrice] = useState('');
  const [gridUpperPrice, setGridUpperPrice] = useState('');
  const [gridNumber, setGridNumber] = useState('10');
  const [gridMode, setGridMode] = useState<'arithmetic' | 'geometric'>('arithmetic');
  const [gridTriggerPrice, setGridTriggerPrice] = useState('');
  const [gridStopLoss, setGridStopLoss] = useState('');
  const [gridTakeProfit, setGridTakeProfit] = useState('');

  // Combo Bot States
  const [comboDirection, setComboDirection] = useState<'long' | 'short'>('long');
  const [comboMargin, setComboMargin] = useState('1,000,000');
  const [comboLeverage, setComboLeverage] = useState('1');
  const [comboMarginMode, setComboMarginMode] = useState<'cross' | 'isolated'>('cross');
  const [comboLowPrice, setComboLowPrice] = useState('');
  const [comboHighPrice, setComboHighPrice] = useState('');
  const [comboGridLevels, setComboGridLevels] = useState('5');
  const [comboDcaOrders, setComboDcaOrders] = useState('3');
  const [comboGridStep, setComboGridStep] = useState('1');
  const [comboDcaStep, setComboDcaStep] = useState('2');
  const [comboTp, setComboTp] = useState('1');
  const [comboSl, setComboSl] = useState('5');

  // Trailing Bot States
  const [trailingTp, setTrailingTp] = useState('10');
  const [trailingSlType, setTrailingSlType] = useState<'price' | 'percentage'>('percentage');
  const [trailingSlValue, setTrailingSlValue] = useState('2');
  const [trailingEnabled, setTrailingEnabled] = useState(false);
  const [trailingPercent, setTrailingPercent] = useState('0.5');

  const initWidget = (symbol: string, currentInterval: string) => {
    if (container.current && window.TradingView) {
      container.current.innerHTML = "";
      widgetRef.current = new window.TradingView.widget({
        "autosize": true,
        "symbol": symbol.includes(":") ? symbol : `BINANCE:${symbol}`,
        "interval": currentInterval,
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "toolbar_bg": "#020408",
        "enable_publishing": false,
        "hide_top_toolbar": false,
        "save_image": false,
        "container_id": "tv_chart_container",
        "backgroundColor": "#05070a",
        "gridColor": "rgba(255, 255, 255, 0.03)",
      });
    }
  };

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [dataRes, keysRes] = await Promise.all([
          axios.get(`${RUST_API}/available-data`),
          axios.get(`${RUST_API}/api-keys`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        setAvailableData(dataRes.data);
        setApiKeys(keysRes.data);
      } catch (err) {
        console.error("Failed to fetch data", err);
      }
    };
    fetchData();

    if (!window.TradingView) {
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/tv.js";
      script.type = "text/javascript";
      script.async = true;
      script.onload = () => initWidget(dcaCoins[0] || "BTCUSDT", interval);
      document.head.appendChild(script);
    } else {
      initWidget(dcaCoins[0] || "BTCUSDT", interval);
    }
  }, [interval, dcaCoins[0]]);

  if (!mounted) return null;

  const addCoin = () => setDcaCoins([...dcaCoins, availableData[0]?.symbol || 'BTCUSDT']);
  const removeCoin = (index: number) => setDcaCoins(dcaCoins.filter((_, i) => i !== index));
  const updateCoin = (index: number, val: string) => {
    const newCoins = [...dcaCoins];
    newCoins[index] = val;
    setDcaCoins(newCoins);
  };

  const togglePlatform = (id: number) => {
    if (selectedPlatforms.includes(id)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== id));
    } else {
      setSelectedPlatforms([...selectedPlatforms, id]);
    }
  };

  const applyQuickSetup = (type: 'short' | 'long') => {
    if (type === 'short') {
      // Aggressive / Scalping
      setDcaTakeProfit('1.0');
      setDcaIntervalValue('15');
      setDcaIntervalUnit('minutes');
      setDcaNominal('500,000');
      setDcaSafetyNominal('500,000');
      
      setGridNumber('40');
      setGridMode('arithmetic');
      
      setComboTp('0.8');
      setComboLeverage('20');
      
      setTrailingTp('0.5');
      setTrailingEnabled(true);
      setTrailingPercent('0.2');
    } else {
      // Conservative / Investment
      setDcaTakeProfit('5.0');
      setDcaIntervalValue('4');
      setDcaIntervalUnit('hours');
      setDcaNominal('2,000,000');
      setDcaSafetyNominal('1,000,000');
      
      setGridNumber('10');
      setGridMode('geometric');
      
      setComboTp('5.0');
      setComboLeverage('3');
      
      setTrailingTp('3.0');
      setTrailingEnabled(true);
      setTrailingPercent('1.0');
    }
    alert(`Applied ${type === 'short' ? 'Short-Term (Aggressive)' : 'Long-Term (Conservative)'} presets successfully.`);
  };

  const handleSaveStrategy = async () => {
    setSaving(true);
    const token = localStorage.getItem('token');
    try {
      let settings: any = {
        coins: dcaCoins,
        platforms: selectedPlatforms
      };

      if (activeBot.startsWith('dca')) {
        settings = {
          ...settings,
          nominal: dcaNominal,
          safety_nominal: dcaSafetyNominal,
          interval_value: dcaIntervalValue,
          interval_unit: dcaIntervalUnit,
          take_profit: dcaTakeProfit,
          stop_loss: dcaStopLoss,
          trailing_stop: trailingEnabled ? trailingPercent : null,
        };
      } else if (activeBot === 'grid_lite') {
        settings = {
          ...settings,
          lower_price: gridLowerPrice,
          upper_price: gridUpperPrice,
          grid_number: gridNumber,
          grid_mode: gridMode,
          trigger_price: gridTriggerPrice,
          stop_loss: gridStopLoss,
          take_profit: gridTakeProfit,
        };
      } else if (activeBot === 'combo_lite') {
        settings = {
          ...settings,
          direction: comboDirection,
          margin: comboMargin,
          leverage: comboLeverage,
          margin_mode: comboMarginMode,
          low_price: comboLowPrice,
          high_price: comboHighPrice,
          grid_levels: comboGridLevels,
          dca_orders: comboDcaOrders,
          grid_step: comboGridStep,
          dca_step: comboDcaStep,
          take_profit: comboTp,
          stop_loss: comboSl,
        };
      } else if (activeBot === 'trailing_lite') {
        settings = {
          ...settings,
          take_profit: trailingTp,
          sl_type: trailingSlType,
          sl_value: trailingSlValue,
          trailing_enabled: trailingEnabled,
        };
      }

      await axios.post(`${RUST_API}/strategies/save`, {
        name: `${activeBot.toUpperCase()} ${dcaCoins[0]} - ${new Date().toLocaleDateString()}`,
        bot_type: activeBot,
        pair: dcaCoins[0],
        settings: settings
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert(t('common.success'));
      setShowSettingsPopup(false);
    } catch (err) {
      alert(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const SettingsContent = () => (
    <div className="space-y-3.5 pb-6 w-full">
      {/* Tab Switcher - Strategy Bots select directly as Tab Buttons */}
      <div className="grid grid-cols-5 gap-1 bg-[#040508] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.8),inset_-2px_-2px_5px_rgba(255,255,255,0.01)] border border-white/5 p-1 rounded-[4px] mx-3 mt-3 mb-1">
        <button 
          onClick={() => setActiveBot('dca_lite')}
          className={`py-1.5 text-[8.5px] font-black uppercase tracking-wider transition-all rounded-[3px] flex flex-col items-center justify-center gap-1 cursor-pointer ${
            activeBot === 'dca_lite' 
              ? 'bg-gradient-to-br from-[#1e2942] to-[#0f172a] text-blue-400 shadow-[3px_3px_7px_rgba(0,0,0,0.6),-2px_-2px_5px_rgba(255,255,255,0.01)] border border-blue-500/35 scale-[1.02]' 
              : 'text-slate-405 hover:text-white hover:bg-white/[0.01]'
          }`}
        >
          <Target size={10} className={activeBot === 'dca_lite' ? 'text-blue-455' : 'text-slate-500'} />
          <span className="hidden sm:inline-block">DCA Lite</span>
          <span className="sm:hidden">DCA</span>
        </button>
        <button 
          onClick={() => setActiveBot('dca_pro')}
          className={`py-1.5 text-[8.5px] font-black uppercase tracking-wider transition-all rounded-[3px] flex flex-col items-center justify-center gap-1 cursor-pointer ${
            activeBot === 'dca_pro' 
              ? 'bg-gradient-to-br from-[#1e2942] to-[#0f172a] text-blue-400 shadow-[3px_3px_7px_rgba(0,0,0,0.6),-2px_-2px_5px_rgba(255,255,255,0.01)] border border-blue-500/35 scale-[1.02]' 
              : 'text-slate-405 hover:text-white hover:bg-white/[0.01]'
          }`}
        >
          <Zap size={10} className={activeBot === 'dca_pro' ? 'text-blue-455' : 'text-slate-500'} />
          <span className="hidden sm:inline-block">Smart DCA</span>
          <span className="sm:hidden">Smart</span>
        </button>
        <button 
          onClick={() => setActiveBot('grid_lite')}
          className={`py-1.5 text-[8.5px] font-black uppercase tracking-wider transition-all rounded-[3px] flex flex-col items-center justify-center gap-1 cursor-pointer ${
            activeBot === 'grid_lite' 
              ? 'bg-gradient-to-br from-[#1e2942] to-[#0f172a] text-blue-400 shadow-[3px_3px_7px_rgba(0,0,0,0.6),-2px_-2px_5px_rgba(255,255,255,0.01)] border border-blue-500/35 scale-[1.02]' 
              : 'text-slate-405 hover:text-white hover:bg-white/[0.01]'
          }`}
        >
          <BarChart2 size={10} className={activeBot === 'grid_lite' ? 'text-blue-455' : 'text-slate-500'} />
          <span className="hidden sm:inline-block">Grid Master</span>
          <span className="sm:hidden">Grid</span>
        </button>
        <button 
          onClick={() => setActiveBot('combo_lite')}
          className={`py-1.5 text-[8.5px] font-black uppercase tracking-wider transition-all rounded-[3px] flex flex-col items-center justify-center gap-1 cursor-pointer ${
            activeBot === 'combo_lite' 
              ? 'bg-gradient-to-br from-[#1e2942] to-[#0f172a] text-blue-400 shadow-[3px_3px_7px_rgba(0,0,0,0.6),-2px_-2px_5px_rgba(255,255,255,0.01)] border border-blue-500/35 scale-[1.02]' 
              : 'text-slate-405 hover:text-white hover:bg-white/[0.01]'
          }`}
        >
          <Layers size={10} className={activeBot === 'combo_lite' ? 'text-blue-455' : 'text-slate-500'} />
          <span className="hidden sm:inline-block">Hybrid</span>
          <span className="sm:hidden">Combo</span>
        </button>
        <button 
          onClick={() => setActiveBot('trailing_lite')}
          className={`py-1.5 text-[8.5px] font-black uppercase tracking-wider transition-all rounded-[3px] flex flex-col items-center justify-center gap-1 cursor-pointer ${
            activeBot === 'trailing_lite' 
              ? 'bg-gradient-to-br from-[#1e2942] to-[#0f172a] text-blue-400 shadow-[3px_3px_7px_rgba(0,0,0,0.6),-2px_-2px_5px_rgba(255,255,255,0.01)] border border-blue-500/35 scale-[1.02]' 
              : 'text-slate-405 hover:text-white hover:bg-white/[0.01]'
          }`}
        >
          <ShieldCheck size={10} className={activeBot === 'trailing_lite' ? 'text-blue-455' : 'text-slate-500'} />
          <span className="hidden sm:inline-block">Trailing</span>
          <span className="sm:hidden">Trail</span>
        </button>
      </div>

      <div className="px-4 space-y-3.5 animate-in fade-in duration-300">
        {/* Portfolio Assets Section */}
        <div className="space-y-2 pb-2.5 border-b border-white/5">
          <div className="flex justify-between items-center">
            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{t('strategy.portfolio_assets')}</label>
            <button 
              onClick={addCoin} 
              className="flex items-center gap-1 text-[8.5px] font-black uppercase tracking-wider text-blue-400 hover:text-blue-350 transition-all bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-[4px] cursor-pointer active:scale-[0.98]"
            >
              <Plus size={8} /> {t('strategy.add_asset')}
            </button>
          </div>
          <div className="space-y-1.5">
            {dcaCoins.map((coin, idx) => (
              <div key={idx} className="flex gap-1.5 group/item">
                <div className="flex-1 relative">
                  <select 
                    value={coin} 
                    onChange={(e) => updateCoin(idx, e.target.value)}
                    className="premium-input !bg-[#07090e]/60 !appearance-none cursor-pointer border border-white/5 hover:border-blue-500/30 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 transition-all font-bold text-[11px] tracking-tight rounded-[4px] !py-1.5 !px-2.5"
                  >
                    {availableData.length > 0 ? availableData.map(d => (
                      <option key={d.symbol} value={d.symbol} className="bg-[#0a0c14]">{d.symbol}</option>
                    )) : (
                      <option value="BTCUSDT">BTCUSDT</option>
                    )}
                  </select>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <ChevronRight size={10} className="rotate-90" />
                  </div>
                </div>
                {dcaCoins.length > 1 && (
                  <button 
                    onClick={() => removeCoin(idx)} 
                    className="p-1.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all rounded-[4px] cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Controls based on selected Active Bot Strategy */}
        <div className="space-y-3.5">
          {activeBot.startsWith('dca') ? (
            <div className="space-y-3.5 animate-in fade-in duration-300">
              {/* Presets */}
              <div className="flex items-center gap-1.5 border-b border-white/5 pb-2.5">
                <button 
                  onClick={() => applyQuickSetup('short')}
                  className="flex-1 py-1.5 bg-[#0b0e14] border border-blue-500/15 text-blue-400 text-[8.5px] font-black uppercase tracking-wider transition-all rounded-[4px] cursor-pointer shadow-[3px_3px_7px_rgba(0,0,0,0.6),-3px_-3px_7px_rgba(255,255,255,0.01)] hover:bg-[#0e121b] hover:border-blue-500/30 hover:shadow-[4px_4px_10px_rgba(0,0,0,0.7),-4px_-4px_10px_rgba(255,255,255,0.02)] active:scale-[0.98] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.7)]"
                >
                  Scalping Presets
                </button>
                <button 
                  onClick={() => applyQuickSetup('long')}
                  className="flex-1 py-1.5 bg-[#0b0e14] border border-emerald-500/15 text-emerald-400 text-[8.5px] font-black uppercase tracking-wider transition-all rounded-[4px] cursor-pointer shadow-[3px_3px_7px_rgba(0,0,0,0.6),-3px_-3px_7px_rgba(255,255,255,0.01)] hover:bg-[#0e121b] hover:border-emerald-500/30 hover:shadow-[4px_4px_10px_rgba(0,0,0,0.7),-4px_-4px_10px_rgba(255,255,255,0.02)] active:scale-[0.98] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.7)]"
                >
                  Investor Presets
                </button>
              </div>

              {/* DCA Fields */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-0.5">{t('strategy.fixed_nominal')}</label>
                  <div className="relative group">
                    <input 
                      type="text" 
                      value={dcaNominal}
                      onChange={(e) => setDcaNominal(e.target.value)}
                      className="premium-input !bg-[#07090e]/60 text-emerald-450 border border-white/5 hover:border-emerald-500/20 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 font-bold text-[11px] transition-all rounded-[4px] !py-1.5 !px-2.5" 
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-500">IDR</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-0.5">{t('strategy.safety_order')}</label>
                    <button 
                      onClick={() => setShowDcaInfo(true)}
                      className="w-3 h-3 rounded-full bg-blue-700/20 text-blue-400 flex items-center justify-center text-[8px] font-bold hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                    >!</button>
                  </div>
                  <div className="relative group">
                    <input 
                      type="text" 
                      value={dcaSafetyNominal}
                      onChange={(e) => setDcaSafetyNominal(e.target.value)}
                      className="premium-input !bg-[#07090e]/60 text-blue-450 border border-white/5 hover:border-blue-700/20 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 font-bold text-[11px] transition-all rounded-[4px] !py-1.5 !px-2.5" 
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-500">IDR</span>
                  </div>
                </div>
              </div>

              {/* Time Interval - Small numbers, grid row */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
                <div className="space-y-1 xl:col-span-2">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-0.5">{t('strategy.time_interval')}</label>
                  <div className="flex gap-1.5">
                    <input 
                      type="number" 
                      value={dcaIntervalValue}
                      onChange={(e) => setDcaIntervalValue(e.target.value)}
                      className="premium-input !bg-[#07090e]/60 border border-white/5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 font-bold text-[11px] transition-all flex-1 rounded-[4px] !py-1.5 !px-2.5" 
                    />
                    <select 
                      value={dcaIntervalUnit}
                      onChange={(e) => setDcaIntervalUnit(e.target.value)}
                      className="premium-input !bg-[#07090e]/60 border border-white/5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 !w-24 font-bold text-[9px] uppercase rounded-[4px] !py-1.5 !px-2.5 cursor-pointer"
                    >
                      <option value="minutes" className="bg-[#0a0c14]">{t('common.minutes')}</option>
                      <option value="hours" className="bg-[#0a0c14]">{t('common.hours')}</option>
                      <option value="days" className="bg-[#0a0c14]">{t('common.days')}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Target TP & SL - Small numbers, grid columns */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-0.5">{t('strategy.target_tp')}</label>
                  <div className="relative group">
                    <input 
                      type="number" 
                      value={dcaTakeProfit}
                      onChange={(e) => setDcaTakeProfit(e.target.value)}
                      className="premium-input !bg-[#07090e]/60 text-emerald-450 border border-white/5 hover:border-emerald-500/20 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 font-bold text-[11px] transition-all rounded-[4px] !py-1.5 !px-2.5" 
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-500">%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-0.5">{t('strategy.stop_loss')}</label>
                  <div className="relative group">
                    <input 
                      type="number" 
                      value={dcaStopLoss}
                      onChange={(e) => setDcaStopLoss(e.target.value)}
                      className="premium-input !bg-[#07090e]/60 text-rose-450 border border-white/5 hover:border-rose-500/20 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/10 font-bold text-[11px] transition-all rounded-[4px] !py-1.5 !px-2.5" 
                      placeholder="0"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-500">%</span>
                  </div>
                </div>
              </div>

              {/* Trailing Stop for Smart DCA */}
              {activeBot === 'dca_pro' && (
                <div className="p-2.5 border border-white/5 bg-[#07090e]/40 flex justify-between items-center rounded-[4px] hover:border-white/10 transition-all shadow-inner">
                  <div>
                    <p className="text-[9px] font-bold text-white uppercase tracking-wider">Trailing Profit</p>
                    <p className="text-[8px] text-slate-500 uppercase font-medium mt-0.5">Pursue maximum momentum</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {trailingEnabled && (
                      <div className="relative w-14">
                        <input 
                          type="number" 
                          value={trailingPercent}
                          onChange={(e) => setTrailingPercent(e.target.value)}
                          className="premium-input !bg-[#05060b] !py-1 !px-1.5 text-emerald-455 text-[9.5px] font-bold text-center rounded-[4px] border border-white/10"
                        />
                        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[7px] font-bold text-slate-500">%</span>
                      </div>
                    )}
                    <button 
                      onClick={() => setTrailingEnabled(!trailingEnabled)}
                      className={`w-7 h-4 relative transition-all duration-300 border rounded-full cursor-pointer ${trailingEnabled ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-white/5 border-white/10'}`}
                    >
                      <div className={`absolute top-0.5 w-2.5 h-2.5 transition-all duration-300 rounded-full ${trailingEnabled ? 'left-3.5 bg-emerald-500 shadow-md' : 'left-0.5 bg-slate-500'}`}></div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : activeBot === 'grid_lite' ? (
            <div className="space-y-3.5 animate-in fade-in duration-300">
              {/* Lower and Upper */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{t('grid.price_range')}</label>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <p className="text-[8px] font-bold uppercase text-slate-500 px-0.5">{t('grid.lower_price')}</p>
                    <input 
                      type="number" 
                      value={gridLowerPrice}
                      onChange={(e) => setGridLowerPrice(e.target.value)}
                      className="premium-input !bg-[#07090e]/60 !py-1.5 !px-2.5 font-bold text-[11px] border border-white/5 rounded-[4px] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 transition-all" 
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-bold uppercase text-slate-500 px-0.5">{t('grid.upper_price')}</p>
                    <input 
                      type="number" 
                      value={gridUpperPrice}
                      onChange={(e) => setGridUpperPrice(e.target.value)}
                      className="premium-input !bg-[#07090e]/60 !py-1.5 !px-2.5 font-bold text-[11px] border border-white/5 rounded-[4px] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 transition-all" 
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Grid Number and Mode */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-0.5">{t('grid.grid_number')}</label>
                  <input 
                    type="number" 
                    value={gridNumber}
                    onChange={(e) => setGridNumber(e.target.value)}
                    className="premium-input !bg-[#07090e]/60 font-bold text-[11px] border border-white/5 rounded-[4px] !py-1.5 !px-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 transition-all" 
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-0.5">{t('grid.grid_mode')}</label>
                    <button 
                      onClick={() => setShowGridModeInfo(true)}
                      className="w-3 h-3 rounded-full bg-blue-700/20 text-blue-400 flex items-center justify-center text-[8px] font-bold hover:bg-blue-700 hover:text-white transition-all cursor-pointer"
                    >!</button>
                  </div>
                  <div className="flex bg-[#040508] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.8)] border border-white/5 p-0.5 h-[28px] rounded-[4px]">
                    <button 
                      onClick={() => setGridMode('arithmetic')}
                      className={`flex-1 text-[8.5px] font-bold uppercase tracking-wider transition-all rounded-[3px] cursor-pointer ${
                        gridMode === 'arithmetic' 
                          ? 'bg-gradient-to-br from-[#1e2942] to-[#0f172a] text-blue-400 shadow-[2px_2px_5px_rgba(0,0,0,0.6),-2px_-2px_5px_rgba(255,255,255,0.01)] border border-blue-500/25' 
                          : 'text-slate-550 hover:text-white hover:bg-white/[0.01]'
                      }`}
                    >
                      {t('grid.arithmetic')}
                    </button>
                    <button 
                      onClick={() => setGridMode('geometric')}
                      className={`flex-1 text-[8.5px] font-bold uppercase tracking-wider transition-all rounded-[3px] cursor-pointer ${
                        gridMode === 'geometric' 
                          ? 'bg-gradient-to-br from-[#1e2942] to-[#0f172a] text-blue-400 shadow-[2px_2px_5px_rgba(0,0,0,0.6),-2px_-2px_5px_rgba(255,255,255,0.01)] border border-blue-500/25' 
                          : 'text-slate-550 hover:text-white hover:bg-white/[0.01]'
                      }`}
                    >
                      {t('grid.geometric')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid Trigger, Stop & TP */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-0.5">{t('grid.trigger_price')}</label>
                <input 
                  type="number" 
                  value={gridTriggerPrice}
                  onChange={(e) => setGridTriggerPrice(e.target.value)}
                  className="premium-input !bg-[#07090e]/60 !py-1.5 !px-2.5 font-bold text-[11px] border border-white/5 rounded-[4px] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 transition-all" 
                  placeholder="Optional Grid Trigger Price"
                />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <p className="text-[8px] font-bold uppercase text-slate-500 px-0.5">{t('strategy.stop_loss')}</p>
                  <input 
                    type="number" 
                    value={gridStopLoss}
                    onChange={(e) => setGridStopLoss(e.target.value)}
                    className="premium-input !bg-[#07090e]/60 !py-1.5 !px-2.5 font-bold text-[11px] border border-white/5 text-rose-455 rounded-[4px] focus:border-rose-500 focus:ring-1 focus:ring-rose-500/10 transition-all" 
                    placeholder="Price SL"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-bold uppercase text-slate-500 px-0.5">{t('strategy.target_tp')}</p>
                  <input 
                    type="number" 
                    value={gridTakeProfit}
                    onChange={(e) => setGridTakeProfit(e.target.value)}
                    className="premium-input !bg-[#07090e]/60 !py-1.5 !px-2.5 font-bold text-[11px] border border-white/5 text-emerald-450 rounded-[4px] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 transition-all" 
                    placeholder="Price TP"
                  />
                </div>
              </div>

              {/* Estimate Cap */}
              <div className="p-2.5 border border-white/5 bg-gradient-to-br from-blue-950/10 via-[#07090e]/40 to-transparent space-y-0.5 rounded-[4px] shadow-inner">
                <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">{t('grid.min_capital')}</p>
                <div className="flex justify-between items-end">
                  <h4 className="text-md font-bold text-emerald-400 tracking-tight">
                    Rp {(parseInt(gridNumber) * 150000).toLocaleString('id-ID')}
                  </h4>
                  <p className="text-[7.5px] text-slate-500 font-bold uppercase italic">*Est. 10 USDT / Grid</p>
                </div>
              </div>
            </div>
          ) : activeBot === 'combo_lite' ? (
            <div className="space-y-3.5 animate-in fade-in duration-300">
              {/* Direction & Mode */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-0.5">{t('combo.direction')}</label>
                  <div className="flex bg-[#040508] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.8)] border border-white/5 p-0.5 h-[28px] rounded-[4px]">
                    <button 
                      onClick={() => setComboDirection('long')}
                      className={`flex-1 text-[8.5px] font-bold uppercase tracking-wider transition-all rounded-[3px] cursor-pointer ${
                        comboDirection === 'long' 
                          ? 'bg-gradient-to-br from-[#1b3d2b] to-[#0d2417] text-emerald-400 shadow-[2px_2px_5px_rgba(0,0,0,0.6),-2px_-2px_5px_rgba(255,255,255,0.01)] border border-emerald-500/25' 
                          : 'text-slate-550 hover:text-white hover:bg-white/[0.01]'
                      }`}
                    >
                      {t('combo.long')}
                    </button>
                    <button 
                      onClick={() => setComboDirection('short')}
                      className={`flex-1 text-[8.5px] font-bold uppercase tracking-wider transition-all rounded-[3px] cursor-pointer ${
                        comboDirection === 'short' 
                          ? 'bg-gradient-to-br from-[#3d1b24] to-[#240d13] text-rose-405 shadow-[2px_2px_5px_rgba(0,0,0,0.6),-2px_-2px_5px_rgba(255,255,255,0.01)] border border-rose-500/25' 
                          : 'text-slate-550 hover:text-white hover:bg-white/[0.01]'
                      }`}
                    >
                      {t('combo.short')}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-0.5">{t('combo.margin_mode')}</label>
                  <div className="flex bg-[#040508] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.8)] border border-white/5 p-0.5 h-[28px] rounded-[4px]">
                    <button 
                      onClick={() => setComboMarginMode('cross')}
                      className={`flex-1 text-[8.5px] font-bold uppercase tracking-wider transition-all rounded-[3px] cursor-pointer ${
                        comboMarginMode === 'cross' 
                          ? 'bg-gradient-to-br from-[#1e2942] to-[#0f172a] text-blue-400 shadow-[2px_2px_5px_rgba(0,0,0,0.6),-2px_-2px_5px_rgba(255,255,255,0.01)] border border-blue-500/25' 
                          : 'text-slate-550 hover:text-white hover:bg-white/[0.01]'
                      }`}
                    >
                      {t('combo.cross')}
                    </button>
                    <button 
                      onClick={() => setComboMarginMode('isolated')}
                      className={`flex-1 text-[8.5px] font-bold uppercase tracking-wider transition-all rounded-[3px] cursor-pointer ${
                        comboMarginMode === 'isolated' 
                          ? 'bg-gradient-to-br from-[#1e2942] to-[#0f172a] text-blue-400 shadow-[2px_2px_5px_rgba(0,0,0,0.6),-2px_-2px_5px_rgba(255,255,255,0.01)] border border-blue-500/25' 
                          : 'text-slate-550 hover:text-white hover:bg-white/[0.01]'
                      }`}
                    >
                      {t('combo.isolated')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Margin & Leverage */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-0.5">{t('combo.initial_margin')}</label>
                  <div className="relative group">
                    <input 
                      type="text" 
                      value={comboMargin}
                      onChange={(e) => setComboMargin(e.target.value)}
                      className="premium-input !bg-[#07090e]/60 text-emerald-455 border border-white/5 hover:border-emerald-500/20 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 font-bold text-[11px] transition-all rounded-[4px] !py-1.5 !px-2.5" 
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-500">IDR</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-0.5">{t('combo.leverage')}</label>
                  <select 
                    value={comboLeverage}
                    onChange={(e) => setComboLeverage(e.target.value)}
                    className="premium-input !bg-[#07090e]/60 border border-white/5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 font-bold text-[11px] transition-all rounded-[4px] !py-1.5 !px-2.5 cursor-pointer"
                  >
                    {[1, 2, 3, 5, 10, 20, 50, 100].map(l => (
                      <option key={l} value={l} className="bg-[#0a0c14]">{l}x</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price Bounds */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <p className="text-[8px] font-bold uppercase text-slate-500 px-0.5">{t('grid.lower_price')}</p>
                  <input 
                    type="number" 
                    value={comboLowPrice}
                    onChange={(e) => setComboLowPrice(e.target.value)}
                    className="premium-input !bg-[#07090e]/60 !py-1.5 !px-2.5 font-bold text-[11px] border border-white/5 rounded-[4px] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 transition-all" 
                    placeholder="Price"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-bold uppercase text-slate-500 px-0.5">{t('grid.upper_price')}</p>
                  <input 
                    type="number" 
                    value={comboHighPrice}
                    onChange={(e) => setComboHighPrice(e.target.value)}
                    className="premium-input !bg-[#07090e]/60 !py-1.5 !px-2.5 font-bold text-[11px] border border-white/5 rounded-[4px] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 transition-all" 
                    placeholder="Price"
                  />
                </div>
              </div>

              {/* Grid Levels & DCA Orders */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <p className="text-[8px] font-bold uppercase text-slate-500 px-0.5">{t('combo.grid_levels')}</p>
                  <input 
                    type="number" 
                    value={comboGridLevels}
                    onChange={(e) => setComboGridLevels(e.target.value)}
                    className="premium-input !bg-[#07090e]/60 !py-1.5 !px-2.5 font-bold text-[11px] border border-white/5 rounded-[4px] focus:border-blue-500" 
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-bold uppercase text-slate-500 px-0.5">{t('combo.dca_orders')}</p>
                  <input 
                    type="number" 
                    value={comboDcaOrders}
                    onChange={(e) => setComboDcaOrders(e.target.value)}
                    className="premium-input !bg-[#07090e]/60 !py-1.5 !px-2.5 font-bold text-[11px] border border-white/5 rounded-[4px] focus:border-blue-500" 
                  />
                </div>
              </div>

              {/* Grid Step & DCA Step */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <p className="text-[8px] font-bold uppercase text-slate-500 px-0.5">{t('combo.grid_step')}</p>
                  <input 
                    type="number" 
                    value={comboGridStep}
                    onChange={(e) => setComboGridStep(e.target.value)}
                    className="premium-input !bg-[#07090e]/60 !py-1.5 !px-2.5 font-bold text-[11px] border border-white/5 rounded-[4px] focus:border-blue-500" 
                    placeholder="%"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-bold uppercase text-slate-500 px-0.5">{t('combo.dca_step')}</p>
                  <input 
                    type="number" 
                    value={comboDcaStep}
                    onChange={(e) => setComboDcaStep(e.target.value)}
                    className="premium-input !bg-[#07090e]/60 !py-1.5 !px-2.5 font-bold text-[11px] border border-white/5 rounded-[4px] focus:border-blue-500" 
                    placeholder="%"
                  />
                </div>
              </div>

              {/* Target TP & Stop Loss */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-0.5">{t('strategy.target_tp')}</label>
                  <div className="relative group">
                    <input 
                      type="number" 
                      value={comboTp}
                      onChange={(e) => setComboTp(e.target.value)}
                      className="premium-input !bg-[#07090e]/60 text-emerald-450 border border-white/5 hover:border-emerald-500/20 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 font-bold text-[11px] transition-all rounded-[4px] !py-1.5 !px-2.5" 
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-500">%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-0.5">{t('strategy.stop_loss')}</label>
                  <div className="relative group">
                    <input 
                      type="number" 
                      value={comboSl}
                      onChange={(e) => setComboSl(e.target.value)}
                      className="premium-input !bg-[#07090e]/60 text-rose-450 border border-white/5 hover:border-rose-500/20 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/10 font-bold text-[11px] transition-all rounded-[4px] !py-1.5 !px-2.5" 
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-500">%</span>
                  </div>
                </div>
              </div>
            </div>
          ) : activeBot === 'trailing_lite' ? (
            <div className="space-y-3.5 animate-in fade-in duration-300">
              {/* Trailing TP & SL Type */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-0.5">{t('strategy.target_tp')}</label>
                  <div className="relative group">
                    <input 
                      type="number" 
                      value={trailingTp}
                      onChange={(e) => setTrailingTp(e.target.value)}
                      className="premium-input !bg-[#07090e]/60 text-emerald-450 border border-white/5 hover:border-emerald-500/20 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 font-bold text-[11px] transition-all rounded-[4px] !py-1.5 !px-2.5" 
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-500">%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-0.5">{t('strategy.stop_loss')}</label>
                  <div className="flex bg-[#040508] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.8)] border border-white/5 p-0.5 h-[28px] rounded-[4px]">
                    <button 
                      onClick={() => setTrailingSlType('price')}
                      className={`flex-1 text-[8.5px] font-bold uppercase tracking-wider transition-all rounded-[3px] cursor-pointer ${
                        trailingSlType === 'price' 
                          ? 'bg-gradient-to-br from-[#1e2942] to-[#0f172a] text-blue-400 shadow-[2px_2px_5px_rgba(0,0,0,0.6),-2px_-2px_5px_rgba(255,255,255,0.01)] border border-blue-500/25' 
                          : 'text-slate-555 hover:text-white hover:bg-white/[0.01]'
                      }`}
                    >
                      {t('trailing.price')}
                    </button>
                    <button 
                      onClick={() => setTrailingSlType('percentage')}
                      className={`flex-1 text-[8.5px] font-bold uppercase tracking-wider transition-all rounded-[3px] cursor-pointer ${
                        trailingSlType === 'percentage' 
                          ? 'bg-gradient-to-br from-[#1e2942] to-[#0f172a] text-blue-400 shadow-[2px_2px_5px_rgba(0,0,0,0.6),-2px_-2px_5px_rgba(255,255,255,0.01)] border border-blue-500/25' 
                          : 'text-slate-555 hover:text-white hover:bg-white/[0.01]'
                      }`}
                    >
                      {t('trailing.percentage')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Stop Loss Value */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-0.5">SL Value</label>
                <div className="relative group">
                  <input 
                    type="number" 
                    value={trailingSlValue}
                    onChange={(e) => setTrailingSlValue(e.target.value)}
                    className="premium-input !bg-[#07090e]/60 text-rose-455 border border-white/5 hover:border-rose-500/20 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/10 transition-all rounded-[4px] !py-1.5 !px-2.5" 
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-500">
                    {trailingSlType === 'price' ? 'USD' : '%'}
                  </span>
                </div>
              </div>

              {/* Trailing Active Toggle */}
              <div className="p-2.5 border border-white/5 bg-[#07090e]/40 flex justify-between items-center rounded-[4px] hover:border-white/10 transition-all shadow-inner">
                <div>
                  <p className="text-[9px] font-bold text-white uppercase tracking-wider">{t('trailing.trailing_sl')}</p>
                  <p className="text-[8px] text-slate-500 uppercase font-medium mt-0.5">Secure highest dynamic trail</p>
                </div>
                <button 
                  onClick={() => setTrailingEnabled(!trailingEnabled)}
                  className={`w-7 h-4 relative transition-all duration-300 border rounded-full cursor-pointer ${trailingEnabled ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-white/5 border-white/10'}`}
                >
                  <div className={`absolute top-0.5 w-2.5 h-2.5 transition-all duration-300 rounded-full ${trailingEnabled ? 'left-3.5 bg-emerald-500 shadow-md' : 'left-0.5 bg-slate-500'}`}></div>
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Platform Selector */}
        <div className="space-y-1.5 pt-2.5 border-t border-white/5">
          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-0.5">{t('strategy.select_platform')}</label>
          <div className="grid grid-cols-1 gap-1.5">
            {apiKeys.length > 0 ? apiKeys.map(key => (
              <button 
                key={key.id}
                onClick={() => togglePlatform(key.id)}
                className={`py-1.5 px-2.5 border flex justify-between items-center transition-all rounded-[4px] cursor-pointer shadow-[3px_3px_6px_rgba(0,0,0,0.5),-3px_-3px_6px_rgba(255,255,255,0.01)] hover:bg-[#0d1017] hover:border-white/15 active:scale-[0.98] ${
                  selectedPlatforms.includes(key.id) 
                    ? 'bg-gradient-to-br from-[#101625] to-[#090b10] border-blue-500/50 text-white shadow-[inset_2px_2px_5px_rgba(0,0,0,0.8),0_0_8px_rgba(59,130,246,0.1)] scale-[1.01]' 
                    : 'bg-[#0b0d12] border-white/5 text-slate-450 hover:shadow-[4px_4px_8px_rgba(0,0,0,0.6)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Globe size={10} className={selectedPlatforms.includes(key.id) ? 'text-blue-400 animate-pulse' : 'text-slate-500'} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">{key.label} ({key.platform_name})</span>
                </div>
                {selectedPlatforms.includes(key.id) ? (
                  <div className="w-1 h-1 bg-blue-400 rounded-full shadow-md shadow-blue-500/50"></div>
                ) : (
                  <div className="w-1 h-1 bg-slate-750 rounded-full"></div>
                )}
              </button>
            )) : (
              <div className="p-2.5 border border-dashed border-white/10 text-center rounded-[4px] bg-white/[0.01]">
                <p className="text-[9px] font-bold text-slate-500 uppercase">{t('strategy.no_api_keys')}</p>
              </div>
            )}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="pt-2.5 border-t border-white/5 space-y-1.5">
          <button 
            onClick={handleSaveStrategy}
            disabled={saving}
            className="w-full py-2 bg-[#0b0d12] border border-white/5 text-slate-300 text-[9.5px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-[4px_4px_10px_rgba(0,0,0,0.7),-4px_-4px_10px_rgba(255,255,255,0.01)] hover:text-white hover:bg-[#111420] hover:border-blue-500/30 hover:shadow-[5px_5px_12px_rgba(0,0,0,0.8),-5px_-5px_12px_rgba(255,255,255,0.02)] active:scale-[0.98] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.8)] rounded-[4px] cursor-pointer"
          >
            {saving ? <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent animate-spin rounded-full"></div> : <Save size={12} className="text-blue-400 animate-pulse" />}
            <span>{t('strategy.save_strategy')}</span>
          </button>
          <button className="w-full py-2 bg-gradient-to-br from-emerald-650 to-emerald-800 border border-emerald-500/20 text-white text-[9.5px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-[4px_4px_10px_rgba(0,0,0,0.7),-4px_-4px_10px_rgba(255,255,255,0.02)] hover:from-emerald-600 hover:to-emerald-750 hover:shadow-[5px_5px_12px_rgba(0,0,0,0.8),-5px_-5px_12px_rgba(255,255,255,0.03)] active:scale-[0.98] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.8)] rounded-[4px] cursor-pointer">
            <Play size={12} fill="currentColor" className="animate-pulse" /> 
            <span>{t('strategy.start_strategy')}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col xl:flex-row h-[calc(100vh-56px)] animate-in fade-in duration-500 relative border-t border-b border-white/10 divide-y xl:divide-y-0 xl:divide-x divide-white/10 w-full bg-transparent">
      {/* DCA Info Modal Overlay */}
      {showDcaInfo && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
           <div className="w-full max-w-sm bg-gradient-to-b from-[#0e111a] to-[#05060b] border border-white/10 p-5 space-y-3.5 animate-in zoom-in-95 duration-200 shadow-2xl relative rounded-[6px] backdrop-blur-2xl">
              <button 
                onClick={() => setShowDcaInfo(false)} 
                className="absolute top-3 right-3 p-1.5 hover:bg-white/10 transition-all text-slate-500 hover:text-white rounded-[4px] cursor-pointer"
              >
                <X size={16} />
              </button>
              
              <div className="flex items-center gap-2.5 border-b border-white/5 pb-2.5">
                 <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-[4px]">
                    <Info size={16} />
                 </div>
                 <h2 className="text-xs font-bold uppercase tracking-wider text-white">{t('strategy.safety_order')}</h2>
              </div>

              <div className="space-y-3 text-slate-300 text-[11px]">
                 <div className="space-y-1.5 p-3 bg-white/5 border-l-2 border-blue-500 rounded-[4px]">
                    <p className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                       <Target size={12} className="text-blue-400" /> {t('strategy.safety_order')}
                    </p>
                    <p className="leading-relaxed text-slate-400 font-medium">{t('strategy.safety_order_desc')}</p>
                 </div>
              </div>
              <button onClick={() => setShowDcaInfo(false)} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-wider transition-all rounded-[4px] cursor-pointer">{t('common.confirm') || 'SAYA MENGERTI'}</button>
           </div>
        </div>
      )}

      {/* Grid Info Modal */}
      {showGridInfo && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
           <div className="w-full max-w-sm bg-gradient-to-b from-[#0e111a] to-[#05060b] border border-white/10 p-5 space-y-3.5 animate-in zoom-in-95 duration-200 shadow-2xl relative rounded-[6px] backdrop-blur-2xl">
              <button 
                onClick={() => setShowGridInfo(false)} 
                className="absolute top-3 right-3 p-1.5 hover:bg-white/10 transition-all text-slate-500 hover:text-white rounded-[4px] cursor-pointer"
              >
                <X size={16} />
              </button>
              
              <div className="flex items-center gap-2.5 border-b border-white/5 pb-2.5">
                 <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-[4px]">
                    <AlertTriangle size={16} />
                 </div>
                 <h2 className="text-xs font-bold uppercase tracking-wider text-white">GRID BOT WARNING</h2>
              </div>

              <div className="space-y-3 text-slate-300 text-[11px]">
                 <div className="space-y-1.5 p-3 bg-red-500/5 border-l-2 border-red-500 rounded-[4px]">
                    <p className="leading-relaxed text-slate-300 font-medium whitespace-pre-line">
                       {t('grid.setup_warning')}
                    </p>
                 </div>
              </div>
              <button onClick={() => setShowGridInfo(false)} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-wider transition-all rounded-[4px] cursor-pointer">SAYA MENGERTI</button>
           </div>
        </div>
      )}

      {/* Grid Mode Info Modal */}
      {showGridModeInfo && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
           <div className="w-full max-w-sm bg-gradient-to-b from-[#0e111a] to-[#05060b] border border-white/10 p-5 space-y-3.5 animate-in zoom-in-95 duration-200 shadow-2xl relative rounded-[6px] backdrop-blur-2xl">
              <button 
                onClick={() => setShowGridModeInfo(false)} 
                className="absolute top-3 right-3 p-1.5 hover:bg-white/10 transition-all text-slate-500 hover:text-white rounded-[4px] cursor-pointer"
              >
                <X size={16} />
              </button>
              
              <div className="flex items-center gap-2.5 border-b border-white/5 pb-2.5">
                 <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-[4px]">
                    <Info size={16} />
                 </div>
                 <h2 className="text-xs font-bold uppercase tracking-wider text-white">{t('grid.grid_mode')}</h2>
              </div>

              <div className="space-y-3 text-slate-300 text-[11px]">
                 <div className="space-y-1.5 p-3 bg-white/5 border-l-2 border-blue-500 rounded-[4px]">
                    <p className="leading-relaxed text-slate-300 font-medium whitespace-pre-line">
                       {t('grid.mode_desc')}
                    </p>
                 </div>
              </div>
              <button onClick={() => setShowGridModeInfo(false)} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-wider transition-all rounded-[4px] cursor-pointer">TUTUP</button>
           </div>
        </div>
      )}

      {/* Mobile Settings Popup - Edge-to-Edge full width/height up to Navbar */}
      {showSettingsPopup && (
        <div className="fixed inset-0 top-14 z-[100] xl:hidden bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300 flex flex-col">
           <div className="w-full h-full bg-[#07090d] p-4 overflow-y-auto custom-scrollbar flex flex-col shadow-2xl">
              <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-white/5">
                 <div>
                    <h2 className="text-xs font-black text-white uppercase tracking-widest">Bot Strategy Setup</h2>
                    <p className="text-[8px] text-slate-500 uppercase font-bold mt-0.5">Configure live trading engine parameters</p>
                 </div>
                 <button onClick={() => setShowSettingsPopup(false)} className="p-1.5 bg-white/5 text-slate-400 hover:text-white border border-white/10 rounded-[4px] cursor-pointer active:scale-[0.98]">
                    <X size={12} />
                 </button>
              </div>
              <SettingsContent />
           </div>
        </div>
      )}

      {/* Left: TradingView - Clean layout, zero header layout collapse safety */}
      <div className={`xl:flex-1 min-h-[220px] xl:min-h-0 bg-transparent flex flex-col relative overflow-hidden group w-full xl:h-full ${showSettingsPopup ? 'hidden xl:flex' : ''}`}>
        {/* TradingView Container - Fully scaled to avoid viewport collapse */}
        <div id="tv_chart_container" ref={container} className="w-full h-[220px] xl:h-full xl:flex-grow z-0 border-b border-white/5" />
        
        {/* Mobile Strategy Selector (Below Chart) */}
        <div className="xl:hidden bg-[#07090e]/95 backdrop-blur-md p-3 grid grid-cols-5 gap-1.5 z-10 rounded-t-[10px]">
          <BotSelector id="dca_lite" name="DCA" icon={Target} active={activeBot === 'dca_lite'} onClick={() => { setActiveBot('dca_lite'); setShowSettingsPopup(true); }} />
          <BotSelector id="dca_pro" name="Smart" icon={Zap} active={activeBot === 'dca_pro'} onClick={() => { setActiveBot('dca_pro'); setShowSettingsPopup(true); }} />
          <BotSelector id="grid_lite" name="Grid" icon={BarChart2} active={activeBot === 'grid_lite'} onClick={() => { setActiveBot('grid_lite'); setShowSettingsPopup(true); }} />
          <BotSelector id="combo_lite" name="Hybrid" icon={Layers} active={activeBot === 'combo_lite'} onClick={() => { setActiveBot('combo_lite'); setShowSettingsPopup(true); }} />
          <BotSelector id="trailing_lite" name="Trail" icon={ShieldCheck} active={activeBot === 'trailing_lite'} onClick={() => { setActiveBot('trailing_lite'); setShowSettingsPopup(true); }} />
        </div>
      </div>

      {/* Right: Strategy Controls (Desktop only) */}
      <div className="hidden xl:flex xl:w-[380px] flex-col overflow-y-auto custom-scrollbar z-10 bg-[#05070a]/90 backdrop-blur-md border-l border-white/10">
        <SettingsContent />
      </div>
    </div>
  );
}

function BotSelector({ id, name, icon: Icon, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`py-2 px-1.5 rounded-[4px] border transition-all flex flex-col items-center gap-1.5 relative group active:scale-[0.98] text-center w-full cursor-pointer shadow-[3px_3px_6px_rgba(0,0,0,0.5),-3px_-3px_6px_rgba(255,255,255,0.01)] ${
        active 
          ? 'bg-gradient-to-br from-[#101625] to-[#090b10] border-blue-500/50 text-white shadow-[inset_2px_2px_5px_rgba(0,0,0,0.8),0_0_8px_rgba(59,130,246,0.15)] scale-[1.02]' 
          : 'bg-[#0b0d12] border-white/5 text-slate-450 hover:bg-[#0d1017] hover:border-white/15 hover:shadow-[4px_4px_8px_rgba(0,0,0,0.6)]'
      }`}
    >
      <div className={`p-1.5 rounded-[4px] transition-all duration-300 ${active ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 scale-105' : 'bg-white/5 text-slate-400 group-hover:text-white'}`}>
        <Icon size={12} />
      </div>
      <span className="text-[8px] font-black uppercase tracking-wider">{name}</span>
      {active && (
        <div className="absolute top-1 right-1 w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
      )}
    </button>
  );
}

function TimeframeBtn({ label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider transition-all rounded-[4px] cursor-pointer ${
        active 
          ? 'bg-white text-black shadow-md font-extrabold scale-105' 
          : 'text-slate-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {label}
    </button>
  );
}

const X = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" className={className}>
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
