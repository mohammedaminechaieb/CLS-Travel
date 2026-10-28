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
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
    depositPercent: parseInt(process.env.STRIPE_DEPOSIT_PERCENT ?? '30', 10),
    currency: (process.env.STRIPE_CURRENCY ?? 'eur').toLowerCase(),
    tndExchangeRate: parseFloat(process.env.STRIPE_TND_EXCHANGE_RATE ?? '0.30'),
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY ?? '',
    fromEmail: process.env.SENDGRID_FROM_EMAIL ?? 'noreply@carthagoloisirs.com',
    fromName: process.env.SENDGRID_FROM_NAME ?? 'CLS Travel',
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
