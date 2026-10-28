import { BadRequestException, Controller, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ADMINS, Roles } from '../common/decorators/roles.decorator';
import { MAX_UPLOAD_BYTES, MediaService } from './media.service';

@Controller('admin/media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  /** POST /admin/media/:folder (multipart, champ "file") → { url } */
  @Roles(...ADMINS)
  @Post(':folder')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } }))
  upload(@Param('folder') folder: string, @UploadedFile() file: Express.Multer.File, @CurrentUser('id') actorId: string) {
    if (!this.media.isFolder(folder)) throw new BadRequestException('Dossier inconnu');
    return this.media.upload(file, folder, actorId);
  }
}
