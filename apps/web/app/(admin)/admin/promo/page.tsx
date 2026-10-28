'use client';

import type { DiscountType, Paginated } from '@cls/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth/auth-provider';
import { useApiQuery } from '@/lib/hooks';

interface Promo {
  id: string;
  code: string;
  discount_type: DiscountType;
  value: string;
  expires_at: string | null;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
}

export default function AdminPromoPage() {
  const t = useTranslations('admin.promo');
  const tc = useTranslations('admin.common');
  const format = useFormatter();
  const { request } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({ code: '', discount_type: 'percent' as DiscountType, value: 10, expires_at: '', max_uses: '' });
  const { data } = useApiQuery<Paginated<Promo>>(['admin-promo'], '/admin/promo', { limit: 100 });
  const onError = (err: unknown) => toast.error(err instanceof ApiError ? (err.details?.join(' · ') ?? err.message) : String(err));
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-promo'] });

  const create = useMutation({
    mutationFn: () =>
      request('/admin/promo', {
        method: 'POST',
        body: {
          code: form.code,
          discount_type: form.discount_type,
          value: form.value,
          ...(form.expires_at && { expires_at: new Date(`${form.expires_at}T23:59:59`).toISOString() }),
          ...(form.max_uses && { max_uses: Number(form.max_uses) }),
        },
      }),
    onSuccess: () => {
      toast.success(t('created'));
      setForm({ ...form, code: '' });
      void refresh();
    },
    onError,
  });
  const toggle = useMutation({
    mutationFn: (p: Promo) => request(`/admin/promo/${p.id}`, { method: 'PATCH', body: { is_active: !p.is_active } }),
    onSuccess: () => void refresh(),
    onError,
  });

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title={t('title')} />
      <form
        className="grid gap-4 rounded-lg border border-border bg-surface p-5 sm:grid-cols-2 lg:grid-cols-6 lg:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <Field id="code" label={t('code')} required className="lg:col-span-2">
          <Input className="uppercase" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required pattern="[A-Z0-9_-]{3,32}" />
        </Field>
        <Field id="type" label={t('type')}>
          <NativeSelect value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value as DiscountType })}>
            <option value="percent">{t('percent')}</option>
            <option value="fixed">{t('fixed')}</option>
          </NativeSelect>
        </Field>
        <Field id="value" label={t('value')} required>
          <Input type="number" min={0.001} step="0.001" max={form.discount_type === 'percent' ? 100 : undefined} value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
        </Field>
        <Field id="expires" label={t('expires')}>
          <Input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
        </Field>
        <Field id="max" label={t('maxUses')}>
          <Input type="number" min={1} value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} />
        </Field>
        <Button type="submit" loading={create.isPending} className="lg:col-start-6">{tc('create')}</Button>
      </form>
      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-muted/60 text-text-muted">
            <tr>
              {[t('code'), t('value'), t('expires'), t('uses'), t('active')].map((h) => <th key={h} scope="col" className="px-3 py-3 text-start font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {data?.data.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-3 py-2.5 font-mono font-semibold">{p.code}</td>
                <td className="px-3 py-2.5">{p.discount_type === 'percent' ? `${Number(p.value)} %` : format.number(Number(p.value), { style: 'currency', currency: 'TND', minimumFractionDigits: 0 })}</td>
                <td className="px-3 py-2.5">{p.expires_at ? format.dateTime(new Date(p.expires_at), { dateStyle: 'medium' }) : t('never')}</td>
                <td className="px-3 py-2.5 tabular-nums">{p.current_uses} / {p.max_uses ?? t('unlimited')}</td>
                <td className="px-3 py-2.5">
                  <Checkbox checked={p.is_active} onCheckedChange={() => toggle.mutate(p)} aria-label={`${t('active')} ${p.code}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
