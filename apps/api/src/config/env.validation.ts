/** Échoue au démarrage si un secret obligatoire manque (jamais de valeur par défaut en dur). */
const REQUIRED = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const;
/** Stockage des médias (Cloudflare R2) — obligatoire en production. */
const R2_REQUIRED = ['R2_ENDPOINT', 'R2_BUCKET', 'R2_ACCESS_KEY', 'R2_SECRET_KEY', 'R2_PUBLIC_URL'] as const;
const R2_ENDPOINT_REGEX = /^https:\/\/[a-z0-9]+\.(eu\.|fedramp\.)?r2\.cloudflarestorage\.com\/?$/;

/** Vérifie la cohérence des variables R2 lorsqu'elles sont renseignées. */
function validateR2(env: Record<string, unknown>) {
  if (env.R2_ENDPOINT && !R2_ENDPOINT_REGEX.test(String(env.R2_ENDPOINT))) {
    throw new Error('R2_ENDPOINT invalide (attendu : https://<ACCOUNT_ID>.r2.cloudflarestorage.com)');
  }
  if (env.R2_REGION && env.R2_REGION !== 'auto') {
    throw new Error('R2_REGION doit valoir "auto" pour Cloudflare R2');
  }
  if (env.R2_PUBLIC_URL && !/^https:\/\//.test(String(env.R2_PUBLIC_URL))) {
    throw new Error('R2_PUBLIC_URL doit être une URL https (domaine public du bucket)');
  }
}

export function validateEnv(env: Record<string, unknown>): Record<string, unknown> {
  const missing = REQUIRED.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Variables d'environnement manquantes : ${missing.join(', ')}`);
  }
  validateR2(env);
  if (env.NODE_ENV === 'production') {
    const missingR2 = R2_REQUIRED.filter((key) => !env[key]);
    if (missingR2.length > 0) {
      throw new Error(`Variables d'environnement manquantes : ${missingR2.join(', ')}`);
    }
    // En production les emails sont obligatoires (vérification, reset, confirmations)
    if (!env.RESEND_API_KEY) throw new Error("Variable d'environnement manquante : RESEND_API_KEY");
    if (!String(env.RESEND_API_KEY).startsWith('re_')) throw new Error('RESEND_API_KEY invalide (préfixe attendu : re_)');
    for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const) {
      if (String(env[key]).length < 32) {
        throw new Error(`${key} doit contenir au moins 32 caractères en production`);
      }
    }
  }
  return env;
}
