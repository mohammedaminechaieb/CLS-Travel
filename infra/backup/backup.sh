#!/usr/bin/env bash
# Sauvegarde quotidienne PostgreSQL chiffrée → Cloudflare R2 (rétention 30 jours)
# Cron (VPS) : 15 3 * * * /opt/cls-travel/infra/backup/backup.sh >> /var/log/cls-backup.log 2>&1
# Prérequis hôte : docker, openssl, aws-cli v2
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
set -a; # shellcheck disable=SC1091
. "$ROOT/.env"; set +a

: "${BACKUP_ENCRYPTION_PASSPHRASE:?}" "${R2_BACKUP_BUCKET:?}" "${R2_ENDPOINT:?}" "${R2_ACCESS_KEY:?}" "${R2_SECRET_KEY:?}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="/tmp/cls_travel_${STAMP}.sql.gz.enc"

export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY" AWS_SECRET_ACCESS_KEY="$R2_SECRET_KEY" AWS_DEFAULT_REGION="${R2_REGION:-auto}"
# R2 : sommes de contrôle uniquement lorsqu'elles sont exigées (aws-cli ≥ 2.23)
export AWS_REQUEST_CHECKSUM_CALCULATION=when_required AWS_RESPONSE_CHECKSUM_VALIDATION=when_required
S3="aws --endpoint-url $R2_ENDPOINT s3"

echo "[$(date -u)] dump → $FILE"
docker compose -f "$ROOT/docker-compose.yml" exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=plain --no-owner \
  | gzip -9 \
  | openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass env:BACKUP_ENCRYPTION_PASSPHRASE \
  > "$FILE"

$S3 cp "$FILE" "s3://$R2_BACKUP_BUCKET/postgres/$(basename "$FILE")"
rm -f "$FILE"

echo "[$(date -u)] purge des sauvegardes > ${RETENTION_DAYS}j"
CUTOFF="$(date -u -d "-${RETENTION_DAYS} days" +%Y%m%d)"
$S3 ls "s3://$R2_BACKUP_BUCKET/postgres/" | awk '{print $4}' | while read -r key; do
  day="$(echo "$key" | sed -E 's/^cls_travel_([0-9]{8}).*/\1/')"
  if [[ "$day" =~ ^[0-9]{8}$ ]] && [[ "$day" < "$CUTOFF" ]]; then
    $S3 rm "s3://$R2_BACKUP_BUCKET/postgres/$key"
  fi
done
echo "[$(date -u)] ✓ sauvegarde terminée"

# Restauration :
#   aws s3 cp s3://$BUCKET/postgres/<file> - | openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 \
#     -pass env:BACKUP_ENCRYPTION_PASSPHRASE | gunzip | docker compose exec -T postgres psql -U $POSTGRES_USER $POSTGRES_DB
