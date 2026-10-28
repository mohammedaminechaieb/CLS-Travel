import { validateEnv } from './env.validation';

const base = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  JWT_ACCESS_SECRET: 'a'.repeat(64),
  JWT_REFRESH_SECRET: 'b'.repeat(64),
};

const r2 = {
  R2_ENDPOINT: 'https://0123456789abcdef0123456789abcdef.r2.cloudflarestorage.com',
  R2_BUCKET: 'cls-travel-media',
  R2_ACCESS_KEY: 'access',
  R2_SECRET_KEY: 'secret',
  R2_REGION: 'auto',
  R2_PUBLIC_URL: 'https://media.carthagoloisirs.com',
};

const prod = { ...base, ...r2, NODE_ENV: 'production', RESEND_API_KEY: 're_123' };

describe('validateEnv', () => {
  it('does not require Resend or R2 outside production', () => {
    expect(() => validateEnv({ ...base, NODE_ENV: 'development' })).not.toThrow();
  });

  it('requires a valid RESEND_API_KEY in production', () => {
    expect(() => validateEnv({ ...prod, RESEND_API_KEY: undefined })).toThrow(/RESEND_API_KEY/);
    expect(() => validateEnv({ ...prod, RESEND_API_KEY: 'SG.legacy' })).toThrow(/re_/);
    expect(() => validateEnv(prod)).not.toThrow();
  });

  it('requires the R2 media settings in production', () => {
    expect(() => validateEnv({ ...prod, R2_BUCKET: undefined, R2_PUBLIC_URL: '' })).toThrow(/R2_BUCKET, R2_PUBLIC_URL/);
  });

  it('validates the R2 endpoint, region and public URL whenever they are set', () => {
    expect(() => validateEnv({ ...base, R2_ENDPOINT: 'https://s3.gra.io.cloud.ovh.net' })).toThrow(/R2_ENDPOINT/);
    expect(() => validateEnv({ ...base, R2_REGION: 'gra' })).toThrow(/R2_REGION/);
    expect(() => validateEnv({ ...base, R2_PUBLIC_URL: 'http://media.example.com' })).toThrow(/R2_PUBLIC_URL/);
    expect(() => validateEnv({ ...base, ...r2, R2_ENDPOINT: `${r2.R2_ENDPOINT.replace('.r2', '.eu.r2')}` })).not.toThrow();
  });
});
