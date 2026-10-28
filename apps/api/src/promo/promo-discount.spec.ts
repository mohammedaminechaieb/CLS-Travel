import { DiscountType, Prisma, type PromoCode } from '@prisma/client';
import { checkPromo, computeDiscount } from './promo-discount';

const promo = (over: Partial<PromoCode> = {}): PromoCode => ({
  id: 'p1',
  code: 'ETE2026',
  discount_type: DiscountType.percent,
  value: new Prisma.Decimal(10),
  expires_at: null,
  max_uses: null,
  current_uses: 0,
  is_active: true,
  applicable_packages: [],
  ...over,
});

describe('promo codes', () => {
  it('computes percent and fixed discounts capped at the subtotal', () => {
    expect(computeDiscount(promo(), new Prisma.Decimal(1290)).toString()).toBe('129');
    expect(computeDiscount(promo({ discount_type: DiscountType.fixed, value: new Prisma.Decimal(500) }), new Prisma.Decimal(145)).toString()).toBe('145');
  });

  it('rejects inactive, expired, exhausted and non-applicable codes', () => {
    expect(checkPromo(promo({ is_active: false }), 'pkg')).toBe('inactive');
    expect(checkPromo(promo({ expires_at: new Date('2020-01-01') }), 'pkg')).toBe('expired');
    expect(checkPromo(promo({ max_uses: 5, current_uses: 5 }), 'pkg')).toBe('exhausted');
    expect(checkPromo(promo({ applicable_packages: ['other'] }), 'pkg')).toBe('not_applicable');
    expect(checkPromo(promo({ applicable_packages: ['pkg'] }), 'pkg')).toBeNull();
  });
});
