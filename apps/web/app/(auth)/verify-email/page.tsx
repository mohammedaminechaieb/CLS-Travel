import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { VerifyEmail } from '@/components/auth/password-forms';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth');
  return { title: t('verifyTitle'), robots: { index: false } };
}

export default async function Page() {
  const t = await getTranslations('auth');
  return (
    <>
      <h1 className="text-3xl font-bold">{t('verifyTitle')}</h1>
      
      <div className="mt-8">
        <Suspense>
          <VerifyEmail />
        </Suspense>
      </div>
    </>
  );
}
