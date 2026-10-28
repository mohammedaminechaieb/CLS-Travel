import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { ForgotPasswordForm } from '@/components/auth/password-forms';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth');
  return { title: t('forgotTitle'), robots: { index: false } };
}

export default async function Page() {
  const t = await getTranslations('auth');
  return (
    <>
      <h1 className="text-3xl font-bold">{t('forgotTitle')}</h1>
      <p className="mt-2 text-text-muted">{t('forgotSubtitle')}</p>
      <div className="mt-8">
        <Suspense>
          <ForgotPasswordForm />
        </Suspense>
      </div>
    </>
  );
}
