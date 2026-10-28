import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { ADMINS, ALL_ROLES, Roles, STAFF, SUPER_ADMIN } from '../common/decorators/roles.decorator';
import { requestMeta } from '../common/request-meta';
import { ListUsersQueryDto, UpdateRoleDto } from './dto/admin-users.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Roles(...ALL_ROLES)
  @Get('users/me')
  me(@CurrentUser('id') userId: string) {
    return this.users.findMe(userId);
  }

  @Roles(...ALL_ROLES)
  @Patch('users/me')
  updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateMeDto, @Req() req: Request) {
    return this.users.updateMe(userId, dto, requestMeta(req));
  }

  @Roles(...ADMINS)
  @Get('admin/users')
  list(@Query() query: ListUsersQueryDto) {
    return this.users.list(query);
  }

  @Roles(...STAFF)
  @Get('admin/users/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() viewer: AuthUser) {
    return this.users.findOne(id, viewer);
  }

  @Roles(...SUPER_ADMIN)
  @Patch('admin/users/:id/role')
  updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() actor: AuthUser,
    @Req() req: Request,
  ) {
    return this.users.updateRole(id, dto.role, actor, requestMeta(req));
  }

  @Roles(...SUPER_ADMIN)
  @Delete('admin/users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: AuthUser, @Req() req: Request) {
    return this.users.remove(id, actor, requestMeta(req));
  }
}
