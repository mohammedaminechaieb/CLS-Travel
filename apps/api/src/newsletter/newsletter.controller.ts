import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsOptional, MaxLength } from 'class-validator';
import { LOCALES } from '@cls/shared';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

class SubscribeDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsOptional()
  @IsIn(LOCALES)
  locale?: string;
}

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly prisma: PrismaService) {}

  /** Réponse identique qu'il s'agisse d'une nouvelle inscription ou non. */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async subscribe(@Body() dto: SubscribeDto) {
    await this.prisma.newsletterSubscriber.upsert({
      where: { email: dto.email },
      update: {},
      create: { email: dto.email, locale: dto.locale ?? 'fr' },
    });
    return { subscribed: true };
  }
}
