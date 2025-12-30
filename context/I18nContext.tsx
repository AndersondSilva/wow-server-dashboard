import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { translations } from '../translations';

export type Language = 'pt-PT' | 'pt-BR' | 'en';

interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations) => string;
  locale: string;
  formatDate: (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const DEFAULT_LANG: Language = 'pt-PT';

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(DEFAULT_LANG);

  useEffect(() => {
    const stored = localStorage.getItem('lang');
    if (stored === 'pt-BR' || stored === 'pt-PT' || stored === 'en') {
      setLanguage(stored as Language);
    }
  }, []);

  const locale = useMemo(() => {
    switch (language) {
      case 'pt-BR':
        return 'pt-BR';
      case 'pt-PT':
        return 'pt-PT';
      case 'en':
      default:
        return 'en-US';
    }
  }, [language]);

  const t = (key: keyof typeof translations) => {
    const entry = translations[key];
    const value = entry?.[language] ?? entry?.['pt-PT'] ?? key;
    return value;
  };

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('lang', lang);
  };

  const formatDate = (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => {
    try {
      const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
      return new Intl.DateTimeFormat(locale, options || { dateStyle: 'medium' }).format(date);
    } catch {
      return String(value);
    }
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage: handleSetLanguage, t, locale, formatDate }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};

