import { BadRequestException, Injectable, InternalServerErrorException, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { AuditService } from '../audit/audit.service';
import { UPLOAD_DIR, UPLOAD_ROUTE } from './upload-dir';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Signatures binaires acceptées : le type MIME déclaré par le client n'est jamais cru sur parole. */
const SIGNATURES: { ext: string; mime: string; test: (b: Buffer) => boolean }[] = [
  { ext: 'jpg', mime: 'image/jpeg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: 'png', mime: 'image/png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: 'webp', mime: 'image/webp', test: (b) => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP' },
  { ext: 'avif', mime: 'image/avif', test: (b) => b.subarray(4, 12).toString() === 'ftypavif' },
];

export function sniffImage(buffer: Buffer) {
  return SIGNATURES.find((s) => s.test(buffer)) ?? null;
}

const FOLDERS = ['packages', 'destinations', 'blog', 'avatars'] as const;
export type MediaFolder = (typeof FOLDERS)[number];

@Injectable()
export class MediaService implements OnModuleInit {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  async onModuleInit() {
    await mkdir(UPLOAD_DIR, { recursive: true });
    this.logger.log(`Fichiers téléversés stockés dans ${UPLOAD_DIR}`);
  }

  isFolder(value: string): value is MediaFolder {
    return (FOLDERS as readonly string[]).includes(value);
  }

  /**
   * Enregistre une image sur le disque du backend et renvoie son URL publique
   * (`${API_URL}/uploads/<fichier>`, ex. https://api.carthagoloisirs.com/uploads/…).
   */
  async upload(file: Express.Multer.File | undefined, folder: MediaFolder, actorId: string) {
    if (!file) throw new BadRequestException('Fichier manquant');
    if (file.size > MAX_UPLOAD_BYTES) throw new BadRequestException('Image trop lourde (5 Mo maximum)');
    const kind = sniffImage(file.buffer);
    if (!kind) throw new BadRequestException('Format non supporté (JPEG, PNG, WebP ou AVIF)');

    // Nom généré côté serveur (jamais le nom fourni par le client) : pas de traversée de chemin
    const filename = `${folder}-${randomUUID()}.${kind.ext}`;
    try {
      await writeFile(join(UPLOAD_DIR, filename), file.buffer, { flag: 'wx', mode: 0o644 });
    } catch (err) {
      this.logger.error(`Écriture de ${filename} impossible : ${(err as Error).message}`);
      throw new InternalServerErrorException('Enregistrement du fichier impossible');
    }

    const base = String(this.config.get<string>('apiUrl')).replace(/\/$/, '');
    const url = `${base}${UPLOAD_ROUTE}/${filename}`;
    await this.audit.log({ actorId, action: 'MEDIA_UPLOADED', resourceType: 'media', resourceId: filename, payload: { size: file.size, mime: kind.mime } });
    return { url, key: filename, size: file.size, mime: kind.mime };
  }
}
