import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { BookingStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../common/pagination';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** Participant tel que stocké en jsonb : {nom, prenom, passport, dob}. */
export class ParticipantDto {
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(80) nom: string;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(80) prenom: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @Matches(/^[A-Z0-9]{6,12}$/, { message: 'Numéro de passeport invalide' })
  passport: string;

  @IsISO8601({ strict: true }, { message: 'Date de naissance invalide (AAAA-MM-JJ)' })
  dob: string;
}

export class CreateBookingDto {
  @IsUUID()
  package_id: string;

  @IsDateString({ strict: true })
  departure_date: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ParticipantDto)
  participants: ParticipantDto[];
}

export class UpdateBookingStatusDto {
  @IsEnum(BookingStatus)
  status: BookingStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

export class AssignAgentDto {
  @ValidateIf((_, v) => v !== null)
  @IsUUID()
  agent_id: string | null;
}

export class UpdateNotesDto {
  @IsString()
  @MaxLength(10_000)
  notes_internal: string;
}

export class AdminBookingQueryDto extends PaginationQueryDto {
  @IsOptional() @IsEnum(BookingStatus) status?: BookingStatus;
  @IsOptional() @IsUUID() package_id?: string;
  @IsOptional() @IsUUID() agent_id?: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(100) search?: string;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
}

export class CreateMessageDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  body: string;
}
