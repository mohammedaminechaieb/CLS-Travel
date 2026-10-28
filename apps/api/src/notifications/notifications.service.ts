import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { paginated, PaginationQueryDto, skipTake } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';
import type { NotificationType } from './notification-types';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, type: NotificationType, payload: Record<string, unknown>) {
    return this.prisma.notification.create({
      data: { user_id: userId, type, payload: payload as Prisma.InputJsonValue },
    });
  }

  /** Diffuse une notification à tous les managers / super admins. */
  async notifyAdmins(type: NotificationType, payload: Record<string, unknown>) {
    const admins = await this.prisma.user.findMany({
      where: { role: { in: [Role.super_admin, Role.manager] } },
      select: { id: true },
    });
    if (admins.length === 0) return;
    await this.prisma.notification.createMany({
      data: admins.map((a) => ({ user_id: a.id, type, payload: payload as Prisma.InputJsonValue })),
    });
  }

  async list(userId: string, query: PaginationQueryDto & { unread?: boolean }) {
    const where = { user_id: userId, ...(query.unread && { is_read: false }) };
    const [data, total, unread] = await this.prisma.$transaction([
      this.prisma.notification.findMany({ where, orderBy: { created_at: 'desc' }, ...skipTake(query) }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { user_id: userId, is_read: false } }),
    ]);
    return { ...paginated(data, total, query), unread };
  }

  async markRead(id: string, userId: string) {
    const { count } = await this.prisma.notification.updateMany({ where: { id, user_id: userId }, data: { is_read: true } });
    if (count === 0) throw new NotFoundException('Notification introuvable');
    return { id, is_read: true };
  }

  async markAllRead(userId: string) {
    const { count } = await this.prisma.notification.updateMany({ where: { user_id: userId, is_read: false }, data: { is_read: true } });
    return { updated: count };
  }
}
