import type { Destination, FeaturedReview, Paginated, PackageSummary } from '@cls/shared';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { DestinationsGrid } from '@/components/home/destinations-grid';
import { FeaturedCarousel } from '@/components/home/featured-carousel';
import { Hero } from '@/components/home/hero';
import { SectionHeading } from '@/components/home/section-heading';
import { Testimonials } from '@/components/home/testimonials';
import { TrustBadges } from '@/components/home/trust-badges';
import { Button } from '@/components/ui/button';
import { serverFetch } from '@/lib/server-api';

export const revalidate = 300;

export default async function HomePage() {
  const t = await getTranslations('home');
  const tc = await getTranslations('common');
  const [featured, destinations, reviews] = await Promise.all([
    serverFetch<Paginated<PackageSummary>>('/packages', { featured: true, limit: 9 }),
    serverFetch<Destination[]>('/destinations'),
    serverFetch<FeaturedReview[]>('/reviews/featured'),
  ]);

  const allDestinations = destinations ?? [];
  const topDestinations = [...allDestinations]
    .sort((a, b) => (b.package_count ?? 0) - (a.package_count ?? 0))
    .slice(0, 7);

  return (
    <>
      <Hero destinations={allDestinations} />

      <section className="border-b border-border bg-surface py-12" aria-label={t('trustTitle')}>
        <div className="container-content">
          <TrustBadges />
        </div>
      </section>

      {featured && featured.data.length > 0 && (
        <section className="py-16 md:py-24" aria-labelledby="featured-title">
          <div className="container-content">
            <SectionHeading id="featured-title" title={t('featuredTitle')} subtitle={t('featuredSubtitle')} href="/voyages" linkLabel={tc('seeAll')} />
            <FeaturedCarousel packages={featured.data} />
          </div>
        </section>
      )}

      {topDestinations.length > 0 && (
        <section className="bg-muted/50 py-16 md:py-24" aria-labelledby="destinations-title">
          <div className="container-content">
            <SectionHeading
              id="destinations-title"
              title={t('destinationsTitle')}
              subtitle={t('destinationsSubtitle')}
              href="/destinations"
              linkLabel={tc('seeAll')}
            />
            <DestinationsGrid destinations={topDestinations} />
          </div>
        </section>
      )}

      {reviews && reviews.length > 0 && (
        <section className="py-16 md:py-24" aria-labelledby="testimonials-title">
          <div className="container-content">
            <SectionHeading id="testimonials-title" title={t('testimonialsTitle')} subtitle={t('testimonialsSubtitle')} />
            <Testimonials reviews={reviews} />
          </div>
        </section>
      )}

      <section className="pb-16 md:pb-24" aria-labelledby="cta-title">
        <div className="container-content">
          <div className="flex flex-col items-start gap-6 rounded-lg bg-primary p-8 text-primary-foreground md:flex-row md:items-center md:justify-between md:p-12">
            <div>
              <h2 id="cta-title" className="text-3xl font-bold">
                {t('ctaTitle')}
              </h2>
              <p className="mt-2 max-w-xl text-primary-foreground/90">{t('ctaText')}</p>
            </div>
            <Button asChild variant="cta" size="lg">
              <Link href="/contact">{t('ctaButton')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
