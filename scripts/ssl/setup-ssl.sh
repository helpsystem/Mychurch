#!/bin/bash
set -e

echo "🚀 Starting SSL setup for $DOMAIN..."

# Wait for nginx to be ready
sleep 10

# Check if certificate already exists
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "✅ SSL certificate already exists for $DOMAIN"
    exit 0
fi

# Create webroot directory
mkdir -p /usr/share/nginx/html/.well-known/acme-challenge

# Obtain certificate
certbot certonly \
    --webroot \
    --webroot-path=/usr/share/nginx/html \
    --email $SSL_EMAIL \
    --agree-tos \
    --no-eff-email \
    --domains $DOMAIN \
    --non-interactive

if [ $? -eq 0 ]; then
    echo "✅ SSL certificate obtained successfully"
    
    # Setup auto-renewal
    echo "0 0,12 * * * certbot renew --quiet --post-hook 'docker-compose restart nginx'" | crontab -
    echo "✅ Auto-renewal configured"
else
    echo "❌ Failed to obtain SSL certificate"
    exit 1
fi