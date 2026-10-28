import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ADMINS, Roles } from '../common/decorators/roles.decorator';
import { requestMeta } from '../common/request-meta';
import { DestinationsService } from './destinations.service';
import { CreateDestinationDto, UpdateDestinationDto } from './dto/destination.dto';

@Controller()
export class DestinationsController {
  constructor(private readonly destinations: DestinationsService) {}

  @Public()
  @Get('destinations')
  list() {
    return this.destinations.list();
  }

  @Public()
  @Get('destinations/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.destinations.findOne(id);
  }

  @Roles(...ADMINS)
  @Post('admin/destinations')
  create(@Body() dto: CreateDestinationDto, @CurrentUser('id') actorId: string, @Req() req: Request) {
    return this.destinations.create(dto, actorId, requestMeta(req));
  }

  @Roles(...ADMINS)
  @Patch('admin/destinations/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDestinationDto,
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    return this.destinations.update(id, dto, actorId, requestMeta(req));
  }
}
