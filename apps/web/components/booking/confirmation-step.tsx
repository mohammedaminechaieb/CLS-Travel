'use client';

import type { Booking } from '@cls/shared';
import { CircleCheck } from 'lucide-react';
import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

/** Dernière étape du tunnel : la réservation est confirmée sans paiement en ligne. */
export function ConfirmationStep({ booking }: { booking: Booking }) {
  const t = useTranslations('booking');
  const format = useFormatter();
  const money = (v: string) => format.number(Number(v), { style: 'currency', currency: 'TND', minimumFractionDigits: 0, maximumFractionDigits: 3 });

  return (
    <div className="flex flex-col items-center gap-5 rounded-lg border border-success/30 bg-surface p-8 text-center md:p-12" role="status">
      <CircleCheck className="size-14 text-success" aria-hidden />
      <h2 className="text-2xl font-bold md:text-3xl">{t('confirmedTitle')}</h2>
      <p className="max-w-lg text-text-muted">{t('confirmedText')}</p>
      <dl className="grid w-full max-w-sm grid-cols-2 gap-3 rounded-md bg-muted/60 p-4 text-sm">
        <dt className="text-start text-text-muted">{t('reference')}</dt>
        <dd className="text-end font-mono font-semibold">{booking.reference}</dd>
        <dt className="text-start text-text-muted">{t('total')}</dt>
        <dd className="text-end font-semibold">{money(booking.total_price)}</dd>
      </dl>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href={`/mes-reservations/${booking.id}`}>{t('goToBooking')}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/voyages">{t('backToTrips')}</Link>
        </Button>
      </div>
    </div>
  );
}
