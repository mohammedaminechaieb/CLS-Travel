'use client';

import type { Booking, PromoValidation } from '@cls/shared';
import { useMutation } from '@tanstack/react-query';
import { LogIn } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth/auth-provider';
import { ParticipantsStep, type ParticipantsValue } from './participants-step';
import { PaymentStep } from './payment-step';
import { Stepper } from './stepper';
import { SummaryStep } from './summary-step';

interface TunnelPackage {
  id: string;
  slug: string;
  title: string;
  base_price: string;
  duration_days: number;
}

export function BookingTunnel({ pkg }: { pkg: TunnelPackage }) {
  const t = useTranslations('booking');
  const tc = useTranslations('common');
  const tn = useTranslations('nav');
  const { status, user, request } = useAuth();
  const params = useSearchParams();
  const pathname = usePathname();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [step, setStep] = useState(0);
  const [value, setValue] = useState<ParticipantsValue | null>(null);
  const [promo, setPromo] = useState<PromoValidation | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);

  // Focus sur le titre de l'étape à chaque changement (lecteurs d'écran)
  useEffect(() => {
    headingRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const create = useMutation({
    mutationFn: () =>
      request<Booking>('/bookings', {
        method: 'POST',
        body: { package_id: pkg.id, ...value, ...(promo && { promo_code: promo.code }) },
      }),
    onSuccess: (b) => {
      setBooking(b);
      toast.success(t('created', { reference: b.reference }));
      setStep(2);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : tc('error')),
  });

  if (status === 'loading') return <Skeleton className="h-96 w-full" />;

  if (status === 'anonymous') {
    const next = `${pathname}?${params.toString()}`;
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface p-10 text-center">
        <LogIn className="size-10 text-primary" aria-hidden />
        <h2 className="text-2xl font-bold">{t('loginRequired')}</h2>
        <p className="max-w-md text-text-muted">{t('loginRequiredText')}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href={`/login?next=${encodeURIComponent(next)}`}>{tn('login')}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/register?next=${encodeURIComponent(next)}`}>{tn('register')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  const requestedDate = params.get('date');
  const travelers = Math.min(20, Math.max(1, Number(params.get('travelers')) || 1));
  const initial: ParticipantsValue = value ?? {
    departure_date: requestedDate && requestedDate >= tomorrow ? requestedDate : '',
    participants: Array.from({ length: travelers }, (_, i) => ({
      nom: i === 0 ? (user?.last_name ?? '') : '',
      prenom: i === 0 ? (user?.first_name ?? '') : '',
      passport: '',
      dob: '',
    })),
  };

  const titles = [t('participantsTitle'), t('summaryTitle'), t('paymentTitle')];

  return (
    <div>
      <Stepper current={step} />
      <h2 ref={headingRef} tabIndex={-1} className="sr-only">
        {titles[step]}
      </h2>
      {step === 0 && (
        <ParticipantsStep
          initial={initial}
          durationDays={pkg.duration_days}
          onNext={(v) => {
            setValue(v);
            if (promo) setPromo(null); // le nombre de voyageurs a pu changer
            setStep(1);
          }}
        />
      )}
      {step === 1 && value && (
        <SummaryStep
          pkg={pkg}
          value={value}
          promo={promo}
          onPromo={setPromo}
          onBack={() => setStep(0)}
          onConfirm={() => create.mutate()}
          submitting={create.isPending}
        />
      )}
      {step === 2 && booking && (
        <PaymentStep bookingId={booking.id} total={Number(booking.total_price)} paid={Number(booking.paid_amount)} />
      )}
    </div>
  );
}
