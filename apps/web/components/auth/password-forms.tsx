'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api-client';

const PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/;

export function ForgotPasswordForm() {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  if (sent) {
    return (
      <div className="flex flex-col gap-4" role="status">
        <p className="rounded-md bg-success/10 px-4 py-3 text-sm text-success">{t('forgotSent')}</p>
        <Link href="/login" className="font-semibold text-primary hover:underline">{t('backToLogin')}</Link>
      </div>
    );
  }
  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        await apiFetch('/auth/forgot-password', { method: 'POST', body: { email } }).catch(() => undefined);
        setLoading(false);
        setSent(true);
      }}
    >
      <Field id="email" label={t('email')} required>
        <Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Button type="submit" size="lg" loading={loading}>{t('forgotCta')}</Button>
      <Link href="/login" className="text-center text-sm font-medium text-primary hover:underline">{t('backToLogin')}</Link>
    </form>
  );
}

export function ResetPasswordForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="flex flex-col gap-5"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (!PASSWORD.test(password)) return setError(t('errors.password'));
        if (password !== confirm) return setError(t('errors.mismatch'));
        setLoading(true);
        try {
          await apiFetch('/auth/reset-password', { method: 'POST', body: { token, password } });
          toast.success(t('resetDone'));
          router.replace('/login');
        } catch {
          setError(t('resetInvalid'));
        } finally {
          setLoading(false);
        }
      }}
    >
      {error && <p role="alert" className="rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
      <Field id="password" label={t('password')} hint={t('passwordHint')} required>
        <Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <Field id="confirm" label={t('confirmPassword')} required>
        <Input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </Field>
      <Button type="submit" size="lg" loading={loading} disabled={!token}>{t('resetCta')}</Button>
    </form>
  );
}

export function VerifyEmail() {
  const t = useTranslations('auth');
  const token = useSearchParams().get('token');
  const [state, setState] = useState<'pending' | 'ok' | 'error'>('pending');

  useEffect(() => {
    if (!token) return setState('error');
    apiFetch('/auth/verify-email', { method: 'POST', body: { token } })
      .then(() => setState('ok'))
      .catch(() => setState('error'));
  }, [token]);

  return (
    <div className="flex flex-col gap-4" role="status" aria-live="polite">
      {state === 'pending' && <p>{t('verifying')}</p>}
      {state === 'ok' && <p className="rounded-md bg-success/10 px-4 py-3 text-success">{t('verified')}</p>}
      {state === 'error' && <p className="rounded-md bg-danger/10 px-4 py-3 text-danger">{t('verifyFailed')}</p>}
      {state !== 'pending' && (
        <Button asChild>
          <Link href="/espace-client">{t('continue')}</Link>
        </Button>
      )}
    </div>
  );
}
