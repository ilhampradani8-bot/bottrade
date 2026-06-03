"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import en from './en.json';
import id from './id.json';
import ms from './ms.json';

const translations: any = { en, id, ms };

const LanguageContext = createContext<any>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState('id');

  useEffect(() => {
    const savedLang = localStorage.getItem('lang');
    if (savedLang) setLang(savedLang);
  }, []);

  const t = (path: string) => {
    const keys = path.split('.');
    let result = translations[lang];
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
