import { Controller, Get, Query } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Roles, SUPER_ADMIN } from '../common/decorators/roles.decorator';
import { paginated, PaginationQueryDto, skipTake } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';

class AuditQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsString()
  @MaxLength(64)
  action?: string;

  @IsOptional()
  @IsUUID()
  actor_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  resource_type?: string;
}

@Controller('admin/audit-logs')
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Roles(...SUPER_ADMIN)
  @Get()
  async list(@Query() q: AuditQueryDto) {
    const where = {
      ...(q.action && { action: q.action }),
      ...(q.actor_id && { actor_id: q.actor_id }),
      ...(q.resource_type && { resource_type: q.resource_type }),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        include: { actor: { select: { id: true, email: true, first_name: true, last_name: true, role: true } } },
        orderBy: { created_at: 'desc' },
        ...skipTake(q),
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return paginated(data, total, q);
  }
}
