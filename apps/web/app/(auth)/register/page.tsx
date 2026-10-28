import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { RegisterForm } from '@/components/auth/register-form';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth');
  return { title: t('registerTitle'), robots: { index: false } };
}

export default async function Page() {
  const t = await getTranslations('auth');
  return (
    <>
      <h1 className="text-3xl font-bold">{t('registerTitle')}</h1>
      <p className="mt-2 text-text-muted">{t('registerSubtitle')}</p>
      <div className="mt-8">
        <Suspense>
          <RegisterForm />
        </Suspense>
      </div>
    </>
  );
}
