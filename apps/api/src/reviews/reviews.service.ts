import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, PackageStatus, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { paginated, PaginationQueryDto, skipTake } from '../common/pagination';
import type { RequestMeta } from '../common/request-meta';
import { PrismaService } from '../prisma/prisma.service';
import type { AdminReviewQueryDto, CreateReviewDto } from './dto/review.dto';

/** Auteur affiché publiquement : prénom + initiale du nom (vie privée). */
const AUTHOR = { select: { user: { select: { first_name: true, last_name: true, avatar_url: true } } } } as const;

type WithAuthor = { booking: { user: { first_name: string; last_name: string; avatar_url: string | null } } };

function publicAuthor<T extends WithAuthor>(review: T) {
  const { booking, ...rest } = review;
  const { first_name, last_name, avatar_url } = booking.user;
  return { ...rest, author: { name: `${first_name} ${last_name.charAt(0)}.`, avatar_url } };
}

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Seul le client d'un voyage terminé (ou dont la date de retour est passée) peut laisser un avis. */
  async create(dto: CreateReviewDto, user: AuthUser) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.booking_id },
      include: { _count: { select: { reviews: true } } },
    });
    if (!booking || booking.user_id !== user.id) throw new NotFoundException('Réservation introuvable');

    const travelled =
      booking.status === BookingStatus.completed ||
      (booking.status === BookingStatus.confirmed && booking.return_date.getTime() < Date.now());
    if (!travelled) throw new BadRequestException('Vous pourrez donner votre avis après votre voyage');
    if (booking._count.reviews > 0) throw new ConflictException('Vous avez déjà donné votre avis pour ce voyage');

    return this.prisma.review.create({ data: { booking_id: booking.id, rating: dto.rating, comment: dto.comment } });
  }

  async listForPackage(slug: string, query: PaginationQueryDto) {
    const pkg = await this.prisma.package.findFirst({ where: { slug, status: PackageStatus.published }, select: { id: true } });
    if (!pkg) throw new NotFoundException('Voyage introuvable');

    const where: Prisma.ReviewWhereInput = { is_approved: true, booking: { package_id: pkg.id } };
    const [items, total, distribution] = await this.prisma.$transaction([
      this.prisma.review.findMany({ where, include: { booking: AUTHOR }, orderBy: { created_at: 'desc' }, ...skipTake(query) }),
      this.prisma.review.count({ where }),
      this.prisma.review.groupBy({ by: ['rating'], where, _count: { _all: true }, orderBy: { rating: 'desc' } }),
    ]);

    const counts = Object.fromEntries([5, 4, 3, 2, 1].map((r) => [r, 0])) as Record<number, number>;
    let sum = 0;
    for (const row of distribution) {
      const n = (row._count as { _all: number })._all;
      counts[row.rating] = n;
      sum += row.rating * n;
    }
    return {
      ...paginated(items.map(publicAuthor), total, query),
      summary: { average: total ? Math.round((sum / total) * 10) / 10 : null, count: total, distribution: counts },
    };
  }

  /** Témoignages de la page d'accueil : avis approuvés les mieux notés. */
  async featured(limit = 6) {
    const reviews = await this.prisma.review.findMany({
      where: { is_approved: true, rating: { gte: 4 } },
      include: {
        booking: {
          select: {
            user: AUTHOR.select.user,
            package: { select: { slug: true, title_fr: true, title_ar: true, title_en: true } },
          },
        },
      },
      orderBy: [{ rating: 'desc' }, { created_at: 'desc' }],
      take: limit,
    });
    return reviews.map((r) => ({ ...publicAuthor(r), package: r.booking.package }));
  }

  async listAdmin(query: AdminReviewQueryDto) {
    const where = query.is_approved === undefined ? {} : { is_approved: query.is_approved };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        include: {
          booking: {
            select: {
              reference: true,
              user: { select: { id: true, email: true, first_name: true, last_name: true } },
              package: { select: { slug: true, title_fr: true } },
            },
          },
        },
        orderBy: { created_at: 'desc' },
        ...skipTake(query),
      }),
      this.prisma.review.count({ where }),
    ]);
    return paginated(data, total, query);
  }

  async approve(id: string, isApproved: boolean, actorId: string, meta: RequestMeta) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Avis introuvable');
    const updated = await this.prisma.review.update({ where: { id }, data: { is_approved: isApproved } });
    await this.audit.log({
      actorId,
      action: 'REVIEW_APPROVED',
      resourceType: 'review',
      resourceId: id,
      payload: { is_approved: isApproved },
      meta,
    });
    return updated;
  }

  async remove(id: string) {
    await this.prisma.review.delete({ where: { id } }).catch(() => {
      throw new NotFoundException('Avis introuvable');
    });
  }
}
