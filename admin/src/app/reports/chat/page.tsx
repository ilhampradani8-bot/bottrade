"use client";

import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { 
  Send, 
  User, 
  MessageSquare, 
  ShieldCheck, 
  Search,
  CheckCheck,
  Bell,
  Command
} from 'lucide-react';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'admin';
  time: string;
}

const SOCKET_URL = "http://139.59.122.230:8080";

export default function AdminChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const socketRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('chat:receive', (data: any) => {
        // Automatically set selected user if we receive from someone
        if (data.sender === 'user' && !selectedUserId) {
            setSelectedUserId(data.user_id);
        }

        setMessages(prev => [...prev, {
            id: Date.now(),
            text: data.text,
            sender: data.sender,
            user_id: data.user_id,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
    });

    return () => {
        socketRef.current.disconnect();
    };
  }, [selectedUserId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedUserId) return;

    const msgData = {
        text: input,
        sender: 'admin',
        user_id: selectedUserId
    };

    socketRef.current.emit('chat:send', msgData);
    
    setMessages(prev => [...prev, {
        id: Date.now(),
        text: input,
        sender: 'admin',
        user_id: selectedUserId,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-700">
      <div className="flex-1 flex gap-8 overflow-hidden">
        {/* Sidebar: Active Chats */}
        <aside className="w-80 apple-card flex flex-col overflow-hidden">
            <div className="p-6 border-b border-white/5">
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Search active users" 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-xs font-medium outline-none focus:border-blue-500/30 transition-all"
                    />
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <div className="p-4 bg-white/10 rounded-2xl border border-white/10 flex items-center gap-4 cursor-pointer">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <User size={20} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white tracking-tight">Support_01</p>
                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Active Now</p>
                    </div>
                </div>
                {[2, 3].map((i) => (
                    <div key={i} className="p-4 hover:bg-white/5 rounded-2xl transition-all flex items-center gap-4 cursor-pointer opacity-50 hover:opacity-100 group">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                            <User size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-400 group-hover:text-white transition-colors">Client_{i}42</p>
                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Offline</p>
                        </div>
                    </div>
                ))}
            </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 apple-card flex flex-col relative overflow-hidden">
            <header className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <h2 className="text-sm font-bold tracking-tight uppercase">Live Session: Support_01</h2>
                </div>
                <button className="p-2 text-slate-500 hover:text-white transition-colors">
                    <Command size={16} />
                </button>
            </header>

            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-10 space-y-6 scale-90">
                        <MessageSquare size={120} strokeWidth={1} />
                        <p className="text-sm font-bold uppercase tracking-[0.6em]">Secure Bridge Active</p>
                    </div>
                ) : messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500`}>
                        <div className={`max-w-[70%] flex flex-col ${msg.sender === 'admin' ? 'items-end' : 'items-start'}`}>
                            <div className={`p-5 text-sm font-medium leading-relaxed rounded-3xl shadow-sm ${
                                msg.sender === 'admin' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white/10 text-slate-200 border border-white/5'
                            }`}>
                                {msg.text}
                            </div>
                            <div className="flex items-center gap-3 mt-3 px-2">
                                <span className="text-[10px] font-bold text-[#86868b] uppercase tabular-nums">{msg.time}</span>
                                {msg.sender === 'admin' && <CheckCheck size={14} className="text-blue-500" />}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <footer className="p-8 border-t border-white/5">
                <form onSubmit={handleSend} className="bg-white/5 border border-white/10 rounded-3xl p-2 flex items-center gap-2 group focus-within:border-white/20 transition-all">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Send message to user..."
                        className="flex-1 bg-transparent border-none outline-none p-4 text-sm font-medium text-white placeholder:text-[#86868b] tracking-tight"
                    />
                    <button 
                        type="submit"
                        className="w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-all flex items-center justify-center group/btn shadow-lg shadow-blue-600/20"
                    >
                        <Send size={18} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-all" />
                    </button>
                </form>
            </footer>
        </main>
      </div>
    </div>
  );
}
