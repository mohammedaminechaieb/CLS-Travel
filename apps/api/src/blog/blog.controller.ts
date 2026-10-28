import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ADMINS, Roles } from '../common/decorators/roles.decorator';
import { requestMeta } from '../common/request-meta';
import { BlogService } from './blog.service';
import { AdminBlogQueryDto, BlogQueryDto, CreateBlogPostDto, UpdateBlogPostDto } from './dto/blog.dto';

@Controller()
export class BlogController {
  constructor(private readonly blog: BlogService) {}

  @Public()
  @Get('blog')
  list(@Query() query: BlogQueryDto) {
    return this.blog.listPublic(query);
  }

  @Public()
  @Get('blog/tags')
  tags() {
    return this.blog.tags();
  }

  @Public()
  @Get('blog/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.blog.findPublicBySlug(slug);
  }

  @Roles(...ADMINS)
  @Get('admin/blog')
  listAdmin(@Query() query: AdminBlogQueryDto) {
    return this.blog.listAdmin(query);
  }

  @Roles(...ADMINS)
  @Get('admin/blog/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.blog.findById(id);
  }

  @Roles(...ADMINS)
  @Post('admin/blog')
  create(@Body() dto: CreateBlogPostDto, @CurrentUser('id') authorId: string, @Req() req: Request) {
    return this.blog.create(dto, authorId, requestMeta(req));
  }

  @Roles(...ADMINS)
  @Patch('admin/blog/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBlogPostDto,
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    return this.blog.update(id, dto, actorId, requestMeta(req));
  }

  @Roles(...ADMINS)
  @Delete('admin/blog/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') actorId: string, @Req() req: Request) {
    return this.blog.remove(id, actorId, requestMeta(req));
  }
}
