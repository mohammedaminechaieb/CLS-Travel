import type { Destination, PackageFacets, PackageSummary, Paginated } from '@cls/shared';
import type { Metadata } from 'next';
import { SearchX } from 'lucide-react';
import { getFormatter, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { CatalogueFilters } from '@/components/catalogue/filters';
import { MobileFilters } from '@/components/catalogue/mobile-filters';
import { Pagination } from '@/components/catalogue/pagination';
import { SortSelect } from '@/components/catalogue/sort-select';
import { PackageCard } from '@/components/packages/package-card';
import { serverFetch } from '@/lib/server-api';

type SearchParams = Record<string, string | string[] | undefined>;

const FILTER_KEYS = ['category', 'destination_id', 'min_price', 'max_price', 'min_duration', 'max_duration', 'search', 'sort', 'date', 'travelers'] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('catalogue');
  return { title: t('title'), description: t('subtitle'), alternates: { canonical: '/voyages' } };
}

export default async function CataloguePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const raw = await searchParams;
  const params = Object.fromEntries(
    FILTER_KEYS.map((k) => [k, typeof raw[k] === 'string' ? (raw[k] as string) : undefined]),
  ) as Record<(typeof FILTER_KEYS)[number], string | undefined>;
  const page = Math.max(1, Number(raw.page) || 1);

  const t = await getTranslations('catalogue');
  const tc = await getTranslations('common');
  const format = await getFormatter();

  const { date, travelers, ...apiFilters } = params;
  const [result, facets, destinations] = await Promise.all([
    serverFetch<Paginated<PackageSummary>>('/packages', { ...apiFilters, page, limit: 12 }, 60),
    serverFetch<PackageFacets>('/packages/facets'),
    serverFetch<Destination[]>('/destinations'),
  ]);

  // Date et voyageurs saisis dans la recherche sont transmis à la fiche puis au tunnel
  const linkQuery = new URLSearchParams(Object.entries({ date, travelers }).filter((e): e is [string, string] => Boolean(e[1]))).toString();
  const total = result?.meta.total ?? 0;

  return (
    <div className="container-content py-10 md:py-14">
      <header className="mb-8">
        <h1 className="text-3xl font-bold md:text-4xl">{t('title')}</h1>
        <p className="mt-2 text-text-muted">{t('subtitle')}</p>
        {date && (
          <p className="mt-3 inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            {t('searchFor', {
              date: format.dateTime(new Date(date), { dateStyle: 'long' }),
              travelers: tc('travelers', { count: Number(travelers) || 1 }),
            })}
          </p>
        )}
      </header>

      <div className="grid gap-8 lg:grid-cols-12">
        <aside className="hidden lg:col-span-3 lg:block" aria-label={t('filters')}>
          <div className="sticky top-24 rounded-lg border border-border bg-surface p-5">
            <h2 className="mb-5 font-serif text-xl font-semibold">{t('filters')}</h2>
            <Suspense>
              <CatalogueFilters facets={facets} destinations={destinations ?? []} />
            </Suspense>
          </div>
        </aside>

        <section className="min-w-0 lg:col-span-9" aria-labelledby="results-count">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p id="results-count" className="font-medium" aria-live="polite">
              {t('results', { count: total })}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Suspense>
                <MobileFilters facets={facets} destinations={destinations ?? []} />
                <SortSelect />
              </Suspense>
            </div>
          </div>

          {result && result.data.length > 0 ? (
            <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {result.data.map((pkg, i) => (
                <li key={pkg.id}>
                  <PackageCard pkg={pkg} priority={i < 3} linkQuery={linkQuery} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-surface px-6 py-16 text-center">
              <SearchX className="size-10 text-text-muted" aria-hidden />
              <p className="font-serif text-xl font-semibold">{t('empty')}</p>
              <p className="text-text-muted">{t('emptyHint')}</p>
            </div>
          )}

          <Pagination page={page} totalPages={result?.meta.totalPages ?? 1} basePath="/voyages" params={{ ...params }} />
        </section>
      </div>
    </div>
  );
}
