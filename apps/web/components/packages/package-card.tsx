import type { PackageSummary } from '@cls/shared';
import { Clock, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { SmartImage } from '@/components/smart-image';
import { Badge } from '@/components/ui/badge';
import { tr } from '@/lib/i18n';
import { RatingStars } from './rating-stars';

export function PackageCard({ pkg, priority = false, linkQuery }: { pkg: PackageSummary; priority?: boolean; linkQuery?: string }) {
  const t = useTranslations('common');
  const tc = useTranslations('categories');
  const locale = useLocale();
  const format = useFormatter();
  const title = tr(pkg, 'title', locale);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm transition-shadow hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden">
        <SmartImage
          src={pkg.gallery_urls[0]}
          alt={title}
          fill
          priority={priority}
          sizes="(min-width: 1280px) 400px, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute start-3 top-3 flex gap-2">
          <Badge variant="accent">{tc(pkg.category)}</Badge>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-text-muted">
          <MapPin className="size-3.5" aria-hidden />
          {tr(pkg.destination, 'name', locale)} · {pkg.destination.country}
        </p>
        <h3 className="font-serif text-lg font-semibold leading-snug">
          <Link href={`/voyages/${pkg.slug}${linkQuery ? `?${linkQuery}` : ''}`} className="after:absolute after:inset-0 hover:text-primary focus-visible:outline-none">
            {title}
          </Link>
        </h3>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-muted">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-4" aria-hidden /> {t('days', { count: pkg.duration_days })}
          </span>
          {pkg.rating.count > 0 && pkg.rating.average !== null ? (
            <span className="inline-flex items-center gap-1">
              <RatingStars value={pkg.rating.average} />
              <span>({pkg.rating.count})</span>
            </span>
          ) : (
            <span>{t('reviews', { count: 0 })}</span>
          )}
        </div>
        <div className="mt-auto flex items-end justify-between border-t border-border pt-3">
          <p className="text-xs text-text-muted">
            {t('from')}
            <span className="block font-serif text-2xl font-bold text-primary">
              {format.number(Number(pkg.base_price), { style: 'currency', currency: 'TND', maximumFractionDigits: 0 })}
            </span>
          </p>
          <span className="text-xs text-text-muted">{t('perPerson')}</span>
        </div>
      </div>
    </article>
  );
}
