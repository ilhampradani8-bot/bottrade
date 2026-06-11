"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Play, Database, Settings, TrendingUp, Activity, PieChart, Clock, 
  Target, ArrowUpCircle, ArrowDownCircle, Calendar, Cpu, Info, Plus, 
  X, Search, Filter, Layers, AlertCircle, Sparkles, CheckCircle
} from 'lucide-react';
import axios from 'axios';
import indicatorsData from '@/data/indicators.json';
import RealtimeLab from './realtime_sim/RealtimeLab';

const RUST_API = "http://139.59.122.230:8080/api";

export default function LabSimulasi() {
  const [labMode, setLabMode] = useState<'offline' | 'realtime'>('offline');
  const [realtimeTab, setRealtimeTab] = useState<'chart' | 'riwayat' | 'daftar_bot'>('chart');
  const [backtestTab, setBacktestTab] = useState<'settings' | 'results'>('settings');
  const [strategies] = useState<any[]>([
    { id: 'dca_lite', name: 'DCA PRO Engine' },
    { id: 'dca_pro', name: 'Advanced DCA PRO' },
    { id: 'grid_lite', name: 'Grid Trading PRO' },
    { id: 'combo_lite', name: 'Combo Strategy PRO' },
    { id: 'trailing_lite', name: 'Trailing Profit PRO' },
    { id: 'bollinger_pro', name: 'Bollinger Bands PRO' },
    { id: 'ema_pro', name: 'EMA Cross PRO' },
    { id: 'rsi_pro', name: 'RSI Momentum PRO' }
  ]);
  const [availableData, setAvailableData] = useState<any[]>([]);
  
  const [selectedStrat, setSelectedStrat] = useState('dca_lite');
  const [selectedPair, setSelectedPair] = useState('');
  const [selectedInterval, setSelectedInterval] = useState('1m');
  const [modalInput, setModalInput] = useState('10,000,000');
  const [trailingEnabled, setTrailingEnabled] = useState(false);
  const [trailingPercent, setTrailingPercent] = useState('0.5');
  
  // Time States
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('00:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('23:59');

  // Indicators State
  const [selectedIndicators, setSelectedIndicators] = useState<any[]>([]);
  const [showIndicatorModal, setShowIndicatorModal] = useState(false);
  const [indicatorSearch, setIndicatorSearch] = useState('');

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState<'summary' | 'trades'>('summary');

  // Strategy Specific Parameters
  const [dcaBaseSize, setDcaBaseSize] = useState('1,000,000');
  const [dcaSafetySize, setDcaSafetySize] = useState('1,000,000');
  const [dcaPriceDev, setDcaPriceDev] = useState('2.0');
  const [dcaStepScale, setDcaStepScale] = useState('1.0');
  const [dcaVolumeScale, setDcaVolumeScale] = useState('1.0');
  const [dcaMaxSafety, setDcaMaxSafety] = useState('5');
  const [dcaTp, setDcaTp] = useState('1.5');
  const [dcaLeverage, setDcaLeverage] = useState('1');

  const [gridLower, setGridLower] = useState('');
  const [gridUpper, setGridUpper] = useState('');
  const [gridCount, setGridCount] = useState('10');

  const [buyAmount, setBuyAmount] = useState('1,000,000');
  const [tpPercent, setTpPercent] = useState('1.5');
  const [dcaPercent, setDcaPercent] = useState('2.0');

  const [emaFast, setEmaFast] = useState('9');
  const [emaSlow, setEmaSlow] = useState('21');

  const [rsiPeriod, setRsiPeriod] = useState('14');
  const [rsiBuyLevel, setRsiBuyLevel] = useState('30');
  const [flashingFields, setFlashingFields] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dataRes = await axios.get(`${RUST_API}/available-data`);
        setAvailableData(dataRes.data);
        
        if (dataRes.data.length > 0) {
          const first = dataRes.data[0];
          setSelectedPair(first.symbol);
          setSelectedInterval(first.interval);
          
          syncDates(first);
        }
      } catch (err) {
        console.error("Failed to fetch lab data", err);
      }
    };
    fetchData();
  }, []);

  const syncDates = (dataEntry: any) => {
    if (dataEntry) {
      const minDate = new Date(dataEntry.min_time);
      const maxDate = new Date(dataEntry.max_time);
      
      setStartDate(minDate.toISOString().split('T')[0]);
      setStartTime(minDate.toTimeString().split(' ')[0].slice(0, 5));
      
      setEndDate(maxDate.toISOString().split('T')[0]);
      setEndTime(maxDate.toTimeString().split(' ')[0].slice(0, 5));
    }
  };

  useEffect(() => {
    const entry = availableData.find(d => d.symbol === selectedPair && d.interval === selectedInterval);
    if (entry) {
        syncDates(entry);
    } else {
        // Fallback: Default to last 7 days if not cached in DB
        const now = new Date();
        const past = new Date();
        past.setDate(now.getDate() - 7);
        
        setStartDate(past.toISOString().split('T')[0]);
        setStartTime("00:00");
        setEndDate(now.toISOString().split('T')[0]);
        setEndTime("23:59");
    }
  }, [selectedPair, selectedInterval, availableData]);

  const formatNumber = (val: string) => {
    const num = val.replace(/\D/g, "");
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleModalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setModalInput(formatNumber(e.target.value));
  };

  const applyQuickSetup = (type: 'short' | 'long') => {
    if (type === 'short') {
      setTpPercent('1.0');
      setDcaPercent('1.0');
      setBuyAmount('500,000');
      setDcaBaseSize('500,000');
      setDcaSafetySize('500,000');
      setDcaPriceDev('1.0');
      setTrailingEnabled(true);
      setTrailingPercent('0.2');
    } else {
      setTpPercent('5.0');
      setDcaPercent('3.0');
      setBuyAmount('2,000,000');
      setDcaBaseSize('2,000,000');
      setDcaSafetySize('1,000,000');
      setDcaPriceDev('3.0');
      setTrailingEnabled(true);
      setTrailingPercent('1.0');
    }
    
    // Trigger bright flash glow on changed fields
    setFlashingFields(['dcaBaseSize', 'dcaSafetySize', 'dcaPriceDev', 'trailingPercent', 'trailingEnabled']);
    setTimeout(() => {
      setFlashingFields([]);
    }, 1200);
  };

  const handleRunBacktest = async () => {
    setLoading(true);
    setResults(null);
    setBacktestTab('results');
    const numericModal = Number(modalInput.replace(/,/g, ""));
    
    // Convert date+time to timestamps
    const startTs = new Date(`${startDate}T${startTime}`).getTime();
    const endTs = new Date(`${endDate}T${endTime}`).getTime();

    try {
      const res = await axios.post(`${RUST_API}/backtest`, {
        strategy_id: selectedStrat,
        pair: selectedPair,
        interval: selectedInterval,
        modal: numericModal,
        start_time: startTs,
        end_time: endTs,
        settings: {
            indicators: selectedIndicators,
            trailing_stop: trailingEnabled ? (Number(trailingPercent) / 100).toString() : null,
            // Dynamic Strategy Settings
            ...(selectedStrat === 'dca_pro' ? {
                base_order_size: Number(dcaBaseSize.replace(/,/g, "")).toString(),
                safety_order_size: Number(dcaSafetySize.replace(/,/g, "")).toString(),
                price_deviation: (Number(dcaPriceDev) / 100).toString(),
                step_scale: dcaStepScale,
                volume_scale: dcaVolumeScale,
                max_safety_orders: Number(dcaMaxSafety),
                take_profit: (Number(dcaTp) / 100).toString(),
                leverage: Number(dcaLeverage)
            } : {}),
            ...(selectedStrat === 'grid_lite' ? {
                lower_price: gridLower,
                upper_price: gridUpper,
                grid_number: Number(gridCount),
                modal: numericModal.toString()
            } : {}),
            ...(selectedStrat === 'combo_lite' ? {
                buy_amount: Number(buyAmount.replace(/,/g, "")).toString(),
                tp_percent: (Number(tpPercent) / 100).toString(),
                dca_percent: (Number(dcaPercent) / 100).toString()
            } : {}),
            ...(selectedStrat === 'trailing_lite' ? {
                buy_amount: Number(buyAmount.replace(/,/g, "")).toString(),
                trailing_percent: (Number(trailingPercent) / 100).toString()
            } : {}),
            ...(selectedStrat === 'bollinger_pro' ? {
                length: 20,
                std_dev: "2.0",
                buy_amount: Number(buyAmount.replace(/,/g, "")).toString()
            } : {}),
            ...(selectedStrat === 'ema_pro' ? {
                fast_period: Number(emaFast),
                slow_period: Number(emaSlow),
                buy_amount: Number(buyAmount.replace(/,/g, "")).toString()
            } : {}),
            ...(selectedStrat === 'rsi_pro' ? {
                rsi_period: Number(rsiPeriod),
                rsi_buy_level: rsiBuyLevel,
                dca_drop_percent: (Number(dcaPercent) / 100).toString(),
                take_profit_percent: (Number(tpPercent) / 100).toString(),
                buy_amount: Number(buyAmount.replace(/,/g, "")).toString()
            } : {})
        }
      });
      setResults(res.data);
    } catch (err) {
      console.error("Backtest failed", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleIndicator = (ind: any) => {
    if (selectedIndicators.find(i => i.id === ind.id)) {
      setSelectedIndicators(selectedIndicators.filter(i => i.id !== ind.id));
    } else {
      setSelectedIndicators([...selectedIndicators, ind]);
    }
  };

  return (
    <div className="p-2 md:p-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 relative w-full bg-transparent">
      
      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
           <div className="w-full max-w-2xl bg-[#0a0c14] border border-white/10 p-6 md:p-10 space-y-6 md:space-y-8 animate-in zoom-in-95 duration-300 rounded-[12px]">
              <div className="flex justify-between items-center border-b border-white/5 pb-4 md:pb-6">
                 <h2 className="text-lg font-black uppercase tracking-widest text-white flex items-center gap-3">
                    <Info size={20} className="text-indigo-400" /> Lab Simulation Guide
                 </h2>
                 <button onClick={() => setShowHelp(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
              </div>
              <div className="space-y-4 text-slate-400 text-xs md:text-sm leading-relaxed">
                 <p>1. <strong>Parameters</strong>: Tentukan strategi eksekusi dan modal awal Anda.</p>
                 <p>2. <strong>Rentang Waktu</strong>: Pilih tanggal & jam mulai/selesai untuk backtesting presisi tinggi.</p>
                 <p>3. <strong>Indikator</strong>: Tambahkan indikator teknikal untuk memengaruhi pengambilan keputusan strategi.</p>
                 <p>4. <strong>Sintesis</strong>: Mesin analisis Rust akan memproses performa berdasarkan data historis database.</p>
              </div>
              <button 
                onClick={() => setShowHelp(false)} 
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-[6px] font-black uppercase tracking-widest text-white transition-all text-xs"
              >
                SAYA MENGERTI
              </button>
           </div>
        </div>
      )}

      {/* Unified Compact Navigation Header replacing original title block */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        {/* Neo-brutalist Mode Toggle (Backtest / Realtime) */}
        <div className="flex gap-3">
          <button
            onClick={() => setLabMode('offline')}
            className={`px-5 py-2 text-xs font-black uppercase tracking-wider transition-all duration-150 cursor-pointer border-[2px] rounded-none ${
              labMode === 'offline' 
                ? 'bg-[#F1BF0A] text-black border-black shadow-[3px_3px_0px_rgba(255,255,255,1)] translate-x-[-2px] translate-y-[-2px]' 
                : 'bg-black text-slate-400 border-white/20 hover:border-white hover:text-white shadow-none translate-x-0 translate-y-0'
            }`}
          >
            Backtest Mode
          </button>
          <button
            onClick={() => setLabMode('realtime')}
            className={`px-5 py-2 text-xs font-black uppercase tracking-wider transition-all duration-150 cursor-pointer border-[2px] rounded-none ${
              labMode === 'realtime' 
                ? 'bg-indigo-600 text-white border-white shadow-[3px_3px_0px_rgba(241,191,10,1)] translate-x-[-2px] translate-y-[-2px]' 
                : 'bg-black text-slate-400 border-white/20 hover:border-white hover:text-white shadow-none translate-x-0 translate-y-0'
            }`}
          >
            Realtime Lab
          </button>
        </div>

        {/* Realtime Sub-navigation Tabs shown only in Realtime mode */}
        {labMode === 'realtime' && (
          <div className="flex gap-2">
            <button 
              onClick={() => setRealtimeTab('chart')}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-[6px] transition-all flex items-center gap-2 cursor-pointer ${
                realtimeTab === 'chart' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-650/20' 
                  : 'bg-white/[0.02] border border-white/5 text-slate-350 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <Activity size={12} className={realtimeTab === 'chart' ? 'animate-pulse text-emerald-400' : ''} />
              Chart
            </button>
            
            <button 
              onClick={() => setRealtimeTab('riwayat')}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-[6px] transition-all flex items-center gap-2 cursor-pointer ${
                realtimeTab === 'riwayat' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-650/20' 
                  : 'bg-white/[0.02] border border-white/5 text-slate-350 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <Database size={12} />
              Riwayat
            </button>

            <button 
              onClick={() => setRealtimeTab('daftar_bot')}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-[6px] transition-all flex items-center gap-2 cursor-pointer ${
                realtimeTab === 'daftar_bot' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-650/20' 
                  : 'bg-white/[0.02] border border-white/5 text-slate-350 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <CheckCircle size={12} />
              Daftar Bot
            </button>
            
            <button 
              onClick={() => setShowHelp(true)}
              className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all rounded-[6px]"
              title="Panduan Lab"
            >
              <Info size={12} />
            </button>
          </div>
        )}

        {/* Backtest Sub-navigation Tabs shown only in Backtest mode */}
        {labMode === 'offline' && (
          <div className="flex gap-2">
            <button 
              onClick={() => setBacktestTab('settings')}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-[6px] transition-all flex items-center gap-2 cursor-pointer ${
                backtestTab === 'settings' 
                  ? 'bg-[#F1BF0A] text-black shadow-md border border-black font-extrabold' 
                  : 'bg-white/[0.02] border border-white/5 text-slate-350 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <Settings size={12} />
              Pengaturan Parameter
            </button>
            
            <button 
              onClick={() => setBacktestTab('results')}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-[6px] transition-all flex items-center gap-2 cursor-pointer ${
                backtestTab === 'results' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-650/20' 
                  : 'bg-white/[0.02] border border-white/5 text-slate-350 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <Activity size={12} className={loading ? 'animate-spin' : ''} />
              Hasil Simulasi
            </button>
            
            <button 
              onClick={() => setShowHelp(true)}
              className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all rounded-[6px]"
              title="Panduan Lab"
            >
              <Info size={12} />
            </button>
          </div>
        )}
      </div>

      {labMode === 'realtime' ? (
        <RealtimeLab activeTab={realtimeTab} setActiveTab={setRealtimeTab} />
      ) : (
        <div className="w-full">
          {backtestTab === 'settings' ? (
            /* Settings View: Takes full width, styled elegantly in grid/groups, no cards */
            <div className="w-full space-y-8 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-[6px]">
                  <Settings size={18} />
                </div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider">
                  Pengaturan Parameter Backtest
                </h2>
              </div>

              {/* Quick Setup presets */}
              <div className="flex gap-3">
                <button 
                  onClick={() => applyQuickSetup('short')}
                  className="flex-1 py-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all rounded-[6px] cursor-pointer"
                >
                  Quick Short
                </button>
                <button 
                  onClick={() => applyQuickSetup('long')}
                  className="flex-1 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all rounded-[6px] cursor-pointer"
                >
                  Quick Long
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Group 1: Dataset & Strategy */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Strategi Eksekusi</label>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          setShowIndicatorModal(true);
                        }} 
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-505 text-white text-[9px] font-bold uppercase tracking-wider rounded-[6px] transition-all cursor-pointer"
                      >
                        <Plus size={10} /> Indikator
                      </button>
                    </div>
                    <select 
                      value={selectedStrat} 
                      onChange={(e) => setSelectedStrat(e.target.value)}
                      className="w-full bg-black border border-white/10 p-3.5 text-xs text-white rounded-[6px] outline-none focus:border-indigo-500/40 cursor-pointer font-bold transition-all"
                    >
                      {strategies.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>

                    {/* Selected Indicators Tags */}
                    {selectedIndicators.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {selectedIndicators.map(ind => (
                          <div key={ind.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-bold uppercase tracking-wider rounded-[6px]">
                            {ind.id}
                            <button onClick={() => toggleIndicator(ind)} className="hover:text-white"><X size={10} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-slate-500 tracking-wider px-1">Konfigurasi Dataset (Koin & Interval)</label>
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        type="text" 
                        value={selectedPair}
                        onChange={(e) => setSelectedPair(e.target.value.toUpperCase())}
                        placeholder="Contoh: BTCUSDT"
                        className="w-full bg-black border border-white/10 p-3 text-xs text-white rounded-[6px] outline-none focus:border-indigo-500/40 font-mono font-bold transition-all"
                        title="Pilih Koin (Binance Pair)"
                      />
                      <select 
                        value={selectedInterval} 
                        onChange={(e) => setSelectedInterval(e.target.value)}
                        className="w-full bg-black border border-white/10 p-3 text-xs text-white rounded-[6px] outline-none focus:border-indigo-500/40 cursor-pointer font-bold transition-all font-mono"
                      >
                        {['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '1w'].map(inv => (
                          <option key={inv} value={inv}>{inv}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-slate-500 tracking-wider px-1">Modal Awal Simulasi</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">Rp</span>
                      <input 
                        type="text" 
                        value={modalInput} 
                        onChange={handleModalChange}
                        className="w-full bg-black border border-white/10 p-3.5 pl-9 text-xs font-black text-emerald-400 rounded-[6px] outline-none focus:border-indigo-500/40 transition-all font-mono" 
                      />
                    </div>
                  </div>
                </div>

                {/* Group 2: Time Range & Strategy Parameters */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-slate-500 tracking-wider px-1">Rentang Waktu Histori</label>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex gap-2">
                        <input 
                          type="date" 
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="flex-1 bg-black border border-white/10 p-3 text-xs text-white rounded-[6px] outline-none font-bold" 
                        />
                        <input 
                          type="time" 
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-32 bg-black border border-white/10 p-3 text-xs text-white rounded-[6px] outline-none font-bold" 
                        />
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="date" 
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="flex-1 bg-black border border-white/10 p-3 text-xs text-white rounded-[6px] outline-none font-bold" 
                        />
                        <input 
                          type="time" 
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-32 bg-black border border-white/10 p-3 text-xs text-white rounded-[6px] outline-none font-bold" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Strategy Parameters */}
                  <div className="space-y-4 pt-2">
                    <label className="text-[10px] uppercase font-black text-slate-500 tracking-wider px-1">Parameter Strategi Spesifik</label>
                    
                    {selectedStrat === 'dca_pro' && (
                      <div className="space-y-3 animate-in fade-in duration-300">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <p className="text-[8px] font-bold uppercase text-slate-500 ml-1">Base Order</p>
                            <input type="text" value={dcaBaseSize} onChange={(e) => setDcaBaseSize(formatNumber(e.target.value))} className={`w-full bg-black border p-2.5 text-xs text-white rounded-[6px] outline-none font-mono font-bold transition-all duration-700 ${flashingFields.includes('dcaBaseSize') ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-[0_0_15px_rgba(241,191,10,0.6)] bg-amber-500/10' : 'border-white/10'}`} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] font-bold uppercase text-slate-500 ml-1">Safety Order</p>
                            <input type="text" value={dcaSafetySize} onChange={(e) => setDcaSafetySize(formatNumber(e.target.value))} className={`w-full bg-black border p-2.5 text-xs text-white rounded-[6px] outline-none font-mono font-bold transition-all duration-700 ${flashingFields.includes('dcaSafetySize') ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-[0_0_15px_rgba(241,191,10,0.6)] bg-amber-500/10' : 'border-white/10'}`} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <p className="text-[8px] font-bold uppercase text-slate-500 ml-1">Price Dev (%)</p>
                            <input type="number" value={dcaPriceDev} onChange={(e) => setDcaPriceDev(e.target.value)} className={`w-full bg-black border p-2.5 text-xs text-white rounded-[6px] outline-none font-mono font-bold transition-all duration-700 ${flashingFields.includes('dcaPriceDev') ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-[0_0_15px_rgba(241,191,10,0.6)] bg-amber-500/10' : 'border-white/10'}`} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] font-bold uppercase text-slate-500 ml-1">Max Safety</p>
                            <input type="number" value={dcaMaxSafety} onChange={(e) => setDcaMaxSafety(e.target.value)} className="w-full bg-black border border-white/10 p-2.5 text-xs text-white rounded-[6px] outline-none font-mono font-bold" />
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedStrat === 'grid_lite' && (
                      <div className="space-y-3 animate-in fade-in duration-300">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <p className="text-[8px] font-bold uppercase text-slate-500 ml-1">Lower Price</p>
                            <input type="number" value={gridLower} onChange={(e) => setGridLower(e.target.value)} className="w-full bg-black border border-white/10 p-2.5 text-xs text-white rounded-[6px] outline-none font-mono font-bold" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] font-bold uppercase text-slate-500 ml-1">Upper Price</p>
                            <input type="number" value={gridUpper} onChange={(e) => setGridUpper(e.target.value)} className="w-full bg-black border border-white/10 p-2.5 text-xs text-white rounded-[6px] outline-none font-mono font-bold" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] font-bold uppercase text-slate-500 ml-1">Grid Levels</p>
                          <input type="number" value={gridCount} onChange={(e) => setGridCount(e.target.value)} className="w-full bg-black border border-white/10 p-2.5 text-xs text-white rounded-[6px] outline-none font-mono font-bold" />
                        </div>
                      </div>
                    )}

                    {selectedStrat === 'rsi_pro' && (
                      <div className="space-y-3 animate-in fade-in duration-300">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <p className="text-[8px] font-bold uppercase text-slate-500 ml-1">RSI Period</p>
                            <input type="number" value={rsiPeriod} onChange={(e) => setRsiPeriod(e.target.value)} className="w-full bg-black border border-white/10 p-2.5 text-xs text-white rounded-[6px] outline-none font-mono font-bold" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] font-bold uppercase text-slate-500 ml-1">Buy Level</p>
                            <input type="number" value={rsiBuyLevel} onChange={(e) => setRsiBuyLevel(e.target.value)} className="w-full bg-black border border-white/10 p-2.5 text-xs text-white rounded-[6px] outline-none font-mono font-bold" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Trailing Stop Section */}
                    <div className={`p-4 rounded-[6px] space-y-4 border transition-all duration-700 ${flashingFields.includes('trailingEnabled') ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-[0_0_15px_rgba(241,191,10,0.6)] bg-amber-500/10' : 'bg-indigo-500/5 border-indigo-500/10'}`}>
                      <div className="flex justify-between items-center">
                        <div className="space-y-0.5">
                          <label className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Trailing Stop</label>
                          <p className="text-[8px] text-slate-500 font-bold uppercase">Lock profit & follow price</p>
                        </div>
                        <button 
                          onClick={() => setTrailingEnabled(!trailingEnabled)}
                          className={`w-10 h-5.5 rounded-full transition-all relative cursor-pointer ${trailingEnabled ? 'bg-indigo-600' : 'bg-slate-800'}`}
                        >
                          <div className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full transition-all ${trailingEnabled ? 'left-5' : 'left-0.5'}`} />
                        </button>
                      </div>

                      {trailingEnabled && (
                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                          <label className="text-[8px] uppercase font-bold text-slate-400 tracking-widest px-1">Callback Percentage</label>
                          <div className="relative group">
                            <input 
                              type="number" 
                              step="0.1"
                              value={trailingPercent}
                              onChange={(e) => setTrailingPercent(e.target.value)}
                              className={`w-full bg-black border p-2.5 pr-8 text-xs font-bold text-white rounded-[6px] outline-none font-mono transition-all duration-700 ${flashingFields.includes('trailingPercent') ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-[0_0_15px_rgba(241,191,10,0.6)] bg-amber-500/10' : 'border-white/10'}`} 
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-black text-xs">%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Neo-brutalist Run Button */}
              <button 
                onClick={handleRunBacktest}
                disabled={loading || !selectedPair.trim()}
                className={`w-full py-4 transition-all bg-[#F1BF0A] border-2 border-black text-black font-black uppercase tracking-wider text-xs shadow-[3px_3px_0px_white] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_white] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-black/30 border-t-black mx-auto" />
                ) : (
                  <>
                    <Play size={14} fill="currentColor" />
                    <span>Jalankan Simulasi Backtest</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Results View: Takes full width, styled elegantly, tables scroll if layout overflows */
            <div className="w-full space-y-6 animate-in fade-in duration-300">
              {!results && !loading ? (
                <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
                  <div className="w-16 h-16 bg-white/5 flex items-center justify-center rounded-[12px] mb-4">
                    <Activity size={24} className="text-slate-650 animate-pulse" />
                  </div>
                  <h3 className="text-sm font-black text-white tracking-tight uppercase">Belum Ada Hasil</h3>
                  <p className="text-slate-500 max-w-sm mt-1 text-[9px] leading-relaxed font-bold uppercase tracking-widest">
                    Silakan buka tab "Pengaturan Parameter", masukkan konfigurasi Anda, lalu jalankan simulasi.
                  </p>
                </div>
              ) : loading ? (
                <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-6">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 border-2 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
                    <Cpu className="absolute inset-0 m-auto text-indigo-400 animate-pulse" size={18} />
                  </div>
                  <p className="text-sm font-black text-white tracking-tight uppercase">Sedang Memproses Backtest</p>
                  <p className="text-slate-500 text-[8px] font-black uppercase tracking-widest mt-1 max-w-xs leading-relaxed">
                    Mesin komputasi Rust sedang memproses data koin historis dan mensimulasikan order trade.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 animate-in zoom-in-95 duration-700">
                  {/* Summary/Trades Toggle */}
                  <div className="flex bg-black border border-white/10 p-1 rounded-[8px] max-w-max">
                    <button
                      type="button"
                      onClick={() => setActiveResultTab('summary')}
                      className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-[6px] transition-all cursor-pointer ${
                        activeResultTab === 'summary' 
                          ? 'bg-[#F1BF0A] text-black shadow-md border border-black font-extrabold' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Ringkasan Performa
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveResultTab('trades')}
                      className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-[6px] transition-all cursor-pointer ${
                        activeResultTab === 'trades' 
                          ? 'bg-[#F1BF0A] text-black shadow-md border border-black font-extrabold' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Riwayat Transaksi
                    </button>
                  </div>

                  {activeResultTab === 'summary' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
                      <ResultCard label="Total Trades" value={results.total_trades} icon={Clock} color="indigo" />
                      <ResultCard label="Success Rate" value={`${results.win_rate}%`} icon={TrendingUp} color="emerald" />
                      <ResultCard label="Net Profit" value={`${Number(results.total_pnl).toLocaleString()} IDR`} icon={PieChart} color="purple" />
                    </div>
                  ) : (
                    /* Excel Spreadsheet Style Grid for Simulation Results */
                    <div className="border border-white/10 overflow-hidden rounded-[12px] bg-[#07080c] animate-in fade-in duration-300">
                      <div className="p-5 border-b border-white/10 bg-white/[0.01] flex justify-between items-center">
                        <h3 className="text-xs font-bold flex items-center gap-2.5 text-white uppercase tracking-wider">
                          <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-[6px]">
                            <Activity size={14} />
                          </div>
                          Execution Timeline (Excel Mode)
                        </h3>
                        <span className="px-2.5 py-1 bg-emerald-500/5 text-emerald-400 rounded-[4px] text-[8px] font-bold border border-emerald-500/10 tracking-widest uppercase">SQL SYNTHESIS OK</span>
                      </div>

                      {/* Spreadsheet UI with limit height scrolling */}
                      <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse border border-white/10 text-xs">
                          <thead>
                            <tr className="bg-white/[0.04]">
                              <th className="border border-white/10 px-4 py-2.5 text-center text-[9px] font-black text-slate-500 uppercase tracking-widest bg-black/60 w-12 font-mono">Row</th>
                              <th className="border border-white/10 px-6 py-2.5 text-[9px] font-black text-slate-500 uppercase tracking-widest bg-black/60">Signal</th>
                              <th className="border border-white/10 px-6 py-2.5 text-[9px] font-black text-slate-500 uppercase tracking-widest bg-black/60">Entry Price</th>
                              <th className="border border-white/10 px-6 py-2.5 text-[9px] font-black text-slate-500 uppercase tracking-widest bg-black/60">Execution Time</th>
                              <th className="border border-white/10 px-6 py-2.5 text-right text-[9px] font-black text-slate-500 uppercase tracking-widest bg-black/60">PnL Result</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {results.trades.map((trade: any, idx: number) => (
                              <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                <td className="border border-white/10 px-4 py-3 text-center font-mono text-[9px] font-bold text-slate-600 bg-black/30 select-none">{idx + 1}</td>
                                <td className="border border-white/10 px-6 py-3">
                                  <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-wider border ${trade.side === 'BUY' ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' : 'bg-rose-500/5 border-rose-500/10 text-rose-400'}`}>
                                    {trade.side}
                                  </span>
                                </td>
                                <td className="border border-white/10 px-6 py-3 font-mono text-xs font-semibold text-slate-200">
                                  {Number(trade.price).toLocaleString()} <span className="text-[9px] text-slate-600 font-bold ml-1">IDR</span>
                                </td>
                                <td className="border border-white/10 px-6 py-3 text-slate-400 font-medium text-[10px]">
                                  {new Date(trade.time).toLocaleDateString()} {new Date(trade.time).toLocaleTimeString()}
                                </td>
                                <td className={`border border-white/10 px-6 py-3 text-right font-mono font-bold text-xs ${Number(trade.pnl) > 0 ? 'text-emerald-400' : Number(trade.pnl) < 0 ? 'text-rose-400' : 'text-slate-600'}`}>
                                  {trade.pnl ? `${Number(trade.pnl) > 0 ? '+' : ''}${Number(trade.pnl).toLocaleString()}` : '0'} <span className="text-[9px] opacity-60 ml-0.5">IDR</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Indicator Selection Modal */}
      {showIndicatorModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-[#0c0d12] border border-white/15 p-6 md:p-8 space-y-6 animate-in zoom-in-95 duration-300 h-[80vh] flex flex-col rounded-[12px] shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h2 className="text-base font-black uppercase tracking-wider text-white flex items-center gap-2.5">
                  <Layers size={18} className="text-indigo-400 animate-pulse" /> INDICATOR REPOSITORY
                </h2>
                <button onClick={() => setShowIndicatorModal(false)} className="p-2 rounded-[6px] hover:bg-white/5 transition-colors text-slate-500 hover:text-white"><X size={18} /></button>
            </div>
            
            <div className="relative">
              <input 
                type="text" 
                placeholder="Cari indikator teknikal..."
                value={indicatorSearch}
                onChange={(e) => setIndicatorSearch(e.target.value)}
                className="w-full bg-black border border-white/10 p-3 pl-10 text-xs font-medium text-white placeholder:text-slate-600 rounded-[6px] outline-none focus:border-indigo-500/40 transition-all"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 grid grid-cols-1 md:grid-cols-2 gap-3 min-h-0">
              {indicatorsData
                .filter(ind => ind.name.toLowerCase().includes(indicatorSearch.toLowerCase()) || ind.category.toLowerCase().includes(indicatorSearch.toLowerCase()))
                .map(ind => (
                <button 
                  key={ind.id}
                  onClick={() => toggleIndicator(ind)}
                  className={`p-4 border flex flex-col gap-2 text-left transition-all rounded-[6px] group ${selectedIndicators.find(i => i.id === ind.id) ? 'bg-indigo-600/10 border-indigo-500 text-white' : 'bg-transparent border-white/5 text-slate-400 hover:border-white/10 hover:bg-white/[0.02]'}`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className={`text-[8px] font-bold uppercase tracking-wider ${selectedIndicators.find(i => i.id === ind.id) ? 'text-indigo-400' : 'text-slate-600'}`}>{ind.category}</span>
                    {selectedIndicators.find(i => i.id === ind.id) && <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-md"></div>}
                  </div>
                  <h4 className="text-xs font-bold tracking-wide group-hover:text-white transition-colors">{ind.name}</h4>
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => setShowIndicatorModal(false)} 
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-xs font-black uppercase tracking-widest text-white rounded-[6px] transition-all shadow-lg"
            >
              CONFIRM SELECTION
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultCard({ label, value, icon: Icon, color }: any) {
  const colors: any = {
    indigo: 'border-indigo-500 text-indigo-400',
    emerald: 'border-emerald-500 text-emerald-400',
    purple: 'border-purple-500 text-purple-400',
  };

  return (
    <div className={`p-5 border-l-4 ${colors[color]} bg-white/[0.02] hover:scale-[1.01] transition-all`}>
      <div className="flex items-center gap-2 mb-2 text-[9px] font-bold uppercase tracking-widest text-slate-500">
        <Icon size={14} /> {label}
      </div>
      <p className="text-xl font-black text-white tracking-tight font-mono">{value}</p>
    </div>
  );
}
