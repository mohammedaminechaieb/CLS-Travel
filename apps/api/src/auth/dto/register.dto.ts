import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { E164_REGEX, STRONG_PASSWORD_MESSAGE, STRONG_PASSWORD_REGEX } from '../../common/validators';

export class RegisterDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Adresse email invalide' })
  @MaxLength(254)
  email: string;

  @IsString()
  @Matches(STRONG_PASSWORD_REGEX, { message: STRONG_PASSWORD_MESSAGE })
  password: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  first_name: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  last_name: string;

  @IsOptional()
  @Matches(E164_REGEX, { message: 'Le téléphone doit être au format international (+216…)' })
  phone?: string;
}
