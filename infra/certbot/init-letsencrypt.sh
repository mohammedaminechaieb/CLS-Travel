#!/usr/bin/env sh
# Émission initiale des certificats Let's Encrypt pour carthagoloisirs.com
set -eu

DOMAINS="carthagoloisirs.com www.carthagoloisirs.com api.carthagoloisirs.com"
PRIMARY="carthagoloisirs.com"
EMAIL="${CERTBOT_EMAIL:?CERTBOT_EMAIL requis}"
STAGING="${CERTBOT_STAGING:-0}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CONF="$ROOT/infra/certbot/conf"

mkdir -p "$CONF/live/$PRIMARY" "$ROOT/infra/certbot/www"

if [ ! -f "$CONF/live/$PRIMARY/fullchain.pem" ]; then
  echo "→ Certificat temporaire auto-signé"
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "$CONF/live/$PRIMARY/privkey.pem" \
    -out "$CONF/live/$PRIMARY/fullchain.pem" -subj "/CN=localhost"
fi

cd "$ROOT"
docker compose up -d nginx

echo "→ Suppression du certificat temporaire"
rm -rf "$CONF/live/$PRIMARY" "$CONF/archive/$PRIMARY" "$CONF/renewal/$PRIMARY.conf"

DOMAIN_ARGS=""
for d in $DOMAINS; do DOMAIN_ARGS="$DOMAIN_ARGS -d $d"; done
STAGING_ARG=""
[ "$STAGING" != "0" ] && STAGING_ARG="--staging"

echo "→ Demande du certificat Let's Encrypt"
# shellcheck disable=SC2086
docker compose run --rm --entrypoint certbot certbot certonly --webroot -w /var/www/certbot \
  $STAGING_ARG $DOMAIN_ARGS --cert-name "$PRIMARY" \
  --email "$EMAIL" --rsa-key-size 4096 --agree-tos --no-eff-email --force-renewal

docker compose exec nginx nginx -s reload
echo "✓ Certificats installés"
