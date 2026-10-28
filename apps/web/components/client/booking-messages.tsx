'use client';

import type { Message } from '@cls/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth/auth-provider';
import { useApiQuery } from '@/lib/hooks';
import { cn } from '@/lib/utils';

/** Fil de discussion client ↔ conseiller (rafraîchi toutes les 20 s). */
export function BookingMessages({ bookingId, labels }: { bookingId: string; labels?: { title?: string } }) {
  const t = useTranslations('client.detail');
  const format = useFormatter();
  const { user, request } = useAuth();
  const qc = useQueryClient();
  const [body, setBody] = useState('');
  const listRef = useRef<HTMLOListElement>(null);
  const key = ['messages', bookingId];
  const { data: messages = [] } = useApiQuery<Message[]>(key, `/bookings/${bookingId}/messages`, undefined, { refetchInterval: 20_000 });

  const send = useMutation({
    mutationFn: () => request<Message>(`/bookings/${bookingId}/messages`, { method: 'POST', body: { body } }),
    onSuccess: () => {
      setBody('');
      void qc.invalidateQueries({ queryKey: key });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : String(err)),
  });

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  return (
    <section aria-labelledby={`messages-${bookingId}`} className="flex flex-col rounded-lg border border-border bg-surface">
      <h2 id={`messages-${bookingId}`} className="border-b border-border px-5 py-4 font-serif text-lg font-semibold">
        {labels?.title ?? t('messages')}
      </h2>
      <ol ref={listRef} className="flex max-h-96 min-h-40 flex-col gap-3 overflow-y-auto p-5" aria-live="polite">
        {messages.length === 0 && <li className="m-auto text-center text-sm text-text-muted">{t('noMessages')}</li>}
        {messages.map((m) => {
          const mine = m.sender_id === user?.id;
          return (
            <li key={m.id} className={cn('flex max-w-[85%] flex-col gap-1', mine ? 'self-end items-end' : 'self-start')}>
              <span className="text-xs text-text-muted">
                {mine ? t('you') : `${m.sender.first_name} ${m.sender.last_name.charAt(0)}.`} ·{' '}
                {format.dateTime(new Date(m.created_at), { dateStyle: 'short', timeStyle: 'short' })}
              </span>
              <p className={cn('whitespace-pre-wrap rounded-lg px-4 py-2 text-sm', mine ? 'bg-primary text-primary-foreground' : 'bg-muted text-text')}>
                {m.body}
              </p>
            </li>
          );
        })}
      </ol>
      <form
        className="flex items-end gap-2 border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (body.trim()) send.mutate();
        }}
      >
        <label htmlFor={`msg-${bookingId}`} className="sr-only">{t('messagePlaceholder')}</label>
        <Textarea
          id={`msg-${bookingId}`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t('messagePlaceholder')}
          className="min-h-11 resize-none"
          rows={2}
          maxLength={5000}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (body.trim()) send.mutate();
            }
          }}
        />
        <Button type="submit" size="icon" loading={send.isPending} aria-label={t('send')}>
          {!send.isPending && <Send className="rtl:-scale-x-100" />}
        </Button>
      </form>
    </section>
  );
}
