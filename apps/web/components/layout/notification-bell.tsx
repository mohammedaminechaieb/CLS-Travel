'use client';

import type { AppNotification, Paginated } from '@cls/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/auth/auth-provider';
import { useApiQuery } from '@/lib/hooks';
import { cn } from '@/lib/utils';

type NotificationsResponse = Paginated<AppNotification> & { unread: number };

export function NotificationBell() {
  const t = useTranslations('notifications');
  const format = useFormatter();
  const { request } = useAuth();
  const qc = useQueryClient();
  const { data } = useApiQuery<NotificationsResponse>(['notifications'], '/notifications', { limit: 8 }, { refetchInterval: 60_000 });

  const markAll = useMutation({
    mutationFn: () => request('/notifications/read-all', { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unread = data?.unread ?? 0;
  return (
    <DropdownMenu onOpenChange={(open) => !open && unread > 0 && markAll.mutate()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('label', { count: unread })} className="relative">
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute end-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-cta px-1 text-[10px] font-bold text-white" aria-hidden>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>{t('title')}</DropdownMenuLabel>
        {(data?.data ?? []).length === 0 && <p className="px-2 py-4 text-center text-sm text-text-muted">{t('empty')}</p>}
        {data?.data.map((n) => {
          const bookingId = typeof n.payload.booking_id === 'string' ? n.payload.booking_id : null;
          return (
            <DropdownMenuItem key={n.id} asChild>
              <Link href={bookingId ? `/mes-reservations/${bookingId}` : '/espace-client'} className={cn('flex-col items-start gap-0.5', !n.is_read && 'bg-primary/5')}>
                <span className="text-sm font-medium">{t(`types.${n.type}` as 'types.BOOKING_CREATED', { reference: String(n.payload.reference ?? '') })}</span>
                <span className="text-xs text-text-muted">{format.relativeTime(new Date(n.created_at))}</span>
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
