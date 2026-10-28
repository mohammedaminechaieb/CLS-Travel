# Certbot — Let's Encrypt

Les certificats sont stockés dans `infra/certbot/conf` (ignoré par git) et le challenge
webroot dans `infra/certbot/www`.

## Première émission

Nginx refuse de démarrer sans certificat. Lancer `init-letsencrypt.sh` sur le VPS :

```bash
CERTBOT_EMAIL=admin@carthagoloisirs.com ./infra/certbot/init-letsencrypt.sh
```

Le script :
1. crée un certificat auto-signé temporaire pour que Nginx démarre ;
2. démarre Nginx ;
3. demande le vrai certificat (carthagoloisirs.com, www, api) via webroot ;
4. recharge Nginx.

## Renouvellement

```bash
docker compose --profile certbot up -d certbot   # boucle `certbot renew` toutes les 12h
docker compose exec nginx nginx -s reload        # (cron hebdomadaire recommandé)
```
