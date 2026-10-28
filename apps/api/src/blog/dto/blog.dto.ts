import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';
import { PostStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../common/pagination';
import { IsTiptapDoc } from '../../common/tiptap';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateBlogPostDto {
  @IsOptional()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(100)
  slug?: string;

  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(200) title_fr: string;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(200) title_ar: string;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(200) title_en: string;

  @IsTiptapDoc()
  body: Record<string, unknown>;

  @IsOptional() @IsString() @MaxLength(500) excerpt_fr?: string;
  @IsOptional() @IsString() @MaxLength(500) excerpt_ar?: string;
  @IsOptional() @IsString() @MaxLength(500) excerpt_en?: string;

  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  cover_url?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @Transform(({ value }) => (Array.isArray(value) ? value.map((t) => String(t).trim().toLowerCase()).filter(Boolean) : value))
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;
}

export class UpdateBlogPostDto extends PartialType(CreateBlogPostDto) {}

export class BlogQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsString()
  @MaxLength(40)
  tag?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  search?: string;
}

export class AdminBlogQueryDto extends BlogQueryDto {
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;
}
