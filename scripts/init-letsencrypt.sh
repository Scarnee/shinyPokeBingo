#!/bin/bash
# Usage: DOMAIN=yourdomain.com EMAIL=your@email.com ./scripts/init-letsencrypt.sh
# Run once on the EC2 after pointing your domain's DNS to the instance.

set -e

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "Usage: DOMAIN=yourdomain.com EMAIL=you@example.com $0"
  exit 1
fi

echo "→ Requesting Let's Encrypt certificate for $DOMAIN"

docker run --rm \
  -v /opt/pokemon-bingo/certbot/conf:/etc/letsencrypt \
  -v /opt/pokemon-bingo/certbot/www:/var/www/certbot \
  -p 80:80 \
  certbot/certbot certonly \
  --standalone \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN"

echo "→ Certificate obtained. Update nginx.conf to enable SSL, then restart:"
echo "   docker compose -f docker-compose.prod.yml up -d --force-recreate frontend"
