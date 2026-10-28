# CLS Travel

Plateforme web de l'agence de voyage tunisienne **CLS Travel** (Carthago Loisirs) — [carthagoloisirs.com](https://carthagoloisirs.com).

| App | Stack | Port |
|-----|-------|------|
| `apps/web` | Next.js 15 (App Router), Tailwind CSS 3, shadcn/ui, TanStack Query v5, next-intl | 3000 |
| `apps/api` | NestJS 11, Prisma 6, PostgreSQL 16 | 4000 |
| `packages/shared` | Types, enums et constantes partagés | — |

## Démarrage local

```bash
pnpm install
docker compose -f docker-compose.dev.yml up -d       # Postgres
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
pnpm --filter @cls/shared build
pnpm dev
```

## Déploiement sur Render (offre gratuite)

1. Render Dashboard → **New → Blueprint** → sélectionner ce dépôt : `render.yaml` crée la base
   PostgreSQL `cls-travel-db`, l'API `cls-travel-api` (Docker) et le front `cls-travel-web` (Node).
2. Renseigner les variables demandées : `RESEND_API_KEY` (obligatoire), `ADMIN_EMAIL`, `ADMIN_PASSWORD`,
   `CONTACT_EMAIL`, `NEXT_PUBLIC_GMAPS_KEY`.
3. Si Render attribue des URL différentes de `cls-travel-api.onrender.com` / `cls-travel-web.onrender.com`,
   corriger `APP_URL`, `CORS_ORIGINS` (API) et `NEXT_PUBLIC_API_URL`, `INTERNAL_API_URL`,
   `NEXT_PUBLIC_SITE_URL` (front), puis redéployer le front.
4. Créer l'administrateur (une fois) depuis votre poste, avec l'« External Database URL » de la base :
   ```bash
   DATABASE_URL='<external-url>' ADMIN_EMAIL=… ADMIN_PASSWORD=… pnpm --filter @cls/api prisma:seed
   ```

Les migrations Prisma s'appliquent au démarrage de l'API ; chaque push sur `main` redéploie.
Limites de l'offre gratuite : mise en veille après 15 min (réveil ≈ 1 min), **fichiers téléversés perdus
à chaque redéploiement** (disque éphémère), base gratuite expirant après 30 jours.

## Production (VPS OVHcloud — alternative Docker Compose)

```bash
# Première installation sur le VPS (Ubuntu 24.04 + Docker)
git clone https://github.com/<owner>/CLS-Travel.git /opt/cls-travel && cd /opt/cls-travel
cp .env.example .env    # remplir tous les secrets
CERTBOT_EMAIL=admin@carthagoloisirs.com ./infra/certbot/init-letsencrypt.sh
docker compose up -d
docker compose run --rm backend npx prisma migrate deploy
docker compose run --rm backend npx prisma db seed   # destinations + super admin
# Sauvegarde quotidienne chiffrée
echo "15 3 * * * /opt/cls-travel/infra/backup/backup.sh >> /var/log/cls-backup.log 2>&1" | crontab -
```

Ensuite, chaque push sur `main` déclenche `.github/workflows/deploy.yml` :
tests → images `ghcr.io/<owner>/cls-travel/{api,web}` → déploiement SSH → migrations → health check
(rollback automatique vers l'image précédente en cas d'échec).

Secrets GitHub : `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_SSH_KNOWN_HOSTS`.
Variables GitHub : `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GMAPS_KEY`,
`VPS_APP_DIR`.

Voir `CLAUDE.md` pour les conventions, le schéma de données et les règles de sécurité.
