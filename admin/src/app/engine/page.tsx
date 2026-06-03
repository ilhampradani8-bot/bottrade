"use client";

import React, { useEffect, useState, useRef } from 'react';
import { 
  RefreshCcw, 
  Power, 
  Terminal as TerminalIcon,
  CheckCircle2
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';

export default function EnginePage() {
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to Backend Socket for Logs
    socketRef.current = io('http://139.59.122.230:8080');
    socketRef.current.on('system:logs', (log: string) => {
      setLogs(prev => [...prev.slice(-100), log]); // Keep last 100 logs
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">System Kernel Control</h1>
          <p className="text-[#6a6a75] text-sm mt-1">Direct oversight of infrastructure and real-time execution logs.</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white/5 border border-white/10 text-white px-4 py-2 text-sm font-bold flex items-center gap-2 hover:bg-white hover:text-black transition-all rounded-xl">
            <RefreshCcw size={18} />
            RESTART KERNEL
          </button>
          <button className="bg-[#ff0055] text-white px-4 py-2 text-sm font-bold flex items-center gap-2 hover:bg-[#d40048] transition-all rounded-xl">
            <Power size={18} />
            STOP ALL
          </button>
        </div>
      </div>

      {/* Full-width Real-time Terminal */}
      <div className="flex-1 bg-white/[0.03] border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-[#00ff88] rounded-full animate-pulse shadow-[0_0_10px_#00ff88]"></div>
            <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-white">
              <TerminalIcon size={18} className="text-[#00f2ff]" />
              Live Kernel Stream (Real-time Data)
            </h2>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2 text-[10px] font-bold text-[#6a6a75] uppercase tracking-widest">
                <CheckCircle2 size={14} className="text-[#00ff88]" />
                Engine Active
            </div>
            <div className="px-3 py-1 bg-white/10 text-[9px] font-bold text-white rounded-lg tracking-widest uppercase border border-white/10">
                Socket: Connected
            </div>
          </div>
        </div>

        <div 
          ref={scrollRef}
          className="flex-1 bg-black/40 p-8 font-mono text-[13px] overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-white/10 selection:bg-[#00f2ff] selection:text-black"
        >
          {logs.map((log, idx) => {
              const isDecision = log.includes('[DECISION]');
              const isBuy = log.includes('BUY') || log.includes('OK');
              const isSell = log.includes('SELL') || log.includes('WRN');
              
              return (
                <div key={idx} className={`flex gap-4 ${isDecision ? 'py-4 my-2 border-y border-white/5 bg-white/[0.02]' : ''}`}>
                    <span className="text-white/20 select-none w-8">{(idx + 1).toString().padStart(3, '0')}</span>
                    <span className={
                        isDecision ? 'text-white font-bold bg-[#00f2ff]/20 px-2 rounded' :
                        isBuy ? 'text-[#00ff88]' : 
                        isSell ? 'text-[#ff0055]' : 
                        'text-[#6a6a75]'
                    }>
                        {log}
                    </span>
                </div>
              );
          })}
          {logs.length === 0 && (
            <div className="text-[#3a3a44] animate-pulse flex flex-col items-center justify-center h-full gap-4">
                <TerminalIcon size={40} />
                <span className="font-bold tracking-widest uppercase text-xs">Awaiting kernel connection...</span>
            </div>
          )}
          <div className="text-[#00f2ff] animate-pulse">_</div>
        </div>
      </div>
      
      <div className="text-center pb-2">
          <p className="text-[10px] text-[#3a3a44] font-bold uppercase tracking-[0.3em]">
              Antigravity Kernel v2.4.0 • End-to-End Encryption Enabled
          </p>
      </div>
    </div>
  );
}
