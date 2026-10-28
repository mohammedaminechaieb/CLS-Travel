'use client';

import { ADMIN_ROLES, type Role } from '@cls/shared';
import { ArrowDownRight, ArrowUpRight, CalendarClock, Clock3, Coins, Luggage, ShoppingBag, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { BarChart } from '@/components/admin/bar-chart';
import { AdminPageHeader } from '@/components/admin/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth/auth-provider';
import { useApiQuery } from '@/lib/hooks';
import { cn } from '@/lib/utils';

interface Overview {
  revenue_month: number;
  revenue_growth: number | null;
  bookings_month: number;
  bookings_growth: number | null;
  pending_bookings: number;
  upcoming_departures: number;
  outstanding_balance: number;
  average_basket: number;
}
interface Revenue { total: number; series: { period: string; revenue: number; payments: number }[] }
interface BookingStats { total: number; by_status: Record<string, number> }
interface TopPackage { id: string; slug: string; title_fr: string; bookings: number; travelers: number; booked: number; collected: number }
interface Conversion { signup_to_booking_rate: number; booking_to_payment_rate: number; cancellation_rate: number; registered_users: number; bookings_created: number; bookings_paid: number }

export default function AdminDashboard() {
  const t = useTranslations('admin.dashboard');
  const ts = useTranslations('client.status');
  const tn = useTranslations('admin.nav');
  const format = useFormatter();
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = !!user && (ADMIN_ROLES as readonly Role[]).includes(user.role);

  // Les agents n'ont pas accès aux KPI financiers : redirection vers leurs réservations
  useEffect(() => {
    if (user && !isAdmin) router.replace('/admin/reservations');
  }, [user, isAdmin, router]);

  const opts = { enabled: isAdmin };
  const overview = useApiQuery<Overview>(['analytics', 'overview'], '/admin/analytics/overview', undefined, opts);
  const revenue = useApiQuery<Revenue>(['analytics', 'revenue'], '/admin/analytics/revenue', { period: 'month' }, opts);
  const bookings = useApiQuery<BookingStats>(['analytics', 'bookings'], '/admin/analytics/bookings', undefined, opts);
  const top = useApiQuery<TopPackage[]>(['analytics', 'top'], '/admin/analytics/top-packages', { limit: 5 }, opts);
  const conversion = useApiQuery<Conversion>(['analytics', 'conversion'], '/admin/analytics/conversion', undefined, opts);

  if (!isAdmin) return <p className="text-text-muted">{t('staffOnly')}</p>;

  const money = (v: number) => format.number(v, { style: 'currency', currency: 'TND', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const o = overview.data;
  const kpis = [
    { icon: Coins, label: t('revenueMonth'), value: o && money(o.revenue_month), growth: o?.revenue_growth },
    { icon: Luggage, label: t('bookingsMonth'), value: o && String(o.bookings_month), growth: o?.bookings_growth },
    { icon: Clock3, label: t('pending'), value: o && String(o.pending_bookings) },
    { icon: CalendarClock, label: t('upcoming'), value: o && String(o.upcoming_departures) },
    { icon: Wallet, label: t('outstanding'), value: o && money(o.outstanding_balance) },
    { icon: ShoppingBag, label: t('basket'), value: o && money(o.average_basket) },
  ];

  // 12 derniers mois, y compris ceux sans encaissement
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() - 11 + i);
    return d.toISOString().slice(0, 7);
  });
  const revenueData = months.map((m) => {
    const v = revenue.data?.series.find((s) => s.period.slice(0, 7) === m)?.revenue ?? 0;
    return { label: format.dateTime(new Date(`${m}-01`), { month: 'short' }), value: v, display: money(v) };
  });
  const statusData = Object.entries(bookings.data?.by_status ?? {}).map(([s, v]) => ({
    label: ts(s as 'pending'),
    value: v,
    display: String(v),
  }));
  const c = conversion.data;

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader title={tn('dashboard')} />

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map(({ icon: Icon, label, value, growth }) => (
          <li key={label} className="rounded-lg border border-border bg-surface p-5">
            <p className="flex items-center gap-2 text-sm text-text-muted">
              <Icon className="size-4" aria-hidden /> {label}
            </p>
            {value === undefined ? <Skeleton className="mt-2 h-8 w-32" /> : <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>}
            {growth !== undefined && growth !== null && (
              <p className={cn('mt-1 flex items-center gap-1 text-xs font-medium', growth >= 0 ? 'text-success' : 'text-danger')}>
                {growth >= 0 ? <ArrowUpRight className="size-3.5" aria-hidden /> : <ArrowDownRight className="size-3.5" aria-hidden />}
                {t('vsLastMonth', { value: growth > 0 ? `+${growth}` : growth })}
              </p>
            )}
          </li>
        ))}
      </ul>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-lg border border-border bg-surface p-5 xl:col-span-2" aria-labelledby="rev-title">
          <h2 id="rev-title" className="mb-1 font-serif text-lg font-semibold">{t('revenueChart')}</h2>
          <p className="mb-4 text-2xl font-bold tabular-nums">{revenue.data ? money(revenue.data.total) : '—'}</p>
          <BarChart data={revenueData} title={t('revenueChart')} tableLabel={t('showTable')} />
        </section>
        <section className="rounded-lg border border-border bg-surface p-5" aria-labelledby="status-title">
          <h2 id="status-title" className="mb-4 font-serif text-lg font-semibold">{t('bookingsChart')}</h2>
          {statusData.length ? (
            <ul className="flex flex-col gap-4">
              {statusData.map((d) => {
                const max = Math.max(1, ...statusData.map((x) => x.value));
                return (
                  <li key={d.label}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-text-muted">{d.label}</span>
                      <span className="font-semibold tabular-nums">{d.display}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(d.value / max) * 100}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-text-muted">{t('noData')}</p>
          )}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="overflow-x-auto rounded-lg border border-border bg-surface p-5 xl:col-span-2" aria-labelledby="top-title">
          <h2 id="top-title" className="mb-4 font-serif text-lg font-semibold">{t('topPackages')}</h2>
          {top.data?.length ? (
            <table className="w-full min-w-[520px] text-sm">
              <thead className="text-text-muted">
                <tr className="border-b border-border">
                  <th className="py-2 text-start font-medium">{t('package')}</th>
                  <th className="py-2 text-end font-medium">{t('bookingsCol')}</th>
                  <th className="py-2 text-end font-medium">{t('travelers')}</th>
                  <th className="py-2 text-end font-medium">{t('booked')}</th>
                  <th className="py-2 text-end font-medium">{t('collected')}</th>
                </tr>
              </thead>
              <tbody>
                {top.data.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="py-2.5 font-medium">{p.title_fr}</td>
                    <td className="py-2.5 text-end tabular-nums">{p.bookings}</td>
                    <td className="py-2.5 text-end tabular-nums">{p.travelers}</td>
                    <td className="py-2.5 text-end tabular-nums">{money(p.booked)}</td>
                    <td className="py-2.5 text-end tabular-nums">{money(p.collected)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-text-muted">{t('noData')}</p>
          )}
        </section>
        <section className="rounded-lg border border-border bg-surface p-5" aria-labelledby="conv-title">
          <h2 id="conv-title" className="mb-4 font-serif text-lg font-semibold">{t('conversion')}</h2>
          <dl className="flex flex-col gap-4">
            {[
              { label: t('signupToBooking'), value: c?.signup_to_booking_rate },
              { label: t('bookingToPayment'), value: c?.booking_to_payment_rate },
              { label: t('cancellation'), value: c?.cancellation_rate },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="mb-1 flex justify-between text-sm">
                  <dt className="text-text-muted">{label}</dt>
                  <dd className="font-semibold tabular-nums">{value ?? '—'} %</dd>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, value ?? 0)}%` }} />
                </div>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
