import type { BookingStatus } from '@cls/shared';
import { useTranslations } from 'next-intl';
import { Badge, type BadgeProps } from '@/components/ui/badge';

const VARIANT: Record<BookingStatus, BadgeProps['variant']> = {
  pending: 'warning',
  confirmed: 'success',
  cancelled: 'danger',
  completed: 'muted',
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const t = useTranslations('client.status');
  return <Badge variant={VARIANT[status]}>{t(status)}</Badge>;
}
