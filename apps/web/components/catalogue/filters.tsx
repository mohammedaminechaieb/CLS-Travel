'use client';

import type { Destination, PackageCategory, PackageFacets } from '@cls/shared';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { tr } from '@/lib/i18n';

const CATEGORIES: PackageCategory[] = ['circuit', 'sejour', 'excursion', 'omra', 'affaires'];
const list = (v: string | null) => (v ? v.split(',').filter(Boolean) : []);

/** Filtres synchronisés avec l'URL (partageable, SEO, bouton retour). */
export function CatalogueFilters({
  facets,
  destinations,
  onApplied,
}: {
  facets: PackageFacets | null;
  destinations: Destination[];
  onApplied?: () => void;
}) {
  const t = useTranslations('catalogue');
  const tc = useTranslations('categories');
  const locale = useLocale();
  const format = useFormatter();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const priceBounds: [number, number] = [Math.floor(facets?.price.min ?? 0), Math.ceil(facets?.price.max ?? 10000)];
  const durationBounds: [number, number] = [facets?.duration.min ?? 1, Math.max(facets?.duration.max ?? 30, (facets?.duration.min ?? 1) + 1)];

  const [price, setPrice] = useState<[number, number]>([
    Number(params.get('min_price') ?? priceBounds[0]),
    Number(params.get('max_price') ?? priceBounds[1]),
  ]);
  const [duration, setDuration] = useState<[number, number]>([
    Number(params.get('min_duration') ?? durationBounds[0]),
    Number(params.get('max_duration') ?? durationBounds[1]),
  ]);
  const [search, setSearch] = useState(params.get('search') ?? '');

  useEffect(() => setSearch(params.get('search') ?? ''), [params]);

  const push = (mutate: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params.toString());
    mutate(next);
    next.delete('page');
    startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
    onApplied?.();
  };

  const toggle = (key: string, value: string) =>
    push((p) => {
      const current = list(p.get(key));
      const nextValues = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      if (nextValues.length) p.set(key, nextValues.join(','));
      else p.delete(key);
    });

  const setRange = (minKey: string, maxKey: string, [min, max]: [number, number], [lo, hi]: [number, number]) =>
    push((p) => {
      if (min > lo) p.set(minKey, String(min));
      else p.delete(minKey);
      if (max < hi) p.set(maxKey, String(max));
      else p.delete(maxKey);
    });

  const selectedCategories = list(params.get('category'));
  const selectedDestinations = list(params.get('destination_id'));
  const money = (v: number) => format.number(v, { style: 'currency', currency: 'TND', minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="flex flex-col gap-8" aria-busy={pending}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          push((p) => (search.trim() ? p.set('search', search.trim()) : p.delete('search')));
        }}
      >
        <label htmlFor="catalogue-search" className="mb-2 block text-sm font-semibold">
          {t('search')}
        </label>
        <Input id="catalogue-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('searchPlaceholder')} />
      </form>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold">{t('category')}</legend>
        <ul className="flex flex-col gap-2.5">
          {CATEGORIES.map((c) => {
            const count = facets?.categories.find((f) => f.category === c)?.count ?? 0;
            const id = `cat-${c}`;
            return (
              <li key={c} className="flex items-center gap-3">
                <Checkbox id={id} checked={selectedCategories.includes(c)} onCheckedChange={() => toggle('category', c)} />
                <label htmlFor={id} className="flex flex-1 cursor-pointer justify-between text-sm">
                  {tc(c)} <span className="text-text-muted">{count}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold">{t('price')}</legend>
        <Slider
          min={priceBounds[0]}
          max={priceBounds[1]}
          step={10}
          value={price}
          onValueChange={(v) => setPrice([v[0], v[1]])}
          onValueCommit={(v) => setRange('min_price', 'max_price', [v[0], v[1]], priceBounds)}
          thumbLabels={[t('priceMin'), t('priceMax')]}
        />
        <p className="mt-2 flex justify-between text-sm text-text-muted">
          <span>{money(price[0])}</span>
          <span>{money(price[1])}</span>
        </p>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold">{t('duration')}</legend>
        <Slider
          min={durationBounds[0]}
          max={durationBounds[1]}
          step={1}
          value={duration}
          onValueChange={(v) => setDuration([v[0], v[1]])}
          onValueCommit={(v) => setRange('min_duration', 'max_duration', [v[0], v[1]], durationBounds)}
          thumbLabels={[t('durationMin'), t('durationMax')]}
        />
        <p className="mt-2 text-sm text-text-muted">{t('durationValue', { min: duration[0], max: duration[1] })}</p>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold">{t('destination')}</legend>
        <ul className="flex max-h-72 flex-col gap-2.5 overflow-y-auto pe-1">
          {destinations
            .filter((d) => (d.package_count ?? 0) > 0)
            .map((d) => {
              const id = `dest-${d.id}`;
              return (
                <li key={d.id} className="flex items-center gap-3">
                  <Checkbox id={id} checked={selectedDestinations.includes(d.id)} onCheckedChange={() => toggle('destination_id', d.id)} />
                  <label htmlFor={id} className="flex flex-1 cursor-pointer justify-between text-sm">
                    {tr(d, 'name', locale)} <span className="text-text-muted">{d.package_count}</span>
                  </label>
                </li>
              );
            })}
        </ul>
      </fieldset>

      <Button
        variant="outline"
        onClick={() => {
          setPrice(priceBounds);
          setDuration(durationBounds);
          setSearch('');
          startTransition(() => router.push(pathname, { scroll: false }));
          onApplied?.();
        }}
      >
        {t('reset')}
      </Button>
    </div>
  );
}
