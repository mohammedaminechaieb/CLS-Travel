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

## Production

```bash
cp .env.example .env    # remplir tous les secrets
./infra/certbot/init-letsencrypt.sh
docker compose up -d
```

Voir `CLAUDE.md` pour les conventions, le schéma de données et les règles de sécurité.
