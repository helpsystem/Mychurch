#!/usr/bin/env bash
set -euo pipefail

# ====== تنظیمات ======
DOMAIN="n8n.samanabyar.online"
EMAIL="help.system@ymail.com"
N8N_USER="admin"
N8N_PASSWORD="Iranian@1989"
ENCRYPTION_KEY="$(openssl rand -hex 32)"
DB_PASSWORD="$(openssl rand -hex 16)"

# ====== آماده‌سازی مسیرها ======
echo "Creating directories..."
mkdir -p ~/n8n/{data,postgres,backups,caddy_data,caddy_config}
cd ~/n8n

# ====== فایل .env ======
echo "Creating .env file..."
cat > .env <<EOF
# ---------- n8n core ----------
N8N_HOST=${DOMAIN}
N8N_PORT=5678
N8N_PROTOCOL=https
WEBHOOK_URL=https://${DOMAIN}/
VUE_APP_URL_BASE_API=https://${DOMAIN}/
N8N_ENCRYPTION_KEY=${ENCRYPTION_KEY}

# Basic Auth
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=${N8N_USER}
N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}

# Timezone
GENERIC_TIMEZONE=Asia/Tehran

# Postgres
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=postgres
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=n8n
DB_POSTGRESDB_PASSWORD=${DB_PASSWORD}

# Caddy
CADDY_ADMIN_EMAIL=${EMAIL}

# Misc
N8N_PAYLOAD_SIZE_MAX=32mb
N8N_DIAGNOSTICS_ENABLED=false
N8N_SECURE_COOKIE=false
EOF

echo ""
echo "✅ Credentials generated:"
echo "   n8n user:     ${N8N_USER}"
echo "   n8n password: ${N8N_PASSWORD}"
echo "   DB password:  ${DB_PASSWORD}"
echo ""

# ====== docker-compose.yml ======
echo "Creating docker-compose.yml..."
cat > docker-compose.yml <<'EOF'
version: "3.8"

services:
  n8n:
    image: n8nio/n8n:1.119.1
    container_name: n8n
    restart: unless-stopped
    env_file: .env
    environment:
      - NODE_ENV=production
    volumes:
      - ./data:/home/node/.n8n
    depends_on:
      - postgres
    networks:
      - web
      - internal

  postgres:
    image: postgres:15-alpine
    container_name: n8n-postgres
    restart: unless-stopped
    env_file: .env
    environment:
      - POSTGRES_DB=${DB_POSTGRESDB_DATABASE}
      - POSTGRES_USER=${DB_POSTGRESDB_USER}
      - POSTGRES_PASSWORD=${DB_POSTGRESDB_PASSWORD}
    volumes:
      - ./postgres:/var/lib/postgresql/data
    networks:
      - internal
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U n8n"]
      interval: 10s
      timeout: 5s
      retries: 5

  caddy:
    image: caddy:2
    container_name: n8n-caddy
    restart: unless-stopped
    ports:
      - "8080:80"
      - "8443:443"
    environment:
      - DOMAIN=${N8N_HOST}
      - EMAIL=${CADDY_ADMIN_EMAIL}
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - ./caddy_data:/data
      - ./caddy_config:/config
    networks:
      - web
      - internal

networks:
  web:
  internal:
    internal: true
EOF

# ====== Caddyfile ======
echo "Creating Caddyfile..."
cat > Caddyfile <<EOF
{
  email ${EMAIL}
}

${DOMAIN} {
  encode gzip
  reverse_proxy n8n:5678
  
  header {
    Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    X-Content-Type-Options "nosniff"
    X-Frame-Options "SAMEORIGIN"
    Referrer-Policy "strict-origin-when-cross-origin"
  }
}
EOF

echo ""
echo "✅ Files created successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Add DNS A record: n8n.samanabyar.online -> $(curl -s ifconfig.me)"
echo "   2. Open firewall: ufw allow 8443/tcp"
echo "   3. Start services: docker compose pull && docker compose up -d"
echo "   4. Check logs: docker compose logs -f"
echo "   5. Access: https://n8n.samanabyar.online"
echo ""
