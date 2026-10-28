import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { cn } from '@/lib/utils';

/** Pagination par liens (crawlable) en conservant les filtres courants. */
export async function Pagination({
  page,
  totalPages,
  basePath,
  params,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;
  const t = await getTranslations('common');
  const tc = await getTranslations('catalogue');
  const href = (p: number) => {
    const qs = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => Boolean(e[1])));
    if (p > 1) qs.set('page', String(p));
    else qs.delete('page');
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );
  const item = 'flex h-10 min-w-10 items-center justify-center rounded-md border border-border px-3 text-sm font-medium';

  return (
    <nav aria-label={tc('pagination')} className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && (
        <Link href={href(page - 1)} className={cn(item, 'hover:bg-muted')} rel="prev">
          <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden /> <span className="sr-only">{t('previous')}</span>
        </Link>
      )}
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && p - pages[i - 1] > 1 && <span aria-hidden>…</span>}
          <Link
            href={href(p)}
            aria-current={p === page ? 'page' : undefined}
            aria-label={t('page', { page: p, total: totalPages })}
            className={cn(item, p === page ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted')}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < totalPages && (
        <Link href={href(page + 1)} className={cn(item, 'hover:bg-muted')} rel="next">
          <span className="sr-only">{t('next')}</span> <ChevronRight className="size-4 rtl:rotate-180" aria-hidden />
        </Link>
      )}
    </nav>
  );
}
