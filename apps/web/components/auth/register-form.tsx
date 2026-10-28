'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth/auth-provider';
import { safeNext } from '@/lib/safe-redirect';

const PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/;
const E164 = /^\+[1-9]\d{6,14}$/;

export function RegisterForm() {
  const t = useTranslations('auth');
  const { register: signUp } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const schema = z
    .object({
      first_name: z.string().trim().min(1, t('errors.required')).max(80),
      last_name: z.string().trim().min(1, t('errors.required')).max(80),
      email: z.string().trim().email(t('errors.email')),
      phone: z
        .string()
        .transform((v) => v.replace(/[\s.-]/g, ''))
        .refine((v) => v === '' || E164.test(v), t('errors.phone')),
      password: z.string().regex(PASSWORD, t('errors.password')),
      confirm: z.string(),
      terms: z.literal(true, { message: t('errors.terms') }),
    })
    .refine((v) => v.password === v.confirm, { path: ['confirm'], message: t('errors.mismatch') });

  type FormInput = z.input<typeof schema>;
  const { register, control, handleSubmit, formState } = useForm<FormInput, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { phone: '', terms: false as unknown as true },
  });

  const onSubmit = handleSubmit(async ({ confirm: _c, terms: _t, phone, ...values }) => {
    setError(null);
    try {
      const user = await signUp({ ...values, ...(phone && { phone }) });
      toast.success(t('welcome', { name: user.first_name }));
      router.replace(safeNext(params.get('next')));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : String(err));
    }
  });

  const e = formState.errors;
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      {error && (
        <p role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="first_name" label={t('firstName')} error={e.first_name?.message} required>
          <Input autoComplete="given-name" {...register('first_name')} />
        </Field>
        <Field id="last_name" label={t('lastName')} error={e.last_name?.message} required>
          <Input autoComplete="family-name" {...register('last_name')} />
        </Field>
      </div>
      <Field id="email" label={t('email')} error={e.email?.message} required>
        <Input type="email" autoComplete="email" {...register('email')} />
      </Field>
      <Field id="phone" label={t('phone')} hint={t('phoneHint')} error={e.phone?.message}>
        <Input type="tel" autoComplete="tel" dir="ltr" placeholder="+216" {...register('phone')} />
      </Field>
      <Field id="password" label={t('password')} hint={t('passwordHint')} error={e.password?.message} required>
        <Input type="password" autoComplete="new-password" {...register('password')} />
      </Field>
      <Field id="confirm" label={t('confirmPassword')} error={e.confirm?.message} required>
        <Input type="password" autoComplete="new-password" {...register('confirm')} />
      </Field>
      <div className="flex flex-col gap-1">
        <div className="flex items-start gap-3">
          <Controller
            control={control}
            name="terms"
            render={({ field }) => (
              <Checkbox id="terms" checked={field.value === true} onCheckedChange={(v) => field.onChange(v === true)} aria-invalid={e.terms ? true : undefined} />
            )}
          />
          <label htmlFor="terms" className="text-sm">
            {t.rich('acceptTerms', {
              link: (chunks) => (
                <Link href="/cgv" target="_blank" className="font-medium text-primary underline">
                  {chunks}
                </Link>
              ),
            })}
          </label>
        </div>
        {e.terms && (
          <p role="alert" className="text-xs font-medium text-danger">
            {e.terms.message}
          </p>
        )}
      </div>
      <Button type="submit" size="lg" loading={formState.isSubmitting}>
        {t('registerCta')}
      </Button>
      <p className="text-center text-sm text-text-muted">
        {t('haveAccount')}{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          {t('loginLink')}
        </Link>
      </p>
    </form>
  );
}
