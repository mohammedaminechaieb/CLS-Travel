'use client';

import type { AuthResponse, PublicUser } from '@cls/shared';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError, apiFetch, type RequestOptions } from '../api-client';

type Status = 'loading' | 'authenticated' | 'anonymous';

interface RegisterInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

interface AuthContextValue {
  status: Status;
  user: PublicUser | null;
  login: (email: string, password: string) => Promise<PublicUser>;
  register: (input: RegisterInput) => Promise<PublicUser>;
  logout: () => Promise<void>;
  setUser: (user: PublicUser) => void;
  /** Requête authentifiée : ajoute le Bearer et rafraîchit la session une fois sur 401. */
  request: <T>(path: string, opts?: RequestOptions) => Promise<T>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * L'access token (15 min) vit uniquement en mémoire ; le refresh token (7 j) est dans un
 * cookie HttpOnly inaccessible au JavaScript. Au chargement, on tente un refresh silencieux.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUserState] = useState<PublicUser | null>(null);
  const tokenRef = useRef<string | null>(null);
  const refreshing = useRef<Promise<string | null> | null>(null);

  const applySession = useCallback((res: AuthResponse) => {
    tokenRef.current = res.accessToken;
    setUserState(res.user);
    setStatus('authenticated');
    return res.user;
  }, []);

  const clearSession = useCallback(() => {
    tokenRef.current = null;
    setUserState(null);
    setStatus('anonymous');
  }, []);

  /** Un seul refresh concurrent (les refresh tokens sont à usage unique). */
  const refresh = useCallback(() => {
    refreshing.current ??= apiFetch<AuthResponse>('/auth/refresh', { method: 'POST' })
      .then((res) => {
        applySession(res);
        return res.accessToken;
      })
      .catch(() => {
        clearSession();
        return null;
      })
      .finally(() => {
        refreshing.current = null;
      });
    return refreshing.current;
  }, [applySession, clearSession]);

  useEffect(() => {
    void refresh();
    // Renouvellement proactif avant expiration de l'access token
    const timer = setInterval(() => tokenRef.current && void refresh(), 13 * 60 * 1000);
    return () => clearInterval(timer);
  }, [refresh]);

  const request = useCallback(
    async <T,>(path: string, opts: RequestOptions = {}): Promise<T> => {
      if (refreshing.current) await refreshing.current;
      try {
        return await apiFetch<T>(path, { ...opts, token: tokenRef.current });
      } catch (err) {
        if (!(err instanceof ApiError) || err.status !== 401) throw err;
        const token = await refresh();
        if (!token) throw err;
        return apiFetch<T>(path, { ...opts, token });
      }
    },
    [refresh],
  );

  const login = useCallback(
    async (email: string, password: string) =>
      applySession(await apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } })),
    [applySession],
  );

  const register = useCallback(
    async (input: RegisterInput) => applySession(await apiFetch<AuthResponse>('/auth/register', { method: 'POST', body: input })),
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST', token: tokenRef.current });
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, register, logout, request, setUser: setUserState }),
    [status, user, login, register, logout, request],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
