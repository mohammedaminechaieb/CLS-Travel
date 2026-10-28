import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { ADMINS, ALL_ROLES, Roles, STAFF } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/pagination';
import { requestMeta } from '../common/request-meta';
import { PromoService } from '../promo/promo.service';
import { BookingsService } from './bookings.service';
import {
  AdminBookingQueryDto,
  AssignAgentDto,
  CreateBookingDto,
  CreateMessageDto,
  UpdateBookingStatusDto,
  UpdateNotesDto,
} from './dto/booking.dto';

@Controller()
export class BookingsController {
  constructor(
    private readonly bookings: BookingsService,
    private readonly promo: PromoService,
  ) {}

  @Roles(...ALL_ROLES)
  @Post('bookings')
  create(@Body() dto: CreateBookingDto, @CurrentUser() user: AuthUser, @Req() req: Request) {
    const code = dto.promo_code;
    return this.bookings.create(
      dto,
      user,
      requestMeta(req),
      code ? (pkgId, subtotal, tx) => this.promo.redeem(code, pkgId, subtotal, tx) : undefined,
    );
  }

  @Roles(...ALL_ROLES)
  @Get('bookings/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.bookings.findOne(id, user);
  }

  @Roles(...ALL_ROLES)
  @Get('bookings/:id/messages')
  messages(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.bookings.listMessages(id, user);
  }

  @Roles(...ALL_ROLES)
  @Post('bookings/:id/messages')
  postMessage(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateMessageDto, @CurrentUser() user: AuthUser) {
    return this.bookings.postMessage(id, dto.body, user);
  }

  @Roles(...ALL_ROLES)
  @Get('client/bookings')
  listMine(@CurrentUser('id') userId: string, @Query() query: PaginationQueryDto) {
    return this.bookings.listForClient(userId, query);
  }

  @Roles(...ALL_ROLES)
  @Patch('client/bookings/:id/cancel')
  cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser, @Req() req: Request) {
    return this.bookings.cancelByClient(id, user, requestMeta(req));
  }

  @Roles(...STAFF)
  @Get('admin/bookings')
  listAdmin(@Query() query: AdminBookingQueryDto, @CurrentUser() user: AuthUser) {
    return this.bookings.listAdmin(query, user);
  }

  @Roles(...ADMINS)
  @Patch('admin/bookings/:id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBookingStatusDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.bookings.updateStatus(id, dto.status, user, requestMeta(req), dto.reason);
  }

  @Roles(...ADMINS)
  @Patch('admin/bookings/:id/agent')
  assignAgent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignAgentDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.bookings.assignAgent(id, dto.agent_id, user, requestMeta(req));
  }

  @Roles(...STAFF)
  @Patch('admin/bookings/:id/notes')
  updateNotes(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateNotesDto, @CurrentUser() user: AuthUser) {
    return this.bookings.updateNotes(id, dto.notes_internal, user);
  }
}
