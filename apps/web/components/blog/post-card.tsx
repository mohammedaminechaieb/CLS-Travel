import type { BlogPostSummary } from '@cls/shared';
import Link from 'next/link';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { SmartImage } from '@/components/smart-image';
import { tr } from '@/lib/i18n';

export function PostCard({ post }: { post: BlogPostSummary }) {
  const t = useTranslations('blog');
  const locale = useLocale();
  const format = useFormatter();
  const title = tr(post, 'title', locale);
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm hover:shadow-lg">
      <div className="relative aspect-[16/9] overflow-hidden">
        <SmartImage src={post.cover_url} alt="" fill sizes="(min-width: 1024px) 400px, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <ul className="flex flex-wrap gap-1.5" aria-label={t('tagsLabel')}>
          {post.tags.map((tag) => (
            <li key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-text-muted">#{tag}</li>
          ))}
        </ul>
        <h3 className="font-serif text-xl font-semibold leading-snug">
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 hover:text-primary">{title}</Link>
        </h3>
        <p className="line-clamp-3 text-sm text-text-muted">{tr(post, 'excerpt', locale)}</p>
        <p className="mt-auto text-xs text-text-muted">
          {post.published_at && <time dateTime={post.published_at}>{format.dateTime(new Date(post.published_at), { dateStyle: 'long' })}</time>}
          {' · '}
          {t('readingTime', { count: post.reading_minutes })}
        </p>
      </div>
    </article>
  );
}
