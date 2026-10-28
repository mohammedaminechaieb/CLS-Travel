'use client';

import { DEFAULT_DEPOSIT_PERCENT, type PackageDetail } from '@cls/shared';
import { CalendarDays, Lock, MessageCircle, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/** Carte de réservation collante (desktop) + barre fixe en bas d'écran (mobile). */
export function BookingSidebar({ pkg }: { pkg: Pick<PackageDetail, 'slug' | 'base_price' | 'max_capacity'> }) {
  const t = useTranslations('package');
  const tc = useTranslations('common');
  const format = useFormatter();
  const router = useRouter();
  const params = useSearchParams();
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

  const [date, setDate] = useState(() => {
    const d = params.get('date');
    return d && d >= tomorrow ? d : '';
  });
  const [travelers, setTravelers] = useState(() => Math.min(20, Math.max(1, Number(params.get('travelers')) || 2)));

  const price = Number(pkg.base_price);
  const total = price * travelers;
  const money = (v: number) => format.number(v, { style: 'currency', currency: 'TND', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const href = `/reserver/${pkg.slug}?${new URLSearchParams({ ...(date && { date }), travelers: String(travelers) })}`;

  return (
    <>
      <div className="sticky top-24 hidden rounded-lg border border-border bg-surface p-6 shadow-lg lg:block">
        <p className="text-sm text-text-muted">{tc('from')}</p>
        <p className="font-serif text-3xl font-bold text-primary">
          {money(price)} <span className="font-sans text-sm font-normal text-text-muted">{tc('perPerson')}</span>
        </p>
        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(href);
          }}
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="booking-date" className="flex items-center gap-1.5 text-sm font-medium">
              <CalendarDays className="size-4" aria-hidden /> {t('departureDate')}
            </label>
            <Input id="booking-date" type="date" min={tomorrow} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="booking-travelers" className="flex items-center gap-1.5 text-sm font-medium">
              <Users className="size-4" aria-hidden /> {t('travelers')}
            </label>
            <Input
              id="booking-travelers"
              type="number"
              min={1}
              max={Math.min(20, pkg.max_capacity)}
              value={travelers}
              onChange={(e) => setTravelers(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
            />
          </div>
          <dl className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-muted">
                {money(price)} × {travelers}
              </dt>
              <dd className="font-semibold">{money(total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">{t('deposit', { percent: DEFAULT_DEPOSIT_PERCENT })}</dt>
              <dd className="font-semibold text-cta">{money((total * DEFAULT_DEPOSIT_PERCENT) / 100)}</dd>
            </div>
          </dl>
          <Button type="submit" variant="cta" size="lg" className="w-full">
            {t('bookCta')}
          </Button>
          <p className="flex items-start gap-2 text-xs text-text-muted">
            <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {t('depositNote', { percent: DEFAULT_DEPOSIT_PERCENT })}
          </p>
        </form>
        <Link href="/contact" className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-primary hover:underline">
          <MessageCircle className="size-4" aria-hidden /> {t('questions')}
        </Link>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
        <div className="container-content flex items-center justify-between gap-3">
          <p className="text-sm">
            <span className="block text-xs text-text-muted">{tc('from')}</span>
            <span className="font-serif text-xl font-bold text-primary">{money(price)}</span>
            <span className="text-xs text-text-muted"> {tc('perPerson')}</span>
          </p>
          <Button asChild variant="cta">
            <Link href={href}>{tc('bookNow')}</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
