"use client";

import React, { useState } from 'react';
import { 
  Search,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ShieldAlert,
  Cpu,
  BookOpen
} from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

export default function ChatSupportPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqs: FaqItem[] = [
    {
      category: "Umum",
      question: "Apa itu TradingSafe Bot?",
      answer: "TradingSafe adalah platform penyedia robot trading otomatis (algo-trading) dengan sinkronisasi API Exchange langsung. Platform ini memfasilitasi eksekusi transaksi instan tanpa harus mengirimkan dana trading Anda ke pihak ketiga."
    },
    {
      category: "Konektivitas",
      question: "Bagaimana cara menghubungkan API Exchange?",
      answer: "Masuk ke menu 'Pengaturan API' di dashboard Anda. Masukkan API Key dan Secret Key yang Anda dapatkan dari Exchange (seperti Binance, Tokocrypto, atau Bybit). Pastikan Anda mencentang opsi 'Enable Trading' dan mematikan opsi 'Enable Withdrawal' demi keamanan dana Anda."
    },
    {
      category: "Keamanan",
      question: "Apakah dana saya aman di TradingSafe?",
      answer: "Sangat aman. TradingSafe tidak memegang atau menampung dana Anda. Semua modal Anda tetap berada di wallet exchange pribadi Anda. Kami hanya mengirimkan instruksi beli/jual secara otomatis via API yang telah dienkripsi."
    },
    {
      category: "Robot Trading",
      question: "Bagaimana cara memilih strategi bot yang tepat?",
      answer: "Gunakan menu 'Cari Bot' untuk melihat statistik performa bot secara real-time. Anda bisa memfilter berdasarkan keuntungan historis, drawdown maksimal, dan tingkat risiko sebelum mengaktifkan bot ke akun Anda."
    },
    {
      category: "Sistem",
      question: "Kenapa status bot saya 'Suspended'?",
      answer: "Status 'Suspended' biasanya dipicu oleh koneksi API yang kedaluwarsa, saldo margin tidak mencukupi di akun exchange, atau adanya kegagalan handshake sistem. Periksa tab Notifikasi atau segera hubungi Live Concierge kami."
    }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const triggerLiveChat = () => {
    // Dispatch custom event to open the floating chat widget
    window.dispatchEvent(new CustomEvent('open-chat-support'));
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto w-full text-white font-sans animate-in fade-in duration-300">
      
      {/* Hero Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent">
          Pusat Bantuan &amp; FAQ
        </h1>
        <p className="text-[#86868b] text-sm mt-3 max-w-xl mx-auto leading-relaxed">
          Temukan jawaban atas kendala teknis bot, pengaturan API key, dan tips memaksimalkan strategi robot trading Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: FAQ Accordion */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari solusi atau pertanyaan..."
              className="w-full bg-[#1c1c1e] border border-white/10 rounded-2xl p-4 pl-12 text-sm font-semibold outline-none focus:border-[#00f2ff]/30 transition-all text-white placeholder:text-[#86868b]"
            />
            <Search className="absolute left-4 top-4 text-[#86868b]" size={18} />
          </div>

          <div className="space-y-3">
            {filteredFaqs.map((faq, idx) => (
              <div 
                key={idx}
                className="bg-[#0c0c0e]/80 border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/10"
              >
                <button
                  onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                  className="w-full p-5 flex items-center justify-between text-left focus:outline-none"
                >
                  <div className="flex gap-3.5 items-center">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider bg-[#00f2ff]/10 text-[#00f2ff] px-2.5 py-1 rounded-md">
                      {faq.category}
                    </span>
                    <span className="text-xs font-bold text-white/90">{faq.question}</span>
                  </div>
                  {expandedIndex === idx ? (
                    <ChevronUp size={16} className="text-[#86868b]" />
                  ) : (
                    <ChevronDown size={16} className="text-[#86868b]" />
                  )}
                </button>

                {expandedIndex === idx && (
                  <div className="px-5 pb-5 pt-1 border-t border-white/5 text-xs text-white/70 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}

            {filteredFaqs.length === 0 && (
              <div className="text-center py-10 bg-white/5 rounded-2xl border border-dashed border-white/10 text-white/50 text-xs font-semibold">
                Tidak menemukan hasil untuk pencarian Anda.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Concierge Widget Banner */}
        <div className="space-y-6">
          <div className="bg-gradient-to-b from-[#1c1c1e] to-[#0c0c0e] border border-white/10 rounded-3xl p-6 relative overflow-hidden group shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f2ff]/5 rounded-full blur-2xl group-hover:bg-[#00f2ff]/10 transition-all duration-500"></div>
            
            <div className="w-12 h-12 rounded-2xl bg-[#00f2ff]/10 border border-[#00f2ff]/20 flex items-center justify-center text-[#00f2ff] mb-6">
              <MessageSquare size={22} />
            </div>

            <h3 className="text-base font-extrabold text-white">Live Support Concierge</h3>
            <p className="text-xs text-[#86868b] mt-3 leading-relaxed">
              Ada masalah mendesak? Konsultan ahli kami sedang online dan siap memandu Anda secara langsung via chat.
            </p>

            <button
              onClick={triggerLiveChat}
              className="w-full mt-6 bg-gradient-to-r from-[#00f2ff] to-[#0071e3] hover:from-[#0071e3] hover:to-[#00f2ff] text-white font-bold py-3.5 px-4 rounded-xl text-xs transition-all shadow-lg shadow-[#00f2ff]/15 flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <MessageSquare size={14} />
              <span>Hubungi Chat Realtime</span>
            </button>
          </div>

          {/* Quick Help Card */}
          <div className="bg-[#0c0c0e]/40 border border-white/5 rounded-3xl p-6 space-y-4">
            <h4 className="text-[10px] font-extrabold text-[#86868b] tracking-wider uppercase">Jaminan Keamanan</h4>
            <div className="flex gap-3.5 items-start">
              <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg mt-0.5">
                <Cpu size={14} />
              </div>
              <div>
                <h5 className="text-xs font-bold text-white/90">Eksekusi Non-Custodial</h5>
                <p className="text-[10px] text-white/50 mt-1">Kami tidak memiliki izin menarik dana dari akun exchange Anda.</p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
