import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  const isProd = SITE_URL.startsWith('https://carthagoloisirs.com');
  return {
    rules: isProd
      ? [
          {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin', '/espace-client', '/mes-reservations', '/profil', '/reserver/', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email'],
          },
        ]
      : [{ userAgent: '*', disallow: '/' }], // pré-production : pas d'indexation
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
