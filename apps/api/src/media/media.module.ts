import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { UPLOAD_DIR, UPLOAD_ROUTE } from './upload-dir';

@Module({
  imports: [
    // GET /uploads/<fichier> : fichiers publics, mis en cache longuement (noms uniques)
    ServeStaticModule.forRoot({
      rootPath: UPLOAD_DIR,
      serveRoot: UPLOAD_ROUTE,
      serveStaticOptions: {
        index: false,
        dotfiles: 'deny',
        fallthrough: false,
        immutable: true,
        maxAge: '365d',
      },
    }),
  ],
  controllers: [MediaController],
  providers: [MediaService],
})
export class MediaModule {}
