import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: { content: string; filename: string; type: string }[];
}

/** Envoi transactionnel via SendGrid. Sans clé API (dev), le message est journalisé. */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    const apiKey = config.get<string>('sendgrid.apiKey');
    this.enabled = Boolean(apiKey && apiKey.startsWith('SG.'));
    if (this.enabled) sgMail.setApiKey(apiKey!);
  }

  async send(message: MailMessage): Promise<void> {
    if (!this.enabled) {
      this.logger.log(`[mail:dev] → ${message.to} | ${message.subject}\n${message.text ?? ''}`);
      return;
    }
    try {
      await sgMail.send({
        to: message.to,
        from: {
          email: this.config.get<string>('sendgrid.fromEmail')!,
          name: this.config.get<string>('sendgrid.fromName'),
        },
        subject: message.subject,
        html: message.html,
        text: message.text,
        attachments: message.attachments?.map((a) => ({ ...a, disposition: 'attachment' })),
      });
    } catch (err) {
      this.logger.error(`SendGrid error to ${message.to}: ${(err as Error).message}`);
    }
  }
}
