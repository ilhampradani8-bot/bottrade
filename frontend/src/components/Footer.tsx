"use client";

import React, { useState } from 'react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Send,
  ChevronRight
} from 'lucide-react';

export default function Footer({ setActiveView }: { setActiveView?: (view: string) => void }) {
  const [showFull, setShowFull] = useState(false);

  return (
    <footer className="border-t border-white/5 bg-black/40 px-6 py-4 shrink-0 w-full transition-all duration-300">
      
      {/* 1. Default Minimalist Footer View (Only Copyright and toggle button >) */}
      <div className="flex justify-between items-center w-full">
        {/* Left Side: Clean Copyright Text (Clicking TradingSafe takes you to Landing Page) */}
        <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 select-none flex items-center gap-1">
          <span>© 2026</span>
          <button 
            onClick={() => setActiveView && setActiveView('landing')}
            className="text-slate-400 hover:text-white transition-colors bg-transparent border-none p-0 font-bold uppercase tracking-widest text-[11px] cursor-pointer"
          >
            TRADINGSAFE
          </button>
          <span>. ALL RIGHTS RESERVED.</span>
        </div>

        {/* Right Side: Sleek minimal toggle button > */}
        <div>
          <button 
            type="button"
            onClick={() => setShowFull(!showFull)}
            className="w-6 h-6 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-[4px] border border-white/10 hover:border-white/20 transition-all cursor-pointer"
            title="More Info"
          >
            <ChevronRight 
              size={12} 
              className={`transform transition-transform duration-300 ${showFull ? 'rotate-90' : ''}`} 
            />
          </button>
        </div>
      </div>

      {/* 2. Expanded Premium Apple-Vibe View */}
      {showFull && (
        <div className="mt-6 pt-6 border-t border-white/5 animate-in slide-in-from-bottom-2 duration-300">
          
          {/* Row 1: CTA Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-white/5 text-[11px] font-medium tracking-wide text-slate-400">
            {/* CTA 1: Find Us */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white/5 rounded-[4px] border border-white/10 text-slate-300 shrink-0">
                <MapPin size={12} />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-white uppercase tracking-widest text-[11px]">Find us</h4>
                <span className="text-slate-500 uppercase tracking-widest text-[11px]">1010 Avenue, SW 54321, New York</span>
              </div>
            </div>
            
            {/* CTA 2: Call Us */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white/5 rounded-[4px] border border-white/10 text-slate-300 shrink-0">
                <Phone size={12} />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-white uppercase tracking-widest text-[11px]">Call us</h4>
                <span className="text-slate-500 uppercase tracking-widest text-[11px]">+1 234 567 890</span>
              </div>
            </div>

            {/* CTA 3: Mail Us */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white/5 rounded-[4px] border border-white/10 text-slate-300 shrink-0">
                <Mail size={12} />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-white uppercase tracking-widest text-[11px]">Mail us</h4>
                <span className="text-slate-500 uppercase tracking-widest text-[11px]">support@tradingsafe.com</span>
              </div>
            </div>
          </div>

          {/* Row 2: Widgets Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-6 text-[11px] font-medium tracking-wide text-slate-400">
            {/* Col 1: Brand & Pitch */}
            <div className="space-y-3">
              <h3 className="font-bold text-white uppercase tracking-widest text-[11px]">About TradingSafe</h3>
              <p className="text-slate-500 uppercase tracking-widest text-[11px] leading-relaxed">
                TradingSafe is a state of the art analytics and bot suite designed for quantitative traders globally. Optimize strategy execution with ultra-low latencies.
              </p>
              {/* Social Media icons using custom robust inline SVG vector graphics */}
              <div className="flex items-center gap-2">
                <a href="#" className="w-6 h-6 bg-white/5 hover:bg-indigo-600 border border-white/5 hover:border-white/20 text-white rounded-[4px] flex items-center justify-center transition-all" aria-label="Facebook">
                  <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                  </svg>
                </a>
                <a href="#" className="w-6 h-6 bg-white/5 hover:bg-indigo-600 border border-white/5 hover:border-white/20 text-white rounded-[4px] flex items-center justify-center transition-all" aria-label="Twitter">
                  <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="w-6 h-6 bg-white/5 hover:bg-indigo-600 border border-white/5 hover:border-white/20 text-white rounded-[4px] flex items-center justify-center transition-all" aria-label="Instagram">
                  <svg className="w-2.5 h-2.5 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
              </div>
            </div>

            {/* Col 2: Useful links */}
            <div className="space-y-3">
              <h3 className="font-bold text-white uppercase tracking-widest text-[11px]">Useful Links</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-slate-500 uppercase tracking-widest text-[11px]">
                <button 
                  onClick={() => setActiveView && setActiveView('landing')} 
                  className="hover:text-white transition-colors text-left bg-transparent border-none p-0 cursor-pointer font-bold uppercase tracking-widest text-[11px] outline-none"
                >
                  Home
                </button>
                <button 
                  onClick={() => setActiveView && setActiveView('overview')} 
                  className="hover:text-white transition-colors text-left bg-transparent border-none p-0 cursor-pointer font-bold uppercase tracking-widest text-[11px] outline-none"
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => setActiveView && setActiveView('chat')} 
                  className="hover:text-white transition-colors text-left bg-transparent border-none p-0 cursor-pointer font-bold uppercase tracking-widest text-[11px] outline-none"
                >
                  Concierge
                </button>
                <a href="#portfolio" className="hover:text-white transition-colors">Portfolio</a>
                <a href="#contact" className="hover:text-white transition-colors">Contact</a>
                <a href="#terms" className="hover:text-white transition-colors">Terms</a>
                <a href="#privacy" className="hover:text-white transition-colors">Privacy</a>
                <a href="#policy" className="hover:text-white transition-colors">Policy</a>
              </div>
            </div>

            {/* Col 3: Newsletter Subscribe Form */}
            <div className="space-y-3">
              <h3 className="font-bold text-white uppercase tracking-widest text-[11px]">Subscribe</h3>
              <p className="text-slate-500 uppercase tracking-widest text-[11px] leading-relaxed">
                Join our newsletter feeds to receive quantitative indicators and new features updates directly.
              </p>
              <div className="relative flex items-center">
                <input 
                  type="text" 
                  placeholder="Email Address" 
                  className="w-full bg-black/30 border border-white/10 p-2.5 pr-10 text-[11px] font-bold text-white uppercase tracking-widest outline-none focus:border-indigo-500/40 rounded-[4px]"
                />
                <button className="absolute right-1 p-1.5 bg-white/5 hover:bg-white/10 text-white rounded-[4px] border border-white/10 transition-all cursor-pointer" aria-label="Subscribe">
                  <Send size={10} />
                </button>
              </div>
            </div>
          </div>

          {/* Row 3: Bottom Copyright area */}
          <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] font-bold uppercase tracking-widest text-slate-500 select-none">
            <div>
              Copyright &copy; 2026, All Rights Reserved{' '}
              <button 
                onClick={() => setActiveView && setActiveView('landing')} 
                className="text-indigo-400 hover:underline cursor-pointer bg-transparent border-none p-0 inline font-bold uppercase tracking-widest text-[11px]"
              >
                TradingSafe
              </button>
            </div>
            <div className="flex gap-4">
              <a href="#terms" className="hover:text-white transition-colors">Terms</a>
              <a href="#privacy" className="hover:text-white transition-colors">Privacy</a>
              <a href="#policy" className="hover:text-white transition-colors">Policy</a>
              <a href="#contact" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
