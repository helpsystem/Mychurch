#!/bin/bash
# Fix and rebuild on server

cd /root/Mychurch

# Remove broken test pages
rm -f pages/BibleSyncTestPage.tsx
rm -f pages/WorshipSyncTestPage.tsx

# Remove imports from App.tsx
sed -i '/import.*BibleSyncTestPage/d' App.tsx
sed -i '/import.*WorshipSyncTestPage/d' App.tsx

# Remove routes from App.tsx  
sed -i '/Route.*bible\/sync-test/d' App.tsx
sed -i '/Route.*worship\/sync-test/d' App.tsx

# Build
npm run build

# Restart
pm2 restart all

echo "✅ Deployment complete!"
