import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { RequestMeta } from '../common/request-meta';
import { PrismaService } from '../prisma/prisma.service';

export type AuditAction =
  | 'USER_REGISTERED'
  | 'USER_LOGIN'
  | 'USER_LOGIN_FAILED'
  | 'USER_LOGOUT'
  | 'USER_EMAIL_VERIFIED'
  | 'USER_PASSWORD_RESET'
  | 'USER_PROFILE_UPDATED'
  | 'USER_ROLE_UPDATED'
  | 'USER_DELETED'
  | 'PACKAGE_CREATED'
  | 'PACKAGE_UPDATED'
  | 'PACKAGE_DELETED'
  | 'DESTINATION_CREATED'
  | 'DESTINATION_UPDATED'
  | 'BOOKING_CREATED'
  | 'BOOKING_STATUS_CHANGED'
  | 'BOOKING_AGENT_ASSIGNED'
  | 'PAYMENT_INTENT_CREATED'
  | 'PAYMENT_SUCCEEDED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_REFUNDED'
  | 'REVIEW_APPROVED'
  | 'BLOG_POST_CREATED'
  | 'BLOG_POST_UPDATED'
  | 'BLOG_POST_DELETED'
  | 'PROMO_CREATED'
  | 'PROMO_UPDATED'
  | 'MEDIA_UPLOADED';

export interface AuditEntry {
  actorId: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string | null;
  payload?: Record<string, unknown>;
  meta?: RequestMeta;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Enregistre une action sensible. Ne fait jamais échouer la requête appelante. */
  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actor_id: entry.actorId,
          action: entry.action,
          resource_type: entry.resourceType,
          resource_id: entry.resourceId ?? null,
          payload: (entry.payload as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          ip: entry.meta?.ip ?? null,
          user_agent: entry.meta?.userAgent ?? null,
        },
      });
    } catch (err) {
      this.logger.error(`Audit log failed for ${entry.action}: ${(err as Error).message}`);
    }
  }
}
