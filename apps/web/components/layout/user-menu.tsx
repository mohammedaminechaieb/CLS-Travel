'use client';

import { STAFF_ROLES } from '@cls/shared';
import { LayoutDashboard, LogOut, Luggage, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/auth/auth-provider';
import { NotificationBell } from './notification-bell';

export function UserMenu() {
  const t = useTranslations('nav');
  const { status, user, logout } = useAuth();
  const router = useRouter();

  if (status === 'loading') return <div className="h-9 w-24 animate-pulse rounded-md bg-muted" aria-hidden />;

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/login">{t('login')}</Link>
        </Button>
        <Button asChild size="sm" className="hidden sm:inline-flex">
          <Link href="/register">{t('register')}</Link>
        </Button>
      </div>
    );
  }

  const isStaff = (STAFF_ROLES as readonly string[]).includes(user.role);
  return (
    <div className="flex items-center gap-1">
      <NotificationBell />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground" aria-hidden>
              {user.first_name.charAt(0)}
              {user.last_name.charAt(0)}
            </span>
            <span className="hidden max-w-[8rem] truncate md:inline">{user.first_name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href="/espace-client">
              <UserRound className="size-4" aria-hidden /> {t('myAccount')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/mes-reservations">
              <Luggage className="size-4" aria-hidden /> {t('myBookings')}
            </Link>
          </DropdownMenuItem>
          {isStaff && (
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <LayoutDashboard className="size-4" aria-hidden /> {t('admin')}
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={async () => {
              await logout();
              router.push('/');
            }}
          >
            <LogOut className="size-4" aria-hidden /> {t('logout')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
