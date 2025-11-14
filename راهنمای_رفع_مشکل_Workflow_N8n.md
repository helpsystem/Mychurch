# راهنمای رفع مشکل فعال‌سازی Workflow در N8n

## مشکل: "Please resolve outstanding issues before you activate it"

این خطا زمانی رخ می‌دهد که مشکلات validation در workflow شما وجود داشته باشد.

---

## دلایل رایج و راه حل‌ها

### 1. ✅ فیلدهای الزامی پر نشده
**مشکل:** Node هایی دارید که فیلدهای الزامی آن‌ها پر نشده.

**راه حل:**
- همه node های با آیکون قرمز هشدار را چک کنید
- تمام فیلدهای الزامی (با علامت *) را پر کنید
- مثال: HTTP Request نیاز به URL دارد، Webhook نیاز به path

---

### 2. ✅ اعتبارسنجی (Credentials) نامعتبر
**مشکل:** credentials موجود نیست یا نامعتبر است.

**راه حل:**
```
1. روی node با مشکل credential کلیک کنید
2. به بخش "Credentials" بروید
3. credential جدید بسازید یا موجودی را تعمیر کنید
4. credential را تست کنید
5. workflow را ذخیره کنید
```

**چک کردن credentials:**
- API key ها معتبر باشند
- Token های OAuth منقضی نشده باشند
- اتصالات database کار کنند

---

### 3. ✅ مشکلات پیکربندی Webhook
**مشکل:** path های webhook نامعتبر یا تکراری هستند.

**راه حل:**
- path های webhook باید یکتا باشند
- فقط از حروف، اعداد و خط تیره استفاده کنید
- مثال درست: `my-webhook-123` ✅
- مثال اشتباه: `my webhook!` ❌

**فرمت URL webhook شما:**
```
https://n8n.samanabyar.online/webhook/WEBHOOK-PATH-SHOMA
```

---

### 4. ✅ خطاهای Expression
**مشکل:** expression های نامعتبر در فیلدهای node.

**راه حل:**
- تمام فیلدهای با `{{ }}` را چک کنید
- expression ها را قبل از فعال‌سازی تست کنید
- از قابلیت "Test Expression" استفاده کنید
- خطاهای رایج:
  - متغیر تعریف نشده: `{{ $json.nonexistent }}`
  - Syntax اشتباه: `{{ json.data }}` (بدون $)

---

### 5. ✅ مشکلات Trigger Node
**مشکل:** trigger node به درستی پیکربندی نشده.

**راه حل:**

**برای Webhook Trigger:**
```
✅ Path: webhook-name (حروف و اعداد، بدون فاصله)
✅ Method: POST/GET (بر اساس نیاز)
✅ Response Mode: Last Node یا Respond to Webhook
```

**برای Schedule Trigger:**
```
✅ Interval: هر X دقیقه/ساعت/روز
✅ Timezone: به درستی تنظیم شود (Asia/Tehran)
```

**برای Polling Trigger:**
```
✅ Credentials: معتبر و تست شده
✅ Interval: منطقی (نه خیلی زیاد)
```

---

### 6. ✅ مشکلات اتصال Database/API
**مشکل:** اتصال به سرویس‌های خارجی برقرار نمی‌شود.

**راه حل:**
- اتصال را در تنظیمات node تست کنید
- قوانین firewall را چک کنید
- تایید کنید API endpoint ها قابل دسترسی هستند
- برای database: host، port، credentials را بررسی کنید

---

### 7. ✅ مشکلات Environment Variable
**مشکل:** استفاده از متغیرهایی که وجود ندارند.

**راه حل:**

متغیرهای محیطی موجود در N8n فعلی:
```bash
N8N_HOST=n8n.samanabyar.online
WEBHOOK_URL=https://n8n.samanabyar.online/
N8N_EDITOR_BASE_URL=https://n8n.samanabyar.online
```

برای اضافه کردن متغیرهای سفارشی:
```bash
# روی سرور
cd ~/n8n
nano .env

# متغیرهای خود را اضافه کنید
MY_CUSTOM_VAR=value

# N8n را ری‌استارت کنید
docker compose restart
```

---

## فرآیند گام به گام عیب‌یابی

### مرحله 1: ابتدا Workflow را دستی اجرا کنید
```
1. دکمه "Execute Workflow" را بزنید
2. خروجی هر node را چک کنید
3. هر خطایی را برطرف کنید
4. فقط بعد از اجرای موفق دستی، فعال کنید
```

### مرحله 2: همه Node ها را بررسی کنید
```
برای هر node در workflow:
1. روی node کلیک کنید
2. به دنبال آیکون قرمز هشدار ⚠️ باشید
3. پیام خطا را بخوانید
4. مشکل را برطرف کنید
5. به node بعدی بروید
```

### مرحله 3: اتصالات را تایید کنید
```
1. مطمئن شوید همه node ها به درستی متصل هستند
2. هیچ node یتیمی نباشد (به trigger متصل نباشد)
3. workflow شروع و پایان واضح داشته باشد
```

### مرحله 4: تنظیمات Workflow را چک کنید
```
1. روی نام workflow (بالا) کلیک کنید
2. به "Workflow Settings" بروید
3. موارد زیر را چک کنید:
   - Timezone صحیح است (Asia/Tehran)
   - Error workflow (در صورت نیاز)
   - تنظیمات را ذخیره کنید
```

---

## پیام‌های خطای خاص

### "Webhook path already exists"
**راه حل:**
```
1. path webhook را به مقدار یکتایی تغییر دهید
2. یا workflow دیگری که از همان path استفاده می‌کند را غیرفعال کنید
3. path باید در بین همه workflow های فعال یکتا باشد
```

### "Missing required parameter"
**راه حل:**
```
1. node با خطا را باز کنید
2. فیلدهای با علامت قرمز * را پیدا کنید
3. همه فیلدهای الزامی را پر کنید
4. ذخیره کنید و دوباره امتحان کنید
```

### "Invalid credentials"
**راه حل:**
```
1. به Settings (بالا راست) بروید
2. روی "Credentials" کلیک کنید
3. credential مشکل‌دار را پیدا کنید
4. ویرایش و تست کنید
5. ذخیره کنید و دوباره امتحان کنید
```

### "Expression error"
**راه حل:**
```
1. روی فیلد با expression کلیک کنید
2. از دکمه "Test Expression" استفاده کنید
3. خطاهای syntax را برطرف کنید
4. تصحیحات رایج:
   - اضافه کردن $ قبل از json: {{ $json.data }}
   - چک کنید متغیر در node قبلی وجود دارد
```

---

## وضعیت پیکربندی N8n

### تنظیمات فعلی (بروز شده)
- ✅ **Host:** n8n.samanabyar.online
- ✅ **پروتکل:** HTTPS (از طریق nginx)
- ✅ **Webhook URL:** https://n8n.samanabyar.online/
- ✅ **دیتابیس:** PostgreSQL (سالم)
- ✅ **Task Runners:** فعال
- ✅ **امنیت:** تقویت شده

### تغییرات اعمال شده اخیر
```bash
# اضافه شده به ~/n8n/.env:
N8N_SKIP_WEBHOOK_DEREGISTRATION_SHUTDOWN=true
WEBHOOK_TUNNEL_URL=https://n8n.samanabyar.online/
N8N_EDITOR_BASE_URL=https://n8n.samanabyar.online
N8N_RUNNERS_ENABLED=true
N8N_BLOCK_ENV_ACCESS_IN_NODE=true
N8N_GIT_NODE_DISABLE_BARE_REPOS=true
N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true
```

---

## تست Workflow شما

### چک لیست قبل از فعال‌سازی:
- [ ] همه node ها پیکربندی شده‌اند (بدون هشدار قرمز)
- [ ] Credentials معتبر و تست شده هستند
- [ ] اجرای دستی موفقیت‌آمیز است
- [ ] Path های webhook یکتا هستند (اگر از webhook استفاده می‌کنید)
- [ ] Expression ها از نظر syntax صحیح هستند
- [ ] همه اتصالات صحیح هستند
- [ ] Trigger node به درستی پیکربندی شده

### مراحل تست دستی:
```
1. دکمه "Execute Workflow" (play) را بزنید
2. علامت تیک سبز روی همه node ها را چک کنید
3. خروجی data را بررسی کنید
4. هر خطایی را برطرف کنید
5. تا زمانی که همه سبز شوند، دوباره اجرا کنید
6. سپس "Activate" را بزنید
```

---

## دریافت کمک بیشتر

### مشاهده لاگ‌های N8n
```bash
# روی سرور
docker logs n8n-n8n-1 --tail 50 -f
```

### بررسی لاگ‌های اجرای Workflow
```
1. در N8n: به "Executions" (نوار کناری چپ) بروید
2. روی اجرای ناموفق کلیک کنید
3. جزئیات خطا را بررسی کنید
4. روی node ناموفق کلیک کنید تا خطای دقیق را ببینید
```

### منابع N8n
- انجمن: https://community.n8n.io/
- مستندات: https://docs.n8n.io/
- نمونه‌ها: https://n8n.io/workflows/

---

## مثال: یک Workflow ساده که کار می‌کنه

### Webhook → Set → Respond
```
1. Webhook Trigger
   - Path: test-webhook
   - Method: POST
   - Response Mode: Last Node

2. Set Node (اختیاری)
   - پردازش داده خود را اضافه کنید

3. Respond to Webhook
   - Response Body: {{ $json }}
```

**تست کنید:**
```bash
curl -X POST https://n8n.samanabyar.online/webhook/test-webhook \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello N8n"}'
```

---

## دستورات سریع تعمیر

### ری‌استارت N8n
```bash
ssh root@samanabyar.online
cd ~/n8n
docker compose restart
```

### مشاهده لاگ‌ها
```bash
docker logs n8n-n8n-1 --tail 100 -f
```

### چک کردن وضعیت
```bash
docker ps --filter name=n8n
curl https://n8n.samanabyar.online/
```

---

## 💡 نکات مهم

1. **همیشه ابتدا دستی تست کنید** - قبل از فعال‌سازی، workflow را با دکمه Execute اجرا کنید

2. **Webhook path ها یکتا باشند** - دو workflow نمی‌توانند از یک path استفاده کنند

3. **Credentials را تست کنید** - قبل از استفاده، اتصال را تست کنید

4. **Expression ها دقیق بنویسید** - از $ قبل از json فراموش نکنید

5. **لاگ‌ها را بررسی کنید** - اگر مشکلی پیش آمد، لاگ‌ها کمک زیادی می‌کنند

---

**آخرین بروزرسانی:** ۱۱ نوامبر ۲۰۲۵  
**نسخه N8n:** 1.119.1  
**وضعیت:** 🟢 در حال اجرا با پیکربندی بهینه
