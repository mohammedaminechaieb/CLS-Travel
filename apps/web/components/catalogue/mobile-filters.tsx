'use client';

import type { Destination, PackageFacets } from '@cls/shared';
import { SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { CatalogueFilters } from './filters';

export function MobileFilters(props: { facets: PackageFacets | null; destinations: Destination[] }) {
  const t = useTranslations('catalogue');
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="lg:hidden">
          <SlidersHorizontal aria-hidden /> {t('showFilters')}
        </Button>
      </SheetTrigger>
      <SheetContent side="start">
        <SheetTitle className="font-serif text-xl font-semibold">{t('filters')}</SheetTitle>
        <CatalogueFilters {...props} onApplied={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
