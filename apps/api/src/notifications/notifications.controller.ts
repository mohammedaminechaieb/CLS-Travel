import { Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ALL_ROLES, Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/pagination';
import { NotificationsService } from './notifications.service';

class NotificationQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  unread?: boolean;
}

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Roles(...ALL_ROLES)
  @Get()
  list(@CurrentUser('id') userId: string, @Query() query: NotificationQueryDto) {
    return this.notifications.list(userId, query);
  }

  // Déclarée avant :id/read pour ne pas être capturée comme un identifiant
  @Roles(...ALL_ROLES)
  @Patch('read-all')
  markAllRead(@CurrentUser('id') userId: string) {
    return this.notifications.markAllRead(userId);
  }

  @Roles(...ALL_ROLES)
  @Patch(':id/read')
  markRead(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    return this.notifications.markRead(id, userId);
  }
}
