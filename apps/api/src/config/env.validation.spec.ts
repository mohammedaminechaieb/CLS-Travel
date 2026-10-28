import { validateEnv } from './env.validation';

const base = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  JWT_ACCESS_SECRET: 'a'.repeat(64),
  JWT_REFRESH_SECRET: 'b'.repeat(64),
};

describe('validateEnv', () => {
  it('does not require RESEND_API_KEY outside production (emails are logged)', () => {
    expect(() => validateEnv({ ...base, NODE_ENV: 'development' })).not.toThrow();
  });

  it('requires a valid RESEND_API_KEY in production', () => {
    expect(() => validateEnv({ ...base, NODE_ENV: 'production' })).toThrow(/RESEND_API_KEY/);
    expect(() => validateEnv({ ...base, NODE_ENV: 'production', RESEND_API_KEY: 'SG.legacy' })).toThrow(/re_/);
    expect(() => validateEnv({ ...base, NODE_ENV: 'production', RESEND_API_KEY: 're_123' })).not.toThrow();
  });
});
