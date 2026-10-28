'use client';

import { DEFAULT_DEPOSIT_PERCENT, type PaymentIntentResponse, type PaymentType } from '@cls/shared';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useMutation } from '@tanstack/react-query';
import { Lock, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth/auth-provider';
import { SITE_URL } from '@/lib/config';
import { getStripe, stripeAppearance } from '@/lib/stripe';
import { cn } from '@/lib/utils';

/**
 * Étape de paiement réutilisable (tunnel + solde depuis l'espace client).
 * Le formulaire carte est un iframe Stripe Elements : aucune donnée bancaire ne touche nos serveurs.
 */
export function PaymentStep({ bookingId, total, paid }: { bookingId: string; total: number; paid: number }) {
  const t = useTranslations('booking');
  const format = useFormatter();
  const { request } = useAuth();
  const stripePromise = useMemo(() => getStripe(), []);

  const options: PaymentType[] = paid > 0 ? ['balance'] : ['deposit', 'full'];
  const [type, setType] = useState<PaymentType>(options[0]);
  const money = (v: number) => format.number(v, { style: 'currency', currency: 'TND', minimumFractionDigits: 0, maximumFractionDigits: 3 });
  const amountFor = (pt: PaymentType) =>
    pt === 'deposit' ? Math.round(total * DEFAULT_DEPOSIT_PERCENT * 10) / 1000 : total - paid;

  const intent = useMutation({
    mutationFn: (pt: PaymentType) =>
      request<PaymentIntentResponse>('/payments/intent', { method: 'POST', body: { booking_id: bookingId, payment_type: pt } }),
  });
  const { mutate } = intent;

  useEffect(() => {
    if (stripePromise) mutate(type);
  }, [type, stripePromise, mutate]);

  if (!stripePromise) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-accent/40 bg-accent/10 p-6" role="status">
        <p>{t('stripeUnavailable')}</p>
        <Button asChild variant="outline" className="self-start">
          <Link href={`/mes-reservations/${bookingId}`}>{t('goToBooking')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <fieldset>
        <legend className="mb-3 font-serif text-lg font-semibold">{t('paymentChoice')}</legend>
        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
          {options.map((pt) => {
            const amount = money(amountFor(pt));
            return (
              <label
                key={pt}
                className={cn(
                  'flex cursor-pointer flex-col gap-1 rounded-lg border-2 bg-surface p-4 transition-colors',
                  type === pt ? 'border-primary' : 'border-border hover:border-primary/50',
                )}
              >
                <span className="flex items-center gap-2 font-semibold">
                  <input type="radio" name="payment_type" value={pt} checked={type === pt} onChange={() => setType(pt)} className="size-4 accent-[#1C3A5E]" />
                  {pt === 'deposit' ? t('payDeposit', { percent: DEFAULT_DEPOSIT_PERCENT }) : pt === 'full' ? t('payFull') : t('payBalance')}
                </span>
                <span className="ps-6 text-sm text-text-muted">
                  {pt === 'deposit' ? t('payDepositText', { amount }) : pt === 'full' ? t('payFullText', { amount }) : t('payBalanceText', { amount })}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {intent.isError && (
        <p role="alert" className="rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">
          {intent.error instanceof ApiError ? intent.error.message : String(intent.error)}
        </p>
      )}
      {intent.isPending && <p className="text-sm text-text-muted" role="status">{t('preparing')}</p>}

      {intent.data && (
        <Elements
          key={intent.data.client_secret}
          stripe={stripePromise}
          options={{ clientSecret: intent.data.client_secret, appearance: stripeAppearance, locale: 'fr' }}
        >
          <CheckoutForm bookingId={bookingId} intent={intent.data} label={money(Number(intent.data.amount_tnd))} />
        </Elements>
      )}

      <p className="flex items-start gap-2 text-xs text-text-muted">
        <ShieldCheck className="size-4 shrink-0 text-success" aria-hidden /> {t('secure')}
      </p>
    </div>
  );
}

function CheckoutForm({ bookingId, intent, label }: { bookingId: string; intent: PaymentIntentResponse; label: string }) {
  const t = useTranslations('booking');
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;
        setSubmitting(true);
        setError(null);
        const { error: stripeError } = await stripe.confirmPayment({
          elements,
          confirmParams: { return_url: `${SITE_URL}/mes-reservations/${bookingId}?payment=processing` },
        });
        // On n'arrive ici qu'en cas d'erreur : sinon Stripe redirige vers return_url
        if (stripeError) setError(t('paymentError', { message: stripeError.message ?? '' }));
        setSubmitting(false);
      }}
    >
      <PaymentElement options={{ layout: 'tabs' }} />
      {intent.currency !== 'TND' && (
        <p className="text-xs text-text-muted">{t('charged', { amount: `${intent.amount_charged} ${intent.currency}` })}</p>
      )}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <Button type="submit" variant="cta" size="lg" loading={submitting} disabled={!stripe}>
        <Lock aria-hidden /> {t('payCta', { amount: label })}
      </Button>
    </form>
  );
}
