import { Injectable, Logger, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer, { type Browser } from 'puppeteer-core';

/** Rendu HTML → PDF via Puppeteer (Chromium headless partagé entre les requêtes). */
@Injectable()
export class PdfService implements OnModuleDestroy {
  private readonly logger = new Logger(PdfService.name);
  private browser: Promise<Browser> | null = null;

  constructor(private readonly config: ConfigService) {}

  async render(html: string): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    try {
      // Aucune ressource externe : le gabarit est autonome (pas de SSRF possible)
      await page.setRequestInterception(true);
      page.on('request', (req) => (req.url().startsWith('data:') ? req.continue() : req.abort()));
      await page.setContent(html, { waitUntil: 'load' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
      });
      return Buffer.from(pdf);
    } finally {
      await page.close();
    }
  }

  private getBrowser(): Promise<Browser> {
    this.browser ??= puppeteer
      .launch({
        executablePath: this.config.get<string>('chromiumPath'),
        headless: true,
        args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--font-render-hinting=none'],
      })
      .then((b) => {
        b.on('disconnected', () => (this.browser = null));
        return b;
      })
      .catch((err) => {
        this.browser = null;
        this.logger.error(`Chromium launch failed: ${(err as Error).message}`);
        throw new ServiceUnavailableException('Génération PDF momentanément indisponible');
      });
    return this.browser;
  }

  async onModuleDestroy() {
    if (this.browser) await (await this.browser.catch(() => null))?.close();
  }
}
