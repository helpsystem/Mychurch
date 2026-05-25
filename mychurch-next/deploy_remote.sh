#!/bin/bash
set -e
cd /root/mychurch-v2/mychurch-next
export NEXT_TELEMETRY_DISABLED=1
export NEXT_DISABLE_ESLINT=1

current_swap_size=$(stat -c%s /swapfile 2>/dev/null || echo 0)
if [ ! -f /swapfile ] || [ "$current_swap_size" -lt 5368709120 ]; then
    echo "Allocating 5GB swap for npm/build operations..."
    swapoff /swapfile >/dev/null 2>&1 || true
    rm -f /swapfile
    (fallocate -l 5G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=5120) >/dev/null 2>&1
    chmod 600 /swapfile
    mkswap /swapfile >/dev/null 2>&1 || true
    swapon /swapfile >/dev/null 2>&1 || true
    free -h | grep Swap || echo "Swap configured"
fi

if [ -d node_modules ] && [ -f .deps-lock.json ] && cmp -s package-lock.json .deps-lock.json; then
    echo 'Dependencies unchanged, skipping npm install'
else
    echo "Installing dependencies..."
    if [ -d node_modules ]; then
        rm -rf node_modules
    fi
    npm install --legacy-peer-deps --no-audit --no-fund
    if [ $? -ne 0 ]; then
        echo "npm install failed, retrying after 10s..."
        sleep 10
        npm install --legacy-peer-deps --no-audit --no-fund || exit 1
    fi
    cp package-lock.json .deps-lock.json
    echo "Dependencies installed successfully"
fi

# Zero-Downtime build setup
echo "Setting up clean zero-downtime shadow build..."
BUILD_DIR="/root/mychurch-v2/mychurch-next-build-temp"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Copy all source files except node_modules, .next, and git directories
echo "Copying source files to shadow directory..."
rsync -a --exclude='node_modules' --exclude='.next' --exclude='.git' /root/mychurch-v2/mychurch-next/ "$BUILD_DIR/"

# Symlink node_modules from active directory to avoid massive disk usage
echo "Symlinking node_modules..."
ln -s /root/mychurch-v2/mychurch-next/node_modules "$BUILD_DIR/node_modules"

# Perform build inside shadow directory
cd "$BUILD_DIR"
rm -rf .next/cache .next/lock
export NODE_OPTIONS=--max-old-space-size=1536
export NEXT_PRIVATE_BUILD_WORKER=1
echo "Building Next.js in shadow directory (timeout: 120 minutes)..."
timeout 120m npm run build || (echo "Build failed, retrying after 30s..." && sleep 30 && timeout 120m npm run build)

# atomic swap of builds inside mychurch-next
echo "Performing zero-downtime build folder swap..."
rm -rf /root/mychurch-v2/mychurch-next/.next_old
if [ -d /root/mychurch-v2/mychurch-next/.next ]; then
    mv /root/mychurch-v2/mychurch-next/.next /root/mychurch-v2/mychurch-next/.next_old
fi
mv "$BUILD_DIR/.next" /root/mychurch-v2/mychurch-next/.next

# Restart service instantly
echo "Restarting mychurch-next PM2 process..."
if pm2 show mychurch-next > /dev/null 2>&1; then
    pm2 restart mychurch-next --update-env
else
    pm2 start npm --name 'mychurch-next' --max-memory-restart 800M -- start
fi
pm2 save

# Clean up shadow folders
rm -rf "$BUILD_DIR"
rm -rf /root/mychurch-v2/mychurch-next/.next_old

echo "Remote deploy script finished with zero-downtime!"
