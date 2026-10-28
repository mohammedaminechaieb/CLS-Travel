'use client';

import { Check, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { setLocale } from '@/i18n/actions';
import { LOCALES } from '@/i18n/config';

export function LanguageSwitcher() {
  const t = useTranslations('nav');
  const current = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5" aria-label={t('changeLanguage', { current: t(`languages.${current}` as 'languages.fr') })} disabled={pending}>
          <Globe className="size-4" aria-hidden />
          <span className="uppercase">{current}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l}
            lang={l}
            dir={l === 'ar' ? 'rtl' : 'ltr'}
            onSelect={() =>
              startTransition(async () => {
                await setLocale(l);
                router.refresh();
              })
            }
            aria-current={l === current ? 'true' : undefined}
          >
            <span className="flex-1">{t(`languages.${l}`)}</span>
            {l === current && <Check className="size-4 text-primary" aria-hidden />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
