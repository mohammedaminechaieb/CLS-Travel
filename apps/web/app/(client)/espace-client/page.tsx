'use client';

import type { ClientBooking, Paginated } from '@cls/shared';
import { CalendarClock, MessageCircle, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { BookingListItem } from '@/components/client/booking-list-item';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth/auth-provider';
import { useApiQuery } from '@/lib/hooks';
import { tr } from '@/lib/i18n';

export default function ClientDashboard() {
  const t = useTranslations('client');
  const format = useFormatter();
  const locale = useLocale();
  const { user } = useAuth();
  const { data, isLoading } = useApiQuery<Paginated<ClientBooking>>(['client-bookings'], '/client/bookings', { limit: 50 });

  const bookings = data?.data ?? [];
  const active = bookings.filter((b) => b.status === 'pending' || b.status === 'confirmed');
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = active
    .filter((b) => b.departure_date.slice(0, 10) >= today)
    .sort((a, b) => a.departure_date.localeCompare(b.departure_date));
  const toPay = active.reduce((s, b) => s + Number(b.total_price) - Number(b.paid_amount), 0);
  const unread = bookings.reduce((s, b) => s + b._count.messages, 0);
  const next = upcoming[0];
  const daysLeft = next ? Math.ceil((new Date(next.departure_date).getTime() - Date.now()) / 86_400_000) : 0;

  const stats = [
    { icon: CalendarClock, label: t('stats.upcoming'), value: String(upcoming.length) },
    { icon: Wallet, label: t('stats.toPay'), value: format.number(toPay, { style: 'currency', currency: 'TND', minimumFractionDigits: 0, maximumFractionDigits: 3 }) },
    { icon: MessageCircle, label: t('stats.unread'), value: String(unread) },
  ];

  return (
    <div className="flex flex-col gap-10">
      <header>
        <h1 className="text-3xl font-bold">{t('hello', { name: user?.first_name ?? '' })}</h1>
        <p className="mt-1 text-text-muted">{t('dashboardSubtitle')}</p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ icon: Icon, label, value }) => (
          <li key={label} className="flex items-center gap-4 rounded-lg border border-border bg-surface p-5">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="size-6" aria-hidden />
            </span>
            <span>
              <span className="block text-sm text-text-muted">{label}</span>
              <span className="text-2xl font-bold">{isLoading ? '—' : value}</span>
            </span>
          </li>
        ))}
      </ul>

      {next && (
        <section aria-labelledby="next-trip" className="rounded-lg bg-primary p-6 text-primary-foreground md:p-8">
          <h2 id="next-trip" className="text-sm font-semibold uppercase tracking-wider opacity-90">{t('nextTrip')}</h2>
          <p className="mt-2 font-serif text-2xl font-bold md:text-3xl">{tr(next.package, 'title', locale)}</p>
          <p className="mt-1 opacity-90">
            {format.dateTime(new Date(next.departure_date), { dateStyle: 'full', timeZone: 'UTC' })} · {t('daysLeft', { count: Math.max(0, daysLeft) })}
          </p>
          <Button asChild variant="accent" className="mt-4">
            <Link href={`/mes-reservations/${next.id}`}>{t('viewDetails')}</Link>
          </Button>
        </section>
      )}

      <section aria-labelledby="recent-title">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="recent-title" className="text-2xl font-bold">{t('recent')}</h2>
          {bookings.length > 3 && (
            <Link href="/mes-reservations" className="text-sm font-semibold text-primary hover:underline">{t('bookings')}</Link>
          )}
        </div>
        {isLoading ? (
          <Skeleton className="h-36 w-full" />
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-surface p-10 text-center">
            <p className="text-text-muted">{t('noBookings')}</p>
            <Button asChild variant="cta"><Link href="/voyages">{t('exploreTrips')}</Link></Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {bookings.slice(0, 3).map((b) => (
              <li key={b.id}><BookingListItem booking={b} /></li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
