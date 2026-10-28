'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { useAuth } from './auth/auth-provider';
import type { Query } from './api-client';

/** useQuery authentifié : la requête n'est lancée qu'une fois la session établie. */
export function useApiQuery<T>(
  key: readonly unknown[],
  path: string,
  query?: Query,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>,
) {
  const { request, status } = useAuth();
  return useQuery<T>({
    queryKey: [...key, query],
    queryFn: () => request<T>(path, { query }),
    ...options,
    enabled: status === 'authenticated' && (options?.enabled ?? true),
  });
}
