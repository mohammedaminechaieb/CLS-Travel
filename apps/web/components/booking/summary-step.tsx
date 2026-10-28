'use client';

import type { PromoValidation } from '@cls/shared';
import { useMutation } from '@tanstack/react-query';
import { Tag, X } from 'lucide-react';
import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth/auth-provider';
import type { ParticipantsValue } from './participants-step';

export function SummaryStep({
  pkg,
  value,
  promo,
  onPromo,
  onBack,
  onConfirm,
  submitting,
}: {
  pkg: { id: string; title: string; base_price: string; duration_days: number };
  value: ParticipantsValue;
  promo: PromoValidation | null;
  onPromo: (promo: PromoValidation | null) => void;
  onBack: () => void;
  onConfirm: () => void;
  submitting: boolean;
}) {
  const t = useTranslations('booking');
  const tc = useTranslations('common');
  const format = useFormatter();
  const { request } = useAuth();
  const [code, setCode] = useState(promo?.code ?? '');
  const [accepted, setAccepted] = useState(false);
  const [cgvError, setCgvError] = useState(false);

  const validate = useMutation({
    mutationFn: () =>
      request<PromoValidation>('/promo/validate', {
        method: 'POST',
        body: { code, package_id: pkg.id, participants: value.participants.length },
      }),
    onSuccess: onPromo,
  });

  const money = (v: number | string) => format.number(Number(v), { style: 'currency', currency: 'TND', minimumFractionDigits: 0, maximumFractionDigits: 3 });
  const count = value.participants.length;
  const subtotal = Number(pkg.base_price) * count;
  const discount = promo ? Number(promo.discount) : 0;
  const total = subtotal - discount;
  const departure = new Date(value.departure_date);
  const ret = new Date(departure.getTime() + (pkg.duration_days - 1) * 86_400_000);

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-lg border border-border bg-surface p-6" aria-labelledby="promo-title">
        <h2 id="promo-title" className="mb-3 flex items-center gap-2 font-serif text-lg font-semibold">
          <Tag className="size-5 text-accent" aria-hidden /> {t('promoTitle')}
        </h2>
        {promo ? (
          <div className="flex items-center justify-between rounded-md bg-success/10 px-4 py-3 text-sm text-success" role="status">
            <span>{t('promoApplied', { code: promo.code, amount: money(promo.discount) })}</span>
            <Button variant="ghost" size="sm" onClick={() => onPromo(null)}>
              <X aria-hidden /> {t('promoRemove')}
            </Button>
          </div>
        ) : (
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (code.trim()) validate.mutate();
            }}
          >
            <label htmlFor="promo" className="sr-only">{t('promoTitle')}</label>
            <Input
              id="promo"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={t('promoPlaceholder')}
              className="uppercase sm:max-w-xs"
              aria-invalid={validate.isError || undefined}
              aria-describedby={validate.isError ? 'promo-error' : undefined}
            />
            <Button type="submit" variant="outline" loading={validate.isPending}>{t('promoApply')}</Button>
          </form>
        )}
        {validate.isError && (
          <p id="promo-error" role="alert" className="mt-2 text-sm text-danger">
            {validate.error instanceof ApiError ? validate.error.message : tc('error')}
          </p>
        )}
      </section>

      <section className="rounded-lg border border-border bg-surface p-6" aria-labelledby="summary-title">
        <h2 id="summary-title" className="mb-4 text-2xl font-bold">{t('summaryTitle')}</h2>
        <p className="font-serif text-lg font-semibold">{pkg.title}</p>
        <dl className="mt-4 flex flex-col gap-3 text-sm">
          <Row label={t('dates')} value={`${format.dateTime(departure, { dateStyle: 'long' })} → ${format.dateTime(ret, { dateStyle: 'long' })}`} />
          <Row label={t('travelersCount')} value={value.participants.map((p) => `${p.prenom} ${p.nom}`).join(', ')} />
          <Row label={t('unitPrice')} value={`${money(pkg.base_price)} × ${count}`} />
          <Row label={t('subtotal')} value={money(subtotal)} />
          {discount > 0 && <Row label={t('discount')} value={`− ${money(discount)}`} className="text-success" />}
          <div className="my-1 border-t border-border" />
          <Row label={t('total')} value={money(total)} strong />
        </dl>
        <p className="mt-4 rounded-md bg-muted/60 px-4 py-3 text-sm text-text-muted">{t('paymentLater')}</p>
      </section>

      <div className="flex flex-col gap-1">
        <div className="flex items-start gap-3">
          <Checkbox
            id="cgv"
            checked={accepted}
            onCheckedChange={(v) => {
              setAccepted(v === true);
              setCgvError(false);
            }}
            aria-invalid={cgvError || undefined}
            aria-describedby={cgvError ? 'cgv-error' : undefined}
          />
          <label htmlFor="cgv" className="text-sm">
            {t.rich('acceptCgv', {
              link: (chunks) => (
                <Link href="/cgv" target="_blank" className="font-medium text-primary underline">{chunks}</Link>
              ),
            })}
          </label>
        </div>
        {cgvError && <p id="cgv-error" role="alert" className="text-xs text-danger">{t('errors.cgv')}</p>}
      </div>

      <div className="flex justify-between gap-3">
        <Button variant="outline" size="lg" onClick={onBack}>{t('back')}</Button>
        <Button
          variant="cta"
          size="lg"
          loading={submitting}
          onClick={() => (accepted ? onConfirm() : setCgvError(true))}
        >
          {t('confirm')}
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value, strong, className }: { label: string; value: string; strong?: boolean; className?: string }) {
  return (
    <div className={`flex justify-between gap-4 ${className ?? ''}`}>
      <dt className="text-text-muted">{label}</dt>
      <dd className={strong ? 'text-lg font-bold' : 'text-end font-medium'}>{value}</dd>
    </div>
  );
}
