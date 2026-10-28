import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ADMINS, ALL_ROLES, Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/pagination';
import { requestMeta } from '../common/request-meta';
import { AdminReviewQueryDto, ApproveReviewDto, CreateReviewDto } from './dto/review.dto';
import { ReviewsService } from './reviews.service';

@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Roles(...ALL_ROLES)
  @Post('reviews')
  create(@Body() dto: CreateReviewDto, @CurrentUser() user: AuthUser) {
    return this.reviews.create(dto, user);
  }

  @Public()
  @Get('reviews/featured')
  featured() {
    return this.reviews.featured();
  }

  @Public()
  @Get('packages/:slug/reviews')
  listForPackage(@Param('slug') slug: string, @Query() query: PaginationQueryDto) {
    return this.reviews.listForPackage(slug, query);
  }

  @Roles(...ADMINS)
  @Get('admin/reviews')
  listAdmin(@Query() query: AdminReviewQueryDto) {
    return this.reviews.listAdmin(query);
  }

  @Roles(...ADMINS)
  @Patch('admin/reviews/:id/approve')
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveReviewDto,
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    return this.reviews.approve(id, dto.is_approved, actorId, requestMeta(req));
  }

  @Roles(...ADMINS)
  @Delete('admin/reviews/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviews.remove(id);
  }
}
