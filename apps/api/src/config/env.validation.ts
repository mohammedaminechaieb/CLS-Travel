/** Échoue au démarrage si un secret obligatoire manque (jamais de valeur par défaut en dur). */
const REQUIRED = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const;

export function validateEnv(env: Record<string, unknown>): Record<string, unknown> {
  const missing = REQUIRED.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Variables d'environnement manquantes : ${missing.join(', ')}`);
  }
  if (env.NODE_ENV === 'production') {
    for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const) {
      if (String(env[key]).length < 32) {
        throw new Error(`${key} doit contenir au moins 32 caractères en production`);
      }
    }
  }
  return env;
}
