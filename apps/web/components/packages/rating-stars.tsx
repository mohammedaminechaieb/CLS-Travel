import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RatingStars({ value, size = 'sm', label }: { value: number; size?: 'sm' | 'md'; label?: string }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={label ?? `${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden
          className={cn(
            size === 'sm' ? 'size-4' : 'size-5',
            i <= rounded ? 'fill-accent text-accent' : i - 0.5 === rounded ? 'fill-accent/50 text-accent' : 'fill-transparent text-border',
          )}
        />
      ))}
    </span>
  );
}
