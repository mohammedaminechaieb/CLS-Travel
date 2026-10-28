'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth/auth-provider';
import { cn } from '@/lib/utils';

export function ReviewForm({ bookingId }: { bookingId: string }) {
  const t = useTranslations('client.detail');
  const { request } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const submit = useMutation({
    mutationFn: () => request('/reviews', { method: 'POST', body: { booking_id: bookingId, rating, comment } }),
    onSuccess: () => {
      toast.success(t('reviewThanks'));
      void qc.invalidateQueries({ queryKey: ['booking', bookingId] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : String(err)),
  });

  return (
    <form
      className="flex flex-col gap-4 rounded-lg border border-accent/40 bg-accent/5 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        submit.mutate();
      }}
    >
      <h2 className="font-serif text-lg font-semibold">{t('reviewTitle')}</h2>
      <p className="text-sm text-text-muted">{t('reviewText')}</p>
      <fieldset>
        <legend className="sr-only">{t('rating')}</legend>
        <div className="flex gap-1" role="radiogroup">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer">
              <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} className="peer sr-only" />
              <span className="sr-only">{t('ratingValue', { count: n })}</span>
              <Star
                aria-hidden
                className={cn('size-8 rounded peer-focus-visible:ring-2 peer-focus-visible:ring-ring', n <= rating ? 'fill-accent text-accent' : 'text-border')}
              />
            </label>
          ))}
        </div>
      </fieldset>
      <label htmlFor="review-comment" className="text-sm font-medium">{t('reviewComment')}</label>
      <Textarea id="review-comment" value={comment} onChange={(e) => setComment(e.target.value)} minLength={10} maxLength={3000} required />
      <Button type="submit" className="self-start" loading={submit.isPending}>{t('reviewSubmit')}</Button>
    </form>
  );
}
