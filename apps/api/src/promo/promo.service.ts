import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PackageStatus, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { paginated, skipTake } from '../common/pagination';
import type { RequestMeta } from '../common/request-meta';
import { PrismaService } from '../prisma/prisma.service';
import type { CreatePromoDto, PromoQueryDto, UpdatePromoDto, ValidatePromoDto } from './dto/promo.dto';
import { checkPromo, computeDiscount, PROMO_MESSAGES } from './promo-discount';

@Injectable()
export class PromoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Prévisualisation de la remise (étape 2 du tunnel) — ne consomme pas d'utilisation. */
  async validate(dto: ValidatePromoDto) {
    const pkg = await this.prisma.package.findFirst({
      where: { id: dto.package_id, status: PackageStatus.published },
      select: { id: true, base_price: true },
    });
    if (!pkg) throw new BadRequestException('Voyage introuvable');

    const promo = await this.prisma.promoCode.findUnique({ where: { code: dto.code } });
    const rejection = promo ? checkPromo(promo, pkg.id) : 'inactive';
    if (!promo || rejection) throw new BadRequestException(PROMO_MESSAGES[rejection ?? 'inactive']);

    const subtotal = new Prisma.Decimal(pkg.base_price).mul(dto.participants);
    const discount = computeDiscount(promo, subtotal);
    return {
      code: promo.code,
      discount_type: promo.discount_type,
      value: promo.value,
      subtotal: subtotal.toFixed(3),
      discount: discount.toFixed(3),
      total: subtotal.sub(discount).toFixed(3),
    };
  }

  /**
   * Consomme une utilisation dans la transaction de réservation. L'UPDATE conditionnel
   * garantit qu'un code limité ne peut pas être utilisé au-delà de max_uses en concurrence.
   */
  async redeem(code: string, packageId: string, subtotal: Prisma.Decimal, tx: Prisma.TransactionClient) {
    const promo = await tx.promoCode.findUnique({ where: { code: code.trim().toUpperCase() } });
    const rejection = promo ? checkPromo(promo, packageId) : 'inactive';
    if (!promo || rejection) throw new BadRequestException(PROMO_MESSAGES[rejection ?? 'inactive']);

    const updated = await tx.$executeRaw`
      UPDATE promo_codes SET current_uses = current_uses + 1
      WHERE id = ${promo.id}::uuid AND is_active = true AND (max_uses IS NULL OR current_uses < max_uses)`;
    if (updated !== 1) throw new BadRequestException(PROMO_MESSAGES.exhausted);

    return { discount: computeDiscount(promo, subtotal), promoCodeId: promo.id };
  }

  async list(query: PromoQueryDto) {
    const where = query.is_active === undefined ? {} : { is_active: query.is_active };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.promoCode.findMany({
        where,
        include: { _count: { select: { bookings: true } } },
        orderBy: { code: 'asc' },
        ...skipTake(query),
      }),
      this.prisma.promoCode.count({ where }),
    ]);
    return paginated(data, total, query);
  }

  async create(dto: CreatePromoDto, actorId: string, meta: RequestMeta) {
    if (await this.prisma.promoCode.findUnique({ where: { code: dto.code } })) {
      throw new ConflictException('Ce code existe déjà');
    }
    const promo = await this.prisma.promoCode.create({
      data: { ...dto, applicable_packages: dto.applicable_packages ?? [], expires_at: dto.expires_at ? new Date(dto.expires_at) : null },
    });
    await this.audit.log({ actorId, action: 'PROMO_CREATED', resourceType: 'promo_code', resourceId: promo.id, payload: { code: promo.code }, meta });
    return promo;
  }

  async update(id: string, dto: UpdatePromoDto, actorId: string, meta: RequestMeta) {
    const current = await this.prisma.promoCode.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Code promo introuvable');
    const { expires_at, ...rest } = dto;
    const promo = await this.prisma.promoCode.update({
      where: { id },
      data: { ...rest, ...(expires_at !== undefined && { expires_at: expires_at ? new Date(expires_at) : null }) },
    });
    await this.audit.log({ actorId, action: 'PROMO_UPDATED', resourceType: 'promo_code', resourceId: id, payload: { fields: Object.keys(dto) }, meta });
    return promo;
  }
}
