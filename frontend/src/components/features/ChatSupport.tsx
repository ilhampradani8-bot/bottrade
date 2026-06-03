"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Paperclip, 
  MoreVertical,
  ArrowRight,
  X,
  FileImage,
  FileText,
  FileSpreadsheet,
  Edit3,
  Plus,
  MessageSquare,
  BookOpen,
  Settings,
  Trash2,
  Check,
  Search
} from 'lucide-react';

import { io } from 'socket.io-client';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'admin';
  time: string;
  status: 'sent' | 'delivered' | 'read';
}

interface ChatSession {
  id: string;
  name: string;
  messages: Message[];
}

const SOCKET_URL = "http://139.59.122.230:8080";

export default function ChatSupport() {
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: 'session-utama',
      name: 'Pusat Bantuan Utama',
      messages: [
        {
          id: 0,
          text: "Halo! Selamat datang di TradingSafe Support. Ada yang bisa kami bantu mengenai robot trading atau konfigurasi API Anda hari ini?",
          sender: 'admin',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'read'
        }
      ]
    }
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string>('session-utama');
  
  const [input, setInput] = useState('');
  const [user, setUser] = useState<any>(null);
  
  // Dropdown & Modal States
  const [showAttachDropdown, setShowAttachDropdown] = useState(false);
  const [showThreeDotsDropdown, setShowThreeDotsDropdown] = useState(false);
  const [attachmentMessage, setAttachmentMessage] = useState<string | null>(null);
  const [supportMessage, setSupportMessage] = useState<string | null>(null);

  // Search Chat list
  const [searchQuery, setSearchQuery] = useState('');

  // Inline editing states
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  useEffect(() => {
    const fetchUserAndHistory = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const apiHost = window.location.hostname;
            // Fetch User
            const userRes = await fetch(`http://${apiHost}:8080/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (userRes.ok) {
                const userData = await userRes.json();
                setUser(userData);

                // Fetch History
                const historyRes = await fetch(`http://${apiHost}:8080/api/chat/history?user_id=${userData.id}`);
                if (historyRes.ok) {
                    const historyData = await historyRes.json();
                    const formatted = historyData.map((m: any) => ({
                        id: m.id,
                        text: m.text,
                        sender: m.sender,
                        time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        status: 'read'
                    }));
                    if (formatted.length > 0) {
                        setSessions(prev => prev.map(s => {
                          if (s.id === 'session-utama') {
                            return {
                              ...s,
                              messages: [
                                {
                                  id: 0,
                                  text: "Halo! Selamat datang di TradingSafe Support. Ada yang bisa kami bantu mengenai robot trading atau konfigurasi API Anda hari ini?",
                                  sender: 'admin',
                                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                  status: 'read'
                                },
                                ...formatted
                              ]
                            };
                          }
                          return s;
                        }));
                    }
                }
            }
        } catch (e) {
            console.error("Chat init error", e);
        }
    };

    fetchUserAndHistory();

    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('chat:receive', (data: any) => {
        // Only show if it's for this user (or from admin to this user)
        if (data.sender === 'admin' && data.user_id === user?.id) {
            setSessions(prev => prev.map(s => {
              if (s.id === activeSessionId) {
                return {
                  ...s,
                  messages: [...s.messages, {
                      id: Date.now(),
                      text: data.text,
                      sender: 'admin',
                      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      status: 'read'
                  }]
                };
              }
              return s;
            }));
        }
    });

    return () => {
        socketRef.current.disconnect();
    };
  }, [user?.id, activeSessionId]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now(),
      text: input,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };

    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          messages: [...s.messages, newMessage]
        };
      }
      return s;
    }));
    
    // Emit to socket
    socketRef.current.emit('chat:send', {
        text: input,
        sender: 'user',
        user_id: user?.id
    });

    setInput('');
  };

  const selectAttachment = (type: string) => {
    setShowAttachDropdown(false);
    setAttachmentMessage(`File attachment type selected: ${type}`);
    setTimeout(() => setAttachmentMessage(null), 3000);
  };

  // Multiple sessions actions
  const createNewSession = () => {
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      name: `Sesi Baru #${sessions.length + 1}`,
      messages: [
        {
          id: 0,
          text: "Halo! Ini adalah sesi obrolan bantuan baru Anda. Silakan ketik pertanyaan Anda.",
          sender: 'admin',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'read'
        }
      ]
    };
    setSessions([...sessions, newSession]);
    setActiveSessionId(newId);
    setShowThreeDotsDropdown(false);
    setSupportMessage("Sesi chat baru berhasil dibuat!");
    setTimeout(() => setSupportMessage(null), 3000);
  };

  const startRenameSession = (id: string, name: string) => {
    setEditingSessionId(id);
    setEditingName(name);
  };

  const saveSessionName = (id: string) => {
    if (!editingName.trim()) return;
    setSessions(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, name: editingName.trim() };
      }
      return s;
    }));
    setEditingSessionId(null);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      setSupportMessage("Gagal: Sesi utama tidak dapat dihapus!");
      setTimeout(() => setSupportMessage(null), 3000);
      return;
    }
    const index = sessions.findIndex(s => s.id === id);
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    
    // If active session was deleted, switch to another one
    if (activeSessionId === id) {
      const nextActiveIndex = index === 0 ? 0 : index - 1;
      setActiveSessionId(newSessions[nextActiveIndex].id);
    }
    setSupportMessage("Sesi berhasil dihapus.");
    setTimeout(() => setSupportMessage(null), 3000);
  };

  const triggerSupportAction = (action: string) => {
    setShowThreeDotsDropdown(false);
    setSupportMessage(`Aksi dipicu: ${action}`);
    setTimeout(() => setSupportMessage(null), 3000);
  };

  return (
    <div className="h-[calc(100vh-96px)] lg:h-[calc(100vh-56px)] animate-in fade-in duration-700 w-full flex flex-col md:flex-row overflow-hidden bg-transparent border-0 shadow-none relative p-0">
      
      {/* Dynamic Alerts / Toast notifications */}
      {attachmentMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-indigo-600 border-2 border-white text-white text-[10px] font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] flex items-center gap-2 rounded-[6px]">
          <span>{attachmentMessage}</span>
          <button onClick={() => setAttachmentMessage(null)}><X size={12} /></button>
        </div>
      )}

      {supportMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-emerald-600 border-2 border-white text-white text-[10px] font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] flex items-center gap-2 rounded-[6px]">
          <span>{supportMessage}</span>
          <button onClick={() => setSupportMessage(null)}><X size={12} /></button>
        </div>
      )}

      {/* LEFT COLUMN: Beranda List Chat - HIDDEN on mobile devices (hidden md:flex) */}
      <aside className="hidden md:flex md:w-64 bg-[#07080a] border-r-2 border-white/20 flex-col shrink-0">
        {/* Chat List Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#0d0e12]">
          <h2 className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
            <MessageSquare size={12} className="text-indigo-400 stroke-[2.5]" /> OBROLAN
          </h2>
          <button 
            onClick={createNewSession}
            className="p-1.5 bg-indigo-600 hover:bg-indigo-500 border border-white/20 text-white rounded-[4px] transition-all flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider"
            title="Sesi Baru"
          >
            <Plus size={10} />
            <span>Baru</span>
          </button>
        </div>

        {/* Search Input for Chats */}
        <div className="p-3 border-b border-white/5 bg-black/10">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Cari obrolan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black border border-white/10 p-2 pl-8 text-[9px] font-bold text-white uppercase tracking-widest outline-none focus:border-indigo-500/40 rounded-[4px]"
            />
            <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* Session Items Loop */}
        <div className="flex-1 overflow-y-auto p-0 space-y-0 custom-scrollbar">
          {sessions
            .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((session) => {
              const isActive = session.id === activeSessionId;
              const lastMsg = session.messages[session.messages.length - 1]?.text || 'Tidak ada pesan';

              return (
                <div 
                  key={session.id}
                  onClick={() => {
                    if (editingSessionId !== session.id) {
                      setActiveSessionId(session.id);
                    }
                  }}
                  className={`w-full p-4 text-left transition-all border-b border-white/5 cursor-pointer group flex items-center justify-between ${
                    isActive 
                      ? 'border-l-4 border-l-indigo-500 bg-white/[0.03]' 
                      : 'border-l-4 border-l-transparent hover:bg-white/[0.01]'
                  }`}
                >
                  <div className="flex-1 min-w-0 mr-2">
                    {editingSessionId === session.id ? (
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="text" 
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveSessionName(session.id);
                          }}
                          className="bg-black border border-white/30 px-2 py-1 text-[10px] font-bold text-white uppercase w-full rounded outline-none"
                          autoFocus
                        />
                        <button 
                          onClick={() => saveSessionName(session.id)}
                          className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-500"
                        >
                          <Check size={10} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <h4 className={`text-[11px] font-black uppercase tracking-wider truncate mb-0.5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                          {session.name}
                        </h4>
                        <p className={`text-[9px] truncate font-bold uppercase ${isActive ? 'text-indigo-400' : 'text-slate-600'}`}>
                          {lastMsg}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Actions inside list items (Rename & Delete) */}
                  {editingSessionId !== session.id && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          startRenameSession(session.id, session.name);
                        }}
                        className={`p-1 rounded hover:bg-white/10 ${isActive ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                        title="Rename"
                      >
                        <Edit3 size={10} />
                      </button>
                      <button 
                        onClick={(e) => deleteSession(session.id, e)}
                        className={`p-1 rounded hover:bg-red-500/20 ${isActive ? 'text-white hover:text-red-200' : 'text-slate-500 hover:text-red-400'}`}
                        title="Hapus"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </aside>

      {/* RIGHT COLUMN: Active Chat Panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-transparent">
        {/* Header - Compact, SVG icon removed */}
        <header className="px-5 py-3 flex justify-between items-center bg-black/40 border-b-2 border-white/20 relative">
          <div>
              <h1 className="text-[10px] sm:text-xs font-black text-white tracking-widest uppercase">
                {activeSession.name}
              </h1>
          </div>
          
          {/* Three-dots trigger dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowThreeDotsDropdown(!showThreeDotsDropdown)}
              className={`p-2 text-slate-400 hover:text-white transition-all rounded-[6px] border ${showThreeDotsDropdown ? 'border-white bg-white/5 text-white' : 'border-transparent hover:border-white/20 hover:bg-white/5'}`}
            >
                <MoreVertical size={14} />
            </button>

            {showThreeDotsDropdown && (
              <div className="absolute right-0 mt-2 w-44 bg-[#0c0d12] border-2 border-white p-1 shadow-[4px_4px_0px_0px_rgba(99,102,241,1)] z-50 rounded-[6px] animate-in fade-in zoom-in-95 duration-200">
                <button 
                  onClick={() => triggerSupportAction('Pengaturan')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[9px] font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-all uppercase rounded-[4px] text-left"
                >
                  <Settings size={12} className="text-indigo-400" />
                  <span>Pengaturan</span>
                </button>
                <button 
                  onClick={createNewSession}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[9px] font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-all uppercase rounded-[4px] text-left"
                >
                  <Plus size={12} className="text-emerald-400" />
                  <span>Sesi Baru</span>
                </button>
                <button 
                  onClick={() => triggerSupportAction('Tutorial')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[9px] font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-all uppercase rounded-[4px] text-left"
                >
                  <BookOpen size={12} className="text-blue-400" />
                  <span>Tutorial</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto py-6 px-6 space-y-6 custom-scrollbar bg-black/20">
          {activeSession.messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} group animate-in slide-in-from-bottom-1 duration-300`}>
              <div className={`max-w-[75%] flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4.5 py-3 text-xs font-semibold leading-relaxed rounded-[6px] border-2 ${
                      msg.sender === 'user' 
                      ? 'bg-indigo-600 text-white border-white shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]' 
                      : 'bg-[#191a23] text-[#e5e5ea] border-white/20 shadow-[3px_3px_0px_0px_rgba(99,102,241,0.05)]'
                  }`}>
                      {msg.text}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 px-1">
                      <span className="text-[8px] font-bold text-slate-500 tabular-nums uppercase">{msg.time}</span>
                  </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <footer className="p-4 bg-black/40 border-t-2 border-white/20 relative">
          {showAttachDropdown && (
            <div className="absolute bottom-20 left-4 w-48 bg-[#0c0d12] border-2 border-white p-1 shadow-[4px_4px_0px_0px_rgba(99,102,241,1)] z-50 rounded-[6px] animate-in fade-in slide-in-from-bottom-2 duration-200">
              <button 
                onClick={() => selectAttachment('Foto / Gambar')}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-all uppercase rounded-[4px] text-left"
              >
                <FileImage size={12} className="text-blue-400" />
                <span>📷 Kirim Foto</span>
              </button>
              <button 
                onClick={() => selectAttachment('Dokumen PDF')}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-all uppercase rounded-[4px] text-left"
              >
                <FileText size={12} className="text-red-400" />
                <span>📄 Dokumen PDF</span>
              </button>
              <button 
                onClick={() => selectAttachment('Spreadsheet Excel')}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-all uppercase rounded-[4px] text-left"
              >
                <FileSpreadsheet size={12} className="text-emerald-400" />
                <span>📊 Excel Sheet</span>
              </button>
            </div>
          )}

          <form onSubmit={handleSend} className="bg-black border-2 border-white/20 rounded-[6px] p-1.5 flex items-center gap-2 focus-within:border-white/50 transition-colors shadow-[3px_3px_0px_0px_rgba(99,102,241,0.2)]">
              <button 
                type="button" 
                onClick={() => setShowAttachDropdown(!showAttachDropdown)}
                className={`p-2.5 text-slate-400 hover:text-white transition-all rounded-[6px] hover:bg-white/5 border ${showAttachDropdown ? 'border-white bg-white/5 text-white' : 'border-transparent'}`}
              >
                  <Paperclip size={16} />
              </button>
              <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Bagaimana kami bisa membantu Anda hari ini?"
                  className="flex-1 bg-transparent border-none outline-none px-2 text-xs font-semibold text-white placeholder:text-slate-600"
              />
              <button 
                  type="submit"
                  disabled={!input.trim()}
                  className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[6px] border-2 border-white flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(255,255,255,0.8)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.8)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              >
                  <ArrowRight size={14} className="font-black" />
              </button>
          </form>
        </footer>

      </div>
    </div>
  );
}
