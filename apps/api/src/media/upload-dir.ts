import { join } from 'node:path';

/**
 * Dossier des fichiers téléversés : /app/uploads dans le conteneur backend (WORKDIR /app,
 * volume Docker nommé), apps/api/uploads en développement.
 *
 * ⚠ Render (offre gratuite) : le système de fichiers est éphémère et aucun disque persistant
 * n'est disponible — les fichiers téléversés sont PERDUS à chaque redéploiement, redémarrage ou
 * mise en veille de l'instance. Acceptable pour les tests ; prévoir un stockage persistant ensuite.
 */
export const UPLOAD_DIR = join(process.cwd(), 'uploads');
/** Préfixe d'URL public servi par ServeStaticModule. */
export const UPLOAD_ROUTE = '/uploads';
