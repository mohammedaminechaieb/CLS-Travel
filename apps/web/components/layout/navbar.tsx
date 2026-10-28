'use client';

import { Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Logo } from './logo';
import { UserMenu } from './user-menu';

const LINKS = [
  { href: '/', key: 'home' },
  { href: '/voyages', key: 'trips' },
  { href: '/destinations', key: 'destinations' },
  { href: '/blog', key: 'blog' },
  { href: '/contact', key: 'contact' },
] as const;

export function Navbar({ languageSwitcher }: { languageSwitcher?: React.ReactNode }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b transition-colors',
        scrolled ? 'border-border bg-surface/95 shadow-sm backdrop-blur' : 'border-transparent bg-bg/80 backdrop-blur',
      )}
    >
      <div className="container-content flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav aria-label={t('mainNav')} className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={isActive(l.href) ? 'page' : undefined}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-primary',
                    isActive(l.href) ? 'text-primary' : 'text-text',
                  )}
                >
                  {t(l.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-1">
          {languageSwitcher}
          <UserMenu />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t('openMenu')}>
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent closeLabel={t('openMenu')}>
              <SheetTitle className="sr-only">{t('mainNav')}</SheetTitle>
              <Logo />
              <nav aria-label={t('mainNav')}>
                <ul className="mt-4 flex flex-col gap-1">
                  {LINKS.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        aria-current={isActive(l.href) ? 'page' : undefined}
                        className={cn('block rounded-md px-3 py-3 text-base font-medium hover:bg-muted', isActive(l.href) && 'bg-muted text-primary')}
                      >
                        {t(l.key)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
