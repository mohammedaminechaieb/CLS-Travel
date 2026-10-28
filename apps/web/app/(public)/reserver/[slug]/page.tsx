import type { PackageDetail } from '@cls/shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { BookingTunnel } from '@/components/booking/booking-tunnel';
import { SmartImage } from '@/components/smart-image';
import { tr } from '@/lib/i18n';
import { serverFetchOrNotFound } from '@/lib/server-api';

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = { robots: { index: false } };

export default async function BookingPage({ params }: Props) {
  const { slug } = await params;
  const pkg = await serverFetchOrNotFound<PackageDetail>(`/packages/${encodeURIComponent(slug)}`, 60);
  if (!pkg || pkg === 'not-found') notFound();

  const locale = await getLocale();
  const t = await getTranslations('booking');
  const title = tr(pkg, 'title', locale);

  return (
    <div className="container-content max-w-4xl py-10 md:py-14">
      <Link href={`/voyages/${pkg.slug}`} className="mb-6 flex items-center gap-4 rounded-lg border border-border bg-surface p-3 hover:border-primary">
        <span className="relative size-16 shrink-0 overflow-hidden rounded-md">
          <SmartImage src={pkg.gallery_urls[0]} alt="" fill sizes="64px" className="object-cover" />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-serif text-lg font-semibold">{title}</span>
          <span className="text-sm text-text-muted">{tr(pkg.destination, 'name', locale)}</span>
        </span>
      </Link>
      <h1 className="mb-8 text-3xl font-bold md:text-4xl">{t('title', { title })}</h1>
      <Suspense>
        <BookingTunnel
          pkg={{ id: pkg.id, slug: pkg.slug, title, base_price: pkg.base_price, duration_days: pkg.duration_days }}
        />
      </Suspense>
    </div>
  );
}
