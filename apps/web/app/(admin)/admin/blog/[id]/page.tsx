'use client';

import type { BlogPost, PostStatus, TiptapDoc } from '@cls/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ImageUploader } from '@/components/admin/image-uploader';
import { AdminPageHeader } from '@/components/admin/page-header';
import { TiptapEditor } from '@/components/admin/tiptap-editor';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth/auth-provider';
import { useApiQuery } from '@/lib/hooks';

interface Form {
  slug: string;
  title_fr: string;
  title_ar: string;
  title_en: string;
  excerpt_fr: string;
  excerpt_ar: string;
  excerpt_en: string;
  cover: string[];
  tags: string;
  body: TiptapDoc;
  status: PostStatus;
}

const EMPTY: Form = {
  slug: '', title_fr: '', title_ar: '', title_en: '', excerpt_fr: '', excerpt_ar: '', excerpt_en: '',
  cover: [], tags: '', body: { type: 'doc', content: [{ type: 'paragraph' }] }, status: 'draft',
};

export default function BlogEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'nouveau';
  const t = useTranslations('admin.blog');
  const tc = useTranslations('admin.common');
  const router = useRouter();
  const qc = useQueryClient();
  const { request } = useAuth();
  const [form, setForm] = useState<Form | null>(isNew ? EMPTY : null);
  const existing = useApiQuery<BlogPost>(['admin-post', id], `/admin/blog/${id}`, undefined, { enabled: !isNew });

  useEffect(() => {
    const p = existing.data;
    if (!p || form) return;
    setForm({
      slug: p.slug, title_fr: p.title_fr, title_ar: p.title_ar, title_en: p.title_en,
      excerpt_fr: p.excerpt_fr ?? '', excerpt_ar: p.excerpt_ar ?? '', excerpt_en: p.excerpt_en ?? '',
      cover: p.cover_url ? [p.cover_url] : [], tags: p.tags.join(', '), body: p.body, status: p.status,
    });
  }, [existing.data, form]);

  const save = useMutation({
    mutationFn: (f: Form) => {
      const body = {
        slug: f.slug || undefined,
        title_fr: f.title_fr, title_ar: f.title_ar, title_en: f.title_en,
        excerpt_fr: f.excerpt_fr || undefined, excerpt_ar: f.excerpt_ar || undefined, excerpt_en: f.excerpt_en || undefined,
        cover_url: f.cover[0],
        tags: f.tags.split(',').map((x) => x.trim()).filter(Boolean),
        body: f.body,
        status: f.status,
      };
      return isNew ? request<BlogPost>('/admin/blog', { method: 'POST', body }) : request<BlogPost>(`/admin/blog/${id}`, { method: 'PATCH', body });
    },
    onSuccess: (p) => {
      toast.success(tc('saved'));
      void qc.invalidateQueries({ queryKey: ['admin-blog'] });
      if (isNew) router.replace(`/admin/blog/${p.id}`);
    },
    onError: (err) => toast.error(err instanceof ApiError ? (err.details?.join(' · ') ?? err.message) : String(err)),
  });

  if (!form) return <Skeleton className="h-96 w-full" />;
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm({ ...form, [k]: v });

  return (
    <form className="flex max-w-4xl flex-col gap-6" onSubmit={(e) => { e.preventDefault(); save.mutate(form); }}>
      <Link href="/admin/blog" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden /> {t('title')}
      </Link>
      <AdminPageHeader
        title={isNew ? t('new') : t('edit')}
        actions={
          <>
            <NativeSelect aria-label={tc('status')} className="w-36" value={form.status} onChange={(e) => set('status', e.target.value as PostStatus)}>
              <option value="draft">{t('statusLabels.draft')}</option>
              <option value="published">{t('statusLabels.published')}</option>
            </NativeSelect>
            <Button type="submit" loading={save.isPending}>{tc('save')}</Button>
          </>
        }
      />
      <section className="grid gap-5 rounded-lg border border-border bg-surface p-6 md:grid-cols-3">
        <Field id="t-fr" label={t('titleFr')} required><Input value={form.title_fr} onChange={(e) => set('title_fr', e.target.value)} required /></Field>
        <Field id="t-ar" label={t('titleAr')} required><Input dir="rtl" lang="ar" value={form.title_ar} onChange={(e) => set('title_ar', e.target.value)} required /></Field>
        <Field id="t-en" label={t('titleEn')} required><Input lang="en" value={form.title_en} onChange={(e) => set('title_en', e.target.value)} required /></Field>
        <Field id="e-fr" label={t('excerptFr')}><Textarea rows={3} value={form.excerpt_fr} onChange={(e) => set('excerpt_fr', e.target.value)} maxLength={500} /></Field>
        <Field id="e-ar" label={t('excerptAr')}><Textarea dir="rtl" rows={3} value={form.excerpt_ar} onChange={(e) => set('excerpt_ar', e.target.value)} maxLength={500} /></Field>
        <Field id="e-en" label={t('excerptEn')}><Textarea rows={3} value={form.excerpt_en} onChange={(e) => set('excerpt_en', e.target.value)} maxLength={500} /></Field>
        <Field id="slug" label="Slug" className="md:col-span-2"><Input dir="ltr" value={form.slug} onChange={(e) => set('slug', e.target.value.toLowerCase())} /></Field>
        <Field id="tags" label={t('tags')}><Input value={form.tags} onChange={(e) => set('tags', e.target.value)} /></Field>
      </section>
      <section className="rounded-lg border border-border bg-surface p-6">
        <h2 className="mb-3 font-serif text-lg font-semibold">{t('cover')}</h2>
        <ImageUploader folder="blog" multiple={false} value={form.cover} onChange={(v) => set('cover', v)} />
      </section>
      <section className="flex flex-col gap-2">
        <label htmlFor="post-body" className="font-serif text-lg font-semibold">{t('body')}</label>
        <TiptapEditor id="post-body" label={t('body')} value={form.body} onChange={(doc) => set('body', doc)} />
      </section>
    </form>
  );
}
