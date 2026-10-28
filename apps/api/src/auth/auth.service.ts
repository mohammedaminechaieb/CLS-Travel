import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { toPublicUser, type PublicUser } from '../common/public-user';
import type { RequestMeta } from '../common/request-meta';
import { escapeHtml, mailLayout } from '../mail/mail.layout';
import { MailService } from '../mail/mail.service';
import { MemoryStore } from '../cache/memory-store';
import { PrismaService } from '../prisma/prisma.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import { BCRYPT_ROUNDS, compareToken, hashToken, sha256 } from './token-hash';

type Expiry = JwtSignOptions['expiresIn'];

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends AuthTokens {
  user: PublicUser;
}

const RESET_TTL_SECONDS = 60 * 60; // 1 h
const resetKey = (hash: string) => `auth:reset:${hash}`;

@Injectable()
export class AuthService {
  // Hash factice : comparaison à temps constant même si l'email n'existe pas
  private readonly dummyHash = bcrypt.hashSync('timing-attack-mitigation', BCRYPT_ROUNDS);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    private readonly audit: AuditService,
    private readonly store: MemoryStore,
  ) {}

  async register(dto: RegisterDto, meta: RequestMeta): Promise<AuthResult> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Un compte existe déjà avec cet email');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password_hash: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
        first_name: dto.first_name,
        last_name: dto.last_name,
        phone: dto.phone,
      },
    });

    await this.audit.log({ actorId: user.id, action: 'USER_REGISTERED', resourceType: 'user', resourceId: user.id, meta });
    await this.sendVerificationEmail(user);
    return this.issueSession(user);
  }

  async login(dto: LoginDto, meta: RequestMeta): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    const valid = await bcrypt.compare(dto.password, user?.password_hash ?? this.dummyHash);

    if (!user || !user.password_hash || !valid) {
      if (user) {
        await this.audit.log({ actorId: user.id, action: 'USER_LOGIN_FAILED', resourceType: 'user', resourceId: user.id, meta });
      }
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    await this.audit.log({ actorId: user.id, action: 'USER_LOGIN', resourceType: 'user', resourceId: user.id, meta });
    return this.issueSession(user);
  }

  /** Rotation : un refresh token n'est utilisable qu'une seule fois. */
  async refresh(refreshToken: string | undefined): Promise<AuthResult> {
    if (!refreshToken) throw new UnauthorizedException('Session expirée');

    let payload: { sub: string; typ: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Session expirée');
    }
    if (payload.typ !== 'refresh') throw new UnauthorizedException('Session expirée');

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user?.refresh_token_hash || !(await compareToken(refreshToken, user.refresh_token_hash))) {
      // Réutilisation d'un ancien token → on révoque toute session (vol probable)
      if (user) {
        await this.prisma.user.update({ where: { id: user.id }, data: { refresh_token_hash: null } });
      }
      throw new UnauthorizedException('Session expirée');
    }

    return this.issueSession(user);
  }

  async logout(userId: string, meta: RequestMeta): Promise<void> {
    await this.prisma.user.updateMany({ where: { id: userId }, data: { refresh_token_hash: null } });
    await this.audit.log({ actorId: userId, action: 'USER_LOGOUT', resourceType: 'user', resourceId: userId, meta });
  }

  async verifyEmail(token: string, meta: RequestMeta): Promise<PublicUser> {
    let payload: { sub: string; typ: string; email: string };
    try {
      payload = await this.jwt.verifyAsync(token, { secret: this.verifySecret() });
    } catch {
      throw new BadRequestException('Lien de vérification invalide ou expiré');
    }
    if (payload.typ !== 'verify-email') throw new BadRequestException('Lien de vérification invalide');

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.email !== payload.email) throw new BadRequestException('Lien de vérification invalide');
    if (user.is_verified) return toPublicUser(user);

    const updated = await this.prisma.user.update({ where: { id: user.id }, data: { is_verified: true } });
    await this.audit.log({ actorId: user.id, action: 'USER_EMAIL_VERIFIED', resourceType: 'user', resourceId: user.id, meta });
    return toPublicUser(updated);
  }

  async resendVerification(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user && !user.is_verified) await this.sendVerificationEmail(user);
  }

  /** Réponse identique que l'email existe ou non (pas d'énumération de comptes). */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return;

    const token = randomBytes(32).toString('hex');
    // En mémoire : un redémarrage de l'API invalide les liens en cours (l'utilisateur en redemande un)
    this.store.set(resetKey(sha256(token)), user.id, RESET_TTL_SECONDS);

    const url = `${this.config.get('appUrl')}/reset-password?token=${token}`;
    await this.mail.send({
      to: user.email,
      subject: 'Réinitialisation de votre mot de passe — CLS Travel',
      html: mailLayout(
        'Réinitialiser votre mot de passe',
        `<p>Bonjour ${escapeHtml(user.first_name)},</p><p>Vous avez demandé à réinitialiser votre mot de passe. Ce lien est valable 1 heure.</p><p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`,
        { label: 'Choisir un nouveau mot de passe', url },
      ),
      text: `Réinitialisez votre mot de passe : ${url}`,
    });
  }

  async resetPassword(token: string, password: string, meta: RequestMeta): Promise<void> {
    const key = resetKey(sha256(token));
    // GETDEL : le token est à usage unique
    const userId = this.store.getdel(key);
    if (!userId) throw new BadRequestException('Lien de réinitialisation invalide ou expiré');

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password_hash: await bcrypt.hash(password, BCRYPT_ROUNDS),
        refresh_token_hash: null, // déconnecte toutes les sessions
        is_verified: true, // l'accès à la boîte mail prouve sa possession
      },
    });
    await this.audit.log({ actorId: userId, action: 'USER_PASSWORD_RESET', resourceType: 'user', resourceId: userId, meta });
  }

  // ---------------------------------------------------------------------------

  private async issueSession(user: User): Promise<AuthResult> {
    const tokens = await this.signTokens(user);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refresh_token_hash: await hashToken(tokens.refreshToken) },
    });
    return { ...tokens, user: toPublicUser(user) };
  }

  private async signTokens(user: User): Promise<AuthTokens> {
    const jwtCfg = this.config.get('jwt');
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: user.id, email: user.email, role: user.role, typ: 'access' },
        { secret: jwtCfg.accessSecret, expiresIn: jwtCfg.accessExpiry as Expiry },
      ),
      this.jwt.signAsync(
        // jti aléatoire : chaque refresh token est unique
        { sub: user.id, typ: 'refresh', jti: randomBytes(16).toString('hex') },
        { secret: jwtCfg.refreshSecret, expiresIn: jwtCfg.refreshExpiry as Expiry },
      ),
    ]);
    return { accessToken, refreshToken };
  }

  private verifySecret(): string {
    // Secret dérivé : un token de vérification ne peut pas servir d'access token
    return `${this.config.get<string>('jwt.accessSecret')}:verify-email`;
  }

  private async sendVerificationEmail(user: User): Promise<void> {
    const token = await this.jwt.signAsync(
      { sub: user.id, email: user.email, typ: 'verify-email' },
      { secret: this.verifySecret(), expiresIn: '24h' },
    );
    const url = `${this.config.get('appUrl')}/verify-email?token=${token}`;
    await this.mail.send({
      to: user.email,
      subject: 'Confirmez votre adresse email — CLS Travel',
      html: mailLayout(
        `Bienvenue ${escapeHtml(user.first_name)} !`,
        '<p>Merci pour votre inscription chez CLS Travel. Confirmez votre adresse email pour finaliser votre compte (lien valable 24 h).</p>',
        { label: 'Confirmer mon email', url },
      ),
      text: `Confirmez votre email : ${url}`,
    });
  }
}
