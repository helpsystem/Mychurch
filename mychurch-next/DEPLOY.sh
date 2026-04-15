#!/bin/bash

# MyChurch Deployment Script
# استریپت استقرار MyChurch
# Usage: ./DEPLOY.sh

set -e

echo "================================"
echo "🚀 MyChurch Deployment Started"
echo "================================"
echo ""

# Step 1: Pull latest code
echo "📥 Step 1: Pulling latest code from GitHub..."
git pull origin main
echo "✓ Code pulled successfully"
echo ""

# Step 2: Install dependencies
echo "📦 Step 2: Installing dependencies..."
npm install --legacy-peer-deps
echo "✓ Dependencies installed"
echo ""

# Step 3: Build for production
echo "🔨 Step 3: Building for production..."
npm run build
echo "✓ Build completed successfully"
echo ""

# Step 4: Stop old process (if running)
echo "🛑 Step 4: Stopping old process..."
npm stop 2>/dev/null || echo "No running process"
echo ""

# Step 5: Start new process
echo "▶️  Step 5: Starting new process..."
npm start &
sleep 3
echo "✓ Process started"
echo ""

# Step 6: Clear cache notification
echo "⚠️  Step 6: Cache Clearing Instructions"
echo "   🌐 Clear browser cache in the following ways:"
echo "      - Chrome/Firefox: Press Ctrl+Shift+Delete"
echo "      - Then reload the page with Ctrl+F5 or Cmd+Shift+R"
echo "   🔄 Or use DevTools:"
echo "      - Right-click → Inspect → Network tab"
echo "      - Check 'Disable cache' option"
echo "      - Reload page (Ctrl+R)"
echo ""

echo "================================"
echo "✅ Deployment completed!"
echo "================================"
echo ""
echo "📊 What was deployed:"
echo "   ✓ Slide Preview Modal"
echo "   ✓ Preview Button (Eye icon)"
echo "   ✓ Bible Dropdown z-index Fix"
echo ""
echo "🧪 Testing checklist:"
echo "   - [ ] Try clicking preview button on slide"
echo "   - [ ] Verify modal opens correctly"
echo "   - [ ] Test verse copy functionality"
echo "   - [ ] Check Bible dropdown appears above content"
echo ""
