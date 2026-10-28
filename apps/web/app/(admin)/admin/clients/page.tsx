'use client';

import type { Paginated, PublicUser, Role } from '@cls/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth/auth-provider';
import { useApiQuery } from '@/lib/hooks';

const ROLES: Role[] = ['client', 'agent', 'manager', 'super_admin'];
type Row = PublicUser & { _count: { bookings: number } };

export default function AdminClientsPage() {
  const t = useTranslations('admin.clients');
  const tc = useTranslations('admin.common');
  const format = useFormatter();
  const { user, request } = useAuth();
  const qc = useQueryClient();
  const isSuper = user?.role === 'super_admin';
  const [role, setRole] = useState('');
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const h = setTimeout(() => {
      setSearch(input);
      setPage(1);
    }, 350);
    return () => clearTimeout(h);
  }, [input]);

  const { data } = useApiQuery<Paginated<Row>>(['admin-users'], '/admin/users', { role, search, page, limit: 25 });
  const onError = (err: unknown) => toast.error(err instanceof ApiError ? err.message : String(err));
  const updateRole = useMutation({
    mutationFn: ({ id, role: r }: { id: string; role: Role }) => request(`/admin/users/${id}/role`, { method: 'PATCH', body: { role: r } }),
    onSuccess: () => {
      toast.success(t('roleUpdated'));
      void qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError,
  });
  const anonymize = useMutation({
    mutationFn: (id: string) => request(`/admin/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success(tc('deleted'));
      void qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError,
  });

  return (
    <div>
      <AdminPageHeader title={t('title')} />
      <div className="mb-4 flex flex-wrap gap-3">
        <label htmlFor="u-search" className="sr-only">{tc('search')}</label>
        <Input id="u-search" type="search" className="max-w-xs" placeholder={tc('search')} value={input} onChange={(e) => setInput(e.target.value)} />
        <label htmlFor="u-role" className="sr-only">{t('role')}</label>
        <NativeSelect id="u-role" className="w-44" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
          <option value="">{tc('all')}</option>
          {ROLES.map((r) => <option key={r} value={r}>{t(`roles.${r}`)}</option>)}
        </NativeSelect>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-muted/60 text-text-muted">
            <tr>
              {[t('name'), t('email'), t('phone'), t('bookings'), t('since'), t('role'), ...(isSuper ? [tc('actions')] : [])].map((h) => (
                <th key={h} scope="col" className="px-3 py-3 text-start font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.data.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-text-muted">{tc('empty')}</td></tr>}
            {data?.data.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-3 py-2.5 font-medium">
                  <span className="flex items-center gap-1.5">
                    {u.first_name} {u.last_name}
                    {u.is_verified && <BadgeCheck className="size-4 text-success" aria-label={t('verified')} />}
                  </span>
                </td>
                <td className="px-3 py-2.5"><a href={`mailto:${u.email}`} className="text-primary hover:underline">{u.email}</a></td>
                <td className="px-3 py-2.5" dir="ltr">{u.phone ?? '—'}</td>
                <td className="px-3 py-2.5 tabular-nums">{u._count.bookings}</td>
                <td className="px-3 py-2.5 text-text-muted">{format.dateTime(new Date(u.created_at), { dateStyle: 'medium' })}</td>
                <td className="px-3 py-2.5">
                  {isSuper && u.id !== user?.id ? (
                    <NativeSelect aria-label={`${t('role')} ${u.email}`} className="h-9 w-36" value={u.role} onChange={(e) => updateRole.mutate({ id: u.id, role: e.target.value as Role })}>
                      {ROLES.map((r) => <option key={r} value={r}>{t(`roles.${r}`)}</option>)}
                    </NativeSelect>
                  ) : (
                    t(`roles.${u.role}`)
                  )}
                </td>
                {isSuper && (
                  <td className="px-3 py-2.5">
                    {u.id !== user?.id && (
                      <Button variant="ghost" size="sm" className="text-danger" onClick={() => window.confirm(tc('confirmDelete')) && anonymize.mutate(u.id)}>
                        {t('anonymize')}
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && data.meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>←</Button>
          <span>{page} / {data.meta.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage(page + 1)}>→</Button>
        </div>
      )}
    </div>
  );
}
