import { API_URL } from './config';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: string[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type Query = Record<string, string | number | boolean | string[] | undefined | null>;

export function buildQuery(query?: Query): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, Array.isArray(value) ? value.join(',') : String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  query?: Query;
  token?: string | null;
  baseUrl?: string;
}

/** Requête JSON vers l'API NestJS. Les cookies (refresh token) sont envoyés via `credentials: include`. */
export async function apiFetch<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { body, query, token, baseUrl = API_URL, headers, ...init } = opts;
  const res = await fetch(`${baseUrl}${path}${buildQuery(query)}`, {
    credentials: 'include',
    ...init,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined && !(body instanceof FormData) && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  });

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const raw = data?.message;
    const details = Array.isArray(raw) ? raw : undefined;
    throw new ApiError(res.status, details ? details[0] : (raw ?? res.statusText), details);
  }
  return data as T;
}
