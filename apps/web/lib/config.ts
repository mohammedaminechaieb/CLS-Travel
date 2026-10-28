export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
/** URL utilisée côté serveur (SSR) : réseau Docker interne en production. */
export const INTERNAL_API_URL = process.env.INTERNAL_API_URL ?? API_URL;
export const GMAPS_KEY = process.env.NEXT_PUBLIC_GMAPS_KEY ?? '';
