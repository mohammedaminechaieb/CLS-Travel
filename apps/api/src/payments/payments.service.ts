import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BookingStatus, PaymentStatus, PaymentType, Prisma } from '@prisma/client';
import Stripe from 'stripe';
import { AuditService } from '../audit/audit.service';
import { BookingsService } from '../bookings/bookings.service';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { EVENTS, type BookingStatusChangedEvent, type PaymentEvent } from '../common/events/events';
import { paginated, PaginationQueryDto, skipTake } from '../common/pagination';
import type { RequestMeta } from '../common/request-meta';
import { PrismaService } from '../prisma/prisma.service';
import { computeAmountDue, toStripeMinorUnits } from './payment-amounts';
import { STRIPE } from './stripe.provider';

const PAYABLE_STATUSES: BookingStatus[] = [BookingStatus.pending, BookingStatus.confirmed];
/** Intents Stripe encore réutilisables (évite d'en créer un nouveau à chaque rechargement). */
const REUSABLE_INTENT_STATUSES: Stripe.PaymentIntent.Status[] = ['requires_payment_method', 'requires_confirmation', 'requires_action'];

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bookings: BookingsService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
    private readonly events: EventEmitter2,
    @Inject(STRIPE) private readonly stripe: Stripe | null,
  ) {}

  /**
   * Crée (ou réutilise) un PaymentIntent. Aucune donnée de carte ne transite par l'API :
   * Stripe Elements tokenise côté navigateur avec le client_secret renvoyé ici (PCI-DSS SAQ A).
   */
  async createIntent(bookingId: string, type: PaymentType, user: AuthUser, meta: RequestMeta) {
    const stripe = this.requireStripe();
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { package: { select: { title_fr: true } }, user: { select: { email: true } } },
    });
    if (!booking) throw new NotFoundException('Réservation introuvable');
    this.bookings.assertCanView(booking, user);
    if (!PAYABLE_STATUSES.includes(booking.status)) throw new BadRequestException('Cette réservation ne peut plus être réglée');

    const depositPercent = this.config.get<number>('stripe.depositPercent') ?? 30;
    const amountTnd = computeAmountDue(type, booking.total_price, booking.paid_amount, depositPercent);
    const currency = this.config.get<string>('stripe.currency') ?? 'eur';
    const rate = this.config.get<number>('stripe.tndExchangeRate') ?? 0.3;
    const minor = toStripeMinorUnits(amountTnd, rate);
    if (minor < 50) throw new BadRequestException('Montant trop faible pour un paiement en ligne');

    // Réutilisation d'un intent en attente pour le même montant
    const pending = await this.prisma.payment.findFirst({
      where: { booking_id: booking.id, payment_type: type, status: PaymentStatus.pending, amount_tnd: amountTnd },
      orderBy: { created_at: 'desc' },
    });
    if (pending) {
      const existing = await stripe.paymentIntents.retrieve(pending.stripe_payment_intent_id);
      if (REUSABLE_INTENT_STATUSES.includes(existing.status) && existing.amount === minor) {
        return this.intentResponse(existing, pending.id, amountTnd, type, currency, depositPercent);
      }
    }

    const intent = await stripe.paymentIntents.create(
      {
        amount: minor,
        currency,
        automatic_payment_methods: { enabled: true },
        receipt_email: booking.user.email,
        description: `${booking.reference} — ${booking.package.title_fr} (${type})`,
        metadata: {
          booking_id: booking.id,
          booking_reference: booking.reference,
          payment_type: type,
          amount_tnd: amountTnd.toFixed(3),
        },
      },
      // Clé d'idempotence : même réservation + type + état de paiement → même intent
      { idempotencyKey: `pi:${booking.id}:${type}:${booking.paid_amount.toFixed(3)}:${amountTnd.toFixed(3)}` },
    );

    const payment = await this.prisma.payment.upsert({
      where: { stripe_payment_intent_id: intent.id },
      update: {},
      create: {
        booking_id: booking.id,
        stripe_payment_intent_id: intent.id,
        amount: new Prisma.Decimal(minor).div(100),
        currency: currency.toUpperCase(),
        amount_tnd: amountTnd,
        payment_type: type,
      },
    });

    await this.audit.log({
      actorId: user.id,
      action: 'PAYMENT_INTENT_CREATED',
      resourceType: 'payment',
      resourceId: payment.id,
      payload: { booking: booking.reference, type, amount_tnd: amountTnd.toFixed(3) },
      meta,
    });
    return this.intentResponse(intent, payment.id, amountTnd, type, currency, depositPercent);
  }

  /** Webhook Stripe : signature vérifiée sur le corps brut, traitement idempotent par event.id. */
  async handleWebhook(rawBody: Buffer | undefined, signature: string | undefined) {
    const stripe = this.requireStripe();
    if (!rawBody || !signature) throw new BadRequestException('Signature Stripe manquante');

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, this.config.get<string>('stripe.webhookSecret')!);
    } catch (err) {
      this.logger.warn(`Invalid Stripe signature: ${(err as Error).message}`);
      throw new BadRequestException('Signature Stripe invalide');
    }

    const already = await this.prisma.stripeEvent.findUnique({ where: { id: event.id } });
    if (already) return { received: true, duplicate: true };

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.onSucceeded(event.id, event.type, event.data.object);
        break;
      case 'payment_intent.payment_failed':
      case 'payment_intent.canceled':
        await this.onFailed(event.id, event.type, event.data.object);
        break;
      case 'charge.refunded':
        await this.onRefunded(event.id, event.type, event.data.object);
        break;
      default:
        await this.markProcessed(this.prisma, event.id, event.type);
    }
    return { received: true };
  }

  async listForClient(userId: string, query: PaginationQueryDto) {
    const where = { booking: { user_id: userId } };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        include: { booking: { select: { id: true, reference: true, package: { select: { title_fr: true, title_ar: true, title_en: true } } } } },
        orderBy: { created_at: 'desc' },
        ...skipTake(query),
      }),
      this.prisma.payment.count({ where }),
    ]);
    return paginated(data, total, query);
  }

  async listAdmin(query: PaginationQueryDto & { status?: PaymentStatus }) {
    const where = query.status ? { status: query.status } : {};
    const [data, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        include: { booking: { select: { id: true, reference: true, user: { select: { email: true, first_name: true, last_name: true } } } } },
        orderBy: { created_at: 'desc' },
        ...skipTake(query),
      }),
      this.prisma.payment.count({ where }),
    ]);
    return paginated(data, total, query);
  }

  // ------------------------------ Webhook handlers ------------------------------

  private async onSucceeded(eventId: string, type: string, intent: Stripe.PaymentIntent) {
    const result = await this.prisma.$transaction(async (tx) => {
      if (!(await this.markProcessed(tx, eventId, type))) return null;
      const payment = await tx.payment.findUnique({ where: { stripe_payment_intent_id: intent.id } });
      if (!payment || payment.status === PaymentStatus.succeeded) return null;

      await tx.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.succeeded, paid_at: new Date() },
      });
      const booking = await tx.booking.update({
        where: { id: payment.booking_id },
        data: { paid_amount: { increment: payment.amount_tnd } },
      });
      // Le premier paiement (acompte ou total) confirme la réservation
      let statusChanged = false;
      if (booking.status === BookingStatus.pending) {
        await tx.booking.update({ where: { id: booking.id }, data: { status: BookingStatus.confirmed } });
        statusChanged = true;
      }
      return { payment, booking, statusChanged };
    });
    if (!result) return;

    const { payment, booking, statusChanged } = result;
    await this.audit.log({
      actorId: booking.user_id,
      action: 'PAYMENT_SUCCEEDED',
      resourceType: 'payment',
      resourceId: payment.id,
      payload: { booking: booking.reference, amount_tnd: payment.amount_tnd.toFixed(3), intent: intent.id },
    });
    this.events.emit(EVENTS.paymentSucceeded, this.paymentEvent(payment));
    if (statusChanged) {
      this.events.emit(EVENTS.bookingStatusChanged, {
        bookingId: booking.id,
        from: BookingStatus.pending,
        to: BookingStatus.confirmed,
        actorId: booking.user_id,
      } satisfies BookingStatusChangedEvent);
    }
  }

  private async onFailed(eventId: string, type: string, intent: Stripe.PaymentIntent) {
    const payment = await this.prisma.$transaction(async (tx) => {
      if (!(await this.markProcessed(tx, eventId, type))) return null;
      const p = await tx.payment.findUnique({ where: { stripe_payment_intent_id: intent.id }, include: { booking: true } });
      if (!p || p.status !== PaymentStatus.pending) return null;
      await tx.payment.update({ where: { id: p.id }, data: { status: PaymentStatus.failed } });
      return p;
    });
    if (!payment) return;
    await this.audit.log({
      actorId: payment.booking.user_id,
      action: 'PAYMENT_FAILED',
      resourceType: 'payment',
      resourceId: payment.id,
      payload: { reason: intent.last_payment_error?.code ?? type },
    });
    this.events.emit(EVENTS.paymentFailed, this.paymentEvent(payment));
  }

  private async onRefunded(eventId: string, type: string, charge: Stripe.Charge) {
    const intentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
    if (!intentId) return this.markProcessed(this.prisma, eventId, type);

    const payment = await this.prisma.$transaction(async (tx) => {
      if (!(await this.markProcessed(tx, eventId, type))) return null;
      const p = await tx.payment.findUnique({ where: { stripe_payment_intent_id: intentId }, include: { booking: true } });
      if (!p || p.status !== PaymentStatus.succeeded || !charge.refunded) return null; // remboursements partiels : traités manuellement
      await tx.payment.update({ where: { id: p.id }, data: { status: PaymentStatus.refunded } });
      const newPaid = Prisma.Decimal.max(p.booking.paid_amount.sub(p.amount_tnd), 0);
      await tx.booking.update({ where: { id: p.booking_id }, data: { paid_amount: newPaid } });
      return p;
    });
    if (!payment) return;
    await this.audit.log({
      actorId: payment.booking.user_id,
      action: 'PAYMENT_REFUNDED',
      resourceType: 'payment',
      resourceId: payment.id,
      payload: { amount_tnd: payment.amount_tnd.toFixed(3) },
    });
  }

  /** Insère l'event.id ; renvoie false s'il a déjà été traité (course entre deux livraisons). */
  private async markProcessed(client: Prisma.TransactionClient, id: string, type: string): Promise<boolean> {
    const inserted = await client.$executeRaw`
      INSERT INTO stripe_events (id, type) VALUES (${id}, ${type}) ON CONFLICT (id) DO NOTHING`;
    return inserted === 1;
  }

  private paymentEvent(p: { id: string; booking_id: string; amount: Prisma.Decimal; currency: string; payment_type: PaymentType }): PaymentEvent {
    return { bookingId: p.booking_id, paymentId: p.id, amount: p.amount.toFixed(2), currency: p.currency, type: p.payment_type };
  }

  private intentResponse(
    intent: Stripe.PaymentIntent,
    paymentId: string,
    amountTnd: Prisma.Decimal,
    type: PaymentType,
    currency: string,
    depositPercent: number,
  ) {
    return {
      payment_id: paymentId,
      client_secret: intent.client_secret,
      payment_type: type,
      amount_tnd: amountTnd.toFixed(3),
      amount_charged: (intent.amount / 100).toFixed(2),
      currency: currency.toUpperCase(),
      deposit_percent: depositPercent,
    };
  }

  private requireStripe(): Stripe {
    if (!this.stripe) throw new ServiceUnavailableException('Le paiement en ligne est momentanément indisponible');
    return this.stripe;
  }
}
