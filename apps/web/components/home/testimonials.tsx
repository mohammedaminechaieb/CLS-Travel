import type { FeaturedReview } from '@cls/shared';
import { Quote } from 'lucide-react';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { RatingStars } from '@/components/packages/rating-stars';
import { tr } from '@/lib/i18n';

export async function Testimonials({ reviews }: { reviews: FeaturedReview[] }) {
  const locale = await getLocale();
  return (
    <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {reviews.map((r) => (
        <li key={r.id}>
          <figure className="flex h-full flex-col gap-4 rounded-lg border border-border bg-surface p-6 shadow-sm">
            <Quote className="size-8 text-accent" aria-hidden />
            <RatingStars value={r.rating} />
            <blockquote className="flex-1 text-text">« {r.comment} »</blockquote>
            <figcaption className="border-t border-border pt-4 text-sm">
              <span className="font-semibold">{r.author.name}</span>
              <span className="text-text-muted"> — </span>
              <Link href={`/voyages/${r.package.slug}`} className="text-primary hover:underline">
                {tr(r.package, 'title', locale)}
              </Link>
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
