# 🚀 راهنمای سریع - شروع در 5 دقیقه

## گام ۱: نصب پکیج‌ها (2 دقیقه)

```bash
cd "D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\scripts"

pip install openai python-dotenv requests
```

## گام ۲: تنظیم API Key (1 دقیقه)

1. برو به: https://platform.openai.com/api-keys
2. Login کن (یا Sign Up)
3. کلیک کن روی "Create new secret key"
4. کپی کن (مثلاً: `sk-proj-abc123def456...`)

5. یه فایل `.env` بساز در همین دایرکتوری:
```bash
# در ویندوز:
notepad .env

# یا با PowerShell:
"OPENAI_API_KEY=sk-your-key-here" | Out-File -Encoding utf8 .env
```

6. API key خودت رو جایگزین کن:
```
OPENAI_API_KEY=sk-proj-abc123def456...
```

## گام ۳: تست سیستم (30 ثانیه)

```bash
python test_whisper_setup.py
```

اگه همه ✅ سبز بود، آماده‌ای!

## گام ۴: پردازش اولین سرود (1 دقیقه)

```bash
# تست با یک سرود:
python batch_process_worship_songs.py --max-songs 1
```

## گام ۵: پردازش همه سرودها (چند ساعت - اختیاری)

```bash
# پردازش 10 تای اول (تست):
python batch_process_worship_songs.py --max-songs 10

# پردازش همه (364 سرود):
python batch_process_worship_songs.py

# بعد از پردازش، آپدیت JSON:
python batch_process_worship_songs.py --update-json
```

---

## 📦 خروجی

فایل‌ها در اینجا ذخیره میشن:
```
public/worship/data/timings/
├── song_1_timing.json
├── song_1_timing.vtt
├── song_1_timing.srt
├── song_2_timing.json
└── ...
```

---

## 💰 هزینه

- هر دقیقه صوت: $0.006
- سرود 4 دقیقه‌ای: $0.024
- 364 سرود × 4 دقیقه = **~$8.74**

اول با چند تا سرود تست کن! 🎵

---

## ❓ مشکل داری?

```bash
# اگه خطا دیدی:
python test_whisper_setup.py

# بخون:
cat LYRICS_SYNC_README.md
```

موفق باشی! 🎉
