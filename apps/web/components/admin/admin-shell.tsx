'use client';

import { ADMIN_ROLES, type Role } from '@cls/shared';
import { BarChart3, ExternalLink, Luggage, Map, Menu, MessageSquareQuote, Newspaper, TicketPercent, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Logo } from '@/components/layout/logo';
import { UserMenu } from '@/components/layout/user-menu';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/lib/auth/auth-provider';
import { cn } from '@/lib/utils';

const ADMIN = ADMIN_ROLES as readonly Role[];
const LINKS = [
  { href: '/admin', key: 'dashboard', icon: BarChart3, roles: ADMIN },
  { href: '/admin/reservations', key: 'bookings', icon: Luggage },
  { href: '/admin/voyages', key: 'packages', icon: Map },
  { href: '/admin/clients', key: 'clients', icon: Users, roles: ADMIN },
  { href: '/admin/blog', key: 'blog', icon: Newspaper, roles: ADMIN },
  { href: '/admin/avis', key: 'reviews', icon: MessageSquareQuote, roles: ADMIN },
  { href: '/admin/promo', key: 'promo', icon: TicketPercent, roles: ADMIN },
] as const;

export function AdminShell({ children, languageSwitcher }: { children: React.ReactNode; languageSwitcher?: React.ReactNode }) {
  const t = useTranslations('admin');
  const pathname = usePathname();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const links = LINKS.filter((l) => !('roles' in l) || (user && l.roles.includes(user.role)));

  const nav = (
    <nav aria-label={t('title')}>
      <ul className="flex flex-col gap-1">
        {links.map(({ href, key, icon: Icon }) => {
          const active = href === '/admin' ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={() => setOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium',
                  active ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white',
                )}
              >
                <Icon className="size-4" aria-hidden /> {t(`nav.${key}`)}
              </Link>
            </li>
          );
        })}
        <li className="mt-4 border-t border-white/15 pt-4">
          <Link href="/" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white">
            <ExternalLink className="size-4" aria-hidden /> {t('nav.site')}
          </Link>
        </li>
      </ul>
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-8 bg-[#0F2236] p-5 lg:flex">
        <Logo inverted />
        {nav}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-surface px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t('title')}>
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="start" className="bg-[#0F2236]">
                <SheetTitle className="sr-only">{t('title')}</SheetTitle>
                <Logo inverted />
                {nav}
              </SheetContent>
            </Sheet>
            <span className="font-serif text-lg font-semibold">{t('title')}</span>
          </div>
          <div className="flex items-center gap-1">
            {languageSwitcher}
            <UserMenu />
          </div>
        </header>
        <main id="main" className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
