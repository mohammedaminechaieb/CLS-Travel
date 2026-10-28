import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { AuthUser } from '../decorators/current-user.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

interface AccessPayload {
  sub: string;
  email: string;
  role: AuthUser['role'];
  typ: 'access';
}

/** Guard global : exige un access token Bearer valide sauf sur les routes @Public(). */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    const req = ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const token = this.extractToken(req);

    if (!token) {
      if (isPublic) return true;
      throw new UnauthorizedException('Authentification requise');
    }

    try {
      const payload = await this.jwt.verifyAsync<AccessPayload>(token, {
        secret: this.config.get<string>('jwt.accessSecret'),
      });
      if (payload.typ !== 'access') throw new Error('wrong token type');
      req.user = { id: payload.sub, email: payload.email, role: payload.role };
      return true;
    } catch {
      // Sur une route publique, un token invalide est simplement ignoré
      if (isPublic) return true;
      throw new UnauthorizedException('Token invalide ou expiré');
    }
  }

  private extractToken(req: Request): string | undefined {
    const [type, value] = req.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' && value ? value : undefined;
  }
}
