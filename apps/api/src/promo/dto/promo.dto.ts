import { PartialType } from '@nestjs/mapped-types';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { DiscountType } from '@prisma/client';
import { PaginationQueryDto } from '../../common/pagination';

const upper = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toUpperCase() : value);

export class ValidatePromoDto {
  @Transform(upper)
  @Matches(/^[A-Z0-9_-]{3,32}$/, { message: 'Code promo invalide' })
  code: string;

  @IsUUID()
  package_id: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  participants: number = 1;
}

export class CreatePromoDto {
  @Transform(upper)
  @Matches(/^[A-Z0-9_-]{3,32}$/, { message: 'Le code doit contenir 3 à 32 caractères A-Z, 0-9, - ou _' })
  code: string;

  @IsEnum(DiscountType)
  discount_type: DiscountType;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  @ValidateIf((o: CreatePromoDto) => o.discount_type === DiscountType.percent)
  @Max(100)
  value: number;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsDateString()
  expires_at?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsInt()
  @Min(1)
  max_uses?: number | null;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  applicable_packages?: string[];
}

export class UpdatePromoDto extends PartialType(CreatePromoDto) {}

export class PromoQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : value === true || value === 'true'))
  @IsBoolean()
  is_active?: boolean;
}
