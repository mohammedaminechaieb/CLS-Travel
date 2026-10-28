import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination';

export class CreateReviewDto {
  @IsUUID()
  booking_id: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Votre avis doit contenir au moins 10 caractères' })
  @MaxLength(3000)
  comment: string;
}

export class ApproveReviewDto {
  @IsOptional()
  @IsBoolean()
  is_approved: boolean = true;
}

export class AdminReviewQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : value === true || value === 'true'))
  @IsBoolean()
  is_approved?: boolean;
}
