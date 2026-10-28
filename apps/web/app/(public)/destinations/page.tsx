import type { Destination } from '@cls/shared';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { DestinationsGrid } from '@/components/home/destinations-grid';
import { SectionHeading } from '@/components/home/section-heading';
import { serverFetch } from '@/lib/server-api';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('home');
  return { title: t('destinationsTitle'), description: t('destinationsSubtitle') };
}

export default async function DestinationsPage() {
  const t = await getTranslations('home');
  const destinations = (await serverFetch<Destination[]>('/destinations')) ?? [];
  return (
    <div className="container-content py-12 md:py-16">
      <SectionHeading id="destinations-title" title={t('destinationsTitle')} subtitle={t('destinationsSubtitle')} />
      <DestinationsGrid destinations={destinations} />
    </div>
  );
}
