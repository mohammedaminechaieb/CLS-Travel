'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { STAFF_ROLES } from '@cls/shared';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth/auth-provider';
import { safeNext } from '@/lib/safe-redirect';

export function LoginForm() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const schema = z.object({
    email: z.string().trim().email(t('errors.email')),
    password: z.string().min(1, t('errors.required')),
  });
  const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const user = await login(values.email, values.password);
      const isStaff = (STAFF_ROLES as readonly string[]).includes(user.role);
      router.replace(safeNext(params.get('next'), isStaff ? '/admin' : '/espace-client'));
    } catch (err) {
      if (!(err instanceof ApiError)) setError(tc('error'));
      else setError(err.status === 429 ? t('errors.tooMany') : err.status === 401 ? t('errors.invalidCredentials') : err.message);
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      {error && (
        <p role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}
      <Field id="email" label={t('email')} error={formState.errors.email?.message} required>
        <Input type="email" autoComplete="email" {...register('email')} />
      </Field>
      <Field id="password" label={t('password')} error={formState.errors.password?.message} required>
        <Input type="password" autoComplete="current-password" {...register('password')} />
      </Field>
      <Link href="/forgot-password" className="-mt-2 self-end text-sm font-medium text-primary hover:underline">
        {t('forgot')}
      </Link>
      <Button type="submit" size="lg" loading={formState.isSubmitting}>
        {t('loginCta')}
      </Button>
      <p className="text-center text-sm text-text-muted">
        {t('noAccount')}{' '}
        <Link href={`/register${params.get('next') ? `?next=${encodeURIComponent(params.get('next')!)}` : ''}`} className="font-semibold text-primary hover:underline">
          {t('createOne')}
        </Link>
      </p>
    </form>
  );
}
