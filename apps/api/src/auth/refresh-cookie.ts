import type { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';

export const REFRESH_COOKIE = 'cls_rt';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function refreshCookieOptions(config: ConfigService): CookieOptions {
  const isProd = config.get('nodeEnv') === 'production';
  // lax : www.carthagoloisirs.com ↔ api.carthagoloisirs.com = même site.
  // none : front et API sur des sites distincts (onrender.com est un suffixe public) — exige Secure.
  const sameSite = config.get<'lax' | 'strict' | 'none'>('cookieSameSite') ?? 'lax';
  return {
    httpOnly: true,
    secure: isProd || sameSite === 'none',
    sameSite,
    domain: isProd ? config.get<string>('cookieDomain') : undefined,
    path: '/auth',
    maxAge: SEVEN_DAYS_MS,
  };
}

export function setRefreshCookie(res: Response, token: string, config: ConfigService) {
  res.cookie(REFRESH_COOKIE, token, refreshCookieOptions(config));
}

export function clearRefreshCookie(res: Response, config: ConfigService) {
  const { maxAge: _m, ...opts } = refreshCookieOptions(config);
  res.clearCookie(REFRESH_COOKIE, opts);
}
