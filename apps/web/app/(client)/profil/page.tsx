'use client';

import type { PublicUser } from '@cls/shared';
import { useMutation } from '@tanstack/react-query';
import { MailWarning } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth/auth-provider';

export default function ProfilePage() {
  const t = useTranslations('client.profileForm');
  const ta = useTranslations('auth');
  const tc = useTranslations('common');
  const { user, request, setUser } = useAuth();
  const [form, setForm] = useState({ first_name: user?.first_name ?? '', last_name: user?.last_name ?? '', phone: user?.phone ?? '' });
  const [pw, setPw] = useState({ current_password: '', new_password: '' });

  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) => request<PublicUser>('/users/me', { method: 'PATCH', body }),
    onSuccess: (u) => {
      setUser(u);
      setPw({ current_password: '', new_password: '' });
      toast.success(t('saved'));
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : String(err)),
  });
  const resend = useMutation({
    mutationFn: () => request('/auth/verify-email/resend', { method: 'POST' }),
    onSuccess: () => toast.success(t('resent')),
  });

  if (!user) return null;
  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      {!user.is_verified && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent/40 bg-accent/10 p-4 text-sm" role="status">
          <span className="flex items-center gap-2"><MailWarning className="size-5 text-accent" aria-hidden /> {t('verifyBanner')}</span>
          <Button size="sm" variant="outline" loading={resend.isPending} onClick={() => resend.mutate()}>{t('resend')}</Button>
        </div>
      )}
      <form
        className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-6"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate({ ...form, phone: form.phone.replace(/[\s.-]/g, '') || null });
        }}
      >
        <h2 className="font-serif text-lg font-semibold">{t('personal')}</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="first_name" label={ta('firstName')} required>
            <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} autoComplete="given-name" />
          </Field>
          <Field id="last_name" label={ta('lastName')} required>
            <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} autoComplete="family-name" />
          </Field>
        </div>
        <Field id="email" label={ta('email')}>
          <Input value={user.email} disabled readOnly />
        </Field>
        <Field id="phone" label={ta('phone')} hint={ta('phoneHint')}>
          <Input type="tel" dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" />
        </Field>
        <Button type="submit" className="self-start" loading={save.isPending}>{tc('save')}</Button>
      </form>
      <form
        className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-6"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(pw);
        }}
      >
        <h2 className="font-serif text-lg font-semibold">{t('security')}</h2>
        <Field id="current_password" label={t('currentPassword')} required>
          <Input type="password" autoComplete="current-password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} />
        </Field>
        <Field id="new_password" label={t('newPassword')} hint={ta('passwordHint')} required>
          <Input type="password" autoComplete="new-password" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} />
        </Field>
        <Button type="submit" variant="outline" className="self-start" loading={save.isPending}>{t('newPassword')}</Button>
      </form>
    </div>
  );
}
