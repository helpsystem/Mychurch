# 🎨 سیستم تولید خودکار عکس
## راهنمای استفاده از سرویس تولید عکس‌های مسیحی

---

## 📋 فهرست مطالب
1. [معرفی](#معرفی)
2. [نصب و راه‌اندازی](#نصب-و-راه‌اندازی)
3. [API های پشتیبانی شده](#api-های-پشتیبانی-شده)
4. [API Endpoints](#api-endpoints)
5. [استفاده در فرانت‌اند](#استفاده-در-فرانت‌اند)
6. [تنظیمات پیشرفته](#تنظیمات-پیشرفته)

---

## 🌟 معرفی

این سیستم به صورت خودکار عکس‌های با کیفیت برای موضوعات مسیحی تولید می‌کند:

### ویژگی‌ها:
- ✅ **تولید خودکار**: هر 7 روز یکبار عکس‌های جدید تولید می‌شود
- ✅ **چند منبع**: پشتیبانی از OpenAI DALL-E, Stability AI, Unsplash
- ✅ **موضوعات متنوع**: 12 موضوع مسیحی مختلف
- ✅ **فارسی/انگلیسی**: توضیحات در دو زبان
- ✅ **ذخیره‌سازی محلی**: عکس‌ها روی سرور ذخیره می‌شوند
- ✅ **Metadata کامل**: اطلاعات کامل هر عکس ثبت می‌شود

### موضوعات پشتیبانی شده:
1. **Jesus** (عیسی مسیح)
2. **Cross** (صلیب)
3. **Church** (کلیسا)
4. **Prayer** (دعا)
5. **Worship** (عبادت)
6. **Bible** (کتاب مقدس)
7. **Faith** (ایمان)
8. **Hope** (امید)
9. **Love** (محبت)
10. **Peace** (صلح)
11. **Salvation** (نجات)
12. **Grace** (فیض)

---

## 🚀 نصب و راه‌اندازی

### 1. تنظیم API Keys در `.env`

```env
# برای Unsplash (رایگان - توصیه می‌شود)
UNSPLASH_ACCESS_KEY=your-unsplash-access-key

# برای OpenAI DALL-E (پولی ولی کیفیت عالی)
OPENAI_API_KEY=your-openai-api-key

# برای Stability AI (پولی - جایگزین DALL-E)
STABILITY_API_KEY=your-stability-api-key

# تنظیمات تولید عکس
IMAGE_UPDATE_INTERVAL=604800000  # 7 days in milliseconds
AUTO_GENERATE_IMAGES=true
IMAGE_TOPICS=jesus,cross,church,prayer,worship,bible,faith,hope,love,peace,salvation,grace
IMAGE_OUTPUT_DIR=public/generated-images
```

### 2. ایجاد دایرکتوری عکس‌ها

```bash
mkdir -p public/generated-images
```

### 3. راه‌اندازی سرور

```bash
cd backend
npm run dev
```

سرویس تولید عکس به صورت خودکار شروع می‌شود:

```
🎨 Image Generation Service ready
```

---

## 🔑 API های پشتیبانی شده

### 1️⃣ Unsplash API (رایگان - توصیه می‌شود)

**مزایا:**
- ✅ رایگان (5000 درخواست در ماه)
- ✅ عکس‌های واقعی و با کیفیت
- ✅ بدون محدودیت حقوق نشر
- ✅ کرِدیت عکاس به صورت خودکار

**نحوه دریافت API Key:**
1. به [Unsplash Developers](https://unsplash.com/developers) برو
2. یک حساب کاربری بساز
3. New Application بساز
4. Access Key رو کپی کن

**مثال استفاده:**
```javascript
UNSPLASH_ACCESS_KEY=abc123xyz789
```

---

### 2️⃣ OpenAI DALL-E API (پولی)

**مزایا:**
- ✅ کیفیت فوق‌العاده
- ✅ تولید دقیق بر اساس prompt
- ✅ عکس‌های یونیک و هنری

**هزینه:**
- DALL-E 3: $0.040 per image (1024x1024)
- DALL-E 3 HD: $0.080 per image (1024x1024)

**نحوه دریافت API Key:**
1. به [OpenAI Platform](https://platform.openai.com/) برو
2. حساب کاربری بساز و اعتبار شارژ کن
3. از بخش API Keys کلید بساز

---

### 3️⃣ Stability AI API (پولی)

**مزایا:**
- ✅ کیفیت خیلی خوب
- ✅ سرعت بالا
- ✅ قیمت مناسب‌تر از DALL-E

**هزینه:**
- $0.002 per image (512x512)
- $0.008 per image (1024x1024)

---

## 📡 API Endpoints

### 1. دریافت همه عکس‌ها

```http
GET /api/images/all
```

**پاسخ:**
```json
{
  "success": true,
  "count": 12,
  "images": [
    {
      "topic": "jesus",
      "filename": "jesus-1760194826778.jpg",
      "url": "/generated-images/jesus-1760194826778.jpg",
      "source": "unsplash",
      "photographer": "John Doe",
      "photographerUrl": "https://unsplash.com/@johndoe",
      "description": "Beautiful portrait of Jesus",
      "timestamp": 1760194826778
    }
  ],
  "lastUpdate": 1760194826778,
  "nextUpdate": "2025-10-18T10:00:00.000Z"
}
```

---

### 2. دریافت عکس بر اساس موضوع

```http
GET /api/images/topic/:topic
```

**مثال:**
```bash
curl http://localhost:3001/api/images/topic/jesus
```

---

### 3. تولید دستی عکس‌های جدید

```http
POST /api/images/generate
```

**مثال:**
```bash
curl -X POST http://localhost:3001/api/images/generate
```

**پاسخ:**
```json
{
  "success": true,
  "message": "Image generation started in background",
  "status": "processing"
}
```

---

### 4. دریافت وضعیت سیستم

```http
GET /api/images/status
```

**پاسخ:**
```json
{
  "success": true,
  "status": "scheduled",
  "config": {
    "autoGenerate": true,
    "updateIntervalDays": 7,
    "topics": ["jesus", "cross", "church"],
    "outputDir": "public/generated-images"
  },
  "lastUpdate": "2025-10-11T10:00:00.000Z",
  "nextUpdate": "2025-10-18T10:00:00.000Z",
  "daysUntilNext": 7,
  "imageCount": 12,
  "apisConfigured": {
    "openai": false,
    "stability": false,
    "unsplash": true
  }
}
```

---

### 5. دریافت عکس تصادفی

```http
GET /api/images/random
```

---

## 🎨 استفاده در فرانت‌اند

### نمایش گالری کامل

```tsx
import AutoImageGallery from '@/components/AutoImageGallery';

function MyPage() {
  return (
    <div>
      <h1>گالری عکس‌های مسیحی</h1>
      <AutoImageGallery 
        showControls={true}
        autoRefresh={true}
      />
    </div>
  );
}
```

---

### نمایش محدود (مثلاً 3 عکس)

```tsx
<AutoImageGallery 
  limit={3}
  showControls={false}
/>
```

---

### استفاده دستی با Axios

```tsx
import axios from 'axios';
import { useEffect, useState } from 'react';

function MyComponent() {
  const [images, setImages] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:3001/api/images/all')
      .then(res => setImages(res.data.images));
  }, []);

  return (
    <div>
      {images.map(img => (
        <img 
          key={img.filename}
          src={`http://localhost:3001${img.url}`}
          alt={img.topic}
        />
      ))}
    </div>
  );
}
```

---

## ⚙️ تنظیمات پیشرفته

### تغییر فاصله زمانی آپدیت

```env
# هر 3 روز یکبار
IMAGE_UPDATE_INTERVAL=259200000

# هر روز یکبار
IMAGE_UPDATE_INTERVAL=86400000

# هر ماه یکبار
IMAGE_UPDATE_INTERVAL=2592000000
```

---

### اضافه کردن موضوعات جدید

```env
IMAGE_TOPICS=jesus,cross,church,prayer,worship,bible,faith,hope,love,peace,salvation,grace,heaven,resurrection
```

سپس در `imageGenerationService.js` prompt های جدید اضافه کن:

```javascript
const prompts = {
  // موضوعات قبلی...
  heaven: 'Beautiful heavenly clouds with divine light, peaceful sky',
  resurrection: 'Empty tomb with morning light, Easter resurrection'
};
```

---

### تغییر سایز عکس‌ها

در `imageGenerationService.js`:

```javascript
// برای Unsplash
params: {
  orientation: 'landscape', // or 'portrait' or 'squarish'
  per_page: 1
}

// برای OpenAI
{
  size: '1024x1024' // or '1792x1024' or '1024x1792'
}

// برای Stability AI
{
  width: 1024,
  height: 1024
}
```

---

## 🔍 عیب‌یابی

### عکس‌ها تولید نمی‌شوند

1. چک کن API key درست باشه:
```bash
# تست وضعیت
curl http://localhost:3001/api/images/status
```

2. لاگ‌های سرور رو بررسی کن:
```
❌ Failed to generate image for jesus: ...
```

3. دستی تولید کن:
```bash
curl -X POST http://localhost:3001/api/images/generate
```

---

### عکس‌ها نمایش داده نمی‌شوند

1. چک کن دایرکتوری وجود داشته باشه:
```bash
ls public/generated-images/
```

2. چک کن URL درست باشه:
```
http://localhost:3001/generated-images/jesus-123456.jpg
```

3. Static file serving رو در Express فعال کن:
```javascript
app.use('/generated-images', express.static('public/generated-images'));
```

---

## 📊 آمار و گزارش

### تعداد عکس‌های تولید شده

```bash
curl http://localhost:3001/api/images/all | jq '.count'
```

### آخرین زمان آپدیت

```bash
curl http://localhost:3001/api/images/status | jq '.lastUpdate'
```

### زمان آپدیت بعدی

```bash
curl http://localhost:3001/api/images/status | jq '.nextUpdate'
```

---

## 🎯 نتیجه‌گیری

با این سیستم:
1. ✅ عکس‌های با کیفیت مسیحی به صورت خودکار تولید می‌شود
2. ✅ هر 7 روز یکبار عکس‌های جدید می‌آید
3. ✅ از چندین API مختلف پشتیبانی می‌کند
4. ✅ فارسی و انگلیسی کامل
5. ✅ مدیریت آسان از طریق API

**توصیه:** برای شروع از Unsplash استفاده کن (رایگان و کیفیت عالی)

---

## 📞 پشتیبانی

اگر مشکلی داشتی:
1. لاگ‌های سرور رو چک کن
2. API keys رو بررسی کن
3. Endpoint `/api/images/status` رو تست کن

---

**ساخته شده با ❤️ برای کلیسای مسیحی ایرانیان**
