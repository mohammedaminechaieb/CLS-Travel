'use client';

import { ChevronLeft, ChevronRight, Images } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { SmartImage } from '@/components/smart-image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/** Mosaïque de photos + lightbox plein écran (clavier ← →, Échap). */
export function Gallery({ images, title }: { images: string[]; title: string }) {
  const t = useTranslations('package');
  const [index, setIndex] = useState<number | null>(null);
  const total = images.length;

  const go = useCallback((delta: number) => setIndex((i) => (i === null ? i : (i + delta + total) % total)), [total]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      const rtl = document.documentElement.dir === 'rtl';
      if (e.key === 'ArrowRight') go(rtl ? -1 : 1);
      if (e.key === 'ArrowLeft') go(rtl ? 1 : -1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, go]);

  const shown = images.length > 0 ? images.slice(0, 5) : [''];
  // Les vignettes secondaires se partagent la moitié droite selon leur nombre
  const thumbClass = (i: number) => {
    const rest = shown.length - 1;
    if (rest === 1) return 'md:col-span-2 md:row-span-2';
    if (rest === 2 || (rest === 3 && i === 3)) return 'md:col-span-2';
    return '';
  };

  return (
    <section aria-label={t('gallery')} className="relative">
      <ul className={cn('grid gap-2 overflow-hidden rounded-lg', shown.length > 1 ? 'md:grid-cols-4 md:grid-rows-2' : '')}>
        {shown.map((src, i) => (
          <li key={i} className={cn('relative', i === 0 ? 'aspect-[16/10] md:col-span-2 md:row-span-2 md:aspect-auto md:min-h-[420px]' : cn('hidden aspect-[4/3] md:block md:aspect-auto', thumbClass(i)))}>
            <button
              type="button"
              onClick={() => src && setIndex(i)}
              className="absolute inset-0 overflow-hidden focus-visible:ring-inset"
              aria-label={t('openPhoto', { index: i + 1 })}
              disabled={!src}
            >
              <SmartImage
                src={src || null}
                alt={`${title} — ${t('photoOf', { index: i + 1, total: Math.max(total, 1) })}`}
                fill
                priority={i === 0}
                sizes={i === 0 ? '(min-width: 768px) 50vw, 100vw' : '25vw'}
                className="object-cover transition-transform duration-500 hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>
      {total > 1 && (
        <Button variant="outline" size="sm" className="absolute bottom-4 end-4 shadow" onClick={() => setIndex(0)}>
          <Images aria-hidden /> {t('showAllPhotos', { count: total })}
        </Button>
      )}

      <Dialog open={index !== null} onOpenChange={(open) => !open && setIndex(null)}>
        <DialogContent className="max-w-5xl bg-black p-0 sm:p-0" closeLabel="✕">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          {index !== null && (
            <figure className="relative">
              <div className="relative aspect-[3/2] w-full">
                <SmartImage src={images[index]} alt={`${title} — ${t('photoOf', { index: index + 1, total })}`} fill sizes="90vw" className="object-contain" />
              </div>
              <figcaption className="p-3 text-center text-sm text-white" aria-live="polite">
                {t('photoOf', { index: index + 1, total })}
              </figcaption>
              {total > 1 && (
                <>
                  <Button variant="secondary" size="icon" className="absolute start-3 top-1/2 -translate-y-1/2 rounded-full" onClick={() => go(-1)} aria-label={t('prevPhoto')}>
                    <ChevronLeft className="rtl:rotate-180" />
                  </Button>
                  <Button variant="secondary" size="icon" className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full" onClick={() => go(1)} aria-label={t('nextPhoto')}>
                    <ChevronRight className="rtl:rotate-180" />
                  </Button>
                </>
              )}
            </figure>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
