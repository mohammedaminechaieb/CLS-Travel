# CLS Travel — Guide de référence pour Claude Code

> Agence de voyage · `carthagoloisirs.com` · OVHcloud VPS
> Société : **CLS Travel**
> Stack : Next.js 15 + NestJS + PostgreSQL 16 + Redis + Docker

---

## 1. Règles de commit (OBLIGATOIRE)

**Chaque fonctionnalité = un commit séparé.** Ne jamais grouper plusieurs modules dans un seul commit.

Format des commits :
```
feat(module): description courte en anglais

- détail 1
- détail 2
```

Exemples de commits attendus dans l'ordre :
```
feat(infra): monorepo structure + docker-compose + nginx config
feat(db): prisma schema — all tables and relations
feat(auth): JWT register/login/refresh/verify-email (NestJS)
feat(users): CRUD users + RBAC guards + roles decorator
feat(packages): travel packages CRUD + slug + i18n fields
feat(destinations): destinations table + seed data
feat(bookings): booking workflow + status machine + reference gen
feat(payments): stripe intent + webhook handler + deposit logic
feat(reviews): review submit + admin moderation
feat(blog): blog posts CRUD + Tiptap content + slug
feat(notifications): in-app + email notifications module
feat(analytics): KPI endpoints + revenue reports
feat(frontend-public): landing page + hero + search bar
feat(frontend-catalogue): packages list + filters + pagination
feat(frontend-package): package detail page + gallery + booking CTA
feat(frontend-booking): 3-step booking tunnel + stripe elements
feat(frontend-client): client portal — dashboard + bookings + docs
feat(frontend-admin): admin dashboard + KPIs + tables
feat(i18n): next-intl FR/AR/EN + RTL support
feat(ci-cd): github actions workflow — test + build + deploy
```

---

## 2. Contexte projet

**CLS Travel** (Carthago Loisirs) est une agence de voyage tunisienne.
- Domaine : `carthagoloisirs.com`
- Hébergement : OVHcloud VPS (Ubuntu 24.04 LTS)
- Repo GitHub : `CLS-Travel` (organisation ou compte personnel)

---

## 3. Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui |
| État client | TanStack Query v5 |
| Backend API | NestJS + TypeScript |
| ORM | Prisma ORM |
| Base de données | PostgreSQL 16 |
| Cache / Rate-limit | Redis 7 |
| Auth | JWT access (15min) + refresh (7j) en HttpOnly cookie, haché en BDD |
| Paiement | Aucun paiement en ligne pour l'instant (Stripe retiré, phase ultérieure) — règlement auprès du conseiller |
| Emails | Resend (transactionnel) |
| Storage | Disque local du backend (`/app/uploads`, volume Docker `cls_uploads_data`), servi sur `https://api.carthagoloisirs.com/uploads/` |
| Déploiement | Docker Compose + Nginx + Certbot Let's Encrypt |
| CI/CD | GitHub Actions |

---

## 4. Structure du monorepo

```
cls-travel/
├── apps/
│   ├── web/              # Next.js 15 frontend
│   │   ├── app/
│   │   │   ├── (public)/     # landing, catalogue, fiche, blog, contact
│   │   │   ├── (auth)/       # login, register, reset-password
│   │   │   ├── (client)/     # portail client authentifié
│   │   │   └── (admin)/      # back-office admin
│   │   ├── components/       # UI partagé
│   │   ├── lib/              # api-client, hooks, utils
│   │   └── i18n/             # dictionnaires FR/AR/EN
│   └── api/              # NestJS backend
│       └── src/
│           ├── auth/
│           ├── users/
│           ├── packages/
│           ├── destinations/
│           ├── bookings/
│           ├── payments/
│           ├── reviews/
│           ├── blog/
│           ├── notifications/
│           └── analytics/
├── packages/
│   └── shared/           # types TypeScript partagés, DTOs, constantes
├── infra/
│   ├── nginx/
│   │   └── nginx.conf
│   └── certbot/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
└── CLAUDE.md             # ce fichier
```

---

## 5. Base de données — Schéma Prisma complet

### Tables principales

**users**
- id (uuid PK), email (unique), password_hash (bcrypt, nullable OAuth)
- role: enum(super_admin, manager, agent, client)
- first_name, last_name, phone (E.164), avatar_url
- is_verified (boolean), refresh_token_hash (varchar)
- created_at, updated_at (auto Prisma)

**packages** (offres voyage)
- id (uuid), slug (unique, SEO), status: enum(draft, published, archived)
- title_fr, title_ar, title_en, description_fr, description_ar, description_en
- destination_id (FK → destinations.id)
- category: enum(circuit, sejour, excursion, omra, affaires)
- duration_days (int), base_price (numeric 10,3 TND), max_capacity (int)
- gallery_urls (text[]), itinerary (jsonb — programme jour/jour)
- included (text[]), excluded (text[]), featured (boolean)

**bookings** (réservations)
- id (uuid), reference (unique — ex. CLS-2026-00142)
- user_id (FK → users), package_id (FK → packages)
- departure_date (date), return_date (date)
- participants (jsonb — [{nom, prenom, passport, dob}])
- total_price (numeric 10,3), paid_amount (numeric 10,3)
- status: enum(pending, confirmed, cancelled, completed)
- assigned_agent_id (FK → users, nullable), notes_internal (text)

**payments** (transactions)
- id (uuid), booking_id (FK → bookings)
- stripe_payment_intent_id (varchar unique) — colonne conservée en BDD, inutilisée tant que le paiement en ligne est différé
- amount (numeric 10,3), currency (char 3 — TND/EUR/USD)
- status: enum(pending, succeeded, failed, refunded)
- payment_type: enum(deposit, balance, full), paid_at (timestamptz)

**destinations**
- id, name_fr, name_ar, name_en, country, region, cover_url, description

**reviews**
- id, booking_id (FK), rating (1-5), comment (text)
- is_approved (boolean, default false), created_at

**blog_posts**
- id, slug (unique), title_fr/ar/en, body (jsonb Tiptap)
- author_id (FK → users), published_at (nullable), tags (text[])
- cover_url, excerpt_fr/ar/en, status: enum(draft, published)

**promo_codes**
- id, code (unique), discount_type: enum(percent, fixed)
- value (numeric), expires_at, max_uses (int), current_uses (int)
- is_active (boolean), applicable_packages (uuid[], null = tous)

**messages**
- id, booking_id (FK), sender_id (FK → users)
- body (text), is_read (boolean), created_at

**audit_logs**
- id, actor_id (FK → users), action (varchar)
- resource_type (varchar), resource_id (uuid)
- payload (jsonb), ip (varchar), user_agent, created_at

**notifications**
- id, user_id (FK → users), type (varchar)
- payload (jsonb), is_read (boolean), created_at

---

## 6. Rôles et permissions (RBAC)

| Rôle | Permissions |
|------|-------------|
| `super_admin` | Accès total — gestion utilisateurs, config système, audit logs, clés API |
| `manager` | Dashboard KPI, validation réservations, gestion offres, rapports financiers, CRM |
| `agent` | Réservations assignées, messagerie clients, fiches clients (lecture), docs voyage |
| `client` | Espace client personnel — réservations propres, paiements, documents, messagerie |
| `visitor` | Catalogue public, blog, formulaire contact, inscription uniquement |

Implémentation : Guards NestJS + décorateur `@Roles()` sur chaque controller.

---

## 7. Sécurité — règles à respecter

1. **JWT** : access token 15min, refresh token 7j en HttpOnly cookie, haché en BDD avec bcrypt
2. **HTTPS** : Let's Encrypt via Certbot, HSTS `max-age=31536000`
3. **Helmet.js** : CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
4. **Rate limiting** : Redis + NestJS throttler — 100 req/min API publique, 10 req/min sur `/auth/login`
5. **PCI-DSS** : jamais de numéro de carte en BDD ni sur le site (aucun paiement en ligne actuellement)
6. **Validation** : `class-validator` + `class-transformer` sur tous les DTOs NestJS
7. **CORS** : origines autorisées `carthagoloisirs.com` et `www.carthagoloisirs.com` uniquement
8. **Audit logs** : toute action sensible loguée (login, paiement, modif rôle, suppression)
9. **Backups** : pg_dump quotidien chiffré → `/opt/cls-travel/backups/` sur le VPS, rétention 30j
10. **Secrets** : variables `.env` uniquement, jamais en dur dans le code, `.env` dans `.gitignore`

---

## 8. Design — tokens et guidelines

### Palette couleurs
```css
--color-primary:    #1C3A5E;  /* Bleu méditerranéen — nav, boutons primaires */
--color-accent:     #B8872A;  /* Or carthaginois — badges, highlights */
--color-cta:        #C85A2A;  /* Terracotta — boutons CTA "Réserver" */
--color-bg:         #FAF8F3;  /* Ivoire chaud — fond pages */
--color-surface:    #FFFFFF;  /* Cartes, modals */
--color-text:       #1A1612;  /* Corps texte */
--color-text-muted: #5A5042;  /* Texte secondaire */
```

### Typographie
- Titres / Hero : **Playfair Display** (serif, élégant)
- Corps / UI : **Inter** (sans-serif, lisible)
- Admin / Mono : **Inter** uniquement (lisibilité données)

### Grille et breakpoints
- Breakpoints : 640px (sm), 768px (md), 1024px (lg), 1280px (xl)
- Spacing scale : 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64px
- Colonnes : 12 colonnes, max-width 1280px centré

### Accessibilité
- Contraste WCAG 2.1 AA (≥ 4.5:1)
- Focus visible sur tous les éléments interactifs
- ARIA labels sur formulaires et icônes
- Alt text obligatoire sur toutes les images

---

## 9. Modules NestJS — endpoints attendus

| Module | Endpoints clés |
|--------|---------------|
| auth | POST /auth/register, /auth/login, /auth/refresh, /auth/logout, /auth/verify-email, /auth/forgot-password |
| users | GET /users/me, PATCH /users/me, GET /admin/users, PATCH /admin/users/:id/role |
| packages | GET /packages, GET /packages/:slug, POST /admin/packages, PATCH /admin/packages/:id, DELETE /admin/packages/:id |
| bookings | POST /bookings, GET /bookings/:id, GET /client/bookings, GET /admin/bookings, PATCH /admin/bookings/:id/status |
| payments | — (module retiré : paiement en ligne différé ; la table `payments` est conservée) |
| reviews | POST /reviews, GET /packages/:slug/reviews, PATCH /admin/reviews/:id/approve |
| blog | GET /blog, GET /blog/:slug, POST /admin/blog, PATCH /admin/blog/:id |
| notifications | GET /notifications, PATCH /notifications/:id/read |
| analytics | GET /admin/analytics/revenue, GET /admin/analytics/bookings, GET /admin/analytics/top-packages |

---

## 10. Variables d'environnement requises (.env.example)

```env
# App
NODE_ENV=production
APP_URL=https://carthagoloisirs.com
API_URL=https://api.carthagoloisirs.com

# Database
DATABASE_URL=postgresql://clsuser:PASSWORD@postgres:5432/cls_travel

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_ACCESS_SECRET=<random-64-chars>
JWT_REFRESH_SECRET=<random-64-chars>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Resend (expéditeur : noreply@carthagoloisirs.com, constante MAIL_FROM)
RESEND_API_KEY=re_...

# Google Maps
NEXT_PUBLIC_GMAPS_KEY=...

# Admin par défaut (seed)
ADMIN_EMAIL=admin@cls-travel.com
ADMIN_PASSWORD=<strong-password>
```

---

## 11. Docker Compose — services

5 services en production :
- `frontend` : Next.js standalone — port interne 3000
- `backend` : NestJS — port interne 4000
- `postgres` : PostgreSQL 16 alpine — port 5432, volume persistant
- `redis` : Redis 7 alpine — port 6379
- `nginx` : reverse proxy 80→443, ssl, rate-limit — ports 80 et 443

Nginx route :
- `carthagoloisirs.com` → frontend:3000
- `api.carthagoloisirs.com` → backend:4000

---

## 12. Roadmap de build — ordre recommandé

### Phase 1 — Fondations (commits 1-4)
1. Monorepo structure + docker-compose + nginx config + .env.example
2. Prisma schema complet + migrations + seed destinations
3. NestJS : module auth (register, login, JWT, refresh, verify-email)
4. NestJS : module users + RBAC guards + roles decorator

### Phase 2 — Données et logique métier (commits 5-10)
5. NestJS : module packages (CRUD + slug + i18n)
6. NestJS : module bookings (workflow + states + reference CLS-YYYY-XXXXX)
7. NestJS : module payments (Stripe intent + webhook + deposit 30%) — retiré depuis, paiement différé
8. NestJS : module reviews + modération
9. NestJS : module blog (Tiptap content)
10. NestJS : module notifications + analytics

### Phase 3 — Frontend public (commits 11-14)
11. Next.js : landing page (hero + search + featured packages + testimonials)
12. Next.js : catalogue voyages (filtres + pagination + cards)
13. Next.js : fiche voyage détaillée (galerie + programme + CTA réservation)
14. Next.js : tunnel réservation 3 étapes (voyageurs → récapitulatif → confirmation, sans paiement)

### Phase 4 — Portails (commits 15-17)
15. Next.js : espace client (dashboard + réservations + paiements + docs)
16. Next.js : back-office admin (KPIs + gestion voyages + réservations + CRM)
17. Next.js : blog public + pages légales + contact

### Phase 5 — Finitions (commits 18-20)
18. i18n next-intl FR/AR/EN + RTL arabe
19. Optimisation performance + SEO (metadata, sitemap, og:image)
20. GitHub Actions CI/CD (test → build → push → deploy SSH)

---

## 13. Commandes et exploitation (état actuel du dépôt)

```bash
pnpm install                                   # installe tout le monorepo (pnpm 9)
docker compose -f docker-compose.dev.yml up -d # Postgres 16 + Redis 7 en local
pnpm --filter @cls/shared build                # à refaire après modification de packages/shared
pnpm --filter @cls/api prisma:migrate          # nouvelle migration (dev)
SEED_DEMO=true pnpm --filter @cls/api prisma:seed  # destinations + admin (+ données de démo)
pnpm dev                                       # API :4000 + web :3000
pnpm -r typecheck && pnpm --filter @cls/web lint && pnpm --filter @cls/api test
pnpm build                                     # shared → api → web (standalone)
```

- **i18n** : locale par cookie `NEXT_LOCALE` puis `Accept-Language` (pas de préfixe d'URL).
  Toute chaîne UI va dans `apps/web/i18n/messages/{fr,ar,en}.json` (mêmes clés partout).
- **Auth front** : access token en mémoire (`useAuth().request`), refresh via cookie HttpOnly `cls_rt` (path `/auth`).
- **Événements** : les modules métier émettent des événements (`common/events`), le module
  notifications envoie in-app + Resend (`mail/mail.service.ts`). Ne pas appeler le mail directement depuis un service métier.
- **Paiements** : différés à une phase ultérieure (Stripe retiré). Une réservation valide est créée
  directement `confirmed` (`INITIAL_BOOKING_STATUS` dans `bookings/bookings.service.ts`) ; le règlement
  se fait auprès du conseiller. Les tables `payments` / `stripe_events` restent dans le schéma.
- **PDF** : Puppeteer (`puppeteer-core`) + Chromium système (`CHROMIUM_PATH`).
- **CI/CD** : `.github/workflows/deploy.yml` (tests → images ghcr.io → SSH → `prisma migrate deploy`
  → health check avec rollback). Secrets : `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_SSH_KNOWN_HOSTS`.
- **Fichiers téléversés** : `media/media.service.ts` écrit dans `UPLOAD_DIR` (`/app/uploads` dans le conteneur),
  `ServeStaticModule` les sert sur `/uploads` ; URL publique = `${API_URL}/uploads/<fichier>`.
- **Sauvegardes** : `infra/backup/backup.sh` (cron quotidien sur le VPS) → `/opt/cls-travel/backups/` (chiffré, 30 j).
