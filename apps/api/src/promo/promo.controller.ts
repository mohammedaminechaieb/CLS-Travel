import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ADMINS, ALL_ROLES, Roles } from '../common/decorators/roles.decorator';
import { requestMeta } from '../common/request-meta';
import { CreatePromoDto, PromoQueryDto, UpdatePromoDto, ValidatePromoDto } from './dto/promo.dto';
import { PromoService } from './promo.service';

@Controller()
export class PromoController {
  constructor(private readonly promo: PromoService) {}

  /** Réservé aux utilisateurs connectés et limité pour empêcher l'énumération des codes. */
  @Roles(...ALL_ROLES)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('promo/validate')
  @HttpCode(HttpStatus.OK)
  validate(@Body() dto: ValidatePromoDto) {
    return this.promo.validate(dto);
  }

  @Roles(...ADMINS)
  @Get('admin/promo')
  list(@Query() query: PromoQueryDto) {
    return this.promo.list(query);
  }

  @Roles(...ADMINS)
  @Post('admin/promo')
  create(@Body() dto: CreatePromoDto, @CurrentUser('id') actorId: string, @Req() req: Request) {
    return this.promo.create(dto, actorId, requestMeta(req));
  }

  @Roles(...ADMINS)
  @Patch('admin/promo/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePromoDto,
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    return this.promo.update(id, dto, actorId, requestMeta(req));
  }
}
