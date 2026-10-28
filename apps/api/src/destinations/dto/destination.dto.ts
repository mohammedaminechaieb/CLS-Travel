import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateDestinationDto {
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(120) name_fr: string;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(120) name_ar: string;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(120) name_en: string;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(80) country: string;

  @IsOptional() @Transform(trim) @IsString() @MaxLength(120) region?: string;

  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2048)
  cover_url?: string;

  @IsOptional() @IsString() @MaxLength(5000) description?: string;
}

export class UpdateDestinationDto extends PartialType(CreateDestinationDto) {}
