import type { BlogPost } from '@cls/shared';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { SmartImage } from '@/components/smart-image';
import { TiptapRenderer } from '@/components/tiptap-renderer';
import { tr } from '@/lib/i18n';
import { serverFetchOrNotFound } from '@/lib/server-api';
import { JsonLd } from '@/components/seo/json-ld';
import { blogPostingSchema } from '@/lib/seo';

export const revalidate = 300;
type Props = { params: Promise<{ slug: string }> };

async function getPost(slug: string) {
  const post = await serverFetchOrNotFound<BlogPost>(`/blog/${encodeURIComponent(slug)}`);
  if (!post || post === 'not-found') notFound();
  return post;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost((await params).slug);
  const locale = await getLocale();
  const title = tr(post, 'title', locale);
  const description = tr(post, 'excerpt', locale) || undefined;
  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title,
      description,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      authors: [`${post.author.first_name} ${post.author.last_name}`],
      tags: post.tags,
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function PostPage({ params }: Props) {
  const post = await getPost((await params).slug);
  const t = await getTranslations('blog');
  const locale = await getLocale();
  const format = await getFormatter();
  const title = tr(post, 'title', locale);

  return (
    <article className="pb-16">
      <JsonLd data={blogPostingSchema(post, locale)} />
      <header className="container-content max-w-3xl pt-10 md:pt-14">
        <Link href="/blog" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden /> {t('backToBlog')}
        </Link>
        <ul className="mb-3 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <li key={tag}><Link href={`/blog?tag=${tag}`} className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-text hover:bg-accent/25">#{tag}</Link></li>
          ))}
        </ul>
        <h1 className="text-3xl font-bold leading-tight md:text-5xl">{title}</h1>
        {tr(post, 'excerpt', locale) && <p className="mt-4 text-xl text-text-muted">{tr(post, 'excerpt', locale)}</p>}
        <p className="mt-6 text-sm text-text-muted">
          {t('by', { name: `${post.author.first_name} ${post.author.last_name}` })}
          {post.published_at && <> · <time dateTime={post.published_at}>{t('publishedOn', { date: format.dateTime(new Date(post.published_at), { dateStyle: 'long' }) })}</time></>}
          {' · '}{t('readingTime', { count: post.reading_minutes })}
        </p>
      </header>
      {post.cover_url && (
        <div className="container-content mt-8 max-w-5xl">
          <div className="relative aspect-[21/9] overflow-hidden rounded-lg">
            <SmartImage src={post.cover_url} alt="" fill priority sizes="(min-width: 1024px) 1024px, 100vw" className="object-cover" />
          </div>
        </div>
      )}
      <div className="container-content mt-10 max-w-3xl">
        <TiptapRenderer doc={post.body} className="text-lg" />
      </div>
      {post.related.length > 0 && (
        <aside className="container-content mt-16 max-w-5xl" aria-labelledby="related-title">
          <h2 id="related-title" className="mb-6 text-2xl font-bold">{t('related')}</h2>
          <ul className="grid gap-6 md:grid-cols-3">
            {post.related.map((r) => (
              <li key={r.slug} className="group relative overflow-hidden rounded-lg border border-border bg-surface">
                <div className="relative aspect-[16/9]"><SmartImage src={r.cover_url} alt="" fill sizes="33vw" className="object-cover" /></div>
                <h3 className="p-4 font-serif text-lg font-semibold">
                  <Link href={`/blog/${r.slug}`} className="after:absolute after:inset-0 group-hover:text-primary">{tr(r, 'title', locale)}</Link>
                </h3>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </article>
  );
}
