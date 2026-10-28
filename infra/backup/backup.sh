#!/usr/bin/env bash
# Sauvegarde quotidienne PostgreSQL chiffrée → OVHcloud Object Storage (rétention 30 jours)
# Cron (VPS) : 15 3 * * * /opt/cls-travel/infra/backup/backup.sh >> /var/log/cls-backup.log 2>&1
# Prérequis hôte : docker, openssl, aws-cli v2
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
set -a; # shellcheck disable=SC1091
. "$ROOT/.env"; set +a

: "${BACKUP_ENCRYPTION_PASSPHRASE:?}" "${OVH_S3_BACKUP_BUCKET:?}" "${OVH_S3_ENDPOINT:?}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="/tmp/cls_travel_${STAMP}.sql.gz.enc"

export AWS_ACCESS_KEY_ID="$OVH_S3_ACCESS_KEY" AWS_SECRET_ACCESS_KEY="$OVH_S3_SECRET_KEY" AWS_DEFAULT_REGION="$OVH_S3_REGION"
S3="aws --endpoint-url $OVH_S3_ENDPOINT s3"

echo "[$(date -u)] dump → $FILE"
docker compose -f "$ROOT/docker-compose.yml" exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=plain --no-owner \
  | gzip -9 \
  | openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass env:BACKUP_ENCRYPTION_PASSPHRASE \
  > "$FILE"

$S3 cp "$FILE" "s3://$OVH_S3_BACKUP_BUCKET/postgres/$(basename "$FILE")"
rm -f "$FILE"

echo "[$(date -u)] purge des sauvegardes > ${RETENTION_DAYS}j"
CUTOFF="$(date -u -d "-${RETENTION_DAYS} days" +%Y%m%d)"
$S3 ls "s3://$OVH_S3_BACKUP_BUCKET/postgres/" | awk '{print $4}' | while read -r key; do
  day="$(echo "$key" | sed -E 's/^cls_travel_([0-9]{8}).*/\1/')"
  if [[ "$day" =~ ^[0-9]{8}$ ]] && [[ "$day" < "$CUTOFF" ]]; then
    $S3 rm "s3://$OVH_S3_BACKUP_BUCKET/postgres/$key"
  fi
done
echo "[$(date -u)] ✓ sauvegarde terminée"

# Restauration :
#   aws s3 cp s3://$BUCKET/postgres/<file> - | openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 \
#     -pass env:BACKUP_ENCRYPTION_PASSPHRASE | gunzip | docker compose exec -T postgres psql -U $POSTGRES_USER $POSTGRES_DB
