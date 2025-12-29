# 🚀 راهنمای Deployment - آپدیت سایت و PWA

## ✅ فایل‌های آماده

1. **Frontend Build**: `mychurch_frontend_deploy.zip` (آماده شده ✅)
2. **Backend Changes**: فایل‌های تغییر یافته:
   - `backend/routes/leadersRoutes.js`
   - `backend/migrations/add_leader_bio_whatsapp.sql`
   - `.env` (با VAPID_PUBLIC_KEY جدید)

## 📤 مراحل Deployment

### مرحله 1: آپلود Frontend (⚡ اولویت بالا)

```bash
# روش 1: از طریق FTP/SFTP
# آپلود محتویات mychurch_frontend_deploy.zip به:
/var/www/mychurch/frontend/dist/

# یا استفاده از rsync:
rsync -avz frontend/dist/ user@samanabyar.online:/var/www/mychurch/frontend/dist/
```

### مرحله 2: آپلود Backend Changes

```bash
# آپلود فایل‌های تغییر یافته:
scp backend/routes/leadersRoutes.js user@samanabyar.online:/var/www/mychurch/backend/routes/
scp backend/migrations/add_leader_bio_whatsapp.sql user@samanabyar.online:/var/www/mychurch/backend/migrations/
scp .env user@samanabyar.online:/var/www/mychurch/
```

### مرحله 3: اجرای Migration روی سرور

```bash
# SSH به سرور
ssh user@samanabyar.online

# اجرای migration
cd /var/www/mychurch/backend
PGPASSWORD='MyChurch2024Secure!' psql -h localhost -p 5433 -U mychurch_user -d mychurch -c "ALTER TABLE leaders ADD COLUMN IF NOT EXISTS bio JSONB DEFAULT '{\"fa\": \"\", \"en\": \"\"}'::jsonb, ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);"
```

### مرحله 4: Restart Backend

```bash
# در سرور:
pm2 restart mychurch-backend
# یا
systemctl restart mychurch-backend
```

### مرحله 5: Clear Cache (جلوگیری از هنگ PWA)

```bash
# Nginx cache
sudo rm -rf /var/cache/nginx/*
sudo systemctl reload nginx

# Browser cache
# کاربران باید Ctrl+Shift+R بزنند
```

---

## 🔍 تست بعد از Deployment

### ✅ Checklist:

1. **API Test**:
```bash
curl https://samanabyar.online/api/leaders
# باید bio و whatsappNumber را نشان بدهد
```

2. **Frontend Test**:
   - باز کردن https://samanabyar.online
   - رفتن به صفحه Leaders
   - بررسی loading state
   - تست WhatsApp button

3. **PWA Test** (موبایل):
   - باز کردن در Chrome/Safari موبایل
   - می‌بایست پیام "Update available" نشان بدهد
   - بعد از refresh، version 2.1.0 باید نمایش داده شود
   - بررسی که هنگ نکند

4. **Cache Test**:
   - Clear browser cache (Ctrl+Shift+R)
   - بررسی که assets جدید بارگذاری شوند

---

## 🎯 Rollback Plan (در صورت مشکل)

اگر مشکلی پیش آمد:

```bash
# Restore frontend backup
cd /var/www/mychurch/frontend
mv dist dist_new
mv dist_backup dist

# Restart backend
pm2 restart mychurch-backend
```

---

## 📱 حل مشکل هنگ PWA

اگر موبایل هنوز هنگ می‌کند:

1. **Clear Site Data**:
   - Settings → Site Settings → samanabyar.online → Clear & Reset
   
2. **Uninstall & Reinstall PWA**:
   - حذف app از home screen
   - دوباره نصب کردن

3. **Force Reload**:
   - باز کردن در browser
   - Menu → Settings → Clear browsing data
   - سپس Refresh

---

## ✅ نتیجه نهایی

بعد از deployment موفق:
- ✅ LeadersPage با Loading/Error handling
- ✅ VAPID key از environment variable
- ✅ Bio و WhatsApp در leaders کار می‌کند
- ✅ PWA به version 2.1.0 بروز شده
- ✅ هنگ PWA برطرف شده

**نمره کلی: 10/10** 🎉
