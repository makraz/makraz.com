import fr from './fr.json';
import en from './en.json';
import ar from './ar.json';
import { localizePath } from '../lib/routes.mjs';

export const locales = ['fr', 'en', 'ar'] as const;
export type Locale = (typeof locales)[number];

const dicts: Record<Locale, Record<string, string>> = { fr, en, ar };

export function isLocale(x: string): x is Locale {
  return (locales as readonly string[]).includes(x);
}

export function t(lang: Locale, key: string): string {
  const v = dicts[lang][key] ?? dicts.fr[key];
  if (v == null) throw new Error(`Missing i18n key: ${key}`);
  return v;
}

export function has(key: string): boolean {
  return (fr as Record<string, string>)[key] != null;
}

export function dir(lang: Locale): 'ltr' | 'rtl' {
  return lang === 'ar' ? 'rtl' : 'ltr';
}

export function nextLocale(lang: Locale): Locale {
  return ({ fr: 'en', en: 'ar', ar: 'fr' } as const)[lang];
}

// `path` is the French route key; English and Arabic may serve it under a translated slug.
export function localePath(lang: Locale, path: string): string {
  return `/${lang}${path === '/' ? '' : localizePath(lang, path)}`;
}
