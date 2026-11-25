import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import catalog from './ui.txt?raw';
import content from './content.txt?raw';

export type Locale = 'en' | 'kk' | 'ru';
type Parameters = Record<string, string | number>;
const storageKey = 'bagdar_locale';
const messages = new Map((catalog + '\n' + content).split(/\r?\n/).filter(row => row.trim()).map(row => {
  const [english, kazakh, russian] = row.split('|');
  return [english, { kk: kazakh, ru: russian }];
}));
export function translate(locale: Locale, english: string, parameters?: Parameters) {
  const message = locale === 'en' ? english : messages.get(english)?.[locale] ?? english;
  return message.replace(/\{(\w+)\}/g, (match, key) => String(parameters?.[key] ?? match));
}

const LocaleContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void }>({
  locale: 'en',
  setLocale: () => {},
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === 'kk' || saved === 'ru' || saved === 'en') return saved;
    } catch {
      // Storage may be disabled in private or embedded browsers.
    }
    return 'en';
  });

  useEffect(() => {
    document.documentElement.lang = locale;
    try { localStorage.setItem(storageKey, locale); } catch {}
  }, [locale]);

  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
}

export const responseLanguage: Record<Locale, string> = { en: 'English', kk: 'Kazakh', ru: 'Russian' };

export function useLocale() {
  const { locale, setLocale } = useContext(LocaleContext);
  return { locale, setLocale, t: (english: string, parameters?: Parameters) => translate(locale, english, parameters) };
}
