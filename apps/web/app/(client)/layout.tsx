import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ClientNav } from '@/components/client/client-nav';
import { RequireAuth } from '@/components/client/require-auth';
import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('common');
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-white">
        {t('skipToContent')}
      </a>
      <Navbar />
      <main id="main" className="flex-1">
        <RequireAuth>
          <div className="container-content py-8 md:py-12">
            <ClientNav />
            {children}
          </div>
        </RequireAuth>
      </main>
      <Footer />
    </>
  );
}
