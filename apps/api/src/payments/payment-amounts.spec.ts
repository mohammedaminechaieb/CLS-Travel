import { BadRequestException } from '@nestjs/common';
import { PaymentType, Prisma } from '@prisma/client';
import { computeAmountDue, toStripeMinorUnits } from './payment-amounts';

const D = (v: number | string) => new Prisma.Decimal(v);

describe('computeAmountDue', () => {
  it('computes a 30% deposit rounded to the millime', () => {
    expect(computeAmountDue(PaymentType.deposit, D('1290.005'), D(0), 30).toString()).toBe('387.002');
  });

  it('computes the balance after the deposit', () => {
    expect(computeAmountDue(PaymentType.balance, D(2580), D(774), 30).toString()).toBe('1806');
  });

  it('computes the full amount', () => {
    expect(computeAmountDue(PaymentType.full, D(145), D(0), 30).toString()).toBe('145');
  });

  it('rejects a second deposit, a premature balance and a fully paid booking', () => {
    expect(() => computeAmountDue(PaymentType.deposit, D(100), D(30), 30)).toThrow(BadRequestException);
    expect(() => computeAmountDue(PaymentType.balance, D(100), D(0), 30)).toThrow(BadRequestException);
    expect(() => computeAmountDue(PaymentType.balance, D(100), D(100), 30)).toThrow(BadRequestException);
  });
});

describe('toStripeMinorUnits', () => {
  it('converts TND to EUR cents', () => {
    expect(toStripeMinorUnits(D('387.002'), 0.3)).toBe(11610);
  });
});
