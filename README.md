# CLS Travel

Plateforme web de l'agence de voyage tunisienne **CLS Travel** (Carthago Loisirs) — [carthagoloisirs.com](https://carthagoloisirs.com).

| App | Stack | Port |
|-----|-------|------|
| `apps/web` | Next.js 15 (App Router), Tailwind CSS 3, shadcn/ui, TanStack Query v5, next-intl | 3000 |
| `apps/api` | NestJS 11, Prisma 6, PostgreSQL 16, Redis 7 | 4000 |
| `packages/shared` | Types, enums et constantes partagés | — |

## Démarrage local

```bash
pnpm install
docker compose -f docker-compose.dev.yml up -d       # Postgres + Redis
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
pnpm --filter @cls/shared build
pnpm dev
```

## Production (VPS OVHcloud)

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
