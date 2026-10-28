import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import type Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS } from '../redis/redis.module';
import { resolveRange, type Period, type RangeQueryDto } from './analytics.dto';

const CACHE_TTL_SECONDS = 60;
const round = (n: number, d = 3) => Math.round(n * 10 ** d) / 10 ** d;
const pct = (num: number, den: number) => (den === 0 ? 0 : round((num / den) * 100, 1));

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  /** Chiffre d'affaires encaissé (paiements réussis, contre-valeur TND) par période. */
  revenue(query: RangeQueryDto & { period: Period }) {
    const { from, to } = this.range(query);
    return this.cached(`revenue:${query.period}:${from.toISOString()}:${to.toISOString()}`, async () => {
      const rows = await this.prisma.$queryRaw<{ bucket: Date; revenue: number; payments: number }[]>`
        SELECT date_trunc(${query.period}, paid_at) AS bucket,
               COALESCE(SUM(amount_tnd), 0)::float AS revenue,
               COUNT(*)::int AS payments
        FROM payments
        WHERE status = 'succeeded' AND paid_at BETWEEN ${from} AND ${to}
        GROUP BY bucket ORDER BY bucket`;
      const total = rows.reduce((s, r) => s + r.revenue, 0);
      return {
        period: query.period,
        from,
        to,
        total: round(total),
        series: rows.map((r) => ({ period: r.bucket, revenue: round(r.revenue), payments: r.payments })),
      };
    });
  }

  /** Réservations par statut + évolution mensuelle. */
  bookings(query: RangeQueryDto) {
    const { from, to } = this.range(query);
    return this.cached(`bookings:${from.toISOString()}:${to.toISOString()}`, async () => {
      const [byStatus, series] = await Promise.all([
        this.prisma.booking.groupBy({ by: ['status'], where: { created_at: { gte: from, lte: to } }, _count: { _all: true } }),
        this.prisma.$queryRaw<{ bucket: Date; status: BookingStatus; count: number }[]>`
          SELECT date_trunc('month', created_at) AS bucket, status, COUNT(*)::int AS count
          FROM bookings WHERE created_at BETWEEN ${from} AND ${to}
          GROUP BY bucket, status ORDER BY bucket`,
      ]);
      const counts = Object.fromEntries(Object.values(BookingStatus).map((s) => [s, 0])) as Record<BookingStatus, number>;
      for (const row of byStatus) counts[row.status] = row._count._all;

      const months = new Map<string, Record<BookingStatus, number>>();
      for (const r of series) {
        const key = r.bucket.toISOString();
        const entry = months.get(key) ?? (Object.fromEntries(Object.values(BookingStatus).map((s) => [s, 0])) as Record<BookingStatus, number>);
        entry[r.status] = r.count;
        months.set(key, entry);
      }
      return {
        from,
        to,
        total: Object.values(counts).reduce((a, b) => a + b, 0),
        by_status: counts,
        series: [...months.entries()].map(([period, c]) => ({ period, ...c })),
      };
    });
  }

  /** Offres les plus vendues (hors annulations) : réservations, voyageurs, CA réservé et encaissé. */
  topPackages(query: RangeQueryDto & { limit: number }) {
    const { from, to } = this.range(query);
    return this.cached(`top:${query.limit}:${from.toISOString()}:${to.toISOString()}`, async () => {
      const rows = await this.prisma.$queryRaw<
        { id: string; slug: string; title_fr: string; category: string; bookings: number; travelers: number; booked: number; collected: number }[]
      >`
        SELECT p.id::text, p.slug, p.title_fr, p.category::text,
               COUNT(b.id)::int AS bookings,
               COALESCE(SUM(jsonb_array_length(b.participants)), 0)::int AS travelers,
               COALESCE(SUM(b.total_price), 0)::float AS booked,
               COALESCE(SUM(b.paid_amount), 0)::float AS collected
        FROM bookings b JOIN packages p ON p.id = b.package_id
        WHERE b.status <> 'cancelled' AND b.created_at BETWEEN ${from} AND ${to}
        GROUP BY p.id ORDER BY booked DESC, bookings DESC
        LIMIT ${query.limit}`;
      return rows.map((r) => ({ ...r, booked: round(r.booked), collected: round(r.collected) }));
    });
  }

  /**
   * Entonnoir de conversion : inscrits → clients ayant réservé → réservations payées.
   * (Le trafic visiteurs relève de l'outil d'analytics web, pas de la base.)
   */
  conversion(query: RangeQueryDto) {
    const { from, to } = this.range(query);
    return this.cached(`conversion:${from.toISOString()}:${to.toISOString()}`, async () => {
      const range = { gte: from, lte: to };
      const [registered, bookers, created, paid, cancelled] = await Promise.all([
        this.prisma.user.count({ where: { role: 'client', created_at: range } }),
        this.prisma.user.count({ where: { role: 'client', created_at: range, bookings: { some: {} } } }),
        this.prisma.booking.count({ where: { created_at: range } }),
        this.prisma.booking.count({ where: { created_at: range, paid_amount: { gt: 0 } } }),
        this.prisma.booking.count({ where: { created_at: range, status: BookingStatus.cancelled } }),
      ]);
      return {
        from,
        to,
        registered_users: registered,
        users_with_booking: bookers,
        bookings_created: created,
        bookings_paid: paid,
        bookings_cancelled: cancelled,
        signup_to_booking_rate: pct(bookers, registered),
        booking_to_payment_rate: pct(paid, created),
        cancellation_rate: pct(cancelled, created),
      };
    });
  }

  /** KPI du tableau de bord : mois en cours vs mois précédent. */
  overview() {
    return this.cached('overview', async () => {
      const now = new Date();
      const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const prevStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));

      const revenueBetween = async (gte: Date, lt: Date) =>
        Number((await this.prisma.payment.aggregate({ where: { status: 'succeeded', paid_at: { gte, lt } }, _sum: { amount_tnd: true } }))._sum.amount_tnd ?? 0);

      const [revenue, prevRevenue, bookings, prevBookings, pending, upcoming, outstanding, avgBasket] = await Promise.all([
        revenueBetween(monthStart, now),
        revenueBetween(prevStart, monthStart),
        this.prisma.booking.count({ where: { created_at: { gte: monthStart } } }),
        this.prisma.booking.count({ where: { created_at: { gte: prevStart, lt: monthStart } } }),
        this.prisma.booking.count({ where: { status: BookingStatus.pending } }),
        this.prisma.booking.count({ where: { status: BookingStatus.confirmed, departure_date: { gte: now } } }),
        this.prisma.$queryRaw<{ v: number }[]>`
          SELECT COALESCE(SUM(total_price - paid_amount), 0)::float AS v FROM bookings WHERE status IN ('pending', 'confirmed')`,
        this.prisma.booking.aggregate({ where: { status: { not: BookingStatus.cancelled } }, _avg: { total_price: true } }),
      ]);
      const growth = (cur: number, prev: number) => (prev === 0 ? null : round(((cur - prev) / prev) * 100, 1));
      return {
        revenue_month: round(revenue),
        revenue_growth: growth(revenue, prevRevenue),
        bookings_month: bookings,
        bookings_growth: growth(bookings, prevBookings),
        pending_bookings: pending,
        upcoming_departures: upcoming,
        outstanding_balance: round(outstanding[0]?.v ?? 0),
        average_basket: round(Number(avgBasket._avg.total_price ?? 0)),
      };
    });
  }

  private range(q: RangeQueryDto) {
    const r = resolveRange(q);
    if (r.from > r.to) throw new BadRequestException('La date de début doit précéder la date de fin');
    return r;
  }

  /** Cache Redis court : les tableaux de bord sont consultés souvent mais tolèrent 60 s de retard. */
  private async cached<T>(key: string, compute: () => Promise<T>): Promise<T> {
    const fullKey = `analytics:${key}`;
    try {
      const hit = await this.redis.get(fullKey);
      if (hit) return JSON.parse(hit) as T;
    } catch {
      /* Redis indisponible : on calcule directement */
    }
    const value = await compute();
    this.redis.set(fullKey, JSON.stringify(value), 'EX', CACHE_TTL_SECONDS).catch(() => undefined);
    return value;
  }
}
