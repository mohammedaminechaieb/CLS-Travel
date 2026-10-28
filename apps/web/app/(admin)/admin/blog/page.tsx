'use client';

import type { BlogPostSummary, Paginated } from '@cls/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/auth-provider';
import { useApiQuery } from '@/lib/hooks';

export default function AdminBlogPage() {
  const t = useTranslations('admin.blog');
  const tc = useTranslations('admin.common');
  const format = useFormatter();
  const { request } = useAuth();
  const qc = useQueryClient();
  const { data } = useApiQuery<Paginated<BlogPostSummary>>(['admin-blog'], '/admin/blog', { limit: 100 });
  const remove = useMutation({
    mutationFn: (id: string) => request(`/admin/blog/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success(tc('deleted'));
      void qc.invalidateQueries({ queryKey: ['admin-blog'] });
    },
  });

  return (
    <div>
      <AdminPageHeader title={t('title')} actions={<Button asChild><Link href="/admin/blog/nouveau"><Plus aria-hidden /> {t('new')}</Link></Button>} />
      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-muted/60 text-text-muted">
            <tr>{[t('titleFr'), tc('status'), t('publishedAt'), tc('actions')].map((h) => <th key={h} scope="col" className="px-3 py-3 text-start font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {data?.data.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-text-muted">{tc('empty')}</td></tr>}
            {data?.data.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-3 py-2.5"><span className="block font-medium">{p.title_fr}</span><span className="font-mono text-xs text-text-muted">/blog/{p.slug}</span></td>
                <td className="px-3 py-2.5"><Badge variant={p.status === 'published' ? 'success' : 'warning'}>{t(`statusLabels.${p.status}`)}</Badge></td>
                <td className="px-3 py-2.5 text-text-muted">{p.published_at ? format.dateTime(new Date(p.published_at), { dateStyle: 'medium' }) : '—'}</td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-1">
                    <Button asChild variant="ghost" size="sm" aria-label={`${tc('edit')} ${p.title_fr}`}><Link href={`/admin/blog/${p.id}`}><Pencil aria-hidden /></Link></Button>
                    <Button variant="ghost" size="sm" aria-label={`${tc('delete')} ${p.title_fr}`} onClick={() => window.confirm(tc('confirmDelete')) && remove.mutate(p.id)}>
                      <Trash2 className="text-danger" aria-hidden />
                    </Button>
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
