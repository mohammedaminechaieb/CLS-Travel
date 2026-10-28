import type { ItineraryDay, TiptapDoc } from '@cls/shared';
import { BedDouble } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { TiptapRenderer } from '@/components/tiptap-renderer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { tr } from '@/lib/i18n';

export async function Itinerary({ days }: { days: ItineraryDay[] }) {
  const t = await getTranslations('package');
  const locale = await getLocale();
  return (
    <Accordion type="multiple" defaultValue={days.length ? [`day-${days[0].day}`] : []}>
      {days.map((d) => {
        const content = (d[`content_${locale}` as keyof ItineraryDay] ?? d.content_fr) as TiptapDoc | undefined;
        return (
          <AccordionItem key={d.day} value={`day-${d.day}`}>
            <AccordionTrigger>
              <span className="flex items-center gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {d.day}
                </span>
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-wide text-text-muted">{t('day', { day: d.day })}</span>
                  <span className="font-serif text-lg">{tr(d, 'title', locale) || d.title_fr}</span>
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="ps-14">
              <TiptapRenderer doc={content} className="text-base" />
              {d.accommodation && (
                <p className="mt-3 inline-flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-sm text-text-muted">
                  <BedDouble className="size-4" aria-hidden /> {t('accommodation', { name: d.accommodation })}
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
