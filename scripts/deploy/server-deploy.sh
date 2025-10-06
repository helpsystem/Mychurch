#!/usr/bin/env bash
set -euo pipefail

# Usage: sudo bash /tmp/server-deploy.sh /tmp/Mychurch-deploy.zip
ZIP_PATH=${1:-/tmp/Mychurch-deploy.zip}
TARGET_DIR=/var/www/mychurch

echo "Deploying $ZIP_PATH to $TARGET_DIR"

if [ ! -f "$ZIP_PATH" ]; then
  echo "Zip file not found: $ZIP_PATH"
  exit 1
fi

mkdir -p /tmp/mychurch_extract
rm -rf /tmp/mychurch_extract/*
unzip -o "$ZIP_PATH" -d /tmp/mychurch_extract

mkdir -p "$TARGET_DIR"
rsync -a /tmp/mychurch_extract/ "$TARGET_DIR/"

chown -R www-data:www-data "$TARGET_DIR"
chmod -R 755 "$TARGET_DIR"

# Install Node.js if missing (Debian/Ubuntu)
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
  apt-get update
  apt-get install -y nodejs build-essential
fi

cd "$TARGET_DIR"

# Install pm2
if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

# Install dependencies (production)
if [ -f package-lock.json ]; then
  npm ci --omit=dev || npm install --production
else
  npm install --production
fi

# Build frontend
if npm run build; then
  echo "Frontend build completed"
else
  echo "Frontend build failed or not configured; continuing"
fi

# Ensure .env is present (operator must create it)
if [ ! -f .env ]; then
  echo ".env file not found in $TARGET_DIR — please create one with SUPABASE and DATABASE_URL values" >&2
  exit 2
fi

# Run importer (if attached_assets contains sqlite)
if [ -d attached_assets ]; then
  echo "Running Bible import script (if present)"
  if [ -f scripts/db/import-bible-data.js ]; then
    node scripts/db/import-bible-data.js || echo "Import script finished with errors (check logs)"
  else
    echo "No import script found"
  fi
fi

# Start backend with pm2
pm2 start backend/server.js --name mychurch-backend --time || pm2 restart mychurch-backend || true
pm2 save

echo "Deployment finished. Check pm2 status and logs." 
