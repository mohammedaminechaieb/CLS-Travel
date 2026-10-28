#!/usr/bin/env bash
# Exécuté sur le VPS par GitHub Actions (stdin). Variables : APP_DIR, IMAGE_TAG,
# GHCR_IMAGE_PREFIX, GHCR_USER, GHCR_TOKEN. Rollback automatique si le health check échoue.
set -euo pipefail
cd "$APP_DIR"

[ -f .env ] || { echo "Fichier $APP_DIR/.env manquant"; exit 1; }
PREVIOUS_TAG="$(cat .deployed_tag 2>/dev/null || echo latest)"

echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin >/dev/null
export IMAGE_TAG GHCR_IMAGE_PREFIX

compose() { docker compose --env-file .env "$@"; }

echo "→ Pull des images ${IMAGE_TAG:0:12}"
compose pull backend frontend

echo "→ Démarrage des dépendances"
compose up -d postgres redis

echo "→ Migrations Prisma"
compose run --rm --no-deps backend npx prisma migrate deploy

echo "→ Redémarrage des services"
compose up -d --remove-orphans backend frontend nginx

healthy() {
  for _ in $(seq 1 30); do
    if compose exec -T backend wget -qO- http://127.0.0.1:4000/health >/dev/null 2>&1 \
      && compose exec -T frontend wget -qO- http://127.0.0.1:3000/ >/dev/null 2>&1; then
      return 0
    fi
    sleep 3
  done
  return 1
}

if healthy; then
  echo "$IMAGE_TAG" > .deployed_tag
  compose exec -T nginx nginx -s reload || true
  docker image prune -af --filter "until=168h" >/dev/null || true
  echo "✓ Déploiement ${IMAGE_TAG:0:12} réussi"
else
  echo "✗ Health check KO — rollback vers ${PREVIOUS_TAG:0:12}"
  IMAGE_TAG="$PREVIOUS_TAG" compose up -d backend frontend
  exit 1
fi
