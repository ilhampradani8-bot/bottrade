import React from 'react';
import { translations } from '../lang';

export default function Footer({ lang = 'en' }) {
  const t = translations[lang] || translations.en;

  return (
    <footer id="about" className="w-full bg-[#09090b] text-slate-400 px-6 md:px-12 lg:px-20 pt-16 pb-12 mt-20 border-t border-slate-800 relative z-10">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        
        {/* Brand Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white">
            <div className="w-6 h-6 bg-[#F1BF0A] rounded-[5px] flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
              </svg>
            </div>
            <span className="font-anton tracking-wider text-sm uppercase text-white">TRADINGSAFE</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed uppercase tracking-wider">
            {t.footer_tagline}
          </p>
          <div className="flex items-center gap-3 pt-2">
            <a href="#" className="w-7 h-7 rounded-full bg-slate-800/60 hover:bg-slate-700 text-white flex items-center justify-center transition-all" aria-label="Twitter">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="#" className="w-7 h-7 rounded-full bg-slate-800/60 hover:bg-slate-700 text-white flex items-center justify-center transition-all" aria-label="Instagram">
              <svg className="w-3.5 h-3.5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            <a href="#" className="w-7 h-7 rounded-full bg-slate-800/60 hover:bg-slate-700 text-white flex items-center justify-center transition-all" aria-label="GitHub">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Column 2: Trading Bots */}
        <div className="space-y-4">
          <h4 className="text-white text-xs font-black uppercase tracking-widest">{t.footer_collections}</h4>
          <ul className="space-y-2 text-xs uppercase tracking-wider font-semibold">
            <li><a href="#bots" className="hover:text-white transition-colors">{t.bot_grid_title}</a></li>
            <li><a href="#bots" className="hover:text-white transition-colors">{t.bot_dca_title}</a></li>
            <li><a href="#bots" className="hover:text-white transition-colors">{t.bot_btd_title}</a></li>
          </ul>
        </div>

        {/* Column 3: Platform */}
        <div className="space-y-4">
          <h4 className="text-white text-xs font-black uppercase tracking-widest">{t.footer_platform}</h4>
          <ul className="space-y-2 text-xs uppercase tracking-wider font-semibold">
            <li><a href="/" className="hover:text-white transition-colors">{t.nav_dashboard}</a></li>
            <li><a href="/" className="hover:text-white transition-colors">{t.nav_terminal}</a></li>
            <li><a href="/" className="hover:text-white transition-colors">{t.nav_security}</a></li>
            <li><a href="#home" className="hover:text-white transition-colors">{t.nav_home}</a></li>
          </ul>
        </div>

        {/* Column 4: Newsletter */}
        <div className="space-y-4">
          <h4 className="text-white text-xs font-black uppercase tracking-widest">{t.footer_stay}</h4>
          <p className="text-xs text-slate-500 uppercase tracking-wider leading-relaxed">
            {t.footer_subscribe}
          </p>
          <div className="flex gap-2">
            <input 
              type="email" 
              placeholder="YOUR EMAIL" 
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white uppercase tracking-wider outline-none focus:border-slate-700 transition-colors"
            />
            <button className="bg-[#F1BF0A] text-black hover:bg-[#d8ab09] px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">
              {t.footer_join}
            </button>
          </div>
        </div>

      </div>

      <div className="max-w-6xl mx-auto mt-16 pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-600">
        <div>
          {t.footer_rights}
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-slate-400 transition-colors">{t.footer_privacy}</a>
          <a href="#" className="hover:text-slate-400 transition-colors">{t.footer_terms}</a>
          <a href="#" className="hover:text-slate-400 transition-colors">{t.footer_support}</a>
        </div>
      </div>
    </footer>
  );
}
