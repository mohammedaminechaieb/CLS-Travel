import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <Link href="/" className={cn('group inline-flex items-center gap-2', className)} aria-label="CLS Travel — accueil">
      <svg viewBox="0 0 40 40" className="size-9" aria-hidden>
        <circle cx="20" cy="20" r="19" className={inverted ? 'fill-white/10' : 'fill-primary'} />
        <path d="M8 26c4-3 8-3 12 0s8 3 12 0" className="stroke-accent" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M20 9l3 8h-6z" className={inverted ? 'fill-white' : 'fill-white'} />
        <circle cx="20" cy="20" r="2.5" className="fill-accent" />
      </svg>
      <span className={cn('font-serif text-xl font-bold leading-none', inverted ? 'text-white' : 'text-primary')}>
        CLS <span className="text-accent">Travel</span>
      </span>
    </Link>
  );
}
