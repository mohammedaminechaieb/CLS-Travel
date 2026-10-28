import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: { content: string; filename: string; type: string }[];
}

/** Expéditeur des emails transactionnels (domaine vérifié dans Resend). */
export const MAIL_FROM = 'CLS Travel <noreply@carthagoloisirs.com>';
/** Adresse de l'agence utilisée par défaut comme destinataire interne. */
export const AGENCY_EMAIL = 'noreply@carthagoloisirs.com';

/** Envoi transactionnel via Resend. Sans clé API (dev), le message est journalisé. */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend | null;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('resend.apiKey');
    this.resend = apiKey && apiKey.startsWith('re_') ? new Resend(apiKey) : null;
  }

  async send(message: MailMessage): Promise<void> {
    if (!this.resend) {
      this.logger.log(`[mail:dev] → ${message.to} | ${message.subject}\n${message.text ?? ''}`);
      return;
    }
    try {
      // Le SDK Resend ne lève pas d'exception : il renvoie { data, error }
      const { error } = await this.resend.emails.send({
        from: MAIL_FROM,
        to: message.to,
        subject: message.subject,
        html: message.html,
        ...(message.text && { text: message.text }),
        ...(message.attachments?.length && {
          attachments: message.attachments.map((a) => ({ filename: a.filename, content: a.content, contentType: a.type })),
        }),
      });
      if (error) this.logger.error(`Resend error to ${message.to}: ${error.name} — ${error.message}`);
    } catch (err) {
      this.logger.error(`Resend error to ${message.to}: ${(err as Error).message}`);
    }
  }
}
