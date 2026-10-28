import { Controller, Get, NotFoundException, Param, ParseUUIDPipe, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { BookingsService } from '../bookings/bookings.service';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { ALL_ROLES, Roles } from '../common/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { confirmationHtml, invoiceHtml } from './document-templates';
import { PdfService } from './pdf.service';

const KINDS = { confirmation: confirmationHtml, invoice: invoiceHtml } as const;

@Controller('bookings/:id/documents')
export class DocumentsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookings: BookingsService,
    private readonly pdf: PdfService,
  ) {}

  /** GET /bookings/:id/documents/confirmation | invoice → PDF (client propriétaire, agent assigné, admins). */
  @Roles(...ALL_ROLES)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Get(':kind')
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('kind') kind: string,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const template = KINDS[kind as keyof typeof KINDS];
    if (!template) throw new NotFoundException('Document inconnu');

    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        user: { select: { first_name: true, last_name: true, email: true, phone: true } },
        package: { select: { title_fr: true, duration_days: true, base_price: true, included: true, destination: { select: { name_fr: true, country: true } } } },
        payments: { orderBy: { created_at: 'asc' } },
      },
    });
    if (!booking) throw new NotFoundException('Réservation introuvable');
    this.bookings.assertCanView(booking, user);

    const buffer = await this.pdf.render(template(booking));
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${kind}-${booking.reference}.pdf"`,
      'Cache-Control': 'private, no-store',
    });
    res.send(buffer);
  }
}
