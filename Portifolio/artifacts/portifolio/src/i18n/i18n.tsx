import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import en from './locales/en.json';
import pt from './locales/pt.json';
import es from './locales/es.json';

export type Language = 'en' | 'pt' | 'es';

const translations = {
  en,
  pt,
  es,
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string | string[] | Record<string, any>;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('language') as Language | null;
      if (saved && saved in translations) return saved;
      
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'pt') return 'pt';
      if (browserLang === 'es') return 'es';
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
    }
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let current: any = translations[language];

    for (const k of keys) {
      if (current && typeof current === 'object') {
        current = current[k];
      } else {
        return key;
      }
    }

    return typeof current === 'string' ? current : key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
