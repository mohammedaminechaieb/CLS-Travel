'use client';

import { LayoutDashboard, Luggage, UserRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export function ClientNav() {
  const t = useTranslations('client');
  const pathname = usePathname();
  const links = [
    { href: '/espace-client', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/mes-reservations', label: t('bookings'), icon: Luggage },
    { href: '/profil', label: t('profile'), icon: UserRound },
  ];
  return (
    <nav aria-label={t('nav')} className="mb-8 overflow-x-auto border-b border-border">
      <ul className="flex gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/espace-client' && pathname.startsWith(href));
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  '-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium',
                  active ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text',
                )}
              >
                <Icon className="size-4" aria-hidden /> {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
