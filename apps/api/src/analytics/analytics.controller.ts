import { Controller, Get, Query } from '@nestjs/common';
import { ADMINS, Roles } from '../common/decorators/roles.decorator';
import { RangeQueryDto, RevenueQueryDto, TopPackagesQueryDto } from './analytics.dto';
import { AnalyticsService } from './analytics.service';

/** Rapports financiers et KPI — réservés aux super admins et managers. */
@Roles(...ADMINS)
@Controller('admin/analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Roles(...ADMINS)
  @Get('overview')
  overview() {
    return this.analytics.overview();
  }

  @Roles(...ADMINS)
  @Get('revenue')
  revenue(@Query() query: RevenueQueryDto) {
    return this.analytics.revenue(query);
  }

  @Roles(...ADMINS)
  @Get('bookings')
  bookings(@Query() query: RangeQueryDto) {
    return this.analytics.bookings(query);
  }

  @Roles(...ADMINS)
  @Get('top-packages')
  topPackages(@Query() query: TopPackagesQueryDto) {
    return this.analytics.topPackages(query);
  }

  @Roles(...ADMINS)
  @Get('conversion')
  conversion(@Query() query: RangeQueryDto) {
    return this.analytics.conversion(query);
  }
}
