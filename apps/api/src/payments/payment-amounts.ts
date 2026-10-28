import { BadRequestException } from '@nestjs/common';
import { PaymentType, Prisma } from '@prisma/client';

const ROUND_TND = 3;

/**
 * Montant (TND) à payer selon le type :
 *  - deposit : acompte de `depositPercent` % du total, seulement si rien n'a été payé
 *  - full    : totalité, seulement si rien n'a été payé
 *  - balance : solde restant, seulement après un premier paiement
 */
export function computeAmountDue(
  type: PaymentType,
  total: Prisma.Decimal,
  paid: Prisma.Decimal,
  depositPercent: number,
): Prisma.Decimal {
  const remaining = total.sub(paid);
  if (remaining.lte(0)) throw new BadRequestException('Cette réservation est déjà soldée');

  switch (type) {
    case PaymentType.deposit:
      if (!paid.isZero()) throw new BadRequestException('L’acompte a déjà été réglé');
      return total.mul(depositPercent).div(100).toDecimalPlaces(ROUND_TND, Prisma.Decimal.ROUND_HALF_UP);
    case PaymentType.full:
      if (!paid.isZero()) throw new BadRequestException('Un paiement a déjà été effectué : réglez le solde');
      return remaining;
    case PaymentType.balance:
      if (paid.isZero()) throw new BadRequestException('Réglez d’abord l’acompte ou la totalité');
      return remaining;
  }
}

/** Conversion TND → plus petite unité de la devise Stripe (centimes). */
export function toStripeMinorUnits(amountTnd: Prisma.Decimal, rate: number): number {
  return Math.round(amountTnd.mul(rate).mul(100).toNumber());
}
