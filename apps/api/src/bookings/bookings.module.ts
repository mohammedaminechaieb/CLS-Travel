import { Module } from '@nestjs/common';
import { PackagesModule } from '../packages/packages.module';
import { PromoModule } from '../promo/promo.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [PackagesModule, PromoModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
