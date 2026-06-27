"use client";

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Sparkles, X, Send, Brain, Bot, ArrowRight, CornerDownLeft, MessageSquareDot } from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

export default function AIAssistant() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      sender: 'ai', 
      text: 'Halo! Saya TradingSafe AI Co-Pilot. Saya bisa membaca layar Anda untuk membantu mendeteksi eror log, menganalisis data, atau membuat saran balasan chat bantuan secara otomatis. Ada yang bisa saya bantu?' 
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Extract visible content from active screen
  const getActiveScreenText = (): string => {
    const mainElement = document.querySelector('main');
    if (mainElement) {
      // Clean up multiple spaces and empty lines to save tokens
      return mainElement.innerText.replace(/\s+/g, ' ').trim();
    }
    return document.body.innerText.replace(/\s+/g, ' ').trim();
  };

  // React-safe DOM input value setter
  const setReactInputValue = (inputEl: HTMLInputElement, value: string) => {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(inputEl, value);
    } else {
      inputEl.value = value;
    }
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    inputEl.focus();
  };

  const handleSend = async (textToSend: string, customIsSuggestReply = false) => {
    if (!textToSend.trim() || isLoading) return;

    if (!customIsSuggestReply) {
      setMessages(prev => [...prev, { sender: 'user', text: textToSend }]);
    }
    
    setInputValue('');
    setIsLoading(true);

    try {
      const pageContent = getActiveScreenText();

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          pageContent: pageContent.substring(0, 12000), // Protect context length limit
          isSuggestReply: customIsSuggestReply
        })
      });

      const data = await response.json();
      
      if (data.reply) {
        if (customIsSuggestReply) {
          // Find the native chat input on the page and insert the reply
          const chatInput = document.querySelector('input[placeholder="Send message to user..."]') as HTMLInputElement;
          if (chatInput) {
            setReactInputValue(chatInput, data.reply);
            setMessages(prev => [...prev, { 
              sender: 'ai', 
              text: `💡 Saran balasan otomatis telah dibuat dan dimasukkan ke kolom input chat:\n\n"${data.reply}"` 
            }]);
          } else {
            setMessages(prev => [...prev, { 
              sender: 'ai', 
              text: `Saran Balasan:\n\n${data.reply}\n\n(Gagal memasukkan otomatis karena kolom input chat tidak ditemukan di halaman ini)` 
            }]);
          }
        } else {
          setMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
        }
      } else if (data.error) {
        setMessages(prev => [...prev, { sender: 'ai', text: `⚠️ Eror: ${data.error}` }]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { sender: 'ai', text: `❌ Gagal menghubungi AI: ${err.message || err}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const explainLogs = () => {
    handleSend("Saya melihat ada eror log atau status bermasalah di layar ini. Bisakah kamu menganalisis log/status eror tersebut dan berikan penjelasan cara memperbaikinya?");
  };

  const analyzeScreen = () => {
    handleSend("Tolong jelaskan secara singkat isi data/informasi yang sedang ditampilkan di layar ini.");
  };

  const suggestReply = () => {
    handleSend("Buatkan saran balasan support chat terbaik untuk pesan terakhir dari pengguna.", true);
  };

  const isChatPage = pathname === '/reports/chat';

  return (
    <>
      <style>{`
        .ai-pulse-glow {
          animation: ai-pulse-glow-anim 3s infinite;
        }
        @keyframes ai-pulse-glow-anim {
          0%, 100% {
            box-shadow: 0 0 15px rgba(0, 242, 255, 0.4), 0 0 5px rgba(0, 242, 255, 0.2);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 25px rgba(0, 242, 255, 0.7), 0 0 12px rgba(0, 242, 255, 0.4);
            transform: scale(1.05);
          }
        }
        .ai-backdrop-glass {
          backdrop-filter: blur(20px);
          background: rgba(10, 10, 14, 0.85);
        }
        .ai-chat-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .ai-chat-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .ai-chat-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 99px;
        }
        .ai-chat-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>

      {/* Floating AI Ball */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 z-[999] hover:scale-110 active:scale-95 ${
          isOpen 
            ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
            : 'bg-gradient-to-tr from-[#00b4d8] to-[#00f2ff] text-black ai-pulse-glow border border-white/20'
        }`}
        title={isOpen ? "Tutup AI Assistant" : "Buka AI Assistant"}
      >
        {isOpen ? <X size={22} strokeWidth={2.5} /> : <Brain size={22} strokeWidth={2.5} />}
      </button>

      {/* Floating AI Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[520px] rounded-3xl border border-white/10 ai-backdrop-glass flex flex-col z-[999] shadow-2xl animate-in slide-in-from-bottom-5 duration-300 overflow-hidden">
          
          {/* Header */}
          <header className="px-5 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00b4d8] to-[#00f2ff] text-black flex items-center justify-center font-black">
                <Bot size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-white flex items-center gap-1.5">
                  AI Co-Pilot
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] inline-block animate-pulse"></span>
                </h4>
                <p className="text-[9px] text-[#86868b] font-medium tracking-tight">Membaca & memandu halaman aktif</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-[#86868b] hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
            >
              <X size={15} />
            </button>
          </header>

          {/* Active Path Indicator */}
          <div className="px-5 py-1.5 bg-white/[0.01] border-b border-white/5 flex items-center gap-2 justify-between">
            <span className="text-[9px] text-[#86868b] font-mono">
              Path: <span className="text-sky-400 font-bold">{pathname}</span>
            </span>
            <span className="text-[9px] text-[#86868b] bg-white/5 px-2 py-0.5 rounded-full font-bold">
              DOM Read Active
            </span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 ai-chat-scrollbar">
            {messages.map((msg, i) => {
              const isAI = msg.sender === 'ai';
              return (
                <div key={i} className={`flex ${isAI ? 'justify-start' : 'justify-end'} items-start gap-2`}>
                  {isAI && (
                    <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5 text-sky-400">
                      <Sparkles size={11} />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl p-3 text-xs font-medium leading-relaxed ${
                    isAI 
                      ? 'bg-white/5 text-slate-200 border border-white/5' 
                      : 'bg-sky-600 text-white shadow-lg shadow-sky-600/10'
                  }`}>
                    {msg.text.split('\n').map((line, key) => (
                      <span key={key}>{line}<br /></span>
                    ))}
                  </div>
                </div>
              );
            })}
            
            {isLoading && (
              <div className="flex justify-start items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-sky-400">
                  <Sparkles size={11} className="animate-spin" />
                </div>
                <div className="bg-white/5 border border-white/5 text-slate-400 text-[9px] font-extrabold uppercase tracking-widest px-3 py-2 rounded-2xl animate-pulse">
                  AI sedang menganalisis halaman...
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Action Chips */}
          <div className="px-4 py-2 bg-white/[0.01] border-t border-white/5 flex gap-2 flex-wrap">
            <button
              onClick={analyzeScreen}
              disabled={isLoading}
              className="text-[9px] font-bold bg-white/5 border border-white/5 hover:bg-white/10 text-sky-300 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all disabled:opacity-50"
            >
              📄 Jelaskan Layar
            </button>
            <button
              onClick={explainLogs}
              disabled={isLoading}
              className="text-[9px] font-bold bg-white/5 border border-white/5 hover:bg-white/10 text-amber-300 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all disabled:opacity-50"
            >
              🚨 Jelaskan Eror
            </button>
            {isChatPage && (
              <button
                onClick={suggestReply}
                disabled={isLoading}
                className="text-[9px] font-bold bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 hover:brightness-110 text-emerald-300 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1"
              >
                <MessageSquareDot size={12} /> Sugesti Balasan
              </button>
            )}
          </div>

          {/* Input Area */}
          <footer className="p-4 border-t border-white/5 bg-white/[0.02]">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(inputValue);
              }}
              className="bg-white/5 border border-white/10 rounded-2xl p-1 flex items-center gap-1 focus-within:border-white/20 transition-all"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Tanya AI atau ketik pesan..."
                className="flex-1 bg-transparent border-none outline-none px-3 py-2.5 text-xs text-white placeholder:text-[#86868b] tracking-tight font-medium"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="w-8 h-8 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg transition-all flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Send size={12} />
              </button>
            </form>
          </footer>

        </div>
      )}
    </>
  );
}
