'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { NativeSelect } from '@/components/ui/native-select';

const SORTS = ['newest', 'price_asc', 'price_desc', 'duration_asc', 'duration_desc'] as const;

export function SortSelect() {
  const t = useTranslations('catalogue');
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="sr-only whitespace-nowrap text-sm text-text-muted sm:not-sr-only">
        {t('sort')}
      </label>
      <NativeSelect
        id="sort"
        className="h-10 min-w-40"
        value={params.get('sort') ?? 'newest'}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          next.set('sort', e.target.value);
          next.delete('page');
          router.push(`${pathname}?${next.toString()}`, { scroll: false });
        }}
      >
        {SORTS.map((s) => (
          <option key={s} value={s}>
            {t(`sorts.${s}`)}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
