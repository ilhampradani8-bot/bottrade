"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import en from './en.json';
import id from './id.json';
import ms from './ms.json';
import fr from './fr.json';
import zh from './zh.json';

const translations: any = { en, id, ms, fr, zh };

const LanguageContext = createContext<any>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState('id');

  useEffect(() => {
    const savedLang = localStorage.getItem('ts_lang') || localStorage.getItem('lang');
    if (savedLang) setLang(savedLang);
  }, []);

  const t = (path: string) => {
    const keys = path.split('.');
    let result = translations[lang] || translations['id'];
    for (const key of keys) {
      if (result && result[key]) {
        result = result[key];
      } else {
        return path;
      }
    }
    return result;
  };

  const changeLanguage = (newLang: string) => {
    setLang(newLang);
    localStorage.setItem('ts_lang', newLang);
    localStorage.setItem('lang', newLang);
  };

  return (
    <LanguageContext.Provider value={{ lang, t, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
