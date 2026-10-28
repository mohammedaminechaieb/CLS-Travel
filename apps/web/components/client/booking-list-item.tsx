'use client';

import type { ClientBooking } from '@cls/shared';
import { CalendarDays, MessageCircle, Users } from 'lucide-react';
import Link from 'next/link';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { SmartImage } from '@/components/smart-image';
import { tr } from '@/lib/i18n';
import { BookingStatusBadge } from './status-badge';

export function BookingListItem({ booking }: { booking: ClientBooking }) {
  const t = useTranslations('client');
  const tc = useTranslations('common');
  const format = useFormatter();
  const locale = useLocale();
  const money = (v: string) => format.number(Number(v), { style: 'currency', currency: 'TND', minimumFractionDigits: 0, maximumFractionDigits: 3 });
  const total = Number(booking.total_price);
  const paid = Number(booking.paid_amount);
  const pct = total > 0 ? Math.round((paid / total) * 100) : 0;

  return (
    <article className="relative flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row">
      <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-md sm:aspect-square sm:w-32">
        <SmartImage src={booking.package.gallery_urls[0]} alt="" fill sizes="128px" className="object-cover" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <BookingStatusBadge status={booking.status} />
          <span className="font-mono text-xs text-text-muted">{booking.reference}</span>
          {booking._count.messages > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-cta/10 px-2 py-0.5 text-xs font-semibold text-cta">
              <MessageCircle className="size-3" aria-hidden /> {t('unreadBadge', { count: booking._count.messages })}
            </span>
          )}
        </div>
        <h3 className="font-serif text-lg font-semibold">
          <Link href={`/mes-reservations/${booking.id}`} className="after:absolute after:inset-0 hover:text-primary">
            {tr(booking.package, 'title', locale)}
          </Link>
        </h3>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-muted">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-4" aria-hidden />
            {format.dateTime(new Date(booking.departure_date), { dateStyle: 'medium', timeZone: 'UTC' })} →{' '}
            {format.dateTime(new Date(booking.return_date), { dateStyle: 'medium', timeZone: 'UTC' })}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-4" aria-hidden /> {tc('travelers', { count: booking.participants.length })}
          </span>
        </p>
        <div className="mt-auto">
          <div className="mb-1 flex justify-between text-xs text-text-muted">
            <span>{t('paidOf', { paid: money(booking.paid_amount), total: money(booking.total_price) })}</span>
            <span>{pct} %</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t('paidOf', { paid: money(booking.paid_amount), total: money(booking.total_price) })}>
            <div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </article>
  );
}
