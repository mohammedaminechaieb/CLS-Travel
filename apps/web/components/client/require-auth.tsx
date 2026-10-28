'use client';

import type { Role } from '@cls/shared';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth/auth-provider';

/**
 * Garde côté client : l'access token n'existe qu'en mémoire, la protection réelle reste
 * l'API (JwtAuthGuard + RolesGuard). Ceci évite seulement d'afficher une page vide.
 */
export function RequireAuth({ roles, children }: { roles?: readonly Role[]; children: React.ReactNode }) {
  const { status, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const allowed = status === 'authenticated' && (!roles || (user && roles.includes(user.role)));

  useEffect(() => {
    if (status === 'anonymous') router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (status === 'authenticated' && !allowed) router.replace('/espace-client');
  }, [status, allowed, router, pathname]);

  if (!allowed) {
    return (
      <div className="container-content flex flex-col gap-4 py-12" aria-busy>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  return <>{children}</>;
}
