import { COMPANY } from '@cls/shared';
import { Mail, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Logo } from './logo';
import { NewsletterForm } from './newsletter-form';

export async function Footer() {
  const t = await getTranslations('footer');
  const nav = await getTranslations('nav');
  const year = new Date().getFullYear();

  const columns = [
    {
      title: t('explore'),
      links: [
        { href: '/voyages', label: nav('trips') },
        { href: '/voyages?category=circuit', label: t('circuits') },
        { href: '/voyages?category=omra', label: t('omra') },
        { href: '/destinations', label: nav('destinations') },
      ],
    },
    {
      title: t('company'),
      links: [
        { href: '/blog', label: nav('blog') },
        { href: '/contact', label: nav('contact') },
        { href: '/register', label: nav('register') },
      ],
    },
    {
      title: t('legal'),
      links: [
        { href: '/cgv', label: t('cgv') },
        { href: '/mentions-legales', label: t('legalNotice') },
        { href: '/confidentialite', label: t('privacy') },
      ],
    },
  ];

  return (
    <footer className="mt-auto bg-[#0F2236] text-white/90">
      <div className="border-b border-white/10">
        <div className="container-content flex flex-col items-start gap-6 py-10 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-serif text-2xl text-white">{t('newsletterTitle')}</h2>
            <p className="mt-1 text-sm text-white/75">{t('newsletterText')}</p>
          </div>
          <div className="w-full md:max-w-md">
            <NewsletterForm />
          </div>
        </div>
      </div>
      <div className="container-content grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo inverted />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75">{t('tagline')}</p>
          <address className="mt-6 flex flex-col gap-2 text-sm not-italic text-white/80">
            <span className="flex items-center gap-2">
              <MapPin className="size-4 text-accent" aria-hidden />
              {COMPANY.address.street}, {COMPANY.address.postalCode} {COMPANY.address.city}
            </span>
            <a href={`tel:${COMPANY.phone}`} className="flex items-center gap-2 hover:text-white" dir="ltr">
              <Phone className="size-4 text-accent" aria-hidden /> {COMPANY.phone}
            </a>
            <a href={`mailto:${COMPANY.email}`} className="flex items-center gap-2 hover:text-white">
              <Mail className="size-4 text-accent" aria-hidden /> {COMPANY.email}
            </a>
          </address>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-accent">{col.title}</h2>
            <ul className="mt-4 flex flex-col gap-2 text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/80 hover:text-white hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container-content flex flex-col gap-2 py-6 text-xs text-white/70 md:flex-row md:justify-between">
          <p>{t('rights', { year })}</p>
          <p>{t('license')}</p>
        </div>
      </div>
    </footer>
  );
}
