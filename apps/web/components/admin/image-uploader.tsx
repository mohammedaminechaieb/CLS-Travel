'use client';

import { ImagePlus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { SmartImage } from '@/components/smart-image';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth/auth-provider';

/** Envoi d'images vers OVHcloud Object Storage via POST /admin/media/:folder. */
export function ImageUploader({
  value,
  onChange,
  folder,
  multiple = true,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  folder: 'packages' | 'destinations' | 'blog';
  multiple?: boolean;
}) {
  const t = useTranslations('admin.packages');
  const { request } = useAuth();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const body = new FormData();
      body.append('file', file);
      try {
        const res = await request<{ url: string }>(`/admin/media/${folder}`, { method: 'POST', body });
        urls.push(res.url);
      } catch (err) {
        toast.error(`${t('uploadError')} — ${file.name}: ${err instanceof ApiError ? err.message : ''}`);
      }
    }
    onChange(multiple ? [...value, ...urls] : urls.slice(0, 1));
    setUploading(false);
    if (input.current) input.current.value = '';
  };

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {value.map((url, i) => (
            <li key={url} className="group relative aspect-[4/3] overflow-hidden rounded-md border border-border">
              <SmartImage src={url} alt="" fill sizes="200px" className="object-cover" />
              {i === 0 && multiple && <span className="absolute start-1 top-1 rounded bg-accent px-1.5 text-[10px] font-bold text-accent-foreground">★</span>}
              <button
                type="button"
                onClick={() => onChange(value.filter((u) => u !== url))}
                className="absolute end-1 top-1 rounded-full bg-black/70 p-1 text-white"
                aria-label={`${t('removePhoto')} ${i + 1}`}
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple={multiple} className="sr-only" id={`upload-${folder}`} onChange={(e) => upload(e.target.files)} />
      <Button type="button" variant="outline" className="self-start" loading={uploading} onClick={() => input.current?.click()}>
        <ImagePlus aria-hidden /> {uploading ? t('uploading') : t('upload')}
      </Button>
      {multiple && <p className="text-xs text-text-muted">{t('coverHint')}</p>}
    </div>
  );
}
