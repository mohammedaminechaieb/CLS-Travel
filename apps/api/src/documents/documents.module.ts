import { Module } from '@nestjs/common';
import { BookingsModule } from '../bookings/bookings.module';
import { DocumentsController } from './documents.controller';
import { PdfService } from './pdf.service';

@Module({
  imports: [BookingsModule],
  controllers: [DocumentsController],
  providers: [PdfService],
})
export class DocumentsModule {}
