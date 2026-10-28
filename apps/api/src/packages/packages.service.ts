import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, PackageStatus, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { paginated, skipTake } from '../common/pagination';
import type { RequestMeta } from '../common/request-meta';
import { uniqueSlug } from '../common/slug';
import { PrismaService } from '../prisma/prisma.service';
import type { CreatePackageDto, UpdatePackageDto } from './dto/package.dto';
import type { AdminPackageQueryDto, PackageQueryDto, PackageSort } from './dto/package-query.dto';
import { canTransitionPackage } from './package-status';

const DESTINATION_SELECT = { id: true, name_fr: true, name_ar: true, name_en: true, country: true, region: true } as const;

const ORDER_BY: Record<PackageSort, Prisma.PackageOrderByWithRelationInput[]> = {
  newest: [{ featured: 'desc' }, { created_at: 'desc' }],
  price_asc: [{ base_price: 'asc' }],
  price_desc: [{ base_price: 'desc' }],
  duration_asc: [{ duration_days: 'asc' }],
  duration_desc: [{ duration_days: 'desc' }],
};

export interface RatingSummary {
  average: number | null;
  count: number;
}

@Injectable()
export class PackagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ------------------------------- Public -------------------------------

  async listPublic(query: PackageQueryDto) {
    return this.list(query, { status: PackageStatus.published });
  }

  async findPublicBySlug(slug: string) {
    const pkg = await this.prisma.package.findFirst({
      where: { slug, status: PackageStatus.published },
      include: { destination: true },
    });
    if (!pkg) throw new NotFoundException('Voyage introuvable');
    const ratings = await this.ratingsFor([pkg.id]);
    return { ...pkg, rating: ratings.get(pkg.id) ?? { average: null, count: 0 } };
  }

  /** Bornes du catalogue pour initialiser les filtres (prix, durée). */
  async facets() {
    const where = { status: PackageStatus.published };
    const [agg, categories] = await this.prisma.$transaction([
      this.prisma.package.aggregate({
        where,
        _min: { base_price: true, duration_days: true },
        _max: { base_price: true, duration_days: true },
      }),
      this.prisma.package.groupBy({ by: ['category'], where, _count: { _all: true }, orderBy: { category: 'asc' } }),
    ]);
    return {
      price: { min: Number(agg._min.base_price ?? 0), max: Number(agg._max.base_price ?? 0) },
      duration: { min: agg._min.duration_days ?? 1, max: agg._max.duration_days ?? 1 },
      categories: categories.map((c) => ({ category: c.category, count: (c._count as { _all: number })._all })),
    };
  }

  // ------------------------------- Admin --------------------------------

  async listAdmin(query: AdminPackageQueryDto) {
    return this.list(query, query.status ? { status: query.status } : {});
  }

  async findById(id: string) {
    const pkg = await this.prisma.package.findUnique({
      where: { id },
      include: { destination: true, _count: { select: { bookings: true } } },
    });
    if (!pkg) throw new NotFoundException('Voyage introuvable');
    return pkg;
  }

  async create(dto: CreatePackageDto, actorId: string, meta: RequestMeta) {
    await this.assertDestination(dto.destination_id);
    const slug = await uniqueSlug(dto.slug ?? dto.title_fr, (s) => this.slugExists(s));
    const pkg = await this.prisma.package.create({
      data: {
        ...dto,
        slug,
        gallery_urls: dto.gallery_urls ?? [],
        included: dto.included ?? [],
        excluded: dto.excluded ?? [],
        itinerary: this.normalizeItinerary(dto.itinerary),
      },
      include: { destination: true },
    });
    await this.audit.log({ actorId, action: 'PACKAGE_CREATED', resourceType: 'package', resourceId: pkg.id, payload: { slug }, meta });
    return pkg;
  }

  async update(id: string, dto: UpdatePackageDto, actorId: string, meta: RequestMeta) {
    const current = await this.findById(id);

    if (dto.status && !canTransitionPackage(current.status, dto.status)) {
      throw new BadRequestException(`Transition de statut interdite : ${current.status} → ${dto.status}`);
    }
    if (dto.destination_id) await this.assertDestination(dto.destination_id);

    let slug: string | undefined;
    if (dto.slug && dto.slug !== current.slug) {
      slug = await uniqueSlug(dto.slug, (s) => this.slugExists(s, id));
    }

    const { itinerary, ...rest } = dto;
    const pkg = await this.prisma.package.update({
      where: { id },
      data: {
        ...rest,
        ...(slug && { slug }),
        ...(itinerary && { itinerary: this.normalizeItinerary(itinerary) }),
      },
      include: { destination: true },
    });
    await this.audit.log({
      actorId,
      action: 'PACKAGE_UPDATED',
      resourceType: 'package',
      resourceId: id,
      payload: { fields: Object.keys(dto), ...(dto.status && { status: { from: current.status, to: dto.status } }) },
      meta,
    });
    return pkg;
  }

  /** Une offre ayant des réservations est archivée (historique conservé) ; sinon supprimée. */
  async remove(id: string, actorId: string, meta: RequestMeta) {
    const pkg = await this.findById(id);
    const archived = pkg._count.bookings > 0;
    if (archived) {
      await this.prisma.package.update({ where: { id }, data: { status: PackageStatus.archived, featured: false } });
    } else {
      await this.prisma.package.delete({ where: { id } });
    }
    await this.audit.log({ actorId, action: 'PACKAGE_DELETED', resourceType: 'package', resourceId: id, payload: { slug: pkg.slug, archived }, meta });
    return { id, archived };
  }

  // ------------------------------ Helpers -------------------------------

  private async list(query: PackageQueryDto, base: Prisma.PackageWhereInput) {
    const where: Prisma.PackageWhereInput = {
      ...base,
      ...(query.category?.length && { category: { in: query.category } }),
      ...(query.destination_id?.length && { destination_id: { in: query.destination_id } }),
      ...(query.featured !== undefined && { featured: query.featured }),
      ...((query.min_price !== undefined || query.max_price !== undefined) && {
        base_price: { gte: query.min_price, lte: query.max_price },
      }),
      ...((query.min_duration !== undefined || query.max_duration !== undefined) && {
        duration_days: { gte: query.min_duration, lte: query.max_duration },
      }),
      ...(query.search && {
        OR: [
          { title_fr: { contains: query.search, mode: 'insensitive' } },
          { title_en: { contains: query.search, mode: 'insensitive' } },
          { title_ar: { contains: query.search } },
          { destination: { name_fr: { contains: query.search, mode: 'insensitive' } } },
          { destination: { name_en: { contains: query.search, mode: 'insensitive' } } },
          { destination: { country: { contains: query.search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.package.findMany({
        where,
        orderBy: ORDER_BY[query.sort ?? 'newest'],
        include: { destination: { select: DESTINATION_SELECT } },
        omit: { itinerary: true, description_ar: true, description_en: true },
        ...skipTake(query),
      }),
      this.prisma.package.count({ where }),
    ]);

    const ratings = await this.ratingsFor(items.map((p) => p.id));
    const data = items.map((p) => ({ ...p, rating: ratings.get(p.id) ?? { average: null, count: 0 } }));
    return paginated(data, total, query);
  }

  /** Note moyenne des avis approuvés, agrégée via les réservations. */
  async ratingsFor(packageIds: string[]): Promise<Map<string, RatingSummary>> {
    if (packageIds.length === 0) return new Map();
    const rows = await this.prisma.$queryRaw<{ package_id: string; average: number; count: number }[]>`
      SELECT b.package_id::text AS package_id, AVG(r.rating)::float AS average, COUNT(*)::int AS count
      FROM reviews r JOIN bookings b ON b.id = r.booking_id
      WHERE r.is_approved = true AND b.package_id = ANY(${packageIds}::uuid[])
      GROUP BY b.package_id`;
    return new Map(rows.map((r) => [r.package_id, { average: Math.round(r.average * 10) / 10, count: r.count }]));
  }

  /** Places restantes pour une date de départ (réservations non annulées). */
  async remainingCapacity(
    packageId: string,
    departure: Date,
    maxCapacity: number,
    client: Prisma.TransactionClient = this.prisma,
  ) {
    const bookings = await client.booking.findMany({
      where: {
        package_id: packageId,
        departure_date: departure,
        status: { in: [BookingStatus.pending, BookingStatus.confirmed] },
      },
      select: { participants: true },
    });
    const taken = bookings.reduce((sum, b) => sum + (Array.isArray(b.participants) ? b.participants.length : 0), 0);
    return Math.max(0, maxCapacity - taken);
  }

  private normalizeItinerary(days?: CreatePackageDto['itinerary']): Prisma.InputJsonValue {
    return [...(days ?? [])].sort((a, b) => a.day - b.day) as unknown as Prisma.InputJsonValue;
  }

  private async slugExists(slug: string, excludeId?: string) {
    const found = await this.prisma.package.findUnique({ where: { slug }, select: { id: true } });
    return Boolean(found && found.id !== excludeId);
  }

  private async assertDestination(id: string) {
    const dest = await this.prisma.destination.findUnique({ where: { id }, select: { id: true } });
    if (!dest) throw new BadRequestException('Destination inconnue');
  }
}
