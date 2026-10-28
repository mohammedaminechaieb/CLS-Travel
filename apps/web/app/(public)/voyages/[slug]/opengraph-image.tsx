import type { PackageDetail } from '@cls/shared';
import { ogImage, OG_SIZE } from '@/lib/og';
import { serverFetchOrNotFound } from '@/lib/server-api';

export const alt = 'Voyage CLS Travel';
export const size = OG_SIZE;
export const contentType = 'image/png';
export const revalidate = 3600;

/** og:image dynamique par voyage : titre, destination, durée et prix. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pkg = await serverFetchOrNotFound<PackageDetail>(`/packages/${encodeURIComponent(slug)}`, 3600);
  if (!pkg || pkg === 'not-found') return ogImage({ eyebrow: 'CLS Travel', title: 'Nos voyages' });
  const price = Math.round(Number(pkg.base_price)).toLocaleString('fr-FR').replace(/ | /g, ' ');
  return ogImage({
    eyebrow: `${pkg.destination.name_fr} · ${pkg.duration_days} jour${pkg.duration_days > 1 ? 's' : ''}`,
    title: pkg.title_fr,
    footer: 'carthagoloisirs.com',
    badge: `Dès ${price} TND`,
  });
}
