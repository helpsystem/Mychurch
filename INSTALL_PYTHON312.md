# 🚀 راهنمای نصب Python 3.12 و Hezar

## گام 1: دانلود Python 3.12

### روش خودکار (PowerShell):
```powershell
# دانلود و نصب خودکار
.\install-python312-manual.bat
```

### روش دستی:
1. برو به: https://www.python.org/downloads/release/python-3128/
2. دانلود کن: **Windows installer (64-bit)** (~25 MB)
3. فایل دانلود شده را اجرا کن

## گام 2: نصب Python 3.12

**⚠️ مهم: در پنجره نصب:**
- ✅ حتماً تیک "**Add Python to PATH**" را بزنید
- ✅ روی "**Install Now**" کلیک کنید
- ⏳ صبر کنید تا نصب کامل شود (1-2 دقیقه)

## گام 3: تست نصب

**این پنجره PowerShell را ببندید و یک پنجره جدید باز کنید!**

سپس:
```powershell
# تست Python 3.12
py -3.12 --version
```

باید ببینید: `Python 3.12.8`

## گام 4: نصب Hezar

```powershell
# نصب Hezar و وابستگی‌ها
py -3.12 -m pip install hezar scipy

# تست Hezar
py -3.12 scripts/test_hezar_simple.py
```

## گام 5: تولید صوت!

```powershell
# تولید صوت برای یک فصل
py -3.12 scripts/hezar_tts_generator.py --book EPH --chapter 1 --combine

# تولید صوت برای کل کتاب مقدس (طولانی!)
py -3.12 scripts/generate_all_bible_audio.py
```

## عیب‌یابی

### مشکل 1: "py -3.12 کار نمی‌کند"
**راه‌حل:**
- PowerShell را ببندید و دوباره باز کنید
- یا از مسیر کامل استفاده کنید:
  ```powershell
  C:\Users\[YourName]\AppData\Local\Programs\Python\Python312\python.exe --version
  ```

### مشکل 2: "pip not found"
**راه‌حل:**
```powershell
py -3.12 -m ensurepip --upgrade
```

### مشکل 3: نصب Hezar خطا می‌دهد
**راه‌حل:**
```powershell
# نصب یک به یک
py -3.12 -m pip install torch
py -3.12 -m pip install transformers
py -3.12 -m pip install hezar
py -3.12 -m pip install scipy
```

## دستورات مفید

```powershell
# لیست تمام نسخه‌های Python
py -0

# نصب یک package خاص
py -3.12 -m pip install package_name

# لیست package های نصب شده
py -3.12 -m pip list

# حذف Hezar
py -3.12 -m pip uninstall hezar

# بروزرسانی pip
py -3.12 -m pip install --upgrade pip
```

## زمان‌بندی تخمینی

| کار | زمان |
|-----|------|
| دانلود Python 3.12 | 1-2 دقیقه |
| نصب Python 3.12 | 1-2 دقیقه |
| نصب Hezar | 2-3 دقیقه |
| دانلود مدل TTS (اولین بار) | 2-3 دقیقه |
| تولید صوت یک فصل | 1-2 دقیقه |
| **جمع کل** | **7-12 دقیقه** |

## چک‌لیست نهایی

- [ ] Python 3.12 دانلود شد
- [ ] Python 3.12 نصب شد (با PATH)
- [ ] PowerShell جدید باز شد
- [ ] `py -3.12 --version` کار می‌کند
- [ ] Hezar نصب شد
- [ ] تست Hezar موفق بود
- [ ] اولین فایل صوتی تولید شد

## لینک‌های مفید

- **دانلود Python 3.12**: https://www.python.org/downloads/release/python-3128/
- **مستندات Hezar**: https://github.com/hezarai/hezar
- **مشکلات رایج**: `HEZAR_PYTHON314_ISSUE.md`
- **راهنمای کامل**: `HEZAR_TTS_GUIDE.md`

---

**آماده‌اید؟ شروع کنید! 🚀**
