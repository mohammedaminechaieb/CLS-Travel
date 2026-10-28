import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Post, Query, Req, type RawBodyRequest } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { IsEnum, IsOptional } from 'class-validator';
import { PaymentStatus } from '@prisma/client';
import type { Request } from 'express';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ADMINS, ALL_ROLES, Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/pagination';
import { requestMeta } from '../common/request-meta';
import { CreatePaymentIntentDto } from './dto/payment.dto';
import { PaymentsService } from './payments.service';

class AdminPaymentQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;
}

@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Roles(...ALL_ROLES)
  @Post('payments/intent')
  createIntent(@Body() dto: CreatePaymentIntentDto, @CurrentUser() user: AuthUser, @Req() req: Request) {
    return this.payments.createIntent(dto.booking_id, dto.payment_type, user, requestMeta(req));
  }

  @Public()
  @SkipThrottle()
  @Post('payments/webhooks/stripe')
  @HttpCode(HttpStatus.OK)
  webhook(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') signature?: string) {
    return this.payments.handleWebhook(req.rawBody, signature);
  }

  @Roles(...ALL_ROLES)
  @Get('client/payments')
  listMine(@CurrentUser('id') userId: string, @Query() query: PaginationQueryDto) {
    return this.payments.listForClient(userId, query);
  }

  @Roles(...ADMINS)
  @Get('admin/payments')
  listAdmin(@Query() query: AdminPaymentQueryDto) {
    return this.payments.listAdmin(query);
  }
}
