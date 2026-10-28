/** Configuration typée — toutes les valeurs proviennent des variables d'environnement. */
export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  // Render (et la plupart des PaaS) imposent le port via PORT ; API_PORT reste accepté (Docker)
  port: parseInt(process.env.PORT ?? process.env.API_PORT ?? '4000', 10),
  appUrl: process.env.APP_URL ?? 'http://localhost:3000',
  // RENDER_EXTERNAL_URL est fourni automatiquement par Render (ex. https://cls-travel-api.onrender.com)
  apiUrl: process.env.API_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:4000',
  corsOrigins: (
    process.env.CORS_ORIGINS ?? 'https://carthagoloisirs.com,https://www.carthagoloisirs.com'
  )
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  // Facultatif : à définir seulement avec des domaines personnalisés (ex. .carthagoloisirs.com)
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  // "none" lorsque le front et l'API sont sur des sites différents (ex. *.onrender.com)
  cookieSameSite: (process.env.COOKIE_SAMESITE ?? 'lax').toLowerCase() as 'lax' | 'strict' | 'none',
  chromiumPath: process.env.CHROMIUM_PATH ?? '/usr/bin/chromium-browser',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY ?? '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY ?? '7d',
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY ?? '',
  },
});
