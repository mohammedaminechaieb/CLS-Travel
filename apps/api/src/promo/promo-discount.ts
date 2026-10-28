import { DiscountType, Prisma, type PromoCode } from '@prisma/client';

export type PromoRejection = 'inactive' | 'expired' | 'exhausted' | 'not_applicable';

export const PROMO_MESSAGES: Record<PromoRejection, string> = {
  inactive: 'Ce code promo n’est pas valide',
  expired: 'Ce code promo a expiré',
  exhausted: 'Ce code promo a atteint son nombre maximal d’utilisations',
  not_applicable: 'Ce code promo ne s’applique pas à ce voyage',
};

export function checkPromo(promo: PromoCode, packageId: string, now = new Date()): PromoRejection | null {
  if (!promo.is_active) return 'inactive';
  if (promo.expires_at && promo.expires_at.getTime() < now.getTime()) return 'expired';
  if (promo.max_uses !== null && promo.current_uses >= promo.max_uses) return 'exhausted';
  if (promo.applicable_packages.length > 0 && !promo.applicable_packages.includes(packageId)) return 'not_applicable';
  return null;
}

/** Remise en TND, plafonnée au sous-total. */
export function computeDiscount(promo: Pick<PromoCode, 'discount_type' | 'value'>, subtotal: Prisma.Decimal): Prisma.Decimal {
  const raw =
    promo.discount_type === DiscountType.percent
      ? subtotal.mul(promo.value).div(100)
      : new Prisma.Decimal(promo.value);
  return Prisma.Decimal.min(raw, subtotal).toDecimalPlaces(3, Prisma.Decimal.ROUND_HALF_UP);
}
