'use client';

import type { Destination, ItineraryDay, PackageCategory, PackageDetail, PackageStatus, TiptapDoc } from '@cls/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ImageUploader } from '@/components/admin/image-uploader';
import { AdminPageHeader } from '@/components/admin/page-header';
import { TiptapEditor } from '@/components/admin/tiptap-editor';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ApiError, apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/auth/auth-provider';
import { useApiQuery } from '@/lib/hooks';
import { useQuery } from '@tanstack/react-query';

const CATEGORIES: PackageCategory[] = ['circuit', 'sejour', 'excursion', 'omra', 'affaires'];

interface FormState {
  slug: string;
  title_fr: string;
  title_ar: string;
  title_en: string;
  description_fr: string;
  description_ar: string;
  description_en: string;
  destination_id: string;
  category: PackageCategory;
  duration_days: number;
  base_price: number;
  max_capacity: number;
  gallery_urls: string[];
  included: string;
  excluded: string;
  itinerary: ItineraryDay[];
  status: PackageStatus;
  featured: boolean;
}

const EMPTY: FormState = {
  slug: '', title_fr: '', title_ar: '', title_en: '', description_fr: '', description_ar: '', description_en: '',
  destination_id: '', category: 'circuit', duration_days: 1, base_price: 0, max_capacity: 20, gallery_urls: [],
  included: '', excluded: '', itinerary: [], status: 'draft', featured: false,
};

export default function PackageEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'nouveau';
  const t = useTranslations('admin.packages');
  const tc = useTranslations('admin.common');
  const tcat = useTranslations('categories');
  const router = useRouter();
  const qc = useQueryClient();
  const { request } = useAuth();
  const [form, setForm] = useState<FormState | null>(isNew ? EMPTY : null);

  const destinations = useQuery({ queryKey: ['destinations'], queryFn: () => apiFetch<Destination[]>('/destinations') });
  const existing = useApiQuery<PackageDetail>(['admin-package', id], `/admin/packages/${id}`, undefined, { enabled: !isNew });

  useEffect(() => {
    const p = existing.data;
    if (!p || form) return;
    setForm({
      slug: p.slug, title_fr: p.title_fr, title_ar: p.title_ar, title_en: p.title_en,
      description_fr: p.description_fr, description_ar: p.description_ar, description_en: p.description_en,
      destination_id: p.destination_id, category: p.category, duration_days: p.duration_days,
      base_price: Number(p.base_price), max_capacity: p.max_capacity, gallery_urls: p.gallery_urls,
      included: p.included.join('\n'), excluded: p.excluded.join('\n'),
      itinerary: Array.isArray(p.itinerary) ? p.itinerary : [], status: p.status, featured: p.featured,
    });
  }, [existing.data, form]);

  const save = useMutation({
    mutationFn: (f: FormState) => {
      const lines = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean);
      const body = {
        ...f,
        slug: f.slug || undefined,
        included: lines(f.included),
        excluded: lines(f.excluded),
        itinerary: f.itinerary.map((d, i) => ({ ...d, day: i + 1 })),
      };
      return isNew
        ? request<PackageDetail>('/admin/packages', { method: 'POST', body })
        : request<PackageDetail>(`/admin/packages/${id}`, { method: 'PATCH', body });
    },
    onSuccess: (p) => {
      toast.success(tc('saved'));
      void qc.invalidateQueries({ queryKey: ['admin-packages'] });
      void qc.invalidateQueries({ queryKey: ['admin-package', p.id] });
      if (isNew) router.replace(`/admin/voyages/${p.id}`);
    },
    onError: (err) => toast.error(err instanceof ApiError ? (err.details?.join(' · ') ?? err.message) : String(err)),
  });

  if (!form) return <Skeleton className="h-96 w-full" />;
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm({ ...form, [key]: value });
  const setDay = (i: number, patch: Partial<ItineraryDay>) =>
    set('itinerary', form.itinerary.map((d, j) => (j === i ? { ...d, ...patch } : d)));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate(form);
      }}
      className="flex max-w-5xl flex-col gap-8"
    >
      <Link href="/admin/voyages" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden /> {t('title')}
      </Link>
      <AdminPageHeader
        title={isNew ? t('new') : t('edit')}
        actions={
          <>
            <NativeSelect aria-label={tc('status')} value={form.status} onChange={(e) => set('status', e.target.value as PackageStatus)} className="w-40">
              {(['draft', 'published', 'archived'] as const).map((s) => <option key={s} value={s}>{t(`statusLabels.${s}`)}</option>)}
            </NativeSelect>
            <Button type="submit" loading={save.isPending}>{tc('save')}</Button>
          </>
        }
      />

      <section className="grid gap-5 rounded-lg border border-border bg-surface p-6 md:grid-cols-3">
        <Field id="title_fr" label={t('titleFr')} required><Input value={form.title_fr} onChange={(e) => set('title_fr', e.target.value)} required /></Field>
        <Field id="title_ar" label={t('titleAr')} required><Input dir="rtl" lang="ar" value={form.title_ar} onChange={(e) => set('title_ar', e.target.value)} required /></Field>
        <Field id="title_en" label={t('titleEn')} required><Input lang="en" value={form.title_en} onChange={(e) => set('title_en', e.target.value)} required /></Field>
        <Field id="slug" label={t('slug')} hint={t('slugHint')} className="md:col-span-3">
          <Input dir="ltr" value={form.slug} onChange={(e) => set('slug', e.target.value.toLowerCase())} pattern="[a-z0-9]+(-[a-z0-9]+)*" />
        </Field>
        <Field id="destination" label={t('destination')} required>
          <NativeSelect value={form.destination_id} onChange={(e) => set('destination_id', e.target.value)} required>
            <option value="">—</option>
            {destinations.data?.map((d) => <option key={d.id} value={d.id}>{d.name_fr} ({d.country})</option>)}
          </NativeSelect>
        </Field>
        <Field id="category" label={t('category')} required>
          <NativeSelect value={form.category} onChange={(e) => set('category', e.target.value as PackageCategory)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{tcat(c)}</option>)}
          </NativeSelect>
        </Field>
        <Field id="duration" label={t('duration')} required>
          <Input type="number" min={1} max={365} value={form.duration_days} onChange={(e) => set('duration_days', Number(e.target.value))} />
        </Field>
        <Field id="price" label={t('price')} required>
          <Input type="number" min={0} step="0.001" value={form.base_price} onChange={(e) => set('base_price', Number(e.target.value))} />
        </Field>
        <Field id="capacity" label={t('capacity')} required>
          <Input type="number" min={1} value={form.max_capacity} onChange={(e) => set('max_capacity', Number(e.target.value))} />
        </Field>
        <div className="flex items-center gap-3 self-end pb-3">
          <Checkbox id="featured" checked={form.featured} onCheckedChange={(v) => set('featured', v === true)} />
          <label htmlFor="featured" className="text-sm">{t('featured')}</label>
        </div>
      </section>

      <section className="grid gap-5 rounded-lg border border-border bg-surface p-6">
        <Field id="desc_fr" label={t('descFr')} required><Textarea rows={5} value={form.description_fr} onChange={(e) => set('description_fr', e.target.value)} required /></Field>
        <Field id="desc_ar" label={t('descAr')} required><Textarea dir="rtl" lang="ar" rows={4} value={form.description_ar} onChange={(e) => set('description_ar', e.target.value)} required /></Field>
        <Field id="desc_en" label={t('descEn')} required><Textarea lang="en" rows={4} value={form.description_en} onChange={(e) => set('description_en', e.target.value)} required /></Field>
      </section>

      <section className="rounded-lg border border-border bg-surface p-6" aria-labelledby="gallery-title">
        <h2 id="gallery-title" className="mb-4 font-serif text-lg font-semibold">{t('gallery')}</h2>
        <ImageUploader folder="packages" value={form.gallery_urls} onChange={(urls) => set('gallery_urls', urls)} />
      </section>

      <section className="grid gap-5 rounded-lg border border-border bg-surface p-6 md:grid-cols-2">
        <Field id="included" label={t('included')}><Textarea rows={6} value={form.included} onChange={(e) => set('included', e.target.value)} /></Field>
        <Field id="excluded" label={t('excluded')}><Textarea rows={6} value={form.excluded} onChange={(e) => set('excluded', e.target.value)} /></Field>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6" aria-labelledby="itinerary-title">
        <h2 id="itinerary-title" className="font-serif text-lg font-semibold">{t('itinerary')}</h2>
        {form.itinerary.map((d, i) => (
          <fieldset key={i} className="flex flex-col gap-3 rounded-md border border-border p-4">
            <div className="flex items-center justify-between">
              <legend className="font-semibold">J{i + 1}</legend>
              <Button type="button" variant="ghost" size="sm" onClick={() => set('itinerary', form.itinerary.filter((_, j) => j !== i))} aria-label={t('removeDay', { day: i + 1 })}>
                <Trash2 className="text-danger" aria-hidden />
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Input aria-label={`${t('dayTitle', { day: i + 1 })} (FR)`} placeholder="Titre FR" value={d.title_fr} onChange={(e) => setDay(i, { title_fr: e.target.value })} required />
              <Input aria-label={`${t('dayTitle', { day: i + 1 })} (AR)`} placeholder="العنوان" dir="rtl" value={d.title_ar ?? ''} onChange={(e) => setDay(i, { title_ar: e.target.value })} />
              <Input aria-label={`${t('dayTitle', { day: i + 1 })} (EN)`} placeholder="Title EN" value={d.title_en ?? ''} onChange={(e) => setDay(i, { title_en: e.target.value })} />
            </div>
            <TiptapEditor
              id={`day-${i}-content`}
              label={t('dayContent', { day: i + 1 })}
              value={d.content_fr}
              onChange={(doc: TiptapDoc) => setDay(i, { content_fr: doc })}
              minimal
            />
            <Input aria-label={t('accommodation')} placeholder={t('accommodation')} value={d.accommodation ?? ''} onChange={(e) => setDay(i, { accommodation: e.target.value })} />
          </fieldset>
        ))}
        <Button type="button" variant="outline" className="self-start" onClick={() => set('itinerary', [...form.itinerary, { day: form.itinerary.length + 1, title_fr: '' }])}>
          <Plus aria-hidden /> {t('addDay')}
        </Button>
      </section>

      <div className="flex justify-end">
        <Button type="submit" size="lg" loading={save.isPending}>{tc('save')}</Button>
      </div>
    </form>
  );
}
