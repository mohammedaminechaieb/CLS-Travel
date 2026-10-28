import type { ConfigService } from '@nestjs/config';
import { refreshCookieOptions } from './refresh-cookie';

const cfg = (values: Record<string, unknown>) => ({ get: (k: string) => values[k] }) as unknown as ConfigService;

describe('refreshCookieOptions', () => {
  it('defaults to SameSite=Lax, HttpOnly, path /auth', () => {
    const o = refreshCookieOptions(cfg({ nodeEnv: 'production' }));
    expect(o).toMatchObject({ httpOnly: true, secure: true, sameSite: 'lax', path: '/auth', domain: undefined });
  });

  it('forces Secure when SameSite=None (cross-site front/API on Render)', () => {
    const o = refreshCookieOptions(cfg({ nodeEnv: 'development', cookieSameSite: 'none' }));
    expect(o).toMatchObject({ sameSite: 'none', secure: true });
  });
});
