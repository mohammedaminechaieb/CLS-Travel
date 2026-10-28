'use client';

import { ADMIN_ROLES, type PackageSummary, type Paginated, type Role } from '@cls/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth/auth-provider';
import { useApiQuery } from '@/lib/hooks';

export default function AdminPackagesPage() {
  const t = useTranslations('admin.packages');
  const tc = useTranslations('admin.common');
  const tcat = useTranslations('categories');
  const format = useFormatter();
  const { user, request } = useAuth();
  const qc = useQueryClient();
  const canEdit = !!user && (ADMIN_ROLES as readonly Role[]).includes(user.role);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const { data } = useApiQuery<Paginated<PackageSummary & { _count?: { bookings: number } }>>(['admin-packages'], '/admin/packages', { status, search, limit: 100 });
  const remove = useMutation({
    mutationFn: (id: string) => request<{ archived: boolean }>(`/admin/packages/${id}`, { method: 'DELETE' }),
    onSuccess: (r) => {
      toast.success(r.archived ? t('archivedInstead') : tc('deleted'));
      void qc.invalidateQueries({ queryKey: ['admin-packages'] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : String(err)),
  });

  return (
    <div>
      <AdminPageHeader
        title={t('title')}
        actions={canEdit && (
          <Button asChild>
            <Link href="/admin/voyages/nouveau"><Plus aria-hidden /> {t('new')}</Link>
          </Button>
        )}
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <label className="sr-only" htmlFor="p-search">{tc('search')}</label>
        <Input id="p-search" type="search" className="max-w-xs" placeholder={tc('search')} value={search} onChange={(e) => setSearch(e.target.value)} />
        <label className="sr-only" htmlFor="p-status">{tc('status')}</label>
        <NativeSelect id="p-status" className="w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">{tc('all')}</option>
          {(['draft', 'published', 'archived'] as const).map((s) => <option key={s} value={s}>{t(`statusLabels.${s}`)}</option>)}
        </NativeSelect>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-muted/60 text-text-muted">
            <tr>
              {[t('titleFr'), t('category'), t('duration'), t('price'), tc('status'), t('updated'), tc('actions')].map((h) => (
                <th key={h} scope="col" className="px-3 py-3 text-start font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.data.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-text-muted">{tc('empty')}</td></tr>}
            {data?.data.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-3 py-2.5">
                  <span className="flex items-center gap-1.5 font-medium">
                    {p.featured && <Star className="size-3.5 fill-accent text-accent" aria-label={t('featured')} />}
                    {p.title_fr}
                  </span>
                  <span className="font-mono text-xs text-text-muted">/{p.slug}</span>
                </td>
                <td className="px-3 py-2.5">{tcat(p.category)}</td>
                <td className="px-3 py-2.5 tabular-nums">{p.duration_days}</td>
                <td className="px-3 py-2.5 tabular-nums">{format.number(Number(p.base_price), { style: 'currency', currency: 'TND', minimumFractionDigits: 0 })}</td>
                <td className="px-3 py-2.5">
                  <Badge variant={p.status === 'published' ? 'success' : p.status === 'draft' ? 'warning' : 'muted'}>{t(`statusLabels.${p.status}`)}</Badge>
                </td>
                <td className="px-3 py-2.5 text-text-muted">{format.dateTime(new Date(p.updated_at), { dateStyle: 'short' })}</td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-1">
                    {p.status === 'published' && (
                      <Button asChild variant="ghost" size="sm" aria-label={`${t('view')} ${p.title_fr}`}>
                        <Link href={`/voyages/${p.slug}`} target="_blank"><ExternalLink aria-hidden /></Link>
                      </Button>
                    )}
                    {canEdit && (
                      <>
                        <Button asChild variant="ghost" size="sm" aria-label={`${tc('edit')} ${p.title_fr}`}>
                          <Link href={`/admin/voyages/${p.id}`}><Pencil aria-hidden /></Link>
                        </Button>
                        <Button variant="ghost" size="sm" aria-label={`${tc('delete')} ${p.title_fr}`} onClick={() => window.confirm(tc('confirmDelete')) && remove.mutate(p.id)}>
                          <Trash2 className="text-danger" aria-hidden />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
