import { localized as pick, type Locale } from '@cls/shared';

export const INTL_LOCALE: Record<Locale, string> = { fr: 'fr-TN', ar: 'ar-TN', en: 'en-GB' };

/** Champ multilingue (title_fr / title_ar / title_en) avec repli sur le français. */
export function tr<T extends object>(entity: T, field: string, locale: string): string {
  return pick(entity as Record<string, unknown>, field, locale as Locale);
}
