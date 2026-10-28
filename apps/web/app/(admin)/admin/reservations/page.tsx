'use client';

import { ADMIN_ROLES, type AdminBooking, type BookingDetail, type BookingStatus, type Paginated, type Person, type Role } from '@cls/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/page-header';
import { BookingMessages } from '@/components/client/booking-messages';
import { BookingStatusBadge } from '@/components/client/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth/auth-provider';
import { useApiQuery } from '@/lib/hooks';

const STATUSES: BookingStatus[] = ['pending', 'confirmed', 'completed', 'cancelled'];
const NEXT: Record<BookingStatus, BookingStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  cancelled: [],
  completed: [],
};

export default function AdminBookingsPage() {
  const t = useTranslations('admin.bookings');
  const tc = useTranslations('admin.common');
  const ts = useTranslations('client.status');
  const format = useFormatter();
  const { user, request } = useAuth();
  const qc = useQueryClient();
  const isAdmin = !!user && (ADMIN_ROLES as readonly Role[]).includes(user.role);

  const [filters, setFilters] = useState({ status: '', search: '', from: '', to: '', page: 1 });
  const [searchInput, setSearchInput] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const h = setTimeout(() => setFilters((f) => ({ ...f, search: searchInput, page: 1 })), 350);
    return () => clearTimeout(h);
  }, [searchInput]);

  const { data, isLoading } = useApiQuery<Paginated<AdminBooking>>(['admin-bookings'], '/admin/bookings', { ...filters, limit: 20 });
  const agents = useApiQuery<Paginated<Person>>(['agents'], '/admin/users', { role: 'agent', limit: 100 }, { enabled: isAdmin });
  const managers = useApiQuery<Paginated<Person>>(['managers'], '/admin/users', { role: 'manager', limit: 100 }, { enabled: isAdmin });
  const staff = [...(agents.data?.data ?? []), ...(managers.data?.data ?? [])];

  const onError = (err: unknown) => toast.error(err instanceof ApiError ? err.message : String(err));
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-bookings'] });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) => request(`/admin/bookings/${id}/status`, { method: 'PATCH', body: { status } }),
    onSuccess: () => {
      toast.success(t('statusUpdated'));
      void refresh();
    },
    onError,
  });
  const setAgent = useMutation({
    mutationFn: ({ id, agent_id }: { id: string; agent_id: string | null }) => request(`/admin/bookings/${id}/agent`, { method: 'PATCH', body: { agent_id } }),
    onSuccess: () => {
      toast.success(t('agentUpdated'));
      void refresh();
    },
    onError,
  });

  const money = (v: string) => format.number(Number(v), { style: 'currency', currency: 'TND', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const rows = data?.data ?? [];

  return (
    <div>
      <AdminPageHeader title={t('title')} />
      <div className="mb-4 grid gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="b-search" className="mb-1 block text-xs font-medium text-text-muted">{tc('search')}</label>
          <Input id="b-search" type="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="CLS-2026-…, nom, email" />
        </div>
        <div>
          <label htmlFor="b-status" className="mb-1 block text-xs font-medium text-text-muted">{tc('status')}</label>
          <NativeSelect id="b-status" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}>
            <option value="">{tc('all')}</option>
            {STATUSES.map((s) => <option key={s} value={s}>{ts(s)}</option>)}
          </NativeSelect>
        </div>
        <div>
          <label htmlFor="b-from" className="mb-1 block text-xs font-medium text-text-muted">{t('from')}</label>
          <Input id="b-from" type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value, page: 1 })} />
        </div>
        <div>
          <label htmlFor="b-to" className="mb-1 block text-xs font-medium text-text-muted">{t('to')}</label>
          <Input id="b-to" type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value, page: 1 })} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-muted/60 text-text-muted">
            <tr>
              {[t('reference'), t('client'), t('package'), t('departure'), t('total'), t('paid'), tc('status'), t('agent'), tc('actions')].map((h) => (
                <th key={h} scope="col" className="px-3 py-3 text-start font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 5 }, (_, i) => (
                <tr key={i}><td colSpan={9} className="p-3"><Skeleton className="h-6 w-full" /></td></tr>
              ))}
            {!isLoading && rows.length === 0 && (
              <tr><td colSpan={9} className="p-8 text-center text-text-muted">{tc('empty')}</td></tr>
            )}
            {rows.map((b) => (
              <tr key={b.id} className="border-t border-border align-middle">
                <td className="px-3 py-2.5 font-mono text-xs">{b.reference}</td>
                <td className="px-3 py-2.5">
                  <span className="block font-medium">{b.user.first_name} {b.user.last_name}</span>
                  <span className="text-xs text-text-muted">{b.user.email}</span>
                </td>
                <td className="max-w-52 truncate px-3 py-2.5" title={b.package.title_fr}>{b.package.title_fr}</td>
                <td className="whitespace-nowrap px-3 py-2.5">{format.dateTime(new Date(b.departure_date), { dateStyle: 'medium', timeZone: 'UTC' })}</td>
                <td className="px-3 py-2.5 tabular-nums">{money(b.total_price)}</td>
                <td className="px-3 py-2.5 tabular-nums">{money(b.paid_amount)}</td>
                <td className="px-3 py-2.5">
                  {isAdmin && NEXT[b.status].length > 0 ? (
                    <NativeSelect
                      aria-label={`${t('changeStatus')} ${b.reference}`}
                      className="h-9 min-w-32"
                      value={b.status}
                      onChange={(e) => setStatus.mutate({ id: b.id, status: e.target.value as BookingStatus })}
                    >
                      <option value={b.status}>{ts(b.status)}</option>
                      {NEXT[b.status].map((s) => <option key={s} value={s}>→ {ts(s)}</option>)}
                    </NativeSelect>
                  ) : (
                    <BookingStatusBadge status={b.status} />
                  )}
                </td>
                <td className="px-3 py-2.5">
                  {isAdmin ? (
                    <NativeSelect
                      aria-label={`${t('agent')} ${b.reference}`}
                      className="h-9 min-w-36"
                      value={b.assigned_agent_id ?? ''}
                      onChange={(e) => setAgent.mutate({ id: b.id, agent_id: e.target.value || null })}
                    >
                      <option value="">{t('unassigned')}</option>
                      {staff.map((a) => <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>)}
                    </NativeSelect>
                  ) : (
                    b.assigned_agent ? `${b.assigned_agent.first_name} ${b.assigned_agent.last_name}` : t('unassigned')
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <Button variant="ghost" size="sm" onClick={() => setSelected(b.id)} aria-label={`${t('details')} ${b.reference}`}>
                    <Eye aria-hidden />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          <Button variant="outline" size="sm" disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>←</Button>
          <span>{filters.page} / {data.meta.totalPages}</span>
          <Button variant="outline" size="sm" disabled={filters.page >= data.meta.totalPages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>→</Button>
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full max-w-xl sm:max-w-xl">
          {selected && <BookingDrawer id={selected} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function BookingDrawer({ id }: { id: string }) {
  const t = useTranslations('admin.bookings');
  const tc = useTranslations('admin.common');
  const format = useFormatter();
  const { request } = useAuth();
  const { data: b } = useApiQuery<BookingDetail>(['booking', id], `/bookings/${id}`);
  const [notes, setNotes] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: () => request(`/admin/bookings/${id}/notes`, { method: 'PATCH', body: { notes_internal: notes ?? '' } }),
    onSuccess: () => toast.success(t('notesSaved')),
  });
  if (!b) return <Skeleton className="h-64 w-full" />;
  return (
    <div className="flex flex-col gap-5">
      <SheetTitle className="font-serif text-xl font-semibold">{b.reference}</SheetTitle>
      <div className="flex items-center gap-2"><BookingStatusBadge status={b.status} /> <span className="text-sm text-text-muted">{b.package.title_fr}</span></div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-text-muted">{t('client')}</dt><dd>{b.user.first_name} {b.user.last_name}<br />{b.user.email}<br />{b.user.phone}</dd></div>
        <div><dt className="text-text-muted">{t('departure')}</dt><dd>{format.dateTime(new Date(b.departure_date), { dateStyle: 'long', timeZone: 'UTC' })}</dd></div>
      </dl>
      <div>
        <h3 className="mb-2 text-sm font-semibold">{t('participants')}</h3>
        <ul className="text-sm">
          {b.participants.map((p, i) => <li key={i}>{p.prenom} {p.nom.toUpperCase()} — <span className="font-mono">{p.passport}</span> — {p.dob}</li>)}
        </ul>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="notes" className="text-sm font-semibold">{t('notes')}</label>
        <Textarea id="notes" value={notes ?? b.notes_internal ?? ''} onChange={(e) => setNotes(e.target.value)} />
        <Button size="sm" variant="outline" className="self-start" loading={save.isPending} onClick={() => save.mutate()}>{tc('save')}</Button>
      </div>
      <BookingMessages bookingId={b.id} />
    </div>
  );
}
