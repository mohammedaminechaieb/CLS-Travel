'use client';

import type { BookingStatus, ClientBooking, Paginated } from '@cls/shared';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { BookingListItem } from '@/components/client/booking-list-item';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApiQuery } from '@/lib/hooks';

type Filter = 'all' | BookingStatus;

export default function MyBookingsPage() {
  const t = useTranslations('client');
  const [filter, setFilter] = useState<Filter>('all');
  const { data, isLoading } = useApiQuery<Paginated<ClientBooking>>(['client-bookings'], '/client/bookings', { limit: 50 });
  const bookings = (data?.data ?? []).filter((b) => filter === 'all' || b.status === filter);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">{t('bookings')}</h1>
      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList className="h-auto flex-wrap">
          {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((f) => (
            <TabsTrigger key={f} value={f}>
              {f === 'all' ? t('bookings') : t(`status.${f}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {isLoading ? (
        <Skeleton className="h-36 w-full" />
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-text-muted">{t('noBookings')}</p>
          <Button asChild variant="cta"><Link href="/voyages">{t('exploreTrips')}</Link></Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {bookings.map((b) => (
            <li key={b.id}><BookingListItem booking={b} /></li>
          ))}
        </ul>
      )}
    </div>
  );
}
