import type { PackageDetail, Paginated, PublicReview, ReviewSummary } from '@cls/shared';
import { Check, ChevronRight, Clock, MapPin, Tag, UsersRound, X } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { BookingSidebar } from '@/components/package/booking-sidebar';
import { Gallery } from '@/components/package/gallery';
import { Itinerary } from '@/components/package/itinerary';
import { ReviewsSection } from '@/components/package/reviews-section';
import { RatingStars } from '@/components/packages/rating-stars';
import { Badge } from '@/components/ui/badge';
import { tr } from '@/lib/i18n';
import { serverFetch, serverFetchOrNotFound } from '@/lib/server-api';

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

async function getPackage(slug: string) {
  const pkg = await serverFetchOrNotFound<PackageDetail>(`/packages/${encodeURIComponent(slug)}`);
  if (pkg === 'not-found' || !pkg) notFound();
  return pkg;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await getPackage(slug);
  const locale = await getLocale();
  const title = tr(pkg, 'title', locale);
  const description = tr(pkg, 'description', locale).slice(0, 160);
  return { title, description, alternates: { canonical: `/voyages/${pkg.slug}` } };
}

export default async function PackagePage({ params }: Props) {
  const { slug } = await params;
  const [pkg, reviews] = await Promise.all([
    getPackage(slug),
    serverFetch<Paginated<PublicReview> & { summary: ReviewSummary }>(`/packages/${encodeURIComponent(slug)}/reviews`, { limit: 10 }),
  ]);
  const locale = await getLocale();
  const t = await getTranslations('package');
  const tc = await getTranslations('common');
  const tcat = await getTranslations('categories');
  const tn = await getTranslations('nav');
  const title = tr(pkg, 'title', locale);

  return (
    <div className="pb-24 lg:pb-16">
      <div className="container-content pt-6">
        <nav aria-label={t('breadcrumb')} className="mb-4 text-sm text-text-muted">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-primary">{tn('home')}</Link>
            </li>
            <ChevronRight className="size-3.5 rtl:rotate-180" aria-hidden />
            <li>
              <Link href="/voyages" className="hover:text-primary">{tn('trips')}</Link>
            </li>
            <ChevronRight className="size-3.5 rtl:rotate-180" aria-hidden />
            <li aria-current="page" className="truncate text-text">{title}</li>
          </ol>
        </nav>

        <header className="mb-6 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="accent">{tcat(pkg.category)}</Badge>
            {pkg.rating.count > 0 && pkg.rating.average !== null && (
              <span className="inline-flex items-center gap-1 text-sm">
                <RatingStars value={pkg.rating.average} /> {pkg.rating.average.toFixed(1)} · {tc('reviews', { count: pkg.rating.count })}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold md:text-5xl">{title}</h1>
          <p className="flex items-center gap-1.5 text-text-muted">
            <MapPin className="size-4" aria-hidden /> {tr(pkg.destination, 'name', locale)}, {pkg.destination.country}
          </p>
        </header>

        <Gallery images={pkg.gallery_urls} title={title} />
      </div>

      <div className="container-content mt-10 grid gap-10 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-12 lg:col-span-8">
          <section aria-labelledby="overview-title">
            <h2 id="overview-title" className="mb-4 text-2xl font-bold">{t('overview')}</h2>
            <dl className="mb-6 grid grid-cols-2 gap-4 rounded-lg border border-border bg-surface p-4 sm:grid-cols-4">
              {[
                { icon: Clock, label: t('duration'), value: tc('days', { count: pkg.duration_days }) },
                { icon: Tag, label: t('category'), value: tcat(pkg.category) },
                { icon: MapPin, label: t('destination'), value: tr(pkg.destination, 'name', locale) },
                { icon: UsersRound, label: t('group'), value: t('capacity', { count: pkg.max_capacity }) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex flex-col gap-1">
                  <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                    <Icon className="size-3.5" aria-hidden /> {label}
                  </dt>
                  <dd className="text-sm font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="whitespace-pre-line text-lg leading-relaxed">{tr(pkg, 'description', locale)}</div>
          </section>

          {pkg.itinerary.length > 0 && (
            <section aria-labelledby="itinerary-title">
              <h2 id="itinerary-title" className="mb-4 text-2xl font-bold">{t('itinerary')}</h2>
              <Itinerary days={pkg.itinerary} />
            </section>
          )}

          <section className="grid gap-6 md:grid-cols-2" aria-label={`${t('included')} / ${t('excluded')}`}>
            <div className="rounded-lg border border-success/30 bg-success/5 p-6">
              <h2 className="mb-4 text-xl font-bold">{t('included')}</h2>
              <ul className="flex flex-col gap-2.5">
                {pkg.included.map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check className="mt-0.5 size-5 shrink-0 text-success" aria-hidden /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-danger/30 bg-danger/5 p-6">
              <h2 className="mb-4 text-xl font-bold">{t('excluded')}</h2>
              <ul className="flex flex-col gap-2.5">
                {pkg.excluded.map((item) => (
                  <li key={item} className="flex gap-2">
                    <X className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section aria-labelledby="reviews-title">
            <h2 id="reviews-title" className="mb-6 text-2xl font-bold">{t('reviews')}</h2>
            <ReviewsSection data={reviews} />
          </section>
        </div>

        <aside className="lg:col-span-4" aria-label={t('bookingTitle')}>
          <Suspense>
            <BookingSidebar pkg={pkg} />
          </Suspense>
        </aside>
      </div>
    </div>
  );
}
