import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/audit.service';

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
export class MediaService {
  private readonly client: S3Client | null;

  constructor(
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {
    const s3 = config.get('s3');
    this.client =
      s3.endpoint && s3.accessKey && s3.accessKey !== '...'
        ? new S3Client({
            endpoint: s3.endpoint,
            region: s3.region,
            credentials: { accessKeyId: s3.accessKey, secretAccessKey: s3.secretKey },
            forcePathStyle: false,
          })
        : null;
  }

  isFolder(value: string): value is MediaFolder {
    return (FOLDERS as readonly string[]).includes(value);
  }

  /** Envoie une image vers OVHcloud Object Storage et renvoie son URL publique. */
  async upload(file: Express.Multer.File | undefined, folder: MediaFolder, actorId: string) {
    if (!file) throw new BadRequestException('Fichier manquant');
    if (file.size > MAX_UPLOAD_BYTES) throw new BadRequestException('Image trop lourde (5 Mo maximum)');
    const kind = sniffImage(file.buffer);
    if (!kind) throw new BadRequestException('Format non supporté (JPEG, PNG, WebP ou AVIF)');
    if (!this.client) throw new ServiceUnavailableException('Stockage des médias non configuré');

    const s3 = this.config.get('s3');
    const now = new Date();
    const key = `${folder}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${randomUUID()}.${kind.ext}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: s3.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: kind.mime,
        ACL: 'public-read',
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
    const base = (s3.publicUrl || `${s3.endpoint}/${s3.bucket}`).replace(/\/$/, '');
    const url = `${base}/${key}`;
    await this.audit.log({ actorId, action: 'MEDIA_UPLOADED', resourceType: 'media', resourceId: key, payload: { size: file.size, mime: kind.mime } });
    return { url, key, size: file.size, mime: kind.mime };
  }
}
