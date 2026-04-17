'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Locale, translations } from '@/i18n/translations';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: keyof typeof translations['en']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>('uz');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedLocale = localStorage.getItem('npuu_locale') as Locale;
    if (savedLocale && (savedLocale === 'uz' || savedLocale === 'ru' || savedLocale === 'en')) {
      setLocaleState(savedLocale);
    }
    setIsLoaded(true);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('npuu_locale', newLocale);
  };

  const t = (key: keyof typeof translations['en']): string => {
    return translations[locale][key] || translations['en'][key] || key;
  };

  // Prevent flash of untranslated content (optional)
  if (!isLoaded) return <div style={{ background: '#00132b', minHeight: '100vh' }} />;

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
