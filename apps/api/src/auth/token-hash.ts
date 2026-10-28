import * as bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';

/**
 * bcrypt ne prend en compte que les 72 premiers octets ; or deux JWT d'un même utilisateur
 * partagent un long préfixe (header + début du payload). On pré-hache donc le token en
 * SHA-256 (64 caractères) avant bcrypt pour que chaque token ait une empreinte distincte.
 */
const prehash = (token: string) => createHash('sha256').update(token).digest('hex');

export const BCRYPT_ROUNDS = 12;

export function hashToken(token: string): Promise<string> {
  return bcrypt.hash(prehash(token), BCRYPT_ROUNDS);
}

export function compareToken(token: string, hash: string): Promise<boolean> {
  return bcrypt.compare(prehash(token), hash);
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
