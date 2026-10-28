import type { BlogPostSummary, Paginated } from '@cls/shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { PostCard } from '@/components/blog/post-card';
import { Pagination } from '@/components/catalogue/pagination';
import { serverFetch } from '@/lib/server-api';
import { cn } from '@/lib/utils';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('blog');
  return { title: t('title'), description: t('subtitle'), alternates: { canonical: '/blog' } };
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { tag, page: rawPage } = await searchParams;
  const page = Math.max(1, Number(rawPage) || 1);
  const t = await getTranslations('blog');
  const [posts, tags] = await Promise.all([
    serverFetch<Paginated<BlogPostSummary>>('/blog', { tag, page, limit: 9 }, 120),
    serverFetch<{ tag: string; count: number }[]>('/blog/tags', undefined, 300),
  ]);
  const chip = (active: boolean) =>
    cn('rounded-full border px-3 py-1.5 text-sm font-medium', active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface hover:border-primary');

  return (
    <div className="container-content py-10 md:py-14">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-bold md:text-5xl">{t('title')}</h1>
        <p className="mt-3 text-lg text-text-muted">{t('subtitle')}</p>
      </header>
      {tags && tags.length > 0 && (
        <nav aria-label={t('tagsLabel')} className="mb-8">
          <ul className="flex flex-wrap gap-2">
            <li><Link href="/blog" aria-current={!tag ? 'page' : undefined} className={chip(!tag)}>{t('allTags')}</Link></li>
            {tags.map((x) => (
              <li key={x.tag}>
                <Link href={`/blog?tag=${encodeURIComponent(x.tag)}`} aria-current={tag === x.tag ? 'page' : undefined} className={chip(tag === x.tag)}>
                  #{x.tag} <span className="opacity-70">({x.count})</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      {posts && posts.data.length > 0 ? (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.data.map((p) => <li key={p.id}><PostCard post={p} /></li>)}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-border p-10 text-center text-text-muted">{t('empty')}</p>
      )}
      <Pagination page={page} totalPages={posts?.meta.totalPages ?? 1} basePath="/blog" params={{ tag }} />
    </div>
  );
}
