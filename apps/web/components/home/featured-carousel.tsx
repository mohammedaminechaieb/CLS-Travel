'use client';

import type { PackageSummary } from '@cls/shared';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { PackageCard } from '@/components/packages/package-card';
import { Button } from '@/components/ui/button';

export function FeaturedCarousel({ packages }: { packages: PackageSummary[] }) {
  const t = useTranslations('home');
  const locale = useLocale();
  const [ref, api] = useEmblaCarousel({ align: 'start', loop: false, direction: locale === 'ar' ? 'rtl' : 'ltr' });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    if (!api) return;
    setCanPrev(api.canScrollPrev());
    setCanNext(api.canScrollNext());
  }, [api]);

  useEffect(() => {
    if (!api) return;
    update();
    api.on('select', update).on('reInit', update);
  }, [api, update]);

  return (
    <div className="relative" role="region" aria-roledescription="carousel" aria-label={t('featuredTitle')}>
      <div className="overflow-hidden" ref={ref}>
        <ul className="-ms-4 flex md:-ms-6">
          {packages.map((pkg, i) => (
            <li
              key={pkg.id}
              className="min-w-0 shrink-0 grow-0 basis-[85%] ps-4 sm:basis-1/2 md:ps-6 lg:basis-1/3"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${packages.length}`}
            >
              <PackageCard pkg={pkg} priority={i < 3} />
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" size="icon" onClick={() => api?.scrollPrev()} disabled={!canPrev} aria-label={t('carouselPrev')}>
          <ChevronLeft className="size-5 rtl:rotate-180" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => api?.scrollNext()} disabled={!canNext} aria-label={t('carouselNext')}>
          <ChevronRight className="size-5 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}
