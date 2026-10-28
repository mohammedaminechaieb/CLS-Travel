import 'server-only';
import { apiFetch, type Query } from './api-client';
import { INTERNAL_API_URL } from './config';

/**
 * Lecture de données publiques côté serveur (RSC) avec cache ISR.
 * Renvoie `null` si l'API est injoignable (ex. pendant `next build`) pour ne pas casser le rendu.
 */
export async function serverFetch<T>(path: string, query?: Query, revalidate = 300): Promise<T | null> {
  try {
    return await apiFetch<T>(path, {
      query,
      baseUrl: INTERNAL_API_URL,
      credentials: 'omit',
      next: { revalidate },
    } as Parameters<typeof apiFetch>[1]);
  } catch (err) {
    if (process.env.NEXT_PHASE !== 'phase-production-build') {
      console.warn(`[serverFetch] ${path}: ${(err as Error).message}`);
    }
    return null;
  }
}

/** Variante qui distingue 404 (renvoie 'not-found') des autres erreurs. */
export async function serverFetchOrNotFound<T>(path: string, revalidate = 300): Promise<T | 'not-found' | null> {
  try {
    return await apiFetch<T>(path, { baseUrl: INTERNAL_API_URL, credentials: 'omit', next: { revalidate } } as Parameters<typeof apiFetch>[1]);
  } catch (err) {
    if ((err as { status?: number }).status === 404) return 'not-found';
    return null;
  }
}
