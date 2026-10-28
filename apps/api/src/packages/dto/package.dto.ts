import { PartialType } from '@nestjs/mapped-types';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PackageCategory, PackageStatus } from '@prisma/client';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** Une journée du programme — `content` est un document Tiptap (ProseMirror JSON). */
export class ItineraryDayDto {
  @IsInt()
  @Min(1)
  @Max(365)
  day: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title_fr: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title_ar?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title_en?: string;

  @IsOptional()
  @IsObject()
  content_fr?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  content_ar?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  content_en?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(3)
  meals?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(200)
  accommodation?: string;
}

export class CreatePackageDto {
  @IsOptional()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'Slug invalide (a-z, 0-9, tirets)' })
  @MaxLength(100)
  slug?: string;

  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(200) title_fr: string;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(200) title_ar: string;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(200) title_en: string;

  @IsString() @IsNotEmpty() @MaxLength(20000) description_fr: string;
  @IsString() @IsNotEmpty() @MaxLength(20000) description_ar: string;
  @IsString() @IsNotEmpty() @MaxLength(20000) description_en: string;

  @IsUUID()
  destination_id: string;

  @IsEnum(PackageCategory)
  category: PackageCategory;

  @IsInt()
  @Min(1)
  @Max(365)
  duration_days: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(9_999_999)
  base_price: number;

  @IsInt()
  @Min(1)
  @Max(10_000)
  max_capacity: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsUrl({ protocols: ['https'], require_protocol: true }, { each: true })
  gallery_urls?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(365)
  @ValidateNested({ each: true })
  @Type(() => ItineraryDayDto)
  itinerary?: ItineraryDayDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  included?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  excluded?: string[];

  @IsOptional()
  @IsEnum(PackageStatus)
  status?: PackageStatus;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;
}

export class UpdatePackageDto extends PartialType(CreatePackageDto) {}
