/** Enums miroir du schéma Prisma — partagés entre l'API et le frontend. */

export const Role = {
  super_admin: 'super_admin',
  manager: 'manager',
  agent: 'agent',
  client: 'client',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const PackageCategory = {
  circuit: 'circuit',
  sejour: 'sejour',
  excursion: 'excursion',
  omra: 'omra',
  affaires: 'affaires',
} as const;
export type PackageCategory = (typeof PackageCategory)[keyof typeof PackageCategory];

export const PackageStatus = {
  draft: 'draft',
  published: 'published',
  archived: 'archived',
} as const;
export type PackageStatus = (typeof PackageStatus)[keyof typeof PackageStatus];

export const BookingStatus = {
  pending: 'pending',
  confirmed: 'confirmed',
  cancelled: 'cancelled',
  completed: 'completed',
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const PaymentStatus = {
  pending: 'pending',
  succeeded: 'succeeded',
  failed: 'failed',
  refunded: 'refunded',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentType = {
  deposit: 'deposit',
  balance: 'balance',
  full: 'full',
} as const;
export type PaymentType = (typeof PaymentType)[keyof typeof PaymentType];

export const PostStatus = {
  draft: 'draft',
  published: 'published',
} as const;
export type PostStatus = (typeof PostStatus)[keyof typeof PostStatus];

export const DiscountType = {
  percent: 'percent',
  fixed: 'fixed',
} as const;
export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType];
