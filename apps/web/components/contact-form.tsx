'use client';

import { useMutation } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { ApiError, apiFetch } from '@/lib/api-client';

const SUBJECTS = ['information', 'devis', 'groupe', 'omra', 'reclamation', 'autre'] as const;

export function ContactForm() {
  const t = useTranslations('contact');
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: 'information', message: '', website: '' });
  const send = useMutation({
    mutationFn: () =>
      apiFetch('/contact', {
        method: 'POST',
        body: { ...form, phone: form.phone.replace(/[\s.-]/g, '') || undefined, website: form.website || undefined },
      }),
  });

  if (send.isSuccess) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 rounded-lg border border-success/30 bg-success/10 p-10 text-center">
        <CheckCircle2 className="size-10 text-success" aria-hidden />
        <p className="text-lg font-medium">{t('sent')}</p>
      </div>
    );
  }
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        send.mutate();
      }}
    >
      {send.isError && (
        <p role="alert" className="rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">
          {send.error instanceof ApiError && send.error.status === 400 ? send.error.message : t('error')}
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="c-name" label={t('name')} required><Input autoComplete="name" value={form.name} onChange={set('name')} required maxLength={120} /></Field>
        <Field id="c-email" label={t('email')} required><Input type="email" autoComplete="email" value={form.email} onChange={set('email')} required /></Field>
        <Field id="c-phone" label={t('phone')}><Input type="tel" dir="ltr" autoComplete="tel" value={form.phone} onChange={set('phone')} placeholder="+216" /></Field>
        <Field id="c-subject" label={t('subject')} required>
          <NativeSelect value={form.subject} onChange={set('subject')}>
            {SUBJECTS.map((s) => <option key={s} value={s}>{t(`subjects.${s}`)}</option>)}
          </NativeSelect>
        </Field>
      </div>
      <Field id="c-message" label={t('message')} required>
        <Textarea rows={6} value={form.message} onChange={set('message')} required minLength={10} maxLength={5000} />
      </Field>
      {/* Pot de miel : invisible pour les humains */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label htmlFor="c-website">Website</label>
        <input id="c-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
      </div>
      <p className="text-xs text-text-muted">
        <Link href="/confidentialite" className="underline">{t('consent')}</Link>
      </p>
      <Button type="submit" variant="cta" size="lg" className="self-start" loading={send.isPending}>{t('send')}</Button>
    </form>
  );
}
