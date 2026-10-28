import { COMPANY, type BlogPost, type PackageDetail } from '@cls/shared';
import { SITE_URL } from './config';
import { tr } from './i18n';

export const absolute = (path: string) => new URL(path, SITE_URL).toString();

export function travelAgencySchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    '@id': `${SITE_URL}/#agency`,
    name: COMPANY.name,
    legalName: COMPANY.legalName,
    url: SITE_URL,
    logo: absolute('/icon.svg'),
    image: absolute('/opengraph-image'),
    email: COMPANY.email,
    telephone: COMPANY.phone,
    priceRange: '$$',
    currenciesAccepted: 'TND, EUR',
    paymentAccepted: 'Credit Card',
    areaServed: 'TN',
    availableLanguage: ['fr', 'ar', 'en'],
    address: {
      '@type': 'PostalAddress',
      streetAddress: COMPANY.address.street,
      addressLocality: COMPANY.address.city,
      postalCode: COMPANY.address.postalCode,
      addressCountry: 'TN',
    },
    geo: { '@type': 'GeoCoordinates', latitude: COMPANY.geo.lat, longitude: COMPANY.geo.lng },
    openingHoursSpecification: [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:30', closes: '18:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '09:00', closes: '13:00' },
    ],
  };
}

export function touristTripSchema(pkg: PackageDetail, locale: string) {
  const url = absolute(`/voyages/${pkg.slug}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    '@id': `${url}#trip`,
    name: tr(pkg, 'title', locale),
    description: tr(pkg, 'description', locale),
    url,
    image: pkg.gallery_urls.length ? pkg.gallery_urls : [absolute('/opengraph-image')],
    touristType: pkg.category,
    inLanguage: locale,
    provider: { '@id': `${SITE_URL}/#agency` },
    itinerary: {
      '@type': 'ItemList',
      numberOfItems: pkg.itinerary.length,
      itemListElement: pkg.itinerary.map((d) => ({
        '@type': 'ListItem',
        position: d.day,
        item: { '@type': 'TouristAttraction', name: tr(d, 'title', locale) || d.title_fr },
      })),
    },
    subjectOf: { '@type': 'Place', name: tr(pkg.destination, 'name', locale), address: { '@type': 'PostalAddress', addressCountry: pkg.destination.country } },
    offers: {
      '@type': 'Offer',
      price: Number(pkg.base_price).toFixed(3),
      priceCurrency: 'TND',
      availability: 'https://schema.org/InStock',
      url: absolute(`/reserver/${pkg.slug}`),
      seller: { '@id': `${SITE_URL}/#agency` },
    },
    ...(pkg.rating.count > 0 && pkg.rating.average !== null && {
      aggregateRating: { '@type': 'AggregateRating', ratingValue: pkg.rating.average, reviewCount: pkg.rating.count, bestRating: 5, worstRating: 1 },
    }),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: absolute(it.path) })),
  };
}

export function blogPostingSchema(post: BlogPost, locale: string) {
  const url = absolute(`/blog/${post.slug}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: tr(post, 'title', locale),
    description: tr(post, 'excerpt', locale) || undefined,
    image: post.cover_url ?? absolute('/opengraph-image'),
    datePublished: post.published_at,
    dateModified: post.updated_at,
    inLanguage: locale,
    mainEntityOfPage: url,
    keywords: post.tags.join(', '),
    author: { '@type': 'Person', name: `${post.author.first_name} ${post.author.last_name}` },
    publisher: { '@id': `${SITE_URL}/#agency` },
  };
}
