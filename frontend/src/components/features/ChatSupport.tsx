"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X,
  MessageSquare,
  Send
} from 'lucide-react';
import { io } from 'socket.io-client';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'admin';
  time: string;
  status: 'sent' | 'delivered' | 'read';
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

// Generate or retrieve a persistent guest ID from localStorage
const getGuestId = (): string => {
  if (typeof window === 'undefined') return 'guest_0';
  let guestId = localStorage.getItem('chat_guest_id');
  if (!guestId) {
    guestId = `guest_${Math.random().toString(36).substring(2, 10)}`;
    localStorage.setItem('chat_guest_id', guestId);
  }
  return guestId;
};

export default function ChatSupport() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      text: "Halo! Selamat datang di TradingSafe Support. Ada yang bisa kami bantu mengenai robot trading atau konfigurasi API Anda hari ini?",
      sender: 'admin',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'read'
    }
  ]);

  // Sync window event for bubble visibility from other components
  useEffect(() => {
    const saved = localStorage.getItem('show_chat_bubble');
    if (saved === 'false') {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }

    const handleToggle = (e: any) => {
      setIsVisible(e.detail !== false);
    };
    window.addEventListener('chat-bubble-visibility', handleToggle);
    return () => window.removeEventListener('chat-bubble-visibility', handleToggle);
  }, []);
  
  const [input, setInput] = useState('');
  const [user, setUser] = useState<any>(null);
  const [chatIdentity, setChatIdentity] = useState<{ id: string | number; isGuest: boolean } | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const initialScrollDone = useRef(false);

  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Sync window event to trigger open from other pages
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setUnreadCount(0);
    };
    window.addEventListener('open-chat-support', handleOpen);
    return () => window.removeEventListener('open-chat-support', handleOpen);
  }, []);

  // 1. Determine chat identity: logged-in user or guest
  useEffect(() => {
    const determineIdentity = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const baseUrl = getApiBaseUrl();
          const userRes = await fetch(`${baseUrl}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (userRes.ok) {
            const userData = await userRes.json();
            setUser(userData);
            setChatIdentity({ id: userData.id, isGuest: false });
            return;
          }
        } catch (e) {
          console.error("Failed to fetch user:", e);
        }
      }
      // Not logged in — use guest identity
      const guestId = getGuestId();
      setChatIdentity({ id: guestId, isGuest: true });
    };
    determineIdentity();
  }, []);

  // 2. Fetch latest messages when identity is ready (newest 20 only)
  useEffect(() => {
    if (!chatIdentity) return;

    const fetchLatest = async () => {
        try {
            const baseUrl = getApiBaseUrl();
            const sessionDbId = chatIdentity.isGuest ? chatIdentity.id : `user_${chatIdentity.id}`;
            const historyRes = await fetch(`${baseUrl}/api/chat/history?session_id=${sessionDbId}&user_id=${chatIdentity.id}&limit=20`);
            if (historyRes.ok) {
                const historyData = await historyRes.json();
                const formatted = historyData.map((m: any) => ({
                    id: m.id,
                    text: m.text,
                    sender: m.sender,
                    time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    status: m.is_read ? 'read' : 'sent'
                }));
                
                setHasMore(historyData.length >= 20);
                
                const welcome: Message = {
                  id: 0,
                  text: "Halo! Selamat datang di TradingSafe Support. Ada yang bisa kami bantu mengenai robot trading atau konfigurasi API Anda hari ini?",
                  sender: 'admin',
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  status: 'read'
                };
                
                if (formatted.length > 0) {
                  setMessages([welcome, ...formatted]);
                } else {
                  setMessages([welcome]);
                }
                initialScrollDone.current = false;
            }
        } catch (e) {
            console.error("Failed to fetch history:", e);
        }
    };

    fetchLatest();
  }, [chatIdentity]);

  // Load older messages when scrolling to top
  const loadOlderMessages = useCallback(async () => {
    if (!chatIdentity || loadingOlder || !hasMore) return;
    
    const realMessages = messages.filter(m => m.id > 0);
    if (realMessages.length === 0) return;
    
    setLoadingOlder(true);
    try {
      const baseUrl = getApiBaseUrl();
      const sessionDbId = chatIdentity.isGuest ? chatIdentity.id : `user_${chatIdentity.id}`;
      const historyRes = await fetch(`${baseUrl}/api/chat/history?session_id=${sessionDbId}&user_id=${chatIdentity.id}&limit=20&offset=${realMessages.length}`);
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        if (historyData.length === 0) {
          setHasMore(false);
        } else {
          const formatted = historyData.map((m: any) => ({
            id: m.id,
            text: m.text,
            sender: m.sender,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: m.is_read ? 'read' : 'sent'
          }));
          
          setHasMore(historyData.length >= 20);
          
          const container = chatContainerRef.current;
          const prevHeight = container?.scrollHeight || 0;
          
          setMessages(prev => {
            const withoutWelcome = prev.filter(m => m.id !== 0);
            const welcome = prev.find(m => m.id === 0);
            const merged = welcome 
              ? [welcome, ...formatted, ...withoutWelcome]
              : [...formatted, ...withoutWelcome];
            return merged;
          });
          
          requestAnimationFrame(() => {
            if (container) {
              const newHeight = container.scrollHeight;
              container.scrollTop = newHeight - prevHeight;
            }
          });
        }
      }
    } catch (e) {
      console.error("Failed to load older messages:", e);
    } finally {
      setLoadingOlder(false);
    }
  }, [chatIdentity, loadingOlder, hasMore, messages]);

  // 3. Handle Socket.io connection
  useEffect(() => {
    if (!chatIdentity) return;

    const baseUrl = getApiBaseUrl();
    const socket = io(baseUrl);
    socketRef.current = socket;

    const sessionDbId = chatIdentity.isGuest ? String(chatIdentity.id) : `user_${chatIdentity.id}`;

    const onConnect = () => {
      console.log("Chat socket connected, joining room:", sessionDbId);
      socket.emit('chat:join', { role: 'user', user_id: chatIdentity.id });
    };

    socket.on('connect', onConnect);

    socket.on('chat:receive', (data: any) => {
        console.log("User received chat:receive:", data);
        setMessages(prev => {
          const isDuplicate = prev.some(m => 
            (data.id && m.id === data.id) || 
            (m.text === data.text && m.sender === data.sender && m.id > 1000000000000)
          );
          if (isDuplicate) {
            return prev;
          }
          return [...prev, {
              id: data.id || Date.now(),
              text: data.text,
              sender: data.sender,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: 'read'
          }];
        });

        if (!isOpenRef.current && data.sender === 'admin') {
          setUnreadCount(prev => prev + 1);
        }
    });

    socket.on('chat:read_ack', (data: any) => {
      if (String(data.user_id) === String(chatIdentity.id)) {
        setMessages(prev => prev.map(m => ({ ...m, status: 'read' })));
      }
    });

    return () => {
        socket.disconnect();
    };
  }, [chatIdentity]);

  // Scroll to bottom INSTANTLY on initial load
  useEffect(() => {
    if (!initialScrollDone.current && messages.length > 1) {
      chatEndRef.current?.scrollIntoView({ behavior: "auto" });
      initialScrollDone.current = true;
    }
  }, [messages]);

  // When chat opens, jump to bottom instantly
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "auto" });
      });
    }
  }, [isOpen]);

  // Detect scroll-to-top for loading older messages
  const handleChatScroll = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    if (container.scrollTop < 60 && hasMore && !loadingOlder) {
      loadOlderMessages();
    }
  }, [hasMore, loadingOlder, loadOlderMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chatIdentity || !socketRef.current) return;

    const newMessage: Message = {
      id: Date.now(),
      text: input,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };

    setMessages(prev => [...prev, newMessage]);
    requestAnimationFrame(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
    
    const sessionDbId = chatIdentity.isGuest ? String(chatIdentity.id) : `user_${chatIdentity.id}`;
    socketRef.current.emit('chat:send', {
        text: input,
        sender: 'user',
        user_id: chatIdentity.id,
        session_id: sessionDbId
    });

    setInput('');
  };

  const handleQuickReply = (text: string) => {
    setInput(text);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Pulse Floating Bubble Button */}
      <button 
        onClick={() => {
          setIsOpen(!isOpen);
          setUnreadCount(0);
        }}
        className="fixed bottom-[88px] right-6 lg:bottom-6 lg:right-6 z-[9999] w-14 h-14 bg-gradient-to-tr from-[#00f2ff] to-[#0071e3] hover:from-[#0071e3] hover:to-[#00f2ff] rounded-full shadow-2xl flex items-center justify-center text-white transition-all duration-300 transform hover:scale-110 active:scale-95 group focus:outline-none cursor-pointer"
        aria-label="Open support chat"
      >
        {isOpen ? (
          <X className="w-6 h-6 transition-all duration-300 rotate-90" />
        ) : (
          <MessageSquare className="w-6 h-6 transition-all duration-300 group-hover:rotate-12" />
        )}
        
        {/* Unread badge notification */}
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-black animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="fixed bottom-[158px] right-6 lg:bottom-[88px] lg:right-6 z-[9999] w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-12rem)] bg-[#0c0c0e]/95 rounded-[24px] border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300 font-sans">
          
          {/* Minimal Text Header */}
          <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between shrink-0">
            <div>
              <h4 className="text-sm font-bold text-white tracking-wide">TradingSafe Support</h4>
              <p className="text-[10px] text-emerald-400/80 font-medium flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Online
              </p>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/40 hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-lg cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Scrollable Messages Area */}
          <div 
            ref={chatContainerRef}
            onScroll={handleChatScroll}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-transparent to-black/30"
          >
            {/* Load older messages indicator */}
            {loadingOlder && (
              <div className="text-center py-2">
                <span className="text-[10px] text-white/40 font-semibold animate-pulse">Memuat pesan lama...</span>
              </div>
            )}
            {!hasMore && messages.length > 1 && (
              <div className="text-center py-2">
                <span className="text-[10px] text-white/20 font-semibold">— Awal percakapan —</span>
              </div>
            )}
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-[18px] px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-gradient-to-r from-[#00f2ff] to-[#0071e3] text-white font-medium rounded-tr-none shadow-lg shadow-[#00f2ff]/10' 
                      : 'bg-white/5 text-white/90 border border-white/10 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] text-white/30 mt-1 px-1 font-semibold">
                  {msg.time}
                </span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Suggestion Quick Tags */}
          {messages.length === 1 && (
            <div className="px-4 py-2 flex flex-wrap gap-2 shrink-0 border-t border-white/5 bg-black/50">
              <button 
                type="button"
                onClick={() => handleQuickReply("Bagaimana cara pasang bot?")}
                className="text-[10px] bg-white/5 hover:bg-white/10 text-white/80 px-2.5 py-1 rounded-full border border-white/10 transition-all cursor-pointer font-semibold"
              >
                🤖 Pasang Bot
              </button>
              <button 
                type="button"
                onClick={() => handleQuickReply("Koneksi API bermasalah")}
                className="text-[10px] bg-white/5 hover:bg-white/10 text-white/80 px-2.5 py-1 rounded-full border border-white/10 transition-all cursor-pointer font-semibold"
              >
                🔌 Koneksi API
              </button>
              <button 
                type="button"
                onClick={() => handleQuickReply("Apakah dana aman?")}
                className="text-[10px] bg-white/5 hover:bg-white/10 text-white/80 px-2.5 py-1 rounded-full border border-white/10 transition-all cursor-pointer font-semibold"
              >
                🛡️ Dana Aman?
              </button>
            </div>
          )}

          {/* Input Chat Area */}
          <form 
            onSubmit={handleSend}
            className="p-3 bg-black border-t border-white/5 flex gap-2 items-center shrink-0"
          >
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tulis pesan Anda..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#00f2ff]/50 transition-colors"
            />
            <button 
              type="submit"
              disabled={!input.trim()}
              className="w-8 h-8 rounded-xl bg-gradient-to-r from-[#00f2ff] to-[#0071e3] hover:from-[#0071e3] hover:to-[#00f2ff] text-white flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
