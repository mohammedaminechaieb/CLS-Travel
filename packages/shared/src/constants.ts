export const COMPANY = {
  name: 'CLS Travel',
  legalName: 'Carthago Loisirs',
  domain: 'carthagoloisirs.com',
  siteUrl: 'https://carthagoloisirs.com',
  apiUrl: 'https://api.carthagoloisirs.com',
  country: 'TN',
  email: 'contact@carthagoloisirs.com',
  phone: '+21671000000',
  address: {
    street: 'Avenue Habib Bourguiba',
    city: 'Tunis',
    postalCode: '1000',
    country: 'Tunisie',
  },
  geo: { lat: 36.8008, lng: 10.18 },
} as const;

export const LOCALES = ['fr', 'ar', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'fr';
export const RTL_LOCALES: readonly Locale[] = ['ar'];

export const CURRENCIES = ['TND', 'EUR', 'USD'] as const;
export type Currency = (typeof CURRENCIES)[number];
export const BASE_CURRENCY: Currency = 'TND';

/** Pourcentage d'acompte par défaut (surchargé par STRIPE_DEPOSIT_PERCENT côté API). */
export const DEFAULT_DEPOSIT_PERCENT = 30;

/** Format de référence de réservation : CLS-YYYY-NNNNN */
export const BOOKING_REFERENCE_REGEX = /^CLS-\d{4}-\d{5}$/;

export const PAGINATION = {
  defaultLimit: 12,
  maxLimit: 100,
} as const;

/** Rôles ayant accès au back-office. */
export const STAFF_ROLES = ['super_admin', 'manager', 'agent'] as const;
export const ADMIN_ROLES = ['super_admin', 'manager'] as const;
