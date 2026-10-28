/** Échoue au démarrage si un secret obligatoire manque (jamais de valeur par défaut en dur). */
const REQUIRED = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const;

export function validateEnv(env: Record<string, unknown>): Record<string, unknown> {
  const missing = REQUIRED.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Variables d'environnement manquantes : ${missing.join(', ')}`);
  }
  if (env.NODE_ENV === 'production') {
    // En production les emails sont obligatoires (vérification, reset, confirmations)
    if (!env.RESEND_API_KEY) throw new Error("Variable d'environnement manquante : RESEND_API_KEY");
    if (!String(env.RESEND_API_KEY).startsWith('re_')) throw new Error('RESEND_API_KEY invalide (préfixe attendu : re_)');
    // Les URL publiques des fichiers téléversés sont construites à partir de API_URL
    if (!/^https:\/\//.test(String(env.API_URL ?? ''))) {
      throw new Error('API_URL doit être une URL https en production (ex. https://api.carthagoloisirs.com)');
    }
    for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const) {
      if (String(env[key]).length < 32) {
        throw new Error(`${key} doit contenir au moins 32 caractères en production`);
      }
    }
  }
  return env;
}
