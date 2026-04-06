# گزارش نهایی صوت کتاب مقدس (پیش از دیپلوی)

تاریخ: 2026-04-06

## نتیجه کلیدی

- استخراج نسخه AFINT کامل انجام شد.
- گزارش صوت برای تمام نسخه ها بازتولید و اصلاح شد.
- فایل های گزارش مرجع:
  - Bible/bible_output/audio_capability_report.json
  - Bible/bible_output/audio_capability_report.csv

## KPI های نهایی

- تعداد کل نسخه ها: 25
- نسخه های audio_capable=true: 19
- نسخه های دارای فایل صوتی واقعی (audio_files > 0): 19
- نسخه های بدون فایل صوتی: 6

نسخه های بدون فایل صوتی:

- POV
- مژده
- PES
- BBK
- RCPV
- AFINT

## وضعیت AFINT

- version_id: 4669
- abbr: AFINT
- name: African International New Testament: Literal Translation (British English Edition)
- audio_capable: false
- audio_chapters: 0
- audio_files: 0

توضیح: این رفتار برای AFINT در خروجی فعلی سازگار است و خطای استخراج محسوب نمی شود.

## نمونه نسخه های دارای صوت بالا

- NLT: 11016
- NIV: 9512
- NKJV: 4756
- TPV: 4756
- NASB2020: 4756

## گیت پیشنهادی قبل از دیپلوی

برای جلوگیری از رگرسیون صوت، قبل از هر دیپلوی این چک اجرا شود:

1. فایل گزارش صوت وجود داشته باشد و خالی نباشد.
2. هر نسخه با audio_capable=true باید audio_files>0 داشته باشد.
3. نسخه های کلیدی (NIV, NLT, NKJV, KJV, BSB, NMV) باید فایل صوتی واقعی داشته باشند.

اسکریپت آماده این گیت:

- scripts/check_audio_kpis.py

فرمان اجرا:

"d:/Windows.old/Users/Sami/Desktop/Iran Church DC/Git/Mychurch/mychurch-next/Bible/.venv/Scripts/python.exe" scripts/check_audio_kpis.py
