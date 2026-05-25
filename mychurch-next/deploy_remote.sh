#!/bin/bash
# Zero-Downtime deploy script for mychurch-next
# Strategy: Build in .next.new alongside live .next, then swap atomically

set -e
DEPLOY_DIR="/root/mychurch-v2/mychurch-next"
cd "$DEPLOY_DIR"

export NEXT_TELEMETRY_DISABLED=1
export NEXT_DISABLE_ESLINT=1
export NODE_OPTIONS=--max-old-space-size=1536
export NEXT_PRIVATE_BUILD_WORKER=1

# ─── 1. ENSURE SWAP ────────────────────────────────────────────────────────────
current_swap_size=$(stat -c%s /swapfile 2>/dev/null || echo 0)
if [ ! -f /swapfile ] || [ "$current_swap_size" -lt 5368709120 ]; then
    echo "[deploy] Allocating 5GB swap..."
    swapoff /swapfile >/dev/null 2>&1 || true
    rm -f /swapfile
    (fallocate -l 5G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=5120) >/dev/null 2>&1
    chmod 600 /swapfile
    mkswap /swapfile >/dev/null 2>&1 || true
    swapon /swapfile >/dev/null 2>&1 || true
    echo "[deploy] Swap ready: $(free -h | grep Swap)"
fi

# ─── 2. INSTALL DEPS (only if changed) ─────────────────────────────────────────
if [ -d node_modules ] && [ -f .deps-lock.json ] && cmp -s package-lock.json .deps-lock.json; then
    echo "[deploy] Dependencies unchanged, skipping npm install."
else
    echo "[deploy] Installing dependencies..."
    rm -rf node_modules
    npm install --legacy-peer-deps --no-audit --no-fund || {
        echo "[deploy] npm install failed, retrying in 15s..."
        sleep 15
        npm install --legacy-peer-deps --no-audit --no-fund
    }
    cp package-lock.json .deps-lock.json
    echo "[deploy] Dependencies installed."
fi

# ─── 3. BUILD INTO .next.new (live site continues using .next) ──────────────────
echo "[deploy] Starting build into .next.new (live site stays up)..."
rm -rf .next.new
NEXT_DIST_DIR=".next.new" timeout 120m npm run build 2>&1 || {
    echo "[deploy] Build failed on first try, cleaning cache and retrying..."
    rm -rf .next.new
    sleep 30
    NEXT_DIST_DIR=".next.new" timeout 120m npm run build 2>&1
}

# Verify build was successful (check for key files)
if [ ! -f ".next.new/BUILD_ID" ] || [ ! -f ".next.new/build-manifest.json" ]; then
    echo "[deploy] ERROR: Build incomplete! Missing BUILD_ID or build-manifest.json. Aborting swap."
    rm -rf .next.new
    exit 1
fi
echo "[deploy] Build verified successfully."

# ─── 4. ATOMIC SWAP ────────────────────────────────────────────────────────────
echo "[deploy] Performing atomic .next swap..."
rm -rf .next.old
if [ -d .next ]; then
    mv .next .next.old
fi
mv .next.new .next
echo "[deploy] Swap complete. New build is now active."

# ─── 5. RESTART PM2 ────────────────────────────────────────────────────────────
echo "[deploy] Restarting mychurch-next via PM2..."
if pm2 show mychurch-next > /dev/null 2>&1; then
    pm2 restart mychurch-next --update-env
else
    pm2 start npm --name 'mychurch-next' --max-memory-restart 800M -- start
fi
pm2 save
echo "[deploy] PM2 restarted."

# ─── 6. CLEANUP ────────────────────────────────────────────────────────────────
rm -rf .next.old
echo "[deploy] Done! Zero-downtime deploy complete."
