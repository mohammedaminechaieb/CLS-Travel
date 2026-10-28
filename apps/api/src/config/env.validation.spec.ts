import { validateEnv } from './env.validation';

const base = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  JWT_ACCESS_SECRET: 'a'.repeat(64),
  JWT_REFRESH_SECRET: 'b'.repeat(64),
};

const prod = { ...base, NODE_ENV: 'production', RESEND_API_KEY: 're_123', API_URL: 'https://api.carthagoloisirs.com' };

describe('validateEnv', () => {
  it('only requires the core secrets outside production', () => {
    expect(() => validateEnv({ ...base, NODE_ENV: 'development' })).not.toThrow();
  });

  it('requires a valid RESEND_API_KEY in production', () => {
    expect(() => validateEnv({ ...prod, RESEND_API_KEY: undefined })).toThrow(/RESEND_API_KEY/);
    expect(() => validateEnv({ ...prod, RESEND_API_KEY: 'SG.legacy' })).toThrow(/re_/);
    expect(() => validateEnv(prod)).not.toThrow();
  });

  it('requires an https API_URL in production (public URLs of uploaded files)', () => {
    expect(() => validateEnv({ ...prod, API_URL: undefined })).toThrow(/API_URL/);
    expect(() => validateEnv({ ...prod, API_URL: 'http://localhost:4000' })).toThrow(/API_URL/);
  });
});

describe('validateEnv — Render', () => {
  const prod = {
    DATABASE_URL: 'postgresql://u:p@host:5432/db',
    JWT_ACCESS_SECRET: 'a'.repeat(64),
    JWT_REFRESH_SECRET: 'b'.repeat(64),
    NODE_ENV: 'production',
    RESEND_API_KEY: 're_123',
  };

  it('accepts RENDER_EXTERNAL_URL instead of API_URL', () => {
    expect(() => validateEnv({ ...prod, RENDER_EXTERNAL_URL: 'https://cls-travel-api.onrender.com' })).not.toThrow();
  });

  it('does not require COOKIE_DOMAIN and validates COOKIE_SAMESITE', () => {
    expect(() => validateEnv({ ...prod, API_URL: 'https://x.onrender.com', COOKIE_SAMESITE: 'none' })).not.toThrow();
    expect(() => validateEnv({ ...prod, API_URL: 'https://x.onrender.com', COOKIE_SAMESITE: 'loose' })).toThrow(/COOKIE_SAMESITE/);
  });
});
