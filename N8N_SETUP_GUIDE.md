# 🤖 راهنمای نصب و راه‌اندازی n8n Automation Panel

## 📋 فهرست مطالب
1. [نصب n8n](#نصب-n8n)
2. [تنظیمات Environment Variables](#تنظیمات-environment-variables)
3. [فعال‌سازی n8n API](#فعالسازی-n8n-api)
4. [پیکربندی Reverse Proxy](#پیکربندی-reverse-proxy)
5. [تست اتصال](#تست-اتصال)
6. [استفاده از پنل ادمین](#استفاده-از-پنل-ادمین)
7. [نمونه Workflows](#نمونه-workflows)
8. [عیب‌یابی](#عیبیابی)

---

## 1️⃣ نصب n8n

### گزینه A: نصب با npm (توصیه می‌شود)

```bash
# نصب n8n به صورت global
npm install -g n8n

# اجرای n8n
n8n start
```

n8n روی پورت **5678** اجرا می‌شود:
- رابط کاربری: `http://localhost:5678`
- API: `http://localhost:5678/api/v1`

---

### گزینه B: نصب با Docker

```bash
# دانلود و اجرای n8n
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

**برای اجرای دائمی در background:**
```bash
docker run -d \
  --name n8n \
  --restart unless-stopped \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

---

### گزینه C: نصب روی سرور (Production)

```bash
# نصب PM2 برای مدیریت پروسه
npm install -g pm2

# نصب n8n
npm install -g n8n

# اجرای n8n با PM2
pm2 start n8n

# ذخیره‌سازی برای auto-start
pm2 save
pm2 startup
```

---

## 2️⃣ تنظیمات Environment Variables

### فایل `.env` در ریشه پروژه React:

```bash
# n8n Connection Settings
VITE_N8N_URL=https://n8n.samyar.at
VITE_N8N_API_KEY=your_api_key_here
```

### فایل `.env` برای سرور n8n:

```bash
# n8n Configuration
N8N_HOST=0.0.0.0
N8N_PORT=5678
N8N_PROTOCOL=https
N8N_EDITOR_BASE_URL=https://n8n.samyar.at

# Security
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=YourStrongPassword123

# API Settings
N8N_API_KEY=your_generated_api_key_here
N8N_ENFORCE_SETTINGS_FILE=true

# Database (Optional - SQLite by default)
DB_TYPE=sqlite
DB_SQLITE_DATABASE=/home/node/.n8n/database.sqlite

# Webhooks
WEBHOOK_URL=https://n8n.samyar.at/
```

---

## 3️⃣ فعال‌سازی n8n API

### A. ساخت API Key

1. وارد n8n شوید: `http://localhost:5678`
2. به **Settings** → **API** بروید
3. روی **Generate API Key** کلیک کنید
4. کلید را کپی کرده و در `.env` قرار دهید

### B. تست API با cURL:

```bash
# تست اتصال
curl -X GET http://localhost:5678/healthz

# لیست Workflows
curl -X GET http://localhost:5678/api/v1/workflows \
  -H "X-N8N-API-KEY: your_api_key_here"

# اجرای Workflow
curl -X POST http://localhost:5678/api/v1/workflows/1/execute \
  -H "X-N8N-API-KEY: your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"data": {}}'
```

---

## 4️⃣ پیکربندی Reverse Proxy

### Nginx Configuration:

```nginx
# /etc/nginx/sites-available/n8n

server {
    listen 443 ssl http2;
    server_name n8n.samyar.at;

    ssl_certificate /etc/letsencrypt/live/n8n.samyar.at/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/n8n.samyar.at/privkey.pem;

    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # WebSocket support
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name n8n.samyar.at;
    return 301 https://$server_name$request_uri;
}
```

**فعال‌سازی:**
```bash
sudo ln -s /etc/nginx/sites-available/n8n /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### Apache Configuration:

```apache
<VirtualHost *:443>
    ServerName n8n.samyar.at
    
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/n8n.samyar.at/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/n8n.samyar.at/privkey.pem
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:5678/
    ProxyPassReverse / http://localhost:5678/
    
    # WebSocket support
    RewriteEngine on
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://localhost:5678/$1" [P,L]
</VirtualHost>
```

---

## 5️⃣ تست اتصال

### تست از خط فرمان:

```bash
# 1. Health Check
curl https://n8n.samyar.at/healthz

# 2. API Test
curl -X GET https://n8n.samyar.at/api/v1/workflows \
  -H "X-N8N-API-KEY: your_api_key_here"
```

### تست از React DevTools:

1. باز کردن Console
2. اجرای کد زیر:

```javascript
fetch('https://n8n.samyar.at/api/v1/workflows', {
  headers: {
    'X-N8N-API-KEY': 'your_api_key_here'
  }
})
.then(res => res.json())
.then(console.log)
.catch(console.error);
```

---

## 6️⃣ استفاده از پنل ادمین

### دسترسی به پنل:
1. لاگین به سایت با حساب **SUPER_ADMIN**
2. رفتن به: `/#/admin`
3. از سایدبار چپ/راست، روی **"اتوماسیون n8n"** کلیک کنید
4. یا مستقیماً به: `/#/admin/automations` بروید

### قابلیت‌ها:

✅ **مشاهده وضعیت سرور n8n**
- نمایش latency
- وضعیت healthy/unhealthy

✅ **لیست تمام Workflows**
- نام و شناسه هر workflow
- وضعیت فعال/غیرفعال
- تاریخ ایجاد و آخرین بروزرسانی

✅ **اجرای دستی Workflows**
- دکمه "اجرا" برای هر workflow
- نمایش وضعیت "در حال اجرا..."
- بازخورد موفقیت/خطا

✅ **فعال/غیرفعال کردن Workflows**
- toggle برای هر workflow
- تغییر آنی وضعیت

✅ **تاریخچه اجرا**
- 20 اجرای اخیر
- نمایش موفقیت/خطا
- زمان اجرا
- نام workflow

---

## 7️⃣ نمونه Workflows

### Workflow 1: Website Audit Automation

```json
{
  "name": "Daily Website Audit",
  "nodes": [
    {
      "type": "n8n-nodes-base.cron",
      "position": [250, 300],
      "parameters": {
        "triggerTimes": {
          "item": [
            {
              "hour": 2,
              "minute": 0
            }
          ]
        }
      }
    },
    {
      "type": "n8n-nodes-base.httpRequest",
      "position": [450, 300],
      "parameters": {
        "url": "http://localhost:5173",
        "method": "GET"
      }
    },
    {
      "type": "n8n-nodes-base.code",
      "position": [650, 300],
      "parameters": {
        "jsCode": "// Check response and create report\nconst status = $input.item.json.statusCode;\nreturn [{\n  json: {\n    status: status === 200 ? 'OK' : 'ERROR',\n    timestamp: new Date().toISOString()\n  }\n}];"
      }
    }
  ]
}
```

---

### Workflow 2: Database Backup

```json
{
  "name": "Daily Database Backup",
  "nodes": [
    {
      "type": "n8n-nodes-base.cron",
      "parameters": {
        "triggerTimes": {
          "item": [
            {
              "hour": 3,
              "minute": 0
            }
          ]
        }
      }
    },
    {
      "type": "n8n-nodes-base.executeCommand",
      "parameters": {
        "command": "pg_dump -U postgres church_db > /backups/backup_{{$now.format('YYYYMMDD')}}.sql"
      }
    },
    {
      "type": "n8n-nodes-base.telegram",
      "parameters": {
        "text": "✅ Daily backup completed successfully!"
      }
    }
  ]
}
```

---

### Workflow 3: New User Welcome Email

```json
{
  "name": "Send Welcome Email",
  "nodes": [
    {
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "new-user",
        "method": "POST"
      }
    },
    {
      "type": "n8n-nodes-base.emailSend",
      "parameters": {
        "fromEmail": "info@yourchurch.com",
        "toEmail": "={{$json.email}}",
        "subject": "Welcome to Our Church!",
        "text": "Dear {{$json.name}},\n\nThank you for joining..."
      }
    }
  ]
}
```

---

## 8️⃣ عیب‌یابی

### مشکل: سرور n8n در دسترس نیست

**راه‌حل:**
```bash
# بررسی وضعیت n8n
pm2 status n8n

# یا در Docker
docker ps | grep n8n

# بررسی لاگ‌ها
pm2 logs n8n

# یا Docker
docker logs n8n
```

---

### مشکل: خطای CORS

**راه‌حل:** اضافه کردن headers به nginx:

```nginx
add_header 'Access-Control-Allow-Origin' '*';
add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE';
add_header 'Access-Control-Allow-Headers' 'X-N8N-API-KEY, Content-Type';
```

---

### مشکل: API Key نامعتبر

**راه‌حل:**
1. به n8n login کنید
2. Settings → API
3. یک کلید جدید بسازید
4. در `.env` بروزرسانی کنید
5. سایت را restart کنید

---

### مشکل: Workflow اجرا نمی‌شود

**بررسی:**
```bash
# لاگ‌های n8n را چک کنید
pm2 logs n8n --lines 50

# یا در Docker
docker logs n8n --tail 50

# اجرای دستی workflow از CLI
n8n execute --id 1
```

---

## 📚 منابع مفید

- **مستندات رسمی n8n:** https://docs.n8n.io
- **API Reference:** https://docs.n8n.io/api
- **Community Forum:** https://community.n8n.io
- **GitHub:** https://github.com/n8n-io/n8n

---

## 🔒 نکات امنیتی

1. ✅ همیشه از HTTPS استفاده کنید
2. ✅ API Key را محرمانه نگه دارید
3. ✅ Basic Auth را فعال کنید
4. ✅ Firewall را پیکربندی کنید (فقط پورت 443 باز باشد)
5. ✅ پسوردهای قوی استفاده کنید
6. ✅ Backup منظم بگیرید

---

## 💰 هزینه

**Self-hosted n8n:** ✅ **کاملاً رایگان**
- هزینه سرور (که قبلاً داشتید)
- بدون محدودیت تعداد workflows
- بدون محدودیت تعداد اجراها
- تمام قابلیت‌ها آزاد

**n8n Cloud:** 💰 از $20/ماه (اگر بخواهید از سرور خودتان استفاده نکنید)

---

## ✅ Checklist نصب

- [ ] n8n نصب شده است
- [ ] n8n روی پورت 5678 اجرا می‌شود
- [ ] API Key ساخته شده
- [ ] `.env` تنظیم شده
- [ ] Reverse proxy پیکربندی شده (اختیاری)
- [ ] SSL نصب شده (اختیاری)
- [ ] تست اتصال موفق بوده
- [ ] پنل ادمین قابل دسترسی است
- [ ] یک workflow تست ساخته شده

---

**نسخه:** 1.0  
**تاریخ:** نوامبر 2025  
**مخصوص:** Iranian Christian Church DC
