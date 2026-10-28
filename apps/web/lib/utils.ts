import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number | string, currency = 'TND', locale = 'fr-TN') {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'TND' ? 0 : 2,
    maximumFractionDigits: currency === 'TND' ? 3 : 2,
  }).format(value);
}

export function formatDate(date: string | Date, locale = 'fr-FR', opts?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale, opts ?? { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(date),
  );
}
