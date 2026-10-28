import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
/** Restreint une route aux rôles listés (vérifié par RolesGuard). */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

/** Raccourcis RBAC */
export const ALL_ROLES: Role[] = [Role.super_admin, Role.manager, Role.agent, Role.client];
export const STAFF: Role[] = [Role.super_admin, Role.manager, Role.agent];
export const ADMINS: Role[] = [Role.super_admin, Role.manager];
export const SUPER_ADMIN: Role[] = [Role.super_admin];
