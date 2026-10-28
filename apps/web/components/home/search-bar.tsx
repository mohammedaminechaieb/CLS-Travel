'use client';

import type { Destination } from '@cls/shared';
import { CalendarDays, MapPin, Search, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { tr } from '@/lib/i18n';

export function SearchBar({ destinations }: { destinations: Destination[] }) {
  const t = useTranslations('home');
  const locale = useLocale();
  const router = useRouter();
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [travelers, setTravelers] = useState(2);
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set('destination_id', destination);
    if (date) params.set('date', date);
    params.set('travelers', String(travelers));
    router.push(`/voyages?${params.toString()}`);
  };

  const fieldClass =
    'flex flex-1 flex-col gap-1 rounded-md px-4 py-2 text-start focus-within:ring-2 focus-within:ring-ring md:rounded-none md:first:rounded-s-md';
  const inputClass = 'w-full bg-transparent text-base font-medium text-text outline-none';

  return (
    <form
      role="search"
      aria-label={t('searchLabel')}
      onSubmit={submit}
      className="flex w-full flex-col gap-2 rounded-lg bg-surface p-2 shadow-2xl md:flex-row md:items-stretch md:gap-0 md:divide-x md:divide-border md:rtl:divide-x-reverse"
    >
      <label className={fieldClass}>
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
          <MapPin className="size-3.5" aria-hidden /> {t('searchDestination')}
        </span>
        <select className={inputClass} value={destination} onChange={(e) => setDestination(e.target.value)}>
          <option value="">{t('searchAnyDestination')}</option>
          {destinations.map((d) => (
            <option key={d.id} value={d.id}>
              {tr(d, 'name', locale)}
            </option>
          ))}
        </select>
      </label>
      <label className={fieldClass}>
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
          <CalendarDays className="size-3.5" aria-hidden /> {t('searchDate')}
        </span>
        <input type="date" min={tomorrow} className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <label className={fieldClass}>
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
          <Users className="size-3.5" aria-hidden /> {t('searchTravelers')}
        </span>
        <input
          type="number"
          min={1}
          max={20}
          inputMode="numeric"
          className={inputClass}
          value={travelers}
          onChange={(e) => setTravelers(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
        />
      </label>
      <div className="p-1 md:ps-2">
        <Button type="submit" variant="cta" size="lg" className="h-full min-h-12 w-full md:w-auto">
          <Search className="size-5" aria-hidden /> {t('searchCta')}
        </Button>
      </div>
    </form>
  );
}
