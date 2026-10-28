import { join } from 'node:path';

/**
 * Dossier des fichiers téléversés : /app/uploads dans le conteneur backend (WORKDIR /app,
 * volume Docker nommé), apps/api/uploads en développement.
 */
export const UPLOAD_DIR = join(process.cwd(), 'uploads');
/** Préfixe d'URL public servi par ServeStaticModule. */
export const UPLOAD_ROUTE = '/uploads';
