import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@prisma/client';
import type { AuthUser } from '../decorators/current-user.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

/** Guard global exécuté après JwtAuthGuard : compare le rôle du JWT aux @Roles() de la route. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const targets = [ctx.getHandler(), ctx.getClass()];
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, targets);
    if (!roles || roles.length === 0) return true;

    const user = ctx.switchToHttp().getRequest().user as AuthUser | undefined;
    if (!user) {
      // Route publique sans @Roles explicite : déjà gérée ; sinon refus
      if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) return true;
      throw new ForbiddenException('Accès refusé');
    }
    if (!roles.includes(user.role)) throw new ForbiddenException('Permissions insuffisantes');
    return true;
  }
}
