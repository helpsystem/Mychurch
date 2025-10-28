#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
نمایش آمار فایل‌های استخراج شده
"""

import json
import os

# تغییر دایرکتوری به محل اسکریپت
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)

# خواندن فایل JSON
with open('output/bible_data/bible_complete_index.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# محاسبه آمار
total = data['total_entries']
stats = data['statistics']
entries = data['entries']

farsi_count = sum(1 for e in entries if e['language'] == 'farsi')
english_count = sum(1 for e in entries if e['language'] == 'english')
with_text = sum(1 for e in entries if e.get('text_content'))
with_audio = sum(1 for e in entries if e.get('audio_path'))

# کتاب‌های یکتا
books_farsi = set(e['book'] for e in entries if e['language'] == 'farsi' and e.get('book'))
books_english = set(e['book'] for e in entries if e['language'] == 'english' and e.get('book'))

print("╔════════════════════════════════════════════════════════════════╗")
print("║          گزارش نهایی استخراج محتوای کتاب مقدس                  ║")
print("╚════════════════════════════════════════════════════════════════╝")
print()
print(f"📊 کل فایل‌های پردازش شده: {total:,}")
print(f"   • فایل‌های MP3: {stats['mp3_files']}")
print(f"   • فایل‌های HTML: {stats['html_files']}")
print(f"   • فایل‌های متنی: {stats['text_files']}")
print()
print(f"🌍 بر اساس زبان:")
print(f"   • فارسی: {farsi_count:,} فایل")
print(f"   • انگلیسی: {english_count:,} فایل")
print()
print(f"📖 محتوای متنی:")
print(f"   • فایل‌ها با محتوای متنی: {with_text:,}")
print(f"   • کتاب‌های یکتای فارسی: {len(books_farsi)}")
print(f"   • کتاب‌های یکتای انگلیسی: {len(books_english)}")
print()
print(f"🎵 فایل‌های صوتی:")
print(f"   • فایل‌های MP3: {stats['mp3_files']}")
print(f"   • فایل‌ها با مسیر صوتی: {with_audio}")
print()
print(f"✅ وضعیت:")
print(f"   • خطاها: {stats['errors']}")
print(f"   • رد شده: {stats['skipped']}")
print()
print(f"📁 فایل‌های خروجی:")
print(f"   • JSON: output/bible_data/bible_complete_index.json")
print(f"   • لاگ: output/bible_data/extraction_log.txt")
print()
print("╔════════════════════════════════════════════════════════════════╗")
print("║                    ✅ استخراج کامل شد!                         ║")
print("╚════════════════════════════════════════════════════════════════╝")
print()
print("🚀 مرحله بعدی:")
print("   1. بررسی فایل JSON")
print("   2. ساخت جداول در Supabase")
print("   3. آپلود با: python upload-to-supabase.py")
