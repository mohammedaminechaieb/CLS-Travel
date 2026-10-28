'use client';

import { useMutation } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api-client';

export function NewsletterForm() {
  const t = useTranslations('footer');
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const mutation = useMutation({
    mutationFn: () => apiFetch('/newsletter', { method: 'POST', body: { email, locale } }),
    onSuccess: () => {
      toast.success(t('newsletterSuccess'));
      setEmail('');
    },
    onError: () => toast.error(t('newsletterError')),
  });

  return (
    <form
      className="flex w-full flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <label htmlFor="newsletter-email" className="sr-only">
        {t('emailLabel')}
      </label>
      <Input
        id="newsletter-email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t('newsletterPlaceholder')}
        className="border-white/20 bg-white/10 text-white placeholder:text-white/70"
      />
      <Button type="submit" variant="accent" loading={mutation.isPending}>
        {t('newsletterCta')}
      </Button>
    </form>
  );
}
