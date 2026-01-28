# 🎬 Broadcast Console Pro - راهنمای استفاده

## 🚀 شروع سریع

### 1️⃣ راه‌اندازی Backend WebSocket

```bash
# نصب dependencies (اولین بار)
cd backend/broadcast
npm install

# اجرای سرور
npm start

# یا در حالت development با auto-restart:
npm run dev
```

سرور روی پورت 3001 اجرا می‌شود:
- WebSocket: `ws://localhost:3001`
- Health Check: `http://localhost:3001/health`

---

### 2️⃣ راه‌اندازی Frontend

```bash
# نصب socket.io-client (قبلاً انجام شده)
npm install socket.io-client

# اجرای frontend
npm run dev
```

Frontend روی `http://localhost:5173` اجرا می‌شود

---

### 3️⃣ دسترسی به Broadcast Console

1. رفتن به: `http://localhost:5173/#/admin/broadcast`
2. دوربین و میکروفون را مجاز کنید
3. شروع به ساخت اسلایدها!

---

## ✨ قابلیت‌های جدید

### 🎥 ضبط ویدیو (Hybrid Recorder)

**نحوه استفاده:**
1. کلیک روی دکمه **REC** در بالای صفحه
2. انتخاب مسیر ذخیره فایل (فقط در مرورگرهای Chromium)
3. ضبط شروع می‌شود (همزمان به دیسک و cloud)
4. برای توقف، دوباره کلیک کنید

**ویژگی‌ها:**
- ✅ ذخیره خودکار روی دیسک محلی
- ✅ آپلود همزمان به cloud (chunk-by-chunk)
- ✅ نمایش زمان ضبط و پیشرفت آپلود
- ✅ فرمت WebM با VP9 + Opus

**پیکربندی Cloud Upload:**
```javascript
// برای استفاده واقعی، باید endpoint آپلود را پیاده‌سازی کنید:
// backend/broadcast/broadcast-server.js

app.post('/api/broadcast/upload/init', async (req, res) => {
  // Generate signed URL from S3/GCP
  const signedUrl = await generateSignedUrl();
  res.json({ uploadUrl: signedUrl });
});
```

---

### 🔄 همگام‌سازی دستگاه‌ها (WebSocket Sync)

**نحوه استفاده:**

#### دستگاه Leader (کنترل کننده):
1. کلیک روی دکمه **Sync** در بالا
2. کلیک **Start Sync**
3. Session ID نمایش داده می‌شود - آن را کپی کنید
4. تغییرات اسلاید به همه دستگاه‌ها ارسال می‌شود

#### دستگاه Viewer (نمایش):
1. باز کردن همان آدرس در دستگاه دیگر
2. رفتن به Broadcast Console
3. کلیک Sync → وارد کردن Session ID مشابه → Start Sync
4. اسلایدها خودکار همگام می‌شوند!

**معماری:**
```
┌────────────────┐                    ┌────────────────┐
│   Leader PC    │  WebSocket         │  Viewer TV     │
│  (Control)     │◄──────────────────►│  (Display)     │
└────────────────┘                    └────────────────┘
        │                                      │
        └─────────►Change Slide────────────────►Auto Update
```

**وضعیت اتصال:**
- 🟢 سبز: متصل (تعداد دستگاه‌ها نمایش داده می‌شود)
- ⚪ خاکستری: قطع

---

## 🎹 میانبرهای کیبورد

| کلید | عملکرد |
|------|---------|
| `Space` | پخش/مکث |
| `←` یا `→` | اسلاید قبل/بعد |
| `F` | تمام صفحه |
| `S` | تنظیمات |
| `R` | شروع/توقف ضبط |

---

## 🛠️ تنظیمات پیشرفته

### تغییر پورت سرور

```javascript
// backend/broadcast/broadcast-server.js
const PORT = process.env.BROADCAST_PORT || 3001;
```

یا با متغیر محیطی:
```bash
BROADCAST_PORT=3002 npm start
```

### تنظیم CORS

```javascript
// backend/broadcast/broadcast-server.js
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'https://samanabyar.online'],
    methods: ['GET', 'POST']
  }
});
```

### فعال‌سازی Cloud Upload واقعی

برای استفاده از S3:
```bash
cd backend/broadcast
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

```javascript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({ region: 'us-east-1' });

app.post('/api/broadcast/upload/init', async (req, res) => {
  const key = `recordings/${Date.now()}-chunk-${req.body.chunkIndex}.webm`;
  const command = new PutObjectCommand({
    Bucket: 'your-bucket',
    Key: key,
    ContentType: 'video/webm'
  });
  
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  res.json({ uploadUrl, key });
});
```

---

## 📊 مانیتورینگ و عیب‌یابی

### چک کردن وضعیت سرور

```bash
curl http://localhost:3001/health
```

خروجی:
```json
{
  "status": "ok",
  "activeSessions": 2,
  "timestamp": "2026-01-28T..."
}
```

### لاگ‌های سرور

سرور به طور خودکار لاگ می‌کند:
```
[Socket] ✅ Client connected: abc123
[Session] Device abc123 joined session-456 (Leader)
[Session] Total devices in session-456: 1
[Session] Slide changed to 5 in session-456
```

### مشکلات رایج

#### ❌ WebSocket اتصال برقرار نمی‌کند
- چک کنید سرور backend اجرا شده باشد
- بررسی کنید پورت 3001 باز باشد
- فایروال را چک کنید

#### ❌ ضبط ویدیو کار نمی‌کند
- فقط در Chrome/Edge کار می‌کند (File System API)
- دسترسی دوربین/میکروفون باید مجاز باشد
- در Firefox فقط آپلود cloud کار می‌کند

#### ❌ Cloud upload 500 error
- این نرمال است! endpoint فعلاً mock است
- برای استفاده واقعی باید S3/GCP را پیکربندی کنید

---

## 🚀 استقرار Production

### Backend

```bash
# روی سرور
cd /var/www/broadcast-server
npm install
PM2 start npm --name broadcast-server -- start

# یا با Docker
docker build -t broadcast-server backend/broadcast
docker run -d -p 3001:3001 broadcast-server
```

### Frontend

```bash
# تغییر آدرس سرور در production
# frontend/src/components/broadcast/hooks/useWebSocketSync.ts

const serverUrl = process.env.NODE_ENV === 'production'
  ? 'https://broadcast.samanabyar.online'
  : 'http://localhost:3001';
```

---

## 📞 پشتیبانی

- **مستندات کامل:** این فایل
- **Backend Server:** `backend/broadcast/broadcast-server.js`
- **Hooks:**
  - `frontend/src/components/broadcast/hooks/useHybridRecorder.ts`
  - `frontend/src/components/broadcast/hooks/useWebSocketSync.ts`
- **UI Integration:** `frontend/src/components/broadcast/LiveConsole.tsx`

---

## 🎯 نکات مهم

1. ✅ **همیشه backend را اول اجرا کنید**
2. ✅ **Session ID را یادداشت کنید** (برای دستگاه‌های بعدی)
3. ✅ **فقط یک Leader** در هر session
4. ✅ **Chromium browsers** برای ذخیره محلی
5. ✅ **HTTPS لازم است** برای production

---

**🎉 حالا می‌توانید مراسم خود را با کیفیت حرفه‌ای پخش و ضبط کنید!**
