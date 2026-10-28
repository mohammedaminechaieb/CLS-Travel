import type { User } from '@prisma/client';

/** Champs exposables d'un utilisateur — jamais de hash ni de token. */
export const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  role: true,
  first_name: true,
  last_name: true,
  phone: true,
  avatar_url: true,
  is_verified: true,
  created_at: true,
  updated_at: true,
} as const;

export type PublicUser = Pick<User, keyof typeof PUBLIC_USER_SELECT>;

export function toPublicUser(user: User): PublicUser {
  const { password_hash: _p, refresh_token_hash: _r, ...rest } = user;
  return rest;
}
