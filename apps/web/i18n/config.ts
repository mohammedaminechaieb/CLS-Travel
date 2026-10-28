import { DEFAULT_LOCALE, LOCALES, RTL_LOCALES, type Locale } from '@cls/shared';

export const LOCALE_COOKIE = 'NEXT_LOCALE';
export { DEFAULT_LOCALE, LOCALES, type Locale };

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

export function direction(locale: Locale): 'rtl' | 'ltr' {
  return RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr';
}

/** Négociation simple sur l'en-tête Accept-Language (ex. "ar-TN,ar;q=0.9,fr;q=0.8"). */
export function negotiate(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const ranked = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { lang: tag.toLowerCase().split('-')[0], q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  return ranked.find((r) => isLocale(r.lang))?.lang as Locale | undefined ?? DEFAULT_LOCALE;
}
