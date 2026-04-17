'use client';

import React from 'react';
import { useTranslation } from '@/context/LanguageContext';
import { Locale } from '@/i18n/translations';

export const LanguageSwitcher = () => {
  const { locale, setLocale } = useTranslation();

  const languages: { code: Locale; label: string }[] = [
    { code: 'uz', label: 'UZ' },
    { code: 'ru', label: 'RU' },
    { code: 'en', label: 'EN' },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLocale(lang.code)}
          style={{
            padding: '6px 12px',
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 800,
            fontFamily: 'inherit',
            letterSpacing: '0.06em',
            transition: 'all 0.18s',
            background: locale === lang.code ? '#6366f1' : 'transparent',
            color: locale === lang.code ? '#ffffff' : '#94a3b8',
            boxShadow: locale === lang.code ? '0 3px 10px rgba(99,102,241,0.3)' : 'none',
          }}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
};
