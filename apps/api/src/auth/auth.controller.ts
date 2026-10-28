import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { requestMeta } from '../common/request-meta';
import { AuthService, type AuthResult } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto, ResetPasswordDto, VerifyEmailDto } from './dto/token.dto';
import { clearRefreshCookie, REFRESH_COOKIE, setRefreshCookie } from './refresh-cookie';

const ONE_MINUTE = 60_000;

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: ONE_MINUTE } })
  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.respond(await this.auth.register(dto, requestMeta(req)), res);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: ONE_MINUTE } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.respond(await this.auth.login(dto, requestMeta(req)), res);
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: ONE_MINUTE } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      return this.respond(await this.auth.refresh(req.cookies?.[REFRESH_COOKIE]), res);
    } catch (err) {
      clearRefreshCookie(res, this.config);
      throw err;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser('id') userId: string, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(userId, requestMeta(req));
    clearRefreshCookie(res, this.config);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() dto: VerifyEmailDto, @Req() req: Request) {
    return this.auth.verifyEmail(dto.token, requestMeta(req));
  }

  @Throttle({ default: { limit: 3, ttl: ONE_MINUTE } })
  @Post('verify-email/resend')
  @HttpCode(HttpStatus.NO_CONTENT)
  resendVerification(@CurrentUser('id') userId: string) {
    return this.auth.resendVerification(userId);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: ONE_MINUTE } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.auth.forgotPassword(dto.email);
    return { message: 'Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.' };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: ONE_MINUTE } })
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.resetPassword(dto.token, dto.password, requestMeta(req));
    clearRefreshCookie(res, this.config);
  }

  /** Le refresh token ne quitte jamais le cookie HttpOnly ; seul l'access token est renvoyé. */
  private respond(result: AuthResult, res: Response) {
    setRefreshCookie(res, result.refreshToken, this.config);
    return { accessToken: result.accessToken, user: result.user };
  }
}
