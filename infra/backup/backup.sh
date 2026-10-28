#!/usr/bin/env bash
# Sauvegarde quotidienne PostgreSQL chiffrée, stockée localement sur le VPS (rétention 30 jours)
# Cron (VPS) : 15 3 * * * /opt/cls-travel/infra/backup/backup.sh >> /var/log/cls-backup.log 2>&1
# Prérequis hôte : docker, openssl
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
set -a; # shellcheck disable=SC1091
. "$ROOT/.env"; set +a

: "${BACKUP_ENCRYPTION_PASSPHRASE:?}"
BACKUP_DIR="${BACKUP_DIR:-/opt/cls-travel/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="$BACKUP_DIR/cls_travel_${STAMP}.sql.gz.enc"

# Dossier réservé à root (ou à l'utilisateur du cron) : les dumps restent illisibles par les autres comptes
umask 077
mkdir -p "$BACKUP_DIR"

echo "[$(date -u)] dump → $FILE"
docker compose -f "$ROOT/docker-compose.yml" exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=plain --no-owner \
  | gzip -9 \
  | openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass env:BACKUP_ENCRYPTION_PASSPHRASE \
  > "$FILE.partial"
# Renommage atomique : un fichier .enc présent est toujours complet
mv "$FILE.partial" "$FILE"

echo "[$(date -u)] purge des sauvegardes > ${RETENTION_DAYS}j"
find "$BACKUP_DIR" -maxdepth 1 -type f -name 'cls_travel_*.sql.gz.enc' -mtime +"$RETENTION_DAYS" -print -delete
find "$BACKUP_DIR" -maxdepth 1 -type f -name 'cls_travel_*.partial' -mmin +120 -delete
echo "[$(date -u)] ✓ sauvegarde terminée ($(du -h "$FILE" | cut -f1))"

# Restauration :
#   openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass env:BACKUP_ENCRYPTION_PASSPHRASE \
#     -in /opt/cls-travel/backups/<fichier>.sql.gz.enc | gunzip \
#     | docker compose exec -T postgres psql -U "$POSTGRES_USER" "$POSTGRES_DB"
