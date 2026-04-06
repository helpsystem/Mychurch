# Smoke Checklist (Broadcast / Builder / Bible)

زمان اجرا: 2 تا 5 دقیقه
هدف: تایید سریع سلامت مسیرهای اصلی قبل از دیپلوی

## 1) Broadcast Console
- مسیر: `/broadcast`
- انتظار:
  - صفحه بدون خطای 500 باز شود.
  - دکمه های اصلی (شروع/توقف/نمایش Viewer) قابل کلیک باشند.
  - اگر Session ساخته شد، شناسه جلسه (session id) نمایش داده شود.

## 2) Broadcast Builder
- مسیر: `/broadcast/builder`
- انتظار:
  - صفحه بیلدر باز شود و پنل اسلایدها لود شود.
  - افزودن یک اسلاید تستی بدون ارور انجام شود.
  - پیش نمایش اسلاید رندر شود.

## 3) Broadcast Viewer
- مسیر: `/broadcast/view?session=<ID>&token=<TOKEN>`
- انتظار:
  - صفحه Viewer باز شود.
  - وضعیت اتصال (BroadcastChannel/WebSocket) نمایش داده شود.
  - تغییر اسلاید از Builder در Viewer اعمال شود.

## 4) Bible Reader
- مسیر: `/bible`
- انتظار:
  - لیست نسخه ها لود شود.
  - انتخاب کتاب/فصل کار کند.
  - متن آیات نمایش داده شود.
  - حالت موازی (EN/FA) بدون خطا کار کند.

## 5) API Quick Checks
- `GET /api/bible/versions` -> باید 200 و لیست نسخه ها برگردد.
- `GET /api/bible/books?version=<id>` -> باید 200 و لیست کتاب ها برگردد.
- `GET /api/bible/chapter?version=<id>&book=JHN&chapter=1` -> باید 200 و آیات برگردد.
- `GET /api/bible/parallel?versionEn=<id>&versionFa=<id>&book=JHN&chapter=1` -> باید 200 و خروجی موازی برگردد.

## 6) KPI / Notification Quick Check
- تولید brief:
  - `Bible/.venv/Scripts/python.exe scripts/audio_kpi_brief.py --lang fa --output Bible/bible_output/audio_kpi_brief.txt --json-output Bible/bible_output/audio_kpi_brief.json`
- انتظار:
  - Exit code = 0
  - فایل `Bible/bible_output/audio_kpi_brief.txt` تک خطی و کوتاه باشد.

## 7) Pass Criteria
- هیچ 500 یا crash در صفحات اصلی دیده نشود.
- APIهای Bible همه 200 باشند.
- سینک Builder -> Viewer کار کند.
- KPI brief بدون خطا تولید شود.

## 8) Fail Criteria
- خطای 500 در هر مسیر اصلی.
- لود نشدن نسخه/کتاب/فصل Bible.
- قطع ارتباط Viewer یا عدم اعمال تغییر اسلاید.
- fail شدن اسکریپت KPI.
