"use client";

import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  TrendingUp, 
  Zap, 
  ShieldCheck, 
  Info, 
  X, 
  MessageSquare, 
  Sliders, 
  AlertTriangle, 
  CheckCircle,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '@/lang/LanguageContext';

interface BotStrategy {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  stats: string;
  color: string;
  risk: 'Low' | 'Medium' | 'High';
  market: string;
  parameters: {
    label: string;
    value: string;
  }[];
  isComingSoon: boolean;
}

export default function Bots({ setActiveView }: { setActiveView?: (view: string) => void }) {
  const { t } = useLanguage();
  const [selectedBot, setSelectedBot] = useState<BotStrategy | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const botList: BotStrategy[] = [
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

  const handleOpenInfo = (bot: BotStrategy) => {
    if (bot.isComingSoon) return; // Ignore clicks for coming soon
    setSelectedBot(bot);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    // Let drawer slide out before clearing state
    setTimeout(() => setSelectedBot(null), 300);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500 w-full relative min-h-screen bg-transparent">
      
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black tracking-tight text-white uppercase">Daftar Bots</h1>
        <p className="text-xs text-[#86868b] tracking-wider uppercase font-semibold">
          Pilih dan pelajari strategi bot otomatis untuk meningkatkan efisiensi portofolio trading Anda.
        </p>
      </div>

      {/* Grid containing Interactive Cards as Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {botList.map((bot) => {
          const isComing = bot.isComingSoon;
          return (
            <div 
              key={bot.id} 
              className={`border border-white/5 p-6 flex flex-col justify-between items-start text-left min-h-[220px] rounded-[16px] bg-white/[0.01] w-full transition-all duration-300 relative overflow-hidden ${
                isComing 
                  ? 'opacity-40 cursor-not-allowed border-dashed' 
                  : 'hover:border-white/10 hover:bg-white/[0.02]'
              }`}
            >
              {/* Left Color Bar Accent */}
              {!isComing && (
                <div className={`absolute top-0 left-0 w-1.5 h-full ${
                  bot.color === 'blue' ? 'bg-blue-500' : 
                  bot.color === 'emerald' ? 'bg-emerald-500' :
                  bot.color === 'purple' ? 'bg-purple-500' : 'bg-amber-500'
                }`}></div>
              )}
              
              <div className="space-y-4 w-full flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 flex items-center justify-center rounded-[8px] bg-white/5 border border-white/5 ${
                        isComing ? 'text-slate-500' :
                        bot.color === 'blue' ? 'text-blue-400' : 
                        bot.color === 'emerald' ? 'text-emerald-400' :
                        bot.color === 'purple' ? 'text-purple-400' : 'text-amber-400'
                      }`}>
                        {bot.id === 'dca' ? <TrendingUp size={16} /> : 
                         bot.id === 'grid' ? <Cpu size={16} /> :
                         bot.id === 'combo' ? <ShieldCheck size={16} /> : <Zap size={16} />}
                      </div>
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">{bot.name}</h3>
                    </div>
                    
                    {/* Status Badge */}
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                      isComing 
                        ? 'bg-slate-900 border-white/10 text-slate-500' 
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}>
                      {isComing ? 'Akan Hadir' : 'Aktif'}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium tracking-wide uppercase">
                    {bot.description}
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/5">
                  {/* Top Action Button - FROZEN (Disabled) */}
                  <button 
                    disabled
                    className="w-full text-center py-2 bg-white/5 border border-white/5 rounded-lg text-[9px] font-black uppercase tracking-wider text-slate-500 cursor-not-allowed opacity-60"
                  >
                    Setup &amp; Aktifkan Bot (Locked)
                  </button>

                  {/* Bottom Action Area - INFO BOT (Clickable if Active) */}
                  {!isComing ? (
                    <button 
                      onClick={() => handleOpenInfo(bot)}
                      className="w-full flex items-center justify-center gap-1.5 py-1 text-[9px] font-black uppercase tracking-widest text-[#0071e3] hover:text-[#00c5ff] transition-all"
                    >
                      <Info size={11} />
                      <span>Info Selengkapnya</span>
                      <ArrowRight size={10} className="ml-0.5" />
                    </button>
                  ) : (
                    <div className="w-full text-center py-1 text-[8px] font-black uppercase tracking-widest text-slate-600">
                      Informasi Tidak Tersedia
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide-out Drawer / Pop-up from Right */}
      {isDrawerOpen && selectedBot && (
        <>
          {/* Backdrop */}
          <div 
            onClick={handleCloseDrawer}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9990] animate-in fade-in duration-300"
          />

          {/* Drawer Panel */}
          <div className="fixed top-0 right-0 h-full w-full sm:max-w-md bg-[#090a0f] border-l border-white/10 z-[9991] flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 ${
                  selectedBot.color === 'blue' ? 'text-blue-400' : 
                  selectedBot.color === 'emerald' ? 'text-emerald-400' :
                  selectedBot.color === 'purple' ? 'text-purple-400' : 'text-amber-400'
                }`}>
                  {selectedBot.id === 'dca' ? <TrendingUp size={18} /> : 
                   selectedBot.id === 'grid' ? <Cpu size={18} /> :
                   selectedBot.id === 'combo' ? <ShieldCheck size={18} /> : <Zap size={18} />}
                </div>
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-wider">{selectedBot.name}</h2>
                  <span className="text-[8px] font-black uppercase tracking-widest text-[#86868b]">{selectedBot.market}</span>
                </div>
              </div>
              
              <button 
                onClick={handleCloseDrawer}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              
              {/* Short Bio info */}
              <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 space-y-2">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tentang Strategi</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                  {selectedBot.longDescription}
                </p>
              </div>

              {/* Stats & Risk */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Tingkat Risiko</span>
                  <p className={`text-xs font-black uppercase tracking-wider mt-1 ${
                    selectedBot.risk === 'Low' ? 'text-emerald-400' :
                    selectedBot.risk === 'Medium' ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {selectedBot.risk} RISK
                  </p>
                </div>
                <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Histori Sukses</span>
                  <p className="text-xs font-black uppercase tracking-wider mt-1 text-white">
                    {selectedBot.stats}
                  </p>
                </div>
              </div>

              {/* Strategy Parameters */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Parameter Konfigurasi</h3>
                <div className="bg-[#040406] border border-white/5 rounded-2xl divide-y divide-white/5">
                  {selectedBot.parameters.map((param, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{param.label}</span>
                      <span className="text-[10px] font-bold text-white font-mono">{param.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* TradingSafe Emotional Protection Safeguard */}
              <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 flex gap-3">
                <ShieldCheck size={18} className="text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-indigo-300">Emotional Safeguard Active</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-semibold mt-1">
                    Bot ini diproteksi oleh sistem TradingSafe yang memantau intervensi kepanikan. Jika sistem mendeteksi deviasi manual yang memicu Panic Loss, bot akan menangguhkan perdagangan sementara dan memberikan audit emosional di Dashboard.
                  </p>
                </div>
              </div>



            </div>

            {/* Drawer Footer */}
            <div className="p-6 border-t border-white/5 bg-black/40">
              <button 
                onClick={handleCloseDrawer}
                className="w-full py-3 bg-white text-black font-black uppercase tracking-widest rounded-xl text-xs hover:bg-slate-200 transition-all cursor-pointer"
              >
                Selesai &amp; Tutup
              </button>
            </div>
            
          </div>
        </>
      )}

    </div>
  );
}
