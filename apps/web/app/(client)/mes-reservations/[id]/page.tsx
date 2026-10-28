'use client';

import type { BookingDetail } from '@cls/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, FileText, MapPin, Receipt, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PaymentStep } from '@/components/booking/payment-step';
import { BookingMessages } from '@/components/client/booking-messages';
import { ReviewForm } from '@/components/client/review-form';
import { BookingStatusBadge } from '@/components/client/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth/auth-provider';
import { useApiQuery } from '@/lib/hooks';
import { tr } from '@/lib/i18n';

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations('client');
  const td = useTranslations('client.detail');
  const tc = useTranslations('common');
  const format = useFormatter();
  const locale = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const qc = useQueryClient();
  const { request, download } = useAuth();
  const [payOpen, setPayOpen] = useState(false);

  const processing = params.get('payment') === 'processing' || params.has('payment_intent');
  const { data: b, isLoading, error } = useApiQuery<BookingDetail>(['booking', id], `/bookings/${id}`, undefined, {
    // Après redirection Stripe, on interroge jusqu'à réception du webhook
    refetchInterval: (q) => (processing && q.state.data?.payments.some((p) => p.status === 'pending') ? 3000 : false),
  });

  useEffect(() => {
    if (processing) toast.info(td('paymentProcessing'));
  }, [processing, td]);

  const cancel = useMutation({
    mutationFn: () => request(`/client/bookings/${id}/cancel`, { method: 'PATCH' }),
    onSuccess: () => {
      toast.success(td('cancelled'));
      void qc.invalidateQueries({ queryKey: ['booking', id] });
      void qc.invalidateQueries({ queryKey: ['client-bookings'] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : String(err)),
  });

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (error || !b) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p role="alert">{error instanceof ApiError ? error.message : tc('error')}</p>
        <Button variant="outline" onClick={() => router.push('/mes-reservations')}>{td('back')}</Button>
      </div>
    );
  }

  const money = (v: string | number) => format.number(Number(v), { style: 'currency', currency: 'TND', minimumFractionDigits: 0, maximumFractionDigits: 3 });
  const total = Number(b.total_price);
  const paid = Number(b.paid_amount);
  const remaining = total - paid;
  const payable = (b.status === 'pending' || b.status === 'confirmed') && remaining > 0;
  const travelled = b.status === 'completed' || (b.status === 'confirmed' && new Date(b.return_date) < new Date());
  const canReview = travelled && b.reviews.length === 0;
  const utc = { timeZone: 'UTC' } as const;

  const dl = async (kind: 'confirmation' | 'invoice') => {
    try {
      await download(`/bookings/${b.id}/documents/${kind}`, `${kind}-${b.reference}.pdf`);
    } catch {
      toast.error(td('downloadError'));
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <Link href="/mes-reservations" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden /> {td('back')}
      </Link>

      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <BookingStatusBadge status={b.status} />
            <span className="font-mono text-sm text-text-muted">{t('reference')} {b.reference}</span>
          </div>
          <h1 className="text-3xl font-bold">{tr(b.package, 'title', locale)}</h1>
          <p className="mt-1 flex items-center gap-1 text-text-muted">
            <MapPin className="size-4" aria-hidden /> {tr(b.package.destination, 'name', locale)}, {b.package.destination.country}
          </p>
        </div>
        {payable && (
          <Button variant="cta" onClick={() => setPayOpen(true)}>
            {td('payBalance')} · {money(remaining)}
          </Button>
        )}
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-8 lg:col-span-2">
          <section className="rounded-lg border border-border bg-surface p-6" aria-labelledby="trip-title">
            <h2 id="trip-title" className="mb-4 font-serif text-lg font-semibold">{td('trip')}</h2>
            <p className="flex items-center gap-2">
              <CalendarDays className="size-5 text-primary" aria-hidden />
              {td('dates', {
                from: format.dateTime(new Date(b.departure_date), { dateStyle: 'full', ...utc }),
                to: format.dateTime(new Date(b.return_date), { dateStyle: 'full', ...utc }),
              })}
            </p>
            <h3 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-text-muted">{td('travelers')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {b.participants.map((p, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="py-2 font-medium">{p.prenom} {p.nom.toUpperCase()}</td>
                      <td className="py-2 font-mono text-text-muted">{p.passport}</td>
                      <td className="py-2 text-end text-text-muted">{format.dateTime(new Date(p.dob), { dateStyle: 'medium', ...utc })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-surface p-6" aria-labelledby="payments-title">
            <h2 id="payments-title" className="mb-4 font-serif text-lg font-semibold">{td('payments')}</h2>
            <dl className="mb-4 grid grid-cols-3 gap-4 rounded-md bg-muted/60 p-4 text-sm">
              <div><dt className="text-text-muted">{td('total')}</dt><dd className="font-bold">{money(total)}</dd></div>
              <div><dt className="text-text-muted">{t('stats.toPay')}</dt><dd className="font-bold text-cta">{money(remaining)}</dd></div>
              <div><dt className="text-text-muted">{td('paid')}</dt><dd className="font-bold text-success">{money(paid)}</dd></div>
            </dl>
            {b.payments.length === 0 ? (
              <p className="text-sm text-text-muted">{td('noPayments')}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {b.payments.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <span>
                      <span className="font-medium">{td(`paymentType.${p.payment_type}`)}</span>
                      <span className="block text-xs text-text-muted">
                        {format.dateTime(new Date(p.paid_at ?? p.created_at), { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <Badge variant={p.status === 'succeeded' ? 'success' : p.status === 'failed' ? 'danger' : 'muted'}>
                        {td(`paymentStatus.${p.status}`)}
                      </Badge>
                      <span className="text-end font-semibold">
                        {money(p.amount_tnd)}
                        {p.currency !== 'TND' && <span className="block text-xs font-normal text-text-muted">{p.amount} {p.currency}</span>}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {canReview && <ReviewForm bookingId={b.id} />}
          <BookingMessages bookingId={b.id} />
        </div>

        <aside className="flex flex-col gap-6">
          <section className="rounded-lg border border-border bg-surface p-6" aria-labelledby="docs-title">
            <h2 id="docs-title" className="mb-4 font-serif text-lg font-semibold">{td('documents')}</h2>
            <div className="flex flex-col gap-2">
              <Button variant="outline" className="justify-start" onClick={() => dl('confirmation')}>
                <FileText aria-hidden /> {td('confirmation')}
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => dl('invoice')}>
                <Receipt aria-hidden /> {td('invoice')}
              </Button>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-surface p-6" aria-labelledby="agent-title">
            <h2 id="agent-title" className="mb-4 font-serif text-lg font-semibold">{td('agent')}</h2>
            {b.assigned_agent ? (
              <p className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground" aria-hidden>
                  {b.assigned_agent.first_name.charAt(0)}{b.assigned_agent.last_name.charAt(0)}
                </span>
                <span>
                  <span className="block font-medium">{b.assigned_agent.first_name} {b.assigned_agent.last_name}</span>
                  <span className="text-sm text-text-muted">{b.assigned_agent.email}</span>
                </span>
              </p>
            ) : (
              <p className="flex items-center gap-2 text-sm text-text-muted"><UserRound className="size-4" aria-hidden /> {td('noAgent')}</p>
            )}
          </section>

          {b.status === 'pending' && paid === 0 && (
            <Button
              variant="ghost"
              className="text-danger"
              loading={cancel.isPending}
              onClick={() => window.confirm(td('cancelConfirm')) && cancel.mutate()}
            >
              {td('cancel')}
            </Button>
          )}
        </aside>
      </div>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{td('payTitle')} — {b.reference}</DialogTitle>
          </DialogHeader>
          {payOpen && <PaymentStep bookingId={b.id} total={total} paid={paid} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
