import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const STEPS = ['participants', 'summary', 'confirmation'] as const;

export function Stepper({ current }: { current: number }) {
  const t = useTranslations('booking');
  return (
    <nav aria-label={t('stepsLabel')} className="mb-8">
      <p className="sr-only" aria-live="polite">
        {t('stepOf', { current: current + 1, total: STEPS.length })}
      </p>
      <ol className="flex items-center gap-2">
        {STEPS.map((step, i) => (
          <li key={step} className="flex flex-1 items-center gap-2" aria-current={i === current ? 'step' : undefined}>
            <span
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold',
                i < current && 'border-success bg-success text-white',
                i === current && 'border-primary bg-primary text-primary-foreground',
                i > current && 'border-border text-text-muted',
              )}
            >
              {i < current ? <Check className="size-4" aria-hidden /> : i + 1}
            </span>
            <span className={cn('hidden text-sm font-medium sm:inline', i === current ? 'text-text' : 'text-text-muted')}>
              {t(`steps.${step}`)}
            </span>
            {i < STEPS.length - 1 && <span className={cn('h-0.5 flex-1 rounded', i < current ? 'bg-success' : 'bg-border')} aria-hidden />}
          </li>
        ))}
      </ol>
    </nav>
  );
}
