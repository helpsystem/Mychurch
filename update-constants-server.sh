#!/bin/bash
# Update constants.ts on server

cd /root/Mychurch/lib || exit 1

# Backup original
cp constants.ts constants.ts.backup

# Update DEFAULT_AVATAR_URL
sed -i "s|export const DEFAULT_AVATAR_URL = 'https://i.imgur.com/gA0939q.png';|export const DEFAULT_AVATAR_URL = '/images/church-logo-hq.png';|" constants.ts

# Update CHURCH_LOGO_URL  
sed -i "s|export const CHURCH_LOGO_URL = '/images/Church_cross_logo_design_bae53bfc.png';|export const CHURCH_LOGO_URL = '/images/church-logo-hq.png';|" constants.ts

echo "✅ Constants updated successfully"
echo ""
echo "New values:"
grep "DEFAULT_AVATAR_URL\|CHURCH_LOGO_URL" constants.ts
