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
