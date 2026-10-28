import type { BlogPost } from '@cls/shared';
import { ogImage, OG_SIZE } from '@/lib/og';
import { serverFetchOrNotFound } from '@/lib/server-api';

export const alt = 'Article du blog CLS Travel';
export const size = OG_SIZE;
export const contentType = 'image/png';
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await serverFetchOrNotFound<BlogPost>(`/blog/${encodeURIComponent(slug)}`, 3600);
  if (!post || post === 'not-found') return ogImage({ eyebrow: 'Blog', title: 'Le blog voyage CLS Travel' });
  return ogImage({ eyebrow: `Blog · ${post.tags.slice(0, 2).map((t) => `#${t}`).join(' ')}`, title: post.title_fr });
}
