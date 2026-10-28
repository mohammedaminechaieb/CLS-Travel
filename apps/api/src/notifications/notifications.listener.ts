import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { BookingStatus, Role } from '@prisma/client';
import {
  EVENTS,
  type BookingAgentAssignedEvent,
  type BookingCreatedEvent,
  type BookingMessageEvent,
  type BookingStatusChangedEvent,
} from '../common/events/events';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { emailTemplates, type BookingMailData } from './email-templates';
import { NOTIFICATION_TYPES as T } from './notification-types';
import { NotificationsService } from './notifications.service';

/**
 * Traduit les événements de domaine en notifications in-app + emails Resend.
 * Exécuté en asynchrone : une erreur d'envoi n'affecte jamais la requête d'origine.
 */
@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  @OnEvent(EVENTS.bookingCreated, { async: true, promisify: true })
  async onBookingCreated({ bookingId }: BookingCreatedEvent) {
    await this.safely('booking.created', async () => {
      const b = await this.load(bookingId);
      if (!b) return;
      const payload = { booking_id: b.id, reference: b.reference, package: b.package.title_fr };
      await this.notifications.create(b.user_id, T.bookingCreated, payload);
      await this.notifications.notifyAdmins(T.newBooking, { ...payload, client: `${b.user.first_name} ${b.user.last_name}` });
      await this.mail.send({ to: b.user.email, ...emailTemplates.bookingCreated(this.mailData(b)) });
    });
  }

  @OnEvent(EVENTS.bookingStatusChanged, { async: true, promisify: true })
  async onStatusChanged({ bookingId, to }: BookingStatusChangedEvent) {
    await this.safely('booking.status_changed', async () => {
      const b = await this.load(bookingId);
      if (!b) return;
      const type = { confirmed: T.bookingConfirmed, cancelled: T.bookingCancelled, completed: T.bookingCompleted, pending: null }[to];
      if (!type) return;
      await this.notifications.create(b.user_id, type, { booking_id: b.id, reference: b.reference, status: to });

      const data = this.mailData(b);
      const tpl =
        to === BookingStatus.confirmed ? emailTemplates.bookingConfirmed(data) : emailTemplates.bookingStatus(data, to as 'cancelled' | 'completed');
      await this.mail.send({ to: b.user.email, ...tpl });
    });
  }

  @OnEvent(EVENTS.bookingAgentAssigned, { async: true, promisify: true })
  async onAgentAssigned({ bookingId, agentId }: BookingAgentAssignedEvent) {
    if (!agentId) return;
    await this.safely('booking.agent_assigned', async () => {
      const b = await this.load(bookingId);
      if (!b) return;
      await this.notifications.create(agentId, T.bookingAssigned, { booking_id: b.id, reference: b.reference, client: `${b.user.first_name} ${b.user.last_name}` });
    });
  }

  @OnEvent(EVENTS.bookingMessage, { async: true, promisify: true })
  async onMessage({ bookingId, senderId }: BookingMessageEvent) {
    await this.safely('booking.message', async () => {
      const b = await this.load(bookingId);
      if (!b) return;
      const sender = await this.prisma.user.findUnique({ where: { id: senderId }, select: { role: true, first_name: true } });
      const payload = { booking_id: b.id, reference: b.reference, from: sender?.first_name };

      if (sender?.role === Role.client) {
        // Client → agent assigné (ou managers à défaut)
        if (b.assigned_agent_id) await this.notifications.create(b.assigned_agent_id, T.newMessage, payload);
        else await this.notifications.notifyAdmins(T.newMessage, payload);
      } else {
        await this.notifications.create(b.user_id, T.newMessage, payload);
        await this.mail.send({ to: b.user.email, ...emailTemplates.newMessage(b.user.first_name, b.reference, this.bookingUrl(b.id)) });
      }
    });
  }

  // ---------------------------------------------------------------------------

  private load(bookingId: string) {
    return this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: { select: { email: true, first_name: true, last_name: true } },
        package: { select: { title_fr: true } },
      },
    });
  }

  private mailData(b: NonNullable<Awaited<ReturnType<NotificationsListener['load']>>>): BookingMailData {
    return {
      firstName: b.user.first_name,
      reference: b.reference,
      packageTitle: b.package.title_fr,
      departure: b.departure_date,
      returnDate: b.return_date,
      participants: Array.isArray(b.participants) ? b.participants.length : 1,
      total: b.total_price.toString(),
      paid: b.paid_amount.toString(),
      url: this.bookingUrl(b.id),
    };
  }

  private bookingUrl(id: string) {
    return `${this.config.get('appUrl')}/mes-reservations/${id}`;
  }

  private async safely(event: string, fn: () => Promise<void>) {
    try {
      await fn();
    } catch (err) {
      this.logger.error(`Notification handler ${event} failed: ${(err as Error).message}`);
    }
  }
}
