"use client";

import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { 
  Send, 
  User, 
  MessageSquare, 
  Search,
  CheckCheck,
  RefreshCcw,
  Database
} from 'lucide-react';

interface ChatSession {
  id: string;
  user_id: number;
  name: string;
  notes?: string;
}

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'admin';
  created_at: string;
  time?: string; // formatted time
}

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || window.location.port === '3000' || window.location.port === '3001' || window.location.port === '8081') {
      return `http://${hostname}:8080`;
    }
    return `${protocol}//${hostname}`;
  }
  return '';
};

export default function AdminChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showDbInfo, setShowDbInfo] = useState(false);
  
  // States for name & notes editing and user profiling
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [updatingSession, setUpdatingSession] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [chatUser, setChatUser] = useState<any>(null);
  const socketRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const res = await fetch(`${getApiBaseUrl()}/api/chat/sessions`, {
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error("Failed to fetch chat sessions:", err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchHistory = async (session: ChatSession) => {
    try {
      setLoadingHistory(true);
      const res = await fetch(`${getApiBaseUrl()}/api/chat/history?session_id=${session.id}`, {
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Failed to fetch chat history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const selectedSessionRef = useRef<ChatSession | null>(null);

  useEffect(() => {
    selectedSessionRef.current = selectedSession;
  }, [selectedSession]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/admin/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  // Connect to Real-time Socket.io Bridge
  useEffect(() => {
    const socket = io(getApiBaseUrl());
    socketRef.current = socket;

    const onConnect = () => {
      console.log("Admin socket connected successfully");
      socket.emit('chat:join', { role: 'admin' });
      // If a session is already selected, mark it as read immediately
      if (selectedSessionRef.current) {
        socket.emit('chat:read', { session_id: selectedSessionRef.current.id });
      }
    };

    socket.on('connect', onConnect);

    socket.on('chat:receive', (data: any) => {
      console.log("Admin socket chat:receive event data:", data);
      const currentSession = selectedSessionRef.current;
      console.log("Admin current active session in ref:", currentSession);
      
      // Unconditionally refresh the sessions list to show new messages/badges
      fetchSessions();

      if (currentSession && data.session_id === currentSession.id) {
        console.log("Match found! Appending message to messages list.");
        setMessages(prev => {
          // Avoid duplicate appends for optimistic messages
          const isDuplicate = prev.some(m => 
            (data.id && m.id === data.id) || 
            (m.text === data.text && m.sender === data.sender && m.id > 1000000000000)
          );
          if (isDuplicate) {
            return prev;
          }
          return [
            ...prev, 
            {
              id: data.id || Date.now(),
              text: data.text,
              sender: data.sender,
              created_at: new Date().toISOString()
            }
          ];
        });
        // Notify backend that admin read this message
        socket.emit('chat:read', { session_id: data.session_id });
      } else {
        console.log("No match or no active session selected. Ignored append.");
      }
    });

    fetchSessions();
    fetchUsers();

    return () => {
      socket.disconnect();
    };
  }, []);

  // Update matched user details when users list is loaded or selectedSession changes
  useEffect(() => {
    if (selectedSession && users.length > 0) {
      const matched = users.find(u => Number(u.id) === Number(selectedSession.user_id));
      setChatUser(matched || null);
    } else {
      setChatUser(null);
    }
  }, [selectedSession, users]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectSession = (session: ChatSession) => {
    setSelectedSession(session);
    setEditName(session.name);
    setEditNotes(session.notes || '');
    fetchHistory(session);
    if (socketRef.current) {
      socketRef.current.emit('chat:read', { session_id: session.id });
    }
  };

  const handleUpdateSessionName = async () => {
    if (!selectedSession || !editName.trim()) return;
    try {
      setUpdatingSession(true);
      const res = await fetch(`${getApiBaseUrl()}/api/chat/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedSession.id,
          user_id: selectedSession.user_id,
          name: editName,
          notes: selectedSession.notes
        })
      });
      if (res.ok) {
        setSelectedSession(prev => prev ? { ...prev, name: editName } : null);
        await fetchSessions();
      }
    } catch (err) {
      console.error("Failed to update session name:", err);
    } finally {
      setUpdatingSession(false);
    }
  };

  const handleUpdateSessionNotes = async () => {
    if (!selectedSession) return;
    try {
      setUpdatingSession(true);
      const res = await fetch(`${getApiBaseUrl()}/api/chat/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedSession.id,
          user_id: selectedSession.user_id,
          name: selectedSession.name,
          notes: editNotes
        })
      });
      if (res.ok) {
        setSelectedSession(prev => prev ? { ...prev, notes: editNotes } : null);
        await fetchSessions();
      }
    } catch (err) {
      console.error("Failed to update session notes:", err);
    } finally {
      setUpdatingSession(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedSession) return;

    const msgData = {
      text: input,
      sender: 'admin',
      user_id: 0, // Admin sender ID indicator
      recipient_id: selectedSession.user_id, // Sent back to the client
      session_id: selectedSession.id
    };

    // Emit live to WebSocket
    socketRef.current.emit('chat:send', msgData);
    
    // Optimistic UI update
    setMessages(prev => [
      ...prev, 
      {
        id: Date.now(),
        text: input,
        sender: 'admin',
        created_at: new Date().toISOString()
      }
    ]);

    setInput('');
  };

  const filteredSessions = sessions.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="w-[calc(100%+4rem)] -mx-8 -my-8 flex h-[calc(100vh-80px)] overflow-hidden bg-black/10 animate-in fade-in duration-300">
      {/* Sidebar: Active Chats */}
      <aside className="w-80 border-r border-white/5 flex flex-col overflow-hidden bg-[#050507]/20 shrink-0">
        <div className="p-6 border-b border-white/5 bg-[#050507]/40 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-extrabold tracking-wider uppercase text-[#86868b]">Active Sessions</h3>
            <button 
              onClick={fetchSessions}
              className="text-[#86868b] hover:text-white p-1 rounded hover:bg-white/5 transition-all cursor-pointer"
            >
              <RefreshCcw size={11} className={loadingSessions ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="relative">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user sessions..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 pl-9 text-xs font-semibold outline-none focus:border-[#00f2ff]/30 transition-all text-white placeholder:text-[#86868b]"
            />
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {loadingSessions ? (
            <div className="py-20 text-center text-[#6a6a75] font-extrabold uppercase text-[9px] tracking-widest animate-pulse">
              Loading sessions...
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="py-20 text-center text-[#6a6a75] font-extrabold uppercase text-[9px] tracking-widest">
              No sessions found
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = selectedSession?.id === session.id;
              return (
                <div 
                  key={session.id} 
                  onClick={() => handleSelectSession(session)}
                  className={`p-4 rounded-2xl flex items-center gap-4 cursor-pointer transition-all border ${
                    isActive 
                      ? 'bg-[#00f2ff]/5 border-[#00f2ff]/20 text-white' 
                      : 'bg-white/5 hover:bg-white/[0.08] border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg shrink-0 ${
                    isActive 
                      ? 'bg-[#00f2ff] text-black shadow-[#00f2ff]/10' 
                      : 'bg-white/5 text-slate-400'
                  }`}>
                    <User size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-extrabold tracking-wider uppercase truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                      {session.name}
                    </p>
                    <p className="text-[9px] text-[#86868b] font-mono truncate mt-0.5">
                      UID: {session.user_id}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-black/5">
        <header className="px-8 py-4 border-b border-white/5 flex justify-between items-center bg-[#050507]/40 shrink-0">
          {selectedSession ? (
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#00ff88] rounded-full animate-pulse"></div>
              <h2 className="text-[10px] font-extrabold tracking-[0.2em] uppercase text-white">
                Live Session: {selectedSession.name}
              </h2>
            </div>
          ) : (
            <div>
              <h2 className="text-[10px] font-extrabold tracking-[0.2em] uppercase text-[#86868b]">
                No Session Selected
              </h2>
            </div>
          )}
          
          <button 
            onClick={() => setShowDbInfo(true)}
            className="w-7 h-7 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 flex items-center justify-center font-black text-xs cursor-pointer transition-all"
            title="Database Schema Relations"
          >
            !
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 custom-scrollbar bg-black/10">
          {!selectedSession ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-4 scale-95">
              <MessageSquare size={64} className="text-[#86868b]" strokeWidth={1.5} />
              <p className="text-[10px] font-extrabold uppercase tracking-[0.5em] text-[#86868b]">
                Select a user chat session to start
              </p>
            </div>
          ) : loadingHistory ? (
            <div className="h-full flex items-center justify-center text-[#6a6a75] font-extrabold uppercase text-[9px] tracking-widest animate-pulse">
              Retrieving database logs...
            </div>
          ) : (
            <>
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-25 space-y-4">
                  <MessageSquare size={48} className="text-[#86868b]" />
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-[#86868b]">
                    No messages in this chat session
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isAdmin = msg.sender === 'admin';
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
                    >
                      <div className={`max-w-[70%] flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                        <div className={`p-4 text-xs font-semibold leading-relaxed rounded-2xl ${
                          isAdmin 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/5' 
                            : 'bg-white/10 text-slate-200 border border-white/5'
                        }`}>
                          {msg.text}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 px-2">
                          <span className="text-[9px] font-bold text-[#86868b] uppercase tabular-nums">
                            {formatTime(msg.created_at)}
                          </span>
                          {isAdmin && <CheckCheck size={12} className="text-blue-500" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        {selectedSession && (
          <footer className="p-6 border-t border-white/5 bg-[#050507]/20 shrink-0">
            <form onSubmit={handleSend} className="bg-white/5 border border-white/10 rounded-2xl p-1.5 flex items-center gap-2 focus-within:border-white/20 transition-all">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Send message to user..."
                className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-xs font-semibold text-white placeholder:text-[#86868b] tracking-tight"
              />
              <button 
                type="submit"
                className="w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-lg shadow-blue-600/20"
              >
                <Send size={14} />
              </button>
            </form>
          </footer>
        )}
      </main>

      {/* Right Panel: Session & User Details */}
      {selectedSession && (
        <aside className="w-80 border-l border-white/5 flex flex-col overflow-hidden bg-[#050507]/20 shrink-0">
          <div className="p-6 border-b border-white/5 bg-[#050507]/40 flex flex-col gap-1">
            <h3 className="text-[10px] font-extrabold tracking-wider uppercase text-[#86868b]">Session Details</h3>
            <p className="text-xs font-semibold text-slate-300">UID: {selectedSession.user_id}</p>
          </div>
          <div className="p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
            {/* Session Name Editor */}
            <div className="space-y-2">
              <label className="text-[9px] font-extrabold tracking-wider uppercase text-[#86868b]">Session Name</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-[#00f2ff]/30 text-white"
                />
                <button 
                  onClick={handleUpdateSessionName}
                  disabled={updatingSession}
                  className="px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs cursor-pointer transition-all disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Session Notes Editor */}
            <div className="space-y-2">
              <label className="text-[9px] font-extrabold tracking-wider uppercase text-[#86868b]">Session Notes</label>
              <textarea 
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Write internal notes about this user or chat session here..."
                className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-semibold outline-none focus:border-[#00f2ff]/30 text-white placeholder:text-slate-600 resize-none"
              />
              <button 
                onClick={handleUpdateSessionNotes}
                disabled={updatingSession}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs cursor-pointer transition-all disabled:opacity-50 uppercase tracking-wider"
              >
                {updatingSession ? 'Saving...' : 'Save Notes'}
              </button>
            </div>

            {/* User Details */}
            <div className="space-y-3 pt-4 border-t border-white/5">
              <label className="text-[9px] font-extrabold tracking-wider uppercase text-[#86868b] block">User Profile</label>
              {chatUser ? (
                <div className="space-y-2 text-xs font-semibold text-[#86868b]">
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5 space-y-1">
                    <span className="text-[9px] text-[#86868b] uppercase block">Username</span>
                    <span className="text-white block font-bold">{chatUser.username}</span>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5 space-y-1">
                    <span className="text-[9px] text-[#86868b] uppercase block">Email</span>
                    <span className="text-white block font-mono truncate">{chatUser.email}</span>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5 space-y-1">
                    <span className="text-[9px] text-[#86868b] uppercase block">WhatsApp</span>
                    <span className="text-white block font-mono">{chatUser.whatsapp_number || '-'}</span>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5 space-y-1">
                    <span className="text-[9px] text-[#86868b] uppercase block">Telegram</span>
                    <span className="text-white block font-mono">{chatUser.telegram || '-'}</span>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-slate-500 font-extrabold uppercase py-4">No user details matched</div>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* Database Schema Relation Modal */}
      {showDbInfo && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#070709] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-white/5 bg-[#0e0e12] flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400">
                <Database size={15} />
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-white">Database Schema Relations</h3>
              </div>
              <button 
                onClick={() => setShowDbInfo(false)}
                className="text-[#86868b] hover:text-white text-[10px] font-extrabold uppercase tracking-widest cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="p-6 space-y-5 text-xs text-[#86868b]">
              <div>
                <h4 className="text-white font-bold mb-1.5 uppercase text-[10px] tracking-wider text-amber-500">1. chat_sessions_by_chat</h4>
                <p className="leading-relaxed mb-2">
                  Menyimpan metadata untuk setiap sesi percakapan bantuan yang dibuat oleh pengguna.
                </p>
                <ul className="list-disc pl-4 space-y-1 font-mono text-[10px]">
                  <li><span className="text-white">id</span> (VARCHAR, Primary Key) - Pengenal sesi unik</li>
                  <li><span className="text-white">user_id</span> (INT) - Kunci tamu relasi ke users_by_user</li>
                  <li><span className="text-white">name</span> (VARCHAR) - Nama sesi (umumnya nama pengguna)</li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-bold mb-1.5 uppercase text-[10px] tracking-wider text-amber-500">2. chat_messages_by_chat</h4>
                <p className="leading-relaxed mb-2">
                  Menyimpan semua detail isi pesan chat yang dikirimkan secara real-time.
                </p>
                <ul className="list-disc pl-4 space-y-1 font-mono text-[10px]">
                  <li><span className="text-white">id</span> (SERIAL, Primary Key) - Pengenal pesan unik</li>
                  <li><span className="text-white">session_id</span> (VARCHAR) - Relasi ke chat_sessions_by_chat</li>
                  <li><span className="text-white">sender</span> (VARCHAR) - Tipe pengirim ('user' atau 'admin')</li>
                  <li><span className="text-white">text</span> (TEXT) - Isi pesan teks</li>
                  <li><span className="text-white">user_id</span> (INT, Nullable) - ID pengirim (NULL jika admin)</li>
                  <li><span className="text-white">recipient_id</span> (INT, Nullable) - ID penerima (NULL jika admin)</li>
                  <li><span className="text-white">created_at</span> (TIMESTAMPTZ) - Waktu pengiriman</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
