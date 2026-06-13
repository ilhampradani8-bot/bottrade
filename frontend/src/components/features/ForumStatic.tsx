"use client";

import React, { useState } from 'react';
import { MessageSquare, ThumbsUp, Eye, Plus, Search, MessageCircle } from 'lucide-react';

export default function ForumStatic() {
  const [activeCategory, setActiveCategory] = useState('Semua');

  const categories = ['Semua', 'Strategi Bot', 'Prediksi Koin', 'Bantuan Teknis', 'Diskusi Umum'];

  const threads = [
    {
      id: 1,
      title: "Bagaimana cara setting DCA Bot terbaik untuk XRP di kondisi sideways?",
      author: "xrp_champion",
      category: "Strategi Bot",
      replies: 24,
      views: 312,
      likes: 45,
      time: "2 jam yang lalu"
    },
    {
      id: 2,
      title: "[PREDIKSI] Sinyal Bullish PEPE V2 - Target profit tercapai dalam 10 jam!",
      author: "pepe_master",
      category: "Prediksi Koin",
      replies: 89,
      views: 1205,
      likes: 231,
      time: "5 jam yang lalu"
    },
    {
      id: 3,
      title: "Error sinkronisasi API Key Binance setelah maintenance bursa, solusinya?",
      author: "dev_crypto",
      category: "Bantuan Teknis",
      replies: 12,
      views: 189,
      likes: 8,
      time: "1 hari yang lalu"
    },
    {
      id: 4,
      title: "Berapa modal minimum ideal untuk menjalankan DCA Lite vs Smart DCA?",
      author: "newbie_trader",
      category: "Strategi Bot",
      replies: 18,
      views: 290,
      likes: 19,
      time: "2 hari yang lalu"
    },
    {
      id: 5,
      title: "TradingSafe Engine V2 sangat akurat mengirim alert signal lewat Telegram!",
      author: "whale_watcher",
      category: "Diskusi Umum",
      replies: 34,
      views: 654,
      likes: 112,
      time: "3 hari yang lalu"
    }
  ];

  const filteredThreads = activeCategory === 'Semua' 
    ? threads 
    : threads.filter(t => t.category === activeCategory);

  return (
    <div className="w-full px-4 sm:px-8 py-6 max-w-5xl mx-auto space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">Forum Komunitas</h1>
          <p className="text-xs text-[#86868b]">Diskusikan strategi bot, sharing profit sinyal, dan berbagi tips trading.</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[6px] text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all active:scale-95 self-start sm:self-auto">
          <Plus size={14} />
          <span>Buat Topik</span>
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="apple-card p-4 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold text-[#86868b] uppercase tracking-wider mb-1">Total Topik</span>
          <span className="text-lg sm:text-xl font-black text-white">1,482</span>
        </div>
        <div className="apple-card p-4 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold text-[#86868b] uppercase tracking-wider mb-1">Total Balasan</span>
          <span className="text-lg sm:text-xl font-black text-white">18,290</span>
        </div>
        <div className="apple-card p-4 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold text-[#86868b] uppercase tracking-wider mb-1">Online Member</span>
          <span className="text-lg sm:text-xl font-black text-indigo-400">324</span>
        </div>
      </div>

      {/* Categories & Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-[6px] text-[10px] font-black uppercase tracking-wider transition-all border ${
                activeCategory === cat 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                  : 'bg-white/5 border-white/5 text-[#86868b] hover:text-white hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input 
            type="text" 
            placeholder="Cari topik diskusi..."
            className="w-full premium-input bg-[#09090b] border border-white/10 rounded-[6px] text-xs py-1.5 pl-8 pr-3"
          />
          <Search size={14} className="absolute left-2.5 top-2.5 text-[#86868b]" />
        </div>
      </div>

      {/* Thread List */}
      <div className="space-y-3">
        {filteredThreads.map((thread) => (
          <div key={thread.id} className="apple-card p-4 hover:border-white/20 transition-all flex items-start gap-4 cursor-pointer">
            <div className="p-2.5 bg-indigo-500/10 rounded-[6px] border border-indigo-500/20 text-indigo-400 self-start">
              <MessageCircle size={16} />
            </div>

            <div className="flex-1 space-y-1.5 min-w-0">
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-white/5 border border-white/5 rounded text-[#86868b]">
                {thread.category}
              </span>
              <h3 className="text-xs sm:text-sm font-bold text-white hover:text-indigo-400 transition-colors line-clamp-1">{thread.title}</h3>
              <p className="text-[10px] text-[#86868b]">
                Diposting oleh <span className="text-slate-300 font-bold">@{thread.author}</span> • {thread.time}
              </p>
            </div>

            <div className="flex items-center gap-4 text-[#86868b] text-[10px] font-bold self-center">
              <span className="flex items-center gap-1">
                <ThumbsUp size={12} />
                <span>{thread.likes}</span>
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare size={12} />
                <span>{thread.replies}</span>
              </span>
              <span className="flex items-center gap-1 hidden sm:inline-flex">
                <Eye size={12} />
                <span>{thread.views}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
