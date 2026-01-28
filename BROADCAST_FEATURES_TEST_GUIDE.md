# 🎬 Broadcast Console - راهنمای تست ویژگی‌های جدید

## ✅ وضعیت سیستم

### Backend Server
- **وضعیت**: ✅ در حال اجرا
- **Port**: 3001
- **Health Check**: http://localhost:3001/health
- **WebSocket**: ws://localhost:3001
- **Session های فعال**: 0

### Frontend  
- **وضعیت**: ✅ در حال اجرا
- **Port**: 5173
- **URL**: http://localhost:5173/#/admin/broadcast
- **Build**: ✅ موفق (بدون خطا)

### Dependencies
- ✅ socket.io-client@4.8.1 (frontend)
- ✅ socket.io@4.8.1 (backend)
- ✅ express@4.21.2 (backend)
- ✅ cors@2.8.5 (backend)

---

## 🎯 ویژگی‌های پیاده‌سازی شده

### 1. **Hybrid Recorder** (ضبط ترکیبی)
ضبط ویدیو همزمان روی دیسک محلی + آپلود به Cloud

**ویژگی‌ها:**
- 📹 ضبط ویدیو با کیفیت HD (1280x720)
- 💾 ذخیره محلی با File System Access API
- ☁️ آپلود chunk-based به سرور (هر 1 ثانیه)
- 📊 نمایش پیشرفت آپلود
- ⏱️ شمارش زمان ضبط

**مسیر API:**
- `POST /api/broadcast/upload/init` - دریافت signed URL
- `POST /api/broadcast/upload/complete` - تکمیل آپلود

### 2. **WebSocket Sync** (همگام‌سازی چند دستگاهی)
همگام‌سازی اسلایدها بین دستگاه‌های مختلف

**ویژگی‌ها:**
- 🔗 اتصال real-time با Socket.IO
- 👥 سیستم Leader/Viewer
- 🎯 همگام‌سازی تغییر اسلاید
- ▶️ کنترل Play/Pause/Stop
- 📡 نمایش وضعیت اتصال و latency
- 🔄 Auto-reconnect در صورت قطع ارتباط

**Socket Events:**
- `join_session` - ورود به session
- `slide_change` - تغییر اسلاید
- `play_control` - کنترل پخش
- `ping/pong` - اندازه‌گیری latency

---

## 📋 مراحل تست

### تست 1: Hybrid Recorder

#### مرحله 1: باز کردن صفحه Broadcast
```
1. مرورگر Chrome/Edge را باز کنید
2. به آدرس بروید: http://localhost:5173/#/admin/broadcast
3. منتظر بمانید تا صفحه بارگذاری شود
```

#### مرحله 2: شروع ضبط
```
1. دکمه 🔴 REC را در بالای صفحه پیدا کنید
2. روی دکمه کلیک کنید
3. پنجره File Picker برای انتخاب مسیر ذخیره باز می‌شود
4. یک مسیر انتخاب کنید (مثلاً: Desktop/broadcast-recording.webm)
5. منتظر بمانید تا ضبط شروع شود
```

**خروجی مورد انتظار:**
- دکمه REC تبدیل به دکمه ⏹️ STOP شود
- تایمر شروع به شمارش کند: "00:00"
- نوار پیشرفت آپلود نمایش داده شود
- در Console مرورگر پیام "Recording started" ظاهر شود
- در Terminal backend پیام "[Upload] Chunk X uploaded" ظاهر شود

#### مرحله 3: ضبط محتوا
```
1. چند اسلاید را تغییر دهید
2. متنی را تایپ کنید
3. حداقل 10 ثانیه ضبط کنید
4. نوار پیشرفت آپلود را مشاهده کنید
```

#### مرحله 4: توقف ضبط
```
1. روی دکمه ⏹️ STOP کلیک کنید
2. منتظر بمانید تا پردازش تکمیل شود
```

**خروجی مورد انتظار:**
- فایل ویدیو در مسیر انتخابی ذخیره شود
- پیام "Recording saved successfully" نمایش داده شود
- در Console: "Recording stopped. Total chunks: X"
- در Backend Terminal: "[Upload] ✅ Recording complete"

#### مرحله 5: بررسی فایل
```
1. به مسیر ذخیره بروید
2. فایل .webm را پیدا کنید
3. فایل را با VLC Player یا Chrome باز کنید
4. اطمینان حاصل کنید که ویدیو ضبط شده است
```

---

### تست 2: WebSocket Sync

#### مرحله 1: آماده‌سازی دو دستگاه/تب
```
1. Tab 1 را در Chrome باز کنید: http://localhost:5173/#/admin/broadcast
2. Tab 2 را در Chrome باز کنید (یا مرورگر دیگر): http://localhost:5173/#/admin/broadcast
```

#### مرحله 2: اتصال Leader (تب اول)
```
1. در تب اول، دکمه 🔗 Sync را کلیک کنید
2. پنجره Sync modal باز می‌شود
3. Session ID خودکار ایجاد شده است (مثلاً: session-1738094000000)
4. گزینه "Leader" را انتخاب کنید
5. دکمه "Connect" را کلیک کنید
```

**خروجی مورد انتظار:**
- وضعیت تغییر می‌کند: Disconnected → Connecting → Connected
- پیام "Connected as Leader" نمایش داده می‌شود
- Latency نمایش داده می‌شود (مثلاً: 15ms)
- در Backend Terminal: "[WebSocket] Client connected: XXXXX"

#### مرحله 3: اتصال Viewer (تب دوم)
```
1. در تب دوم، دکمه 🔗 Sync را کلیک کنید
2. همان Session ID را وارد کنید (copy از تب اول)
3. گزینه "Viewer" را انتخاب کنید
4. دکمه "Connect" را کلیک کنید
```

**خروجی مورد انتظار:**
- وضعیت: Connected as Viewer
- پیام "Joined session: XXXXX" در Console
- در Backend Terminal: "[Session] Device joined: XXXXX"

#### مرحله 4: تست همگام‌سازی اسلاید
```
1. در تب اول (Leader)، اسلایدها را تغییر دهید
2. از دکمه‌های Next/Previous استفاده کنید
3. به تب دوم (Viewer) نگاه کنید
```

**خروجی مورد انتظار:**
- اسلایدها در تب دوم به صورت خودکار تغییر می‌کنند
- تاخیر بسیار کم (< 50ms)
- در Console تب دوم: "Received slide change: X"
- در Backend Terminal: "[Session] Slide changed to X"

#### مرحله 5: تست کنترل Play
```
1. در تب اول (Leader)، دکمه Play را کلیک کنید
2. به تب دوم نگاه کنید
```

**خروجی مورد انتظار:**
- اسلایدها در تب دوم شروع به پخش خودکار می‌کنند
- در Console: "Received play control: play"

#### مرحله 6: تست قطع ارتباط
```
1. در یکی از تب‌ها، دکمه "Disconnect" را کلیک کنید
2. وضعیت تغییر می‌کند: Disconnected
```

---

## 🔍 نحوه بررسی لاگ‌ها

### Frontend Console (F12 در مرورگر)
```javascript
// باز کردن Console
F12 → Console

// لاگ‌های Hybrid Recorder
[Recorder] Starting...
[Recorder] Chunk 0 uploaded
[Recorder] Chunk 1 uploaded
[Recorder] Recording stopped. Total chunks: 10

// لاگ‌های WebSocket Sync
[Sync] Connecting to ws://localhost:3001...
[Sync] Connected as Leader
[Sync] Sending slide change: 5
[Sync] Received slide change: 5
[Sync] Latency: 15ms
```

### Backend Terminal
```bash
# در Terminal ای که broadcast-server.js اجرا می‌شود:

# اتصال WebSocket
[WebSocket] Client connected: abcd1234

# Session Management
[Session] Device joined session-123: abcd1234
[Session] abcd1234 is now Leader

# Slide Changes
[Session] Slide changed to 3 in session-123

# Upload Events
[Upload] Chunk 0 uploaded
[Upload] Chunk 1 uploaded
[Upload] ✅ Recording complete: 10 chunks
```

---

## 🚨 عیب‌یابی مشکلات رایج

### مشکل 1: Backend متصل نمی‌شود

**علائم:**
- پیام "Connection failed" در modal
- در Console: "WebSocket connection error"

**راه‌حل:**
```bash
# 1. چک کنید سرور در حال اجرا است
curl http://localhost:3001/health

# 2. اگر پاسخی ندارد، سرور را دوباره راه‌اندازی کنید
cd backend/broadcast
npm start

# 3. چک کنید port 3001 باز است
netstat -ano | findstr ":3001"
```

### مشکل 2: ضبط شروع نمی‌شود

**علائم:**
- دکمه REC کار نمی‌کند
- پیام خطا در Console

**راه‌حل:**
```bash
# 1. از Chrome یا Edge استفاده کنید (Firefox پشتیبانی نمی‌کند)
# 2. اجازه دسترسی به فایل سیستم را بدهید
# 3. چک کنید که HTTPS یا localhost باشید
# 4. Console را برای جزئیات خطا چک کنید
```

### مشکل 3: اسلایدها همگام نمی‌شوند

**علائم:**
- تغییر اسلاید در یک تب، در تب دیگر اعمال نمی‌شود

**راه‌حل:**
```bash
# 1. مطمئن شوید هر دو تب به همان Session ID متصل هستند
# 2. بررسی کنید که یکی Leader و دیگری Viewer است
# 3. Console را برای خطاهای Socket.IO چک کنید
# 4. Backend Terminal را برای لاگ‌های session چک کنید
```

### مشکل 4: آپلود شکست می‌خورد

**علائم:**
- پیام "Upload failed" در Console
- نوار پیشرفت قرمز می‌شود

**راه‌حل:**
```bash
# 1. چک کنید endpoint /api/broadcast/upload/init در دسترس است
curl -X POST http://localhost:3001/api/broadcast/upload/init \
  -H "Content-Type: application/json" \
  -d '{"chunkIndex":0,"contentType":"video/webm","size":1024}'

# 2. اگر 404 برگشت، سرور را دوباره راه‌اندازی کنید
# 3. اگر خطای CORS دیدید، بررسی کنید CORS در broadcast-server.js فعال است
```

---

## 📊 معیارهای موفقیت

### Hybrid Recorder
- ✅ ضبط شروع می‌شود
- ✅ تایمر به درستی کار می‌کند
- ✅ فایل محلی ذخیره می‌شود
- ✅ آپلود chunk به backend ارسال می‌شود
- ✅ پیشرفت آپلود نمایش داده می‌شود
- ✅ فایل نهایی قابل پخش است

### WebSocket Sync
- ✅ اتصال برقرار می‌شود (< 1 ثانیه)
- ✅ اسلایدها همگام می‌شوند (تاخیر < 50ms)
- ✅ کنترل Play/Pause کار می‌کند
- ✅ Latency نمایش داده می‌شود
- ✅ Auto-reconnect در صورت قطع ارتباط
- ✅ چندین دستگاه می‌توانند به یک session متصل شوند

---

## 🔗 اتصال به دیتابیس (اختیاری)

در حال حاضر، session ها در memory نگهداری می‌شوند. برای ذخیره persistent:

### گام 1: افزودن جدول به دیتابیس
```sql
-- در Supabase SQL Editor اجرا کنید
CREATE TABLE broadcast_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  leader_device_id VARCHAR(255),
  current_slide INTEGER DEFAULT 0,
  devices JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_broadcast_sessions_session_id ON broadcast_sessions(session_id);
```

### گام 2: اضافه کردن Supabase به backend
```bash
cd backend/broadcast
npm install @supabase/supabase-js
```

### گام 3: آپدیت broadcast-server.js
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

// در تابع getSession
async function getSession(sessionId) {
  const { data, error } = await supabase
    .from('broadcast_sessions')
    .select('*')
    .eq('session_id', sessionId)
    .single();
  
  if (!data) {
    // Create new session
    await supabase
      .from('broadcast_sessions')
      .insert({ session_id: sessionId });
  }
  
  return data;
}
```

---

## 📁 فایل‌های مرتبط

### Frontend
- `frontend/src/components/broadcast/hooks/useHybridRecorder.ts` - Hook ضبط
- `frontend/src/components/broadcast/hooks/useWebSocketSync.ts` - Hook همگام‌سازی
- `frontend/src/components/broadcast/LiveConsole.tsx` - UI اصلی (دکمه‌ها و modal)

### Backend
- `backend/broadcast/broadcast-server.js` - WebSocket server
- `backend/broadcast/package.json` - Dependencies

### Documentation
- `BROADCAST_USAGE_GUIDE.md` - راهنمای جامع استفاده
- `BROADCAST_PLUS_COMPARISON_REPORT.md` - مقایسه با نسخه قبلی

---

## 🎓 نکات تکمیلی

### امنیت
- Session ID ها قابل حدس زدن هستند - برای production از UUID استفاده کنید
- Upload endpoint نیاز به authentication دارد
- برای production، signed URLs واقعی از S3/GCS استفاده کنید

### عملکرد
- Chunk size بهینه: 1 ثانیه (حدود 500KB - 1MB)
- WebSocket latency معمولاً < 20ms در local
- برای session های بزرگ (>50 دستگاه)، از Redis استفاده کنید

### سازگاری مرورگر
- ✅ Chrome/Edge 102+ (File System Access API)
- ❌ Firefox (پشتیبانی نمی‌کند)
- ✅ Safari 16+ (با محدودیت)

---

## 🚀 آماده برای تست!

همه چیز آماده است:
1. ✅ Backend در حال اجرا: http://localhost:3001
2. ✅ Frontend در حال اجرا: http://localhost:5173
3. ✅ بدون خطای TypeScript
4. ✅ همه dependencies نصب شده‌اند

**برای شروع تست:**
1. به http://localhost:5173/#/admin/broadcast بروید
2. مراحل تست بالا را دنبال کنید
3. لاگ‌ها را در Console و Terminal مشاهده کنید

اگر مشکلی پیش آمد، بخش عیب‌یابی را مطالعه کنید یا به من اطلاع دهید! 🎉
