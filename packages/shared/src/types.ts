import type { Locale } from './constants';

export interface Paginated<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

/** Champs multilingues indexés par locale. */
export type I18nField<K extends string> = {
  [L in Locale as `${K}_${L}`]: string;
};

export function localized<T extends Record<string, unknown>>(
  entity: T,
  field: string,
  locale: Locale,
): string {
  const value = entity[`${field}_${locale}`] ?? entity[`${field}_fr`];
  return typeof value === 'string' ? value : '';
}
