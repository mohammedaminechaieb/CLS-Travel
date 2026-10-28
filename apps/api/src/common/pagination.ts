import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import type { Paginated } from '@cls/shared';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 12;
}

export function skipTake({ page, limit }: PaginationQueryDto) {
  return { skip: (page - 1) * limit, take: limit };
}

export function paginated<T>(data: T[], total: number, { page, limit }: PaginationQueryDto): Paginated<T> {
  return { data, meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}
