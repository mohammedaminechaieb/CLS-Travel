import type { Paginated, PublicReview, ReviewSummary } from '@cls/shared';
import { getFormatter, getTranslations } from 'next-intl/server';
import { RatingStars } from '@/components/packages/rating-stars';

export async function ReviewsSection({ data }: { data: (Paginated<PublicReview> & { summary: ReviewSummary }) | null }) {
  const t = await getTranslations('package');
  const format = await getFormatter();
  if (!data || data.summary.count === 0) return <p className="text-text-muted">{t('noReviews')}</p>;

  const { summary } = data;
  return (
    <div className="grid gap-8 md:grid-cols-3">
      <div className="rounded-lg bg-muted/60 p-6">
        <p className="mb-2 font-serif text-5xl font-bold leading-none text-primary">{summary.average?.toFixed(1)}</p>
        <RatingStars value={summary.average ?? 0} size="md" />
        <p className="mt-1 text-sm text-text-muted">{t('basedOn', { count: summary.count })}</p>
        <ul className="mt-4 flex flex-col gap-1.5">
          {[5, 4, 3, 2, 1].map((r) => {
            const n = summary.distribution[r] ?? 0;
            const pct = summary.count ? Math.round((n / summary.count) * 100) : 0;
            return (
              <li key={r} className="flex items-center gap-2 text-sm">
                <span className="w-16 text-text-muted">{t('stars', { count: r })}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-border" aria-hidden>
                  <span className="block h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                </span>
                <span className="w-8 text-end tabular-nums">{n}</span>
              </li>
            );
          })}
        </ul>
      </div>
      <ul className="flex flex-col gap-6 md:col-span-2">
        {data.data.map((r) => (
          <li key={r.id} className="border-b border-border pb-6 last:border-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{r.author.name}</p>
              <time className="text-sm text-text-muted" dateTime={r.created_at}>
                {format.dateTime(new Date(r.created_at), { month: 'long', year: 'numeric' })}
              </time>
            </div>
            <RatingStars value={r.rating} />
            <p className="mt-2 text-text">{r.comment}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
