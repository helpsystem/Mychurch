# راهنمای فعال‌سازی لایسنس N8n

## ✅ وضعیت: آماده برای فعال‌سازی لایسنس

### تنظیمات فعلی
- **آدرس:** https://n8n.samanabyar.online
- **نسخه:** 1.119.1 (آخرین نسخه پایدار)
- **وضعیت:** 🟢 در حال اجرا
- **تنظیمات قدیمی:** با موفقیت حذف شد

---

## 🔑 اطلاعات لایسنس

**کلید لایسنس شما:**
```
abb8b5d3-b865-400b-8a74-071344a28170
```

---

## 📝 نحوه فعال‌سازی لایسنس

### مرحله 1: ورود به N8n
1. به آدرس زیر بروید: https://n8n.samanabyar.online
2. اطلاعات ورود را وارد کنید:
   - **نام کاربری:** `admin`
   - **رمز عبور:** `Iranian@1989`

### مرحله 2: اضافه کردن کلید لایسنس
1. روی آیکون پروفایل (گوشه بالا راست) کلیک کنید
2. به **Settings** (تنظیمات) → **License** (لایسنس) بروید
3. روی **"Add License Key"** (اضافه کردن کلید لایسنس) کلیک کنید
4. کلید لایسنس را paste کنید: `abb8b5d3-b865-400b-8a74-071344a28170`
5. روی **"Activate"** (فعال‌سازی) کلیک کنید

### جایگزین: استفاده از نسخه رایگان
اگر نمی‌خواهید الان لایسنس را فعال کنید، می‌توانید از نسخه رایگان N8n استفاده کنید که شامل:
- workflow های نامحدود
- اجراهای نامحدود
- پشتیبانی انجمن کاربری

---

## 🔧 کارهای انجام شده

### مشکل
تنظیمات لایسنس قدیمی مشکل ایجاد می‌کرد یا نیاز به reset داشت.

### راه حل
```bash
# یافتن محل فایل config
docker exec n8n-n8n-1 find / -name 'config' -type f 2>/dev/null

# حذف تنظیمات قدیمی
docker exec n8n-n8n-1 rm -vf /home/node/.n8n/config

# ری‌استارت N8n
docker restart n8n-n8n-1
```

### نتیجه
- ✅ تنظیمات قدیمی حذف شد
- ✅ N8n با موفقیت راه‌اندازی شد
- ✅ رابط وب قابل دسترسی است (HTTP 200)
- ✅ نسخه 1.119.1 تایید شد
- ✅ آماده برای فعال‌سازی لایسنس جدید

---

## 📊 متغیرهای محیطی N8n

تنظیمات فعلی از فایل `~/n8n/.env`:

```env
# تنظیمات پایه
N8N_HOST=n8n.samanabyar.online
N8N_PORT=5678
N8N_PROTOCOL=http
WEBHOOK_URL=https://n8n.samanabyar.online/

# امنیت
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=Iranian@1989

# دیتابیس
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=postgres
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=postgres
DB_POSTGRESDB_PASSWORD=f5d64c17e8d63743b9b6a514b9f870df

# سایر
N8N_PAYLOAD_SIZE_MAX=33554432
GENERIC_TIMEZONE=Asia/Tehran
```

---

## ⚙️ بهینه‌سازی‌های پیشنهادی

N8n چند هشدار deprecation نشون می‌ده. پیشنهاد می‌شه این متغیرها رو به `~/n8n/.env` اضافه کنید:

```env
# فعال‌سازی task runners (توصیه می‌شود)
N8N_RUNNERS_ENABLED=true

# محدود کردن دسترسی به متغیرهای محیطی (امنیت)
N8N_BLOCK_ENV_ACCESS_IN_NODE=true

# غیرفعال کردن bare repositories در Git Node (امنیت)
N8N_GIT_NODE_DISABLE_BARE_REPOS=true

# اعمال خودکار دسترسی‌های صحیح برای فایل config
N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true
```

برای اعمال تغییرات:
```bash
# روی سرور
cd ~/n8n
nano .env  # متغیرهای بالا رو اضافه کنید
docker compose down
docker compose up -d
```

---

## 🐛 رفع مشکلات

### لایسنس فعال نمی‌شه
1. لاگ‌های N8n را چک کنید: `docker logs n8n-n8n-1 --tail 50`
2. اتصال اینترنت کانتینر را بررسی کنید
3. دوباره config را حذف کنید و restart کنید

### دسترسی به N8n نیست
1. وضعیت کانتینر را چک کنید: `docker ps | grep n8n`
2. nginx را بررسی کنید: `systemctl status nginx`
3. مستقیم تست کنید: `curl http://localhost:5678`

### مشکلات دسترسی
```bash
# تعمیر دسترسی‌های فایل config
docker exec n8n-n8n-1 chmod 600 /home/node/.n8n/config
docker restart n8n-n8n-1
```

---

## 📚 دستورات مفید

```bash
# چک کردن وضعیت N8n
docker ps --filter name=n8n

# مشاهده لاگ‌های N8n
docker logs n8n-n8n-1 --tail 50 -f

# ری‌استارت N8n
docker restart n8n-n8n-1

# ورود به کانتینر N8n
docker exec -it n8n-n8n-1 bash

# چک کردن نسخه N8n
docker exec n8n-n8n-1 n8n --version

# Backup از داده‌های N8n
docker exec n8n-n8n-1 tar czf - /home/node/.n8n > n8n-backup-$(date +%Y%m%d).tar.gz
```

---

## 🔗 لینک‌های مفید

- **مستندات N8n:** https://docs.n8n.io/
- **راهنمای Hosting:** https://docs.n8n.io/hosting/
- **اطلاعات لایسنس:** https://n8n.io/pricing/
- **انجمن کاربری:** https://community.n8n.io/

---

## ✅ چک لیست

- [x] تنظیمات قدیمی حذف شد
- [x] N8n ری‌استارت شد
- [x] رابط وب قابل دسترسی است
- [x] گواهی SSL معتبر است
- [ ] **کلید لایسنس فعال شود** (مرحله بعدی شما)
- [ ] Workflow ها تست شوند
- [ ] متغیرهای محیطی بهینه شوند (اختیاری)

---

## 🎯 مراحل بعدی

1. **الان:** به https://n8n.samanabyar.online بروید و لایسنس را فعال کنید
2. **بعد:** Workflow های خود را بسازید و تست کنید
3. **اختیاری:** متغیرهای محیطی پیشنهادی را اضافه کنید

---

**آخرین بروزرسانی:** ۱۱ نوامبر ۲۰۲۵  
**نسخه N8n:** 1.119.1  
**وضعیت:** 🟢 آماده برای فعال‌سازی لایسنس

---

## 💡 نکته مهم

اگر لایسنس قبلاً استفاده شده بود و الان نمی‌خواهید دوباره بخرید، می‌توانید از **نسخه رایگان** استفاده کنید که برای اکثر کاربردها کافی است.

**موفق باشید! 🚀**
