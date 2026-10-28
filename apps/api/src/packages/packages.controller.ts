import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ADMINS, Roles, STAFF } from '../common/decorators/roles.decorator';
import { requestMeta } from '../common/request-meta';
import { CreatePackageDto, UpdatePackageDto } from './dto/package.dto';
import { AdminPackageQueryDto, PackageQueryDto } from './dto/package-query.dto';
import { PackagesService } from './packages.service';

@Controller()
export class PackagesController {
  constructor(private readonly packages: PackagesService) {}

  @Public()
  @Get('packages')
  list(@Query() query: PackageQueryDto) {
    return this.packages.listPublic(query);
  }

  @Public()
  @Get('packages/facets')
  facets() {
    return this.packages.facets();
  }

  @Public()
  @Get('packages/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.packages.findPublicBySlug(slug);
  }

  @Roles(...STAFF)
  @Get('admin/packages')
  listAdmin(@Query() query: AdminPackageQueryDto) {
    return this.packages.listAdmin(query);
  }

  @Roles(...STAFF)
  @Get('admin/packages/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.packages.findById(id);
  }

  @Roles(...ADMINS)
  @Post('admin/packages')
  create(@Body() dto: CreatePackageDto, @CurrentUser('id') actorId: string, @Req() req: Request) {
    return this.packages.create(dto, actorId, requestMeta(req));
  }

  @Roles(...ADMINS)
  @Patch('admin/packages/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePackageDto,
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    return this.packages.update(id, dto, actorId, requestMeta(req));
  }

  @Roles(...ADMINS)
  @Delete('admin/packages/:id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') actorId: string, @Req() req: Request) {
    return this.packages.remove(id, actorId, requestMeta(req));
  }
}
