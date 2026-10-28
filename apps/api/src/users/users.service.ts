import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuditService } from '../audit/audit.service';
import { BCRYPT_ROUNDS } from '../auth/token-hash';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { paginated, skipTake } from '../common/pagination';
import { PUBLIC_USER_SELECT } from '../common/public-user';
import type { RequestMeta } from '../common/request-meta';
import { PrismaService } from '../prisma/prisma.service';
import type { ListUsersQueryDto } from './dto/admin-users.dto';
import type { UpdateMeDto } from './dto/update-me.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: PUBLIC_USER_SELECT });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  async updateMe(userId: string, dto: UpdateMeDto, meta: RequestMeta) {
    const { current_password, new_password, ...profile } = dto;
    const data: Prisma.UserUpdateInput = { ...profile };

    if (new_password) {
      const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
      if (user.password_hash) {
        if (!current_password || !(await bcrypt.compare(current_password, user.password_hash))) {
          throw new UnauthorizedException('Mot de passe actuel incorrect');
        }
      }
      data.password_hash = await bcrypt.hash(new_password, BCRYPT_ROUNDS);
    }

    const updated = await this.prisma.user.update({ where: { id: userId }, data, select: PUBLIC_USER_SELECT });
    await this.audit.log({
      actorId: userId,
      action: 'USER_PROFILE_UPDATED',
      resourceType: 'user',
      resourceId: userId,
      payload: { fields: Object.keys(profile), password_changed: Boolean(new_password) },
      meta,
    });
    return updated;
  }

  /** CRM : liste paginée avec recherche plein texte simple et nombre de réservations. */
  async list(query: ListUsersQueryDto) {
    const where: Prisma.UserWhereInput = {
      email: { not: { startsWith: 'deleted+' } },
      ...(query.role && { role: query.role }),
      ...(query.search && {
        OR: [
          { email: { contains: query.search, mode: 'insensitive' } },
          { first_name: { contains: query.search, mode: 'insensitive' } },
          { last_name: { contains: query.search, mode: 'insensitive' } },
          { phone: { contains: query.search } },
        ],
      }),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: { ...PUBLIC_USER_SELECT, _count: { select: { bookings: true } } },
        orderBy: { created_at: 'desc' },
        ...skipTake(query),
      }),
      this.prisma.user.count({ where }),
    ]);
    return paginated(data, total, query);
  }

  async findOne(id: string, viewer: AuthUser) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...PUBLIC_USER_SELECT,
        bookings: {
          select: { id: true, reference: true, status: true, departure_date: true, total_price: true, paid_amount: true, assigned_agent_id: true },
          orderBy: { created_at: 'desc' },
          take: 50,
        },
      },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    // Un agent ne consulte que les clients dont il gère au moins une réservation
    if (viewer.role === Role.agent && !user.bookings.some((b) => b.assigned_agent_id === viewer.id)) {
      throw new ForbiddenException('Client non assigné');
    }
    return user;
  }

  async updateRole(id: string, role: Role, actor: AuthUser, meta: RequestMeta) {
    if (id === actor.id) throw new BadRequestException('Impossible de modifier son propre rôle');
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('Utilisateur introuvable');

    const updated = await this.prisma.user.update({
      where: { id },
      // Révocation de la session : le nouveau rôle s'applique au prochain login
      data: { role, refresh_token_hash: null },
      select: PUBLIC_USER_SELECT,
    });
    await this.audit.log({
      actorId: actor.id,
      action: 'USER_ROLE_UPDATED',
      resourceType: 'user',
      resourceId: id,
      payload: { from: target.role, to: role },
      meta,
    });
    return updated;
  }

  /**
   * Suppression RGPD : les réservations, paiements et journaux d'audit doivent être conservés
   * (obligations comptables), donc le compte est anonymisé et rendu inutilisable.
   */
  async remove(id: string, actor: AuthUser, meta: RequestMeta) {
    if (id === actor.id) throw new BadRequestException('Impossible de supprimer son propre compte');
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('Utilisateur introuvable');

    await this.prisma.$transaction([
      this.prisma.notification.deleteMany({ where: { user_id: id } }),
      this.prisma.user.update({
        where: { id },
        data: {
          email: `deleted+${id}@deleted.carthagoloisirs.com`,
          password_hash: null,
          refresh_token_hash: null,
          first_name: 'Utilisateur',
          last_name: 'supprimé',
          phone: null,
          avatar_url: null,
          is_verified: false,
          role: Role.client,
        },
      }),
    ]);
    await this.audit.log({
      actorId: actor.id,
      action: 'USER_DELETED',
      resourceType: 'user',
      resourceId: id,
      payload: { email: target.email, role: target.role },
      meta,
    });
  }
}
