import { Transform } from 'class-transformer';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { STRONG_PASSWORD_MESSAGE, STRONG_PASSWORD_REGEX } from '../../common/validators';

export class VerifyEmailDto {
  @IsString()
  @MinLength(10)
  @MaxLength(2048)
  token: string;
}

export class ForgotPasswordDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(32)
  @MaxLength(256)
  token: string;

  @IsString()
  @Matches(STRONG_PASSWORD_REGEX, { message: STRONG_PASSWORD_MESSAGE })
  password: string;
}
