import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { PackageCategory, PackageStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../common/pagination';

export const PACKAGE_SORTS = ['newest', 'price_asc', 'price_desc', 'duration_asc', 'duration_desc'] as const;
export type PackageSort = (typeof PACKAGE_SORTS)[number];

const toArray = ({ value }: { value: unknown }) =>
  value === undefined ? undefined : Array.isArray(value) ? value : String(value).split(',').filter(Boolean);

export class PackageQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(toArray)
  @IsEnum(PackageCategory, { each: true })
  category?: PackageCategory[];

  @IsOptional()
  @Transform(toArray)
  @IsUUID('4', { each: true })
  destination_id?: string[];

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) min_price?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) max_price?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) min_duration?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) max_duration?: number;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsIn(PACKAGE_SORTS)
  sort: PackageSort = 'newest';
}

export class AdminPackageQueryDto extends PackageQueryDto {
  @IsOptional()
  @IsEnum(PackageStatus)
  status?: PackageStatus;
}
