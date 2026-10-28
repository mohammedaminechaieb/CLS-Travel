import { getTranslations } from 'next-intl/server';
import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';
import { JsonLd } from '@/components/seo/json-ld';
import { travelAgencySchema } from '@/lib/seo';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('common');
  return (
    <>
      <a href="#main" className="sr-only z-50 rounded bg-primary px-4 py-2 text-white focus:not-sr-only focus:fixed focus:start-4 focus:top-4">
        {t('skipToContent')}
      </a>
      <Navbar />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <JsonLd data={travelAgencySchema()} />
    </>
  );
}
