# راهنمای دریافت API Key رایگان Gemini

## مشکل فعلی
API key فعلی منقضی شده است:
```
message: 'API key expired'
```

## راه حل: دریافت API Key رایگان جدید

### مرحله 1: ورود به Google AI Studio
1. به آدرس زیر بروید:
   https://makersuite.google.com/app/apikey
   
   یا
   
   https://aistudio.google.com/app/apikey

2. با حساب Google خود وارد شوید

### مرحله 2: ایجاد API Key جدید
1. روی دکمه **"Create API Key"** کلیک کنید
2. API key جدید نمایش داده می‌شود
3. روی **"Copy"** کلیک کنید

### مرحله 3: به‌روزرسانی فایل .env
1. فایل `.env` را در root پروژه باز کنید:
   ```
   d:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\.env
   ```

2. خط `GEMINI_API_KEY` را پیدا کنید و API key جدید را جایگزین کنید:
   ```env
   GEMINI_API_KEY=AIza...  (کلید جدید شما)
   ```

3. فایل را ذخیره کنید

### مرحله 4: تست مجدد
پس از به‌روزرسانی، این دستور را اجرا کنید:
```bash
node backend/scripts/test-gemini-timing.js
```

## حد رایگان Gemini 1.5 Flash

Gemini 1.5 Flash (که در اسکریپت استفاده می‌کنیم) حد رایگان خوبی دارد:

- ✅ **15 درخواست در دقیقه**
- ✅ **1 میلیون توکن در روز**
- ✅ **1500 درخواست در روز**

برای 1189 فصل کتاب مقدس:
- با 15 RPM: حدود 80 دقیقه (~1.3 ساعت)
- همه چیز رایگان! 🎉

## نکات مهم

1. **Resume Capability**: اسکریپت ما قابلیت Resume دارد. اگر قطع شد، از جایی که قطع شده ادامه می‌دهد.

2. **Rate Limiting**: اسکریپت 2 ثانیه بین هر درخواست استراحت می‌کند تا از محدودیت 15 RPM عبور نکند.

3. **هزینه صفر**: تا زمانی که از Gemini 1.5 Flash استفاده کنیم، همه چیز رایگان است.

## مراحل بعد از دریافت API Key

```bash
# 1. تست یک فصل
node backend/scripts/test-gemini-timing.js

# 2. اگر موفق بود، پردازش کامل
node backend/scripts/generate-bible-timing-batch.js
```

---

**صبر می‌کنم تا API key جدید دریافت کنید و در `.env` قرار دهید.**
