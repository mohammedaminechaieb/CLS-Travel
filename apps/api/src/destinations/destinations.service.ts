import { Injectable, NotFoundException } from '@nestjs/common';
import { PackageStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import type { RequestMeta } from '../common/request-meta';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateDestinationDto, UpdateDestinationDto } from './dto/destination.dto';

@Injectable()
export class DestinationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Liste publique avec le nombre d'offres publiées par destination. */
  async list() {
    const destinations = await this.prisma.destination.findMany({
      orderBy: [{ country: 'asc' }, { name_fr: 'asc' }],
      include: {
        _count: { select: { packages: { where: { status: PackageStatus.published } } } },
        packages: {
          where: { status: PackageStatus.published },
          select: { base_price: true },
          orderBy: { base_price: 'asc' },
          take: 1,
        },
      },
    });
    return destinations.map(({ _count, packages, ...d }) => ({
      ...d,
      package_count: _count.packages,
      price_from: packages[0]?.base_price ?? null,
    }));
  }

  async findOne(id: string) {
    const dest = await this.prisma.destination.findUnique({ where: { id } });
    if (!dest) throw new NotFoundException('Destination introuvable');
    return dest;
  }

  async create(dto: CreateDestinationDto, actorId: string, meta: RequestMeta) {
    const dest = await this.prisma.destination.create({ data: dto });
    await this.audit.log({ actorId, action: 'DESTINATION_CREATED', resourceType: 'destination', resourceId: dest.id, meta });
    return dest;
  }

  async update(id: string, dto: UpdateDestinationDto, actorId: string, meta: RequestMeta) {
    await this.findOne(id);
    const dest = await this.prisma.destination.update({ where: { id }, data: dto });
    await this.audit.log({
      actorId,
      action: 'DESTINATION_UPDATED',
      resourceType: 'destination',
      resourceId: id,
      payload: { fields: Object.keys(dto) },
      meta,
    });
    return dest;
  }
}
