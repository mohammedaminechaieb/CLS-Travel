/** Numéro de téléphone au format international E.164 (ex. +21698123456). */
export const E164_REGEX = /^\+[1-9]\d{6,14}$/;
/** ≥ 8 caractères, au moins une minuscule, une majuscule et un chiffre. */
export const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/;
export const STRONG_PASSWORD_MESSAGE =
  'Le mot de passe doit contenir au moins 8 caractères dont une majuscule, une minuscule et un chiffre';
