import { COMPANY } from '@cls/shared';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ContactForm } from '@/components/contact-form';
import { GMAPS_KEY } from '@/lib/config';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('contact');
  return { title: t('title'), description: t('subtitle'), alternates: { canonical: '/contact' } };
}

export default async function ContactPage() {
  const t = await getTranslations('contact');
  const query = encodeURIComponent(`${COMPANY.address.street}, ${COMPANY.address.postalCode} ${COMPANY.address.city}, Tunisie`);
  // Embed API avec clé si disponible, sinon intégration publique sans clé
  const mapSrc = GMAPS_KEY
    ? `https://www.google.com/maps/embed/v1/place?key=${GMAPS_KEY}&q=${query}&zoom=16`
    : `https://maps.google.com/maps?q=${COMPANY.geo.lat},${COMPANY.geo.lng}&z=16&output=embed`;

  const infos = [
    { icon: MapPin, label: t('agency'), value: `${COMPANY.address.street}, ${COMPANY.address.postalCode} ${COMPANY.address.city}` },
    { icon: Phone, label: t('call'), value: COMPANY.phone, href: `tel:${COMPANY.phone}` },
    { icon: Mail, label: t('write'), value: COMPANY.email, href: `mailto:${COMPANY.email}` },
    { icon: Clock, label: t('hours'), value: t('hoursValue') },
  ];

  return (
    <div className="container-content py-10 md:py-14">
      <header className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-bold md:text-5xl">{t('title')}</h1>
        <p className="mt-3 text-lg text-text-muted">{t('subtitle')}</p>
      </header>
      <div className="grid gap-10 lg:grid-cols-12">
        <section className="relative self-start rounded-lg border border-border bg-surface p-6 md:p-8 lg:col-span-7" aria-label={t('title')}>
          <ContactForm />
        </section>
        <aside className="flex flex-col gap-6 lg:col-span-5">
          <ul className="flex flex-col gap-4 rounded-lg bg-primary p-6 text-primary-foreground">
            {infos.map(({ icon: Icon, label, value, href }) => (
              <li key={label} className="flex gap-3">
                <Icon className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
                <span>
                  <span className="block text-sm opacity-80">{label}</span>
                  {href ? <a href={href} className="font-medium hover:underline" dir="ltr">{value}</a> : <span className="font-medium">{value}</span>}
                </span>
              </li>
            ))}
          </ul>
          <div className="overflow-hidden rounded-lg border border-border">
            <iframe
              title={t('mapTitle')}
              src={mapSrc}
              className="aspect-[4/3] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
