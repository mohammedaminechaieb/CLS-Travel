import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Public } from '../common/decorators/public.decorator';
import { E164_REGEX } from '../common/validators';
import { escapeHtml, mailLayout } from '../mail/mail.layout';
import { MailService } from '../mail/mail.service';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
export const CONTACT_SUBJECTS = ['information', 'devis', 'groupe', 'omra', 'reclamation', 'autre'] as const;

class ContactDto {
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(120) name: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/[\s.-]/g, '') : value))
  @Matches(E164_REGEX, { message: 'Téléphone au format international (+216…)' })
  phone?: string;

  @IsIn(CONTACT_SUBJECTS)
  subject: (typeof CONTACT_SUBJECTS)[number];

  @Transform(trim) @IsString() @MinLength(10) @MaxLength(5000) message: string;

  /** Pot de miel anti-spam : doit rester vide */
  @IsOptional() @IsString() @MaxLength(0) website?: string;
}

@Controller('contact')
export class ContactController {
  constructor(
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async send(@Body() dto: ContactDto) {
    const to = process.env.CONTACT_EMAIL || this.config.get<string>('sendgrid.fromEmail')!;
    const rows = [
      ['Nom', dto.name],
      ['Email', dto.email],
      ['Téléphone', dto.phone ?? '—'],
      ['Sujet', dto.subject],
    ]
      .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#5A5042">${k}</td><td>${escapeHtml(v)}</td></tr>`)
      .join('');
    await this.mail.send({
      to,
      subject: `[Contact] ${dto.subject} — ${dto.name}`,
      html: mailLayout('Nouveau message du site', `<table>${rows}</table><p style="white-space:pre-wrap">${escapeHtml(dto.message)}</p>`),
      text: `${dto.name} <${dto.email}> ${dto.phone ?? ''}\n${dto.subject}\n\n${dto.message}`,
    });
    await this.mail.send({
      to: dto.email,
      subject: 'Nous avons bien reçu votre message — CLS Travel',
      html: mailLayout(
        `Merci ${escapeHtml(dto.name)} !`,
        '<p>Votre message a bien été transmis à nos conseillers. Nous vous répondons sous 24 h ouvrées.</p>',
      ),
    });
    return { sent: true };
  }
}
