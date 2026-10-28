import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BookingStatus, PackageStatus, Prisma, Role } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { EVENTS, type BookingAgentAssignedEvent, type BookingMessageEvent, type BookingStatusChangedEvent } from '../common/events/events';
import { paginated, PaginationQueryDto, skipTake } from '../common/pagination';
import type { RequestMeta } from '../common/request-meta';
import { PackagesService } from '../packages/packages.service';
import { PrismaService } from '../prisma/prisma.service';
import { nextBookingReference } from './booking-reference';
import { canTransitionBooking } from './booking-status';
import type { AdminBookingQueryDto, CreateBookingDto } from './dto/booking.dto';

const STAFF_ROLES: Role[] = [Role.super_admin, Role.manager, Role.agent];
const ADMIN_ROLES: Role[] = [Role.super_admin, Role.manager];
const DAY_MS = 86_400_000;

const PACKAGE_SUMMARY = {
  select: {
    id: true,
    slug: true,
    title_fr: true,
    title_ar: true,
    title_en: true,
    category: true,
    duration_days: true,
    gallery_urls: true,
    base_price: true,
    destination: { select: { id: true, name_fr: true, name_ar: true, name_en: true, country: true } },
  },
} as const;

const PERSON = { select: { id: true, email: true, first_name: true, last_name: true, phone: true, avatar_url: true, role: true } } as const;

/** Hook optionnel appliqué au prix avant création (ex. code promo). */
export interface PriceAdjustment {
  discount: Prisma.Decimal;
  promoCodeId: string | null;
}

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly packages: PackagesService,
    private readonly audit: AuditService,
    private readonly events: EventEmitter2,
  ) {}

  // ------------------------------- Client -------------------------------

  async create(
    dto: CreateBookingDto,
    user: AuthUser,
    meta: RequestMeta,
    adjust?: (pkgId: string, subtotal: Prisma.Decimal, tx: Prisma.TransactionClient) => Promise<PriceAdjustment>,
  ) {
    const pkg = await this.prisma.package.findUnique({ where: { id: dto.package_id } });
    if (!pkg || pkg.status !== PackageStatus.published) throw new BadRequestException('Ce voyage n’est pas réservable');

    const departure = new Date(`${dto.departure_date.slice(0, 10)}T00:00:00.000Z`);
    if (departure.getTime() < Date.now() + DAY_MS) {
      throw new BadRequestException('La date de départ doit être au moins demain');
    }
    const returnDate = new Date(departure.getTime() + (pkg.duration_days - 1) * DAY_MS);

    for (const p of dto.participants) {
      if (new Date(p.dob).getTime() >= Date.now()) throw new BadRequestException('Date de naissance invalide');
    }

    const subtotal = new Prisma.Decimal(pkg.base_price).mul(dto.participants.length);

    const booking = await this.prisma.$transaction(async (tx) => {
      // Verrou sur l'offre : sérialise les réservations concurrentes pour le contrôle de capacité
      await tx.$queryRaw`SELECT id FROM packages WHERE id = ${pkg.id}::uuid FOR UPDATE`;
      const remaining = await this.packages.remainingCapacity(pkg.id, departure, pkg.max_capacity, tx);
      if (dto.participants.length > remaining) {
        throw new BadRequestException(`Plus que ${remaining} place(s) disponible(s) pour ce départ`);
      }

      const adjustment = adjust ? await adjust(pkg.id, subtotal, tx) : { discount: new Prisma.Decimal(0), promoCodeId: null };
      const discount = Prisma.Decimal.min(adjustment.discount, subtotal);
      return tx.booking.create({
        data: {
          reference: await nextBookingReference(tx),
          user_id: user.id,
          package_id: pkg.id,
          departure_date: departure,
          return_date: returnDate,
          participants: dto.participants as unknown as Prisma.InputJsonValue,
          total_price: subtotal.sub(discount),
          discount_amount: discount,
          promo_code_id: adjustment.promoCodeId,
        },
        include: { package: PACKAGE_SUMMARY },
      });
    });

    await this.audit.log({
      actorId: user.id,
      action: 'BOOKING_CREATED',
      resourceType: 'booking',
      resourceId: booking.id,
      payload: { reference: booking.reference, total: booking.total_price.toString() },
      meta,
    });
    this.events.emit(EVENTS.bookingCreated, { bookingId: booking.id });
    return booking;
  }

  async listForClient(userId: string, query: PaginationQueryDto) {
    const where = { user_id: userId };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where,
        omit: { notes_internal: true },
        include: {
          package: PACKAGE_SUMMARY,
          assigned_agent: { select: { id: true, first_name: true, last_name: true, avatar_url: true } },
          _count: { select: { messages: { where: { is_read: false, sender_id: { not: userId } } } } },
        },
        orderBy: { departure_date: 'desc' },
        ...skipTake(query),
      }),
      this.prisma.booking.count({ where }),
    ]);
    return paginated(data, total, query);
  }

  /** Client propriétaire, agent assigné ou admin. Les notes internes restent réservées au staff. */
  async findOne(id: string, viewer: AuthUser) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        package: PACKAGE_SUMMARY,
        user: PERSON,
        assigned_agent: PERSON,
        payments: { orderBy: { created_at: 'desc' } },
        reviews: true,
        promo_code: { select: { code: true, discount_type: true, value: true } },
      },
    });
    if (!booking) throw new NotFoundException('Réservation introuvable');
    this.assertCanView(booking, viewer);

    if (!STAFF_ROLES.includes(viewer.role)) {
      const { notes_internal: _n, ...rest } = booking;
      return rest;
    }
    return booking;
  }

  async cancelByClient(id: string, user: AuthUser, meta: RequestMeta) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking || booking.user_id !== user.id) throw new NotFoundException('Réservation introuvable');
    if (booking.status !== BookingStatus.pending || !booking.paid_amount.isZero()) {
      throw new BadRequestException('Seule une réservation en attente et non payée peut être annulée en ligne. Contactez votre agent.');
    }
    return this.applyStatus(booking.id, booking.status, BookingStatus.cancelled, user.id, meta, 'Annulée par le client');
  }

  // ------------------------------- Staff --------------------------------

  async listAdmin(query: AdminBookingQueryDto, viewer: AuthUser) {
    const where: Prisma.BookingWhereInput = {
      ...(viewer.role === Role.agent && { assigned_agent_id: viewer.id }),
      ...(query.status && { status: query.status }),
      ...(query.package_id && { package_id: query.package_id }),
      ...(query.agent_id && viewer.role !== Role.agent && { assigned_agent_id: query.agent_id }),
      ...((query.from || query.to) && {
        departure_date: { gte: query.from ? new Date(query.from) : undefined, lte: query.to ? new Date(query.to) : undefined },
      }),
      ...(query.search && {
        OR: [
          { reference: { contains: query.search, mode: 'insensitive' } },
          { user: { email: { contains: query.search, mode: 'insensitive' } } },
          { user: { last_name: { contains: query.search, mode: 'insensitive' } } },
          { user: { first_name: { contains: query.search, mode: 'insensitive' } } },
        ],
      }),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where,
        include: {
          package: { select: { id: true, slug: true, title_fr: true, category: true } },
          user: PERSON,
          assigned_agent: { select: { id: true, first_name: true, last_name: true } },
        },
        orderBy: { created_at: 'desc' },
        ...skipTake(query),
      }),
      this.prisma.booking.count({ where }),
    ]);
    return paginated(data, total, query);
  }

  async updateStatus(id: string, to: BookingStatus, actor: AuthUser, meta: RequestMeta, reason?: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Réservation introuvable');
    if (!canTransitionBooking(booking.status, to)) {
      throw new BadRequestException(`Transition interdite : ${booking.status} → ${to}`);
    }
    return this.applyStatus(id, booking.status, to, actor.id, meta, reason);
  }

  async assignAgent(id: string, agentId: string | null, actor: AuthUser, meta: RequestMeta) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Réservation introuvable');
    if (agentId) {
      const agent = await this.prisma.user.findUnique({ where: { id: agentId } });
      if (!agent || !STAFF_ROLES.includes(agent.role)) throw new BadRequestException('L’utilisateur choisi n’est pas un agent');
    }
    const updated = await this.prisma.booking.update({
      where: { id },
      data: { assigned_agent_id: agentId },
      include: { assigned_agent: PERSON },
    });
    await this.audit.log({
      actorId: actor.id,
      action: 'BOOKING_AGENT_ASSIGNED',
      resourceType: 'booking',
      resourceId: id,
      payload: { from: booking.assigned_agent_id, to: agentId },
      meta,
    });
    this.events.emit(EVENTS.bookingAgentAssigned, { bookingId: id, agentId } satisfies BookingAgentAssignedEvent);
    return updated;
  }

  async updateNotes(id: string, notes: string, viewer: AuthUser) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Réservation introuvable');
    this.assertCanView(booking, viewer);
    return this.prisma.booking.update({ where: { id }, data: { notes_internal: notes }, select: { id: true, notes_internal: true } });
  }

  // ------------------------------ Messages ------------------------------

  async listMessages(bookingId: string, viewer: AuthUser) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Réservation introuvable');
    this.assertCanView(booking, viewer);

    const [messages] = await this.prisma.$transaction([
      this.prisma.message.findMany({
        where: { booking_id: bookingId },
        include: { sender: { select: { id: true, first_name: true, last_name: true, role: true, avatar_url: true } } },
        orderBy: { created_at: 'asc' },
        take: 500,
      }),
      this.prisma.message.updateMany({
        where: { booking_id: bookingId, sender_id: { not: viewer.id }, is_read: false },
        data: { is_read: true },
      }),
    ]);
    return messages;
  }

  async postMessage(bookingId: string, body: string, viewer: AuthUser) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Réservation introuvable');
    this.assertCanView(booking, viewer);

    const message = await this.prisma.message.create({
      data: { booking_id: bookingId, sender_id: viewer.id, body },
      include: { sender: { select: { id: true, first_name: true, last_name: true, role: true, avatar_url: true } } },
    });
    this.events.emit(EVENTS.bookingMessage, { bookingId, messageId: message.id, senderId: viewer.id } satisfies BookingMessageEvent);
    return message;
  }

  // ------------------------------ Helpers -------------------------------

  private async applyStatus(id: string, from: BookingStatus, to: BookingStatus, actorId: string, meta: RequestMeta, reason?: string) {
    const updated = await this.prisma.booking.update({ where: { id }, data: { status: to }, include: { package: PACKAGE_SUMMARY } });
    await this.audit.log({
      actorId,
      action: 'BOOKING_STATUS_CHANGED',
      resourceType: 'booking',
      resourceId: id,
      payload: { from, to, reason },
      meta,
    });
    this.events.emit(EVENTS.bookingStatusChanged, { bookingId: id, from, to, actorId } satisfies BookingStatusChangedEvent);
    return updated;
  }

  assertCanView(booking: { user_id: string; assigned_agent_id: string | null }, viewer: AuthUser) {
    if (ADMIN_ROLES.includes(viewer.role)) return;
    if (viewer.role === Role.agent && booking.assigned_agent_id === viewer.id) return;
    if (booking.user_id === viewer.id) return;
    throw new ForbiddenException('Accès à cette réservation refusé');
  }
}
