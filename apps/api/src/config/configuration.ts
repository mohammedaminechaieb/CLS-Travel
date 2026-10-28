/** Configuration typée — toutes les valeurs proviennent des variables d'environnement. */
export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.API_PORT ?? '4000', 10),
  appUrl: process.env.APP_URL ?? 'http://localhost:3000',
  apiUrl: process.env.API_URL ?? 'http://localhost:4000',
  corsOrigins: (
    process.env.CORS_ORIGINS ?? 'https://carthagoloisirs.com,https://www.carthagoloisirs.com'
  )
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  chromiumPath: process.env.CHROMIUM_PATH ?? '/usr/bin/chromium-browser',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY ?? '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY ?? '7d',
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY ?? '',
  },
  s3: {
    endpoint: process.env.OVH_S3_ENDPOINT ?? '',
    bucket: process.env.OVH_S3_BUCKET ?? '',
    accessKey: process.env.OVH_S3_ACCESS_KEY ?? '',
    secretKey: process.env.OVH_S3_SECRET_KEY ?? '',
    region: process.env.OVH_S3_REGION ?? 'gra',
    publicUrl: process.env.OVH_S3_PUBLIC_URL ?? '',
  },
});
