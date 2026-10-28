import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUrl, Matches, MaxLength, ValidateIf } from 'class-validator';
import { E164_REGEX, STRONG_PASSWORD_MESSAGE, STRONG_PASSWORD_REGEX } from '../../common/validators';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class UpdateMeDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  first_name?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  last_name?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Matches(E164_REGEX, { message: 'Le téléphone doit être au format international (+216…)' })
  phone?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2048)
  avatar_url?: string | null;

  /** Changement de mot de passe : exige le mot de passe actuel */
  @IsOptional()
  @IsString()
  @MaxLength(128)
  current_password?: string;

  @IsOptional()
  @Matches(STRONG_PASSWORD_REGEX, { message: STRONG_PASSWORD_MESSAGE })
  new_password?: string;
}
