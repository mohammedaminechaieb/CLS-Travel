'use client';

import type { Paginated, Review } from '@cls/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/page-header';
import { RatingStars } from '@/components/packages/rating-stars';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth/auth-provider';
import { useApiQuery } from '@/lib/hooks';

type Row = Review & { booking: { reference: string; user: { email: string; first_name: string; last_name: string }; package: { slug: string; title_fr: string } } };

export default function AdminReviewsPage() {
  const t = useTranslations('admin.reviews');
  const format = useFormatter();
  const { request } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'waiting' | 'approved'>('waiting');
  const { data } = useApiQuery<Paginated<Row>>(['admin-reviews'], '/admin/reviews', { is_approved: tab === 'approved', limit: 50 });
  const moderate = useMutation({
    mutationFn: ({ id, is_approved }: { id: string; is_approved: boolean }) => request(`/admin/reviews/${id}/approve`, { method: 'PATCH', body: { is_approved } }),
    onSuccess: (_, v) => {
      toast.success(v.is_approved ? t('approvedToast') : t('rejectedToast'));
      void qc.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
  });

  return (
    <div>
      <AdminPageHeader title={t('title')} />
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mb-4">
        <TabsList>
          <TabsTrigger value="waiting">{t('waiting')}</TabsTrigger>
          <TabsTrigger value="approved">{t('approved')}</TabsTrigger>
        </TabsList>
      </Tabs>
      <ul className="flex flex-col gap-4">
        {data?.data.length === 0 && <li className="rounded-lg border border-dashed border-border p-8 text-center text-text-muted">—</li>}
        {data?.data.map((r) => (
          <li key={r.id} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <RatingStars value={r.rating} />
                <Badge variant={r.is_approved ? 'success' : 'warning'}>{r.is_approved ? t('approved') : t('waiting')}</Badge>
                <span className="text-xs text-text-muted">{format.dateTime(new Date(r.created_at), { dateStyle: 'medium' })}</span>
              </div>
              <p>{r.comment}</p>
              <p className="text-xs text-text-muted">
                {r.booking.user.first_name} {r.booking.user.last_name} · {r.booking.reference} · {r.booking.package.title_fr}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              {r.is_approved ? (
                <Button variant="outline" size="sm" onClick={() => moderate.mutate({ id: r.id, is_approved: false })}>{t('reject')}</Button>
              ) : (
                <Button size="sm" onClick={() => moderate.mutate({ id: r.id, is_approved: true })}>{t('approve')}</Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
