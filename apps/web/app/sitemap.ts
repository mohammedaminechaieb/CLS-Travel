import type { BlogPostSummary, Destination, PackageSummary, Paginated } from '@cls/shared';
import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/config';
import { serverFetch } from '@/lib/server-api';

export const revalidate = 3600;

async function all<T>(path: string): Promise<T[]> {
  const out: T[] = [];
  for (let page = 1; page <= 50; page++) {
    const res = await serverFetch<Paginated<T>>(path, { page, limit: 100 }, 3600);
    if (!res) break;
    out.push(...res.data);
    if (page >= res.meta.totalPages) break;
  }
  return out;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (p: string) => `${SITE_URL}${p}`;
  const now = new Date();
  const [packages, posts, destinations] = await Promise.all([
    all<PackageSummary>('/packages'),
    all<BlogPostSummary>('/blog'),
    serverFetch<Destination[]>('/destinations', undefined, 3600),
  ]);

  const statics: MetadataRoute.Sitemap = [
    { url: url('/'), lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: url('/voyages'), lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: url('/destinations'), lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: url('/blog'), lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: url('/contact'), changeFrequency: 'yearly', priority: 0.5 },
    { url: url('/cgv'), changeFrequency: 'yearly', priority: 0.2 },
    { url: url('/mentions-legales'), changeFrequency: 'yearly', priority: 0.2 },
    { url: url('/confidentialite'), changeFrequency: 'yearly', priority: 0.2 },
  ];

  return [
    ...statics,
    ...packages.map((p) => ({
      url: url(`/voyages/${p.slug}`),
      lastModified: new Date(p.updated_at),
      changeFrequency: 'weekly' as const,
      priority: p.featured ? 0.9 : 0.8,
      images: p.gallery_urls.slice(0, 5),
    })),
    ...(destinations ?? [])
      .filter((d) => (d.package_count ?? 0) > 0)
      .map((d) => ({ url: url(`/voyages?destination_id=${d.id}`), changeFrequency: 'weekly' as const, priority: 0.6 })),
    ...posts.map((p) => ({
      url: url(`/blog/${p.slug}`),
      lastModified: new Date(p.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
      ...(p.cover_url && { images: [p.cover_url] }),
    })),
  ];
}
