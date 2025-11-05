# 🎙️ سیستم تولید صوت خودکار کتاب مقدس با Hezar AI

## ⚠️ نیازمندی مهم: Python 3.12

**توجه:** این سیستم با Python 3.14 کار نمی‌کند!  
شما الان Python 3.14 دارید و باید Python 3.12 نصب کنید.

## 🚀 نصب سریع (3 مرحله)

### 1. دانلود Python 3.12
```
https://www.python.org/downloads/release/python-3128/
```
**مهم:** هنگام نصب "Add to PATH" را تیک بزنید!

### 2. نصب Hezar
```powershell
# PowerShell جدید باز کنید و اجرا کنید:
py -3.12 -m pip install hezar scipy
```

### 3. تولید اولین صوت
```powershell
py -3.12 scripts/hezar_tts_generator.py --book EPH --chapter 1 --combine
```

## 📚 مستندات

- **راهنمای نصب کامل**: `INSTALL_PYTHON312.md`
- **مشکل Python 3.14**: `HEZAR_PYTHON314_ISSUE.md`
- **راهنمای Hezar**: `HEZAR_TTS_GUIDE.md`
- **شروع سریع**: `HEZAR_QUICKSTART.md`

## 🎯 امکانات

✅ تولید صوت فارسی باکیفیت  
✅ تولید خودکار برای تمام کتاب مقدس  
✅ ترکیب آیات به فصل کامل  
✅ رایگان و آفلاین  
✅ بدون نیاز به API key  

## 📦 اسکریپت‌های موجود

```powershell
# تست سیستم
py -3.12 scripts/test_hezar_simple.py

# تولید یک فصل
py -3.12 scripts/hezar_tts_generator.py --book EPH --chapter 1

# تولید کل کتاب مقدس (طولانی!)
py -3.12 scripts/generate_all_bible_audio.py

# تولید از کتاب خاص
py -3.12 scripts/generate_all_bible_audio.py --start-from MAT
```

## ⏱️ زمان تقریبی

- یک آیه: ~2 ثانیه
- یک فصل: ~1 دقیقه
- کل کتاب مقدس: ~20 ساعت (CPU) یا ~5 ساعت (GPU)

## 🔧 عیب‌یابی

### py -3.12 کار نمی‌کند؟
→ PowerShell را ببندید و دوباره باز کنید

### خطا در نصب Hezar؟
→ `HEZAR_PYTHON314_ISSUE.md` را بخوانید

### سؤال دیگری دارید؟
→ `INSTALL_PYTHON312.md` راهنمای کامل است

---

**🎉 بعد از نصب Python 3.12، همه چیز آماده است!**
