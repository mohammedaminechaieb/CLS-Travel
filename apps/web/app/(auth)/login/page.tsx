import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth');
  return { title: t('loginTitle'), robots: { index: false } };
}

export default async function Page() {
  const t = await getTranslations('auth');
  return (
    <>
      <h1 className="text-3xl font-bold">{t('loginTitle')}</h1>
      <p className="mt-2 text-text-muted">{t('loginSubtitle')}</p>
      <div className="mt-8">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </>
  );
}
