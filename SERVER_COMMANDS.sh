# دستورات برای اجرا در سرور (SSH)
# شما الان در سرور هستید، این دستورات را copy-paste کنید

# ═══════════════════════════════════════════════════════════
# مرحله 1: بررسی PM2 processes
# ═══════════════════════════════════════════════════════════
pm2 list

# ═══════════════════════════════════════════════════════════
# مرحله 2: اجرای Migration (با syntax صحیح)
# ═══════════════════════════════════════════════════════════
PGPASSWORD='MyChurch2024Secure!' psql -h localhost -p 5433 -U mychurch_user -d mychurch <<'EOF'
ALTER TABLE leaders 
ADD COLUMN IF NOT EXISTS bio JSONB DEFAULT '{"fa": "", "en": ""}'::jsonb,
ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);

SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'leaders' 
AND column_name IN ('bio', 'whatsapp_number')
ORDER BY column_name;
EOF

# ═══════════════════════════════════════════════════════════
# مرحله 3: Restart Backend (بعد از دیدن نام در pm2 list)
# ═══════════════════════════════════════════════════════════
# یکی از این دستورات را بسته به نام process اجرا کنید:

pm2 restart all
# یا اگر نام خاصی داشت:
# pm2 restart church-api-backend
# pm2 restart mychurch-backend
# pm2 restart 0  (اگر شماره process است)

# ═══════════════════════════════════════════════════════════
# مرحله 4: Reload Nginx
# ═══════════════════════════════════════════════════════════
systemctl daemon-reload
systemctl reload nginx

# ═══════════════════════════════════════════════════════════
# مرحله 5: تست API
# ═══════════════════════════════════════════════════════════
curl http://localhost:3001/api/leaders | jq '.[0] | {name, bio, whatsappNumber}'

# یا بدون jq:
curl http://localhost:3001/api/leaders

# ═══════════════════════════════════════════════════════════
# ✅ بعد از تست موفق، خروج از سرور
# ═══════════════════════════════════════════════════════════
exit
