#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json

with open('output/bible_data/bible_complete_index.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

total = len(data['entries'])
valid_chapters = [e for e in data['entries'] if e.get('book_iso') and e.get('chapter') is not None and e.get('text_content')]
valid_audio = [e for e in data['entries'] if e.get('audio_path')]

print(f"📊 تحلیل داده‌ها:")
print(f"   کل رکوردها: {total}")
print(f"   فایل‌های صوتی: {len(valid_audio)}")
print(f"   فصل‌های معتبر (با book_iso, chapter, text): {len(valid_chapters)}")
print()

if valid_chapters:
    print("نمونه فصل معتبر:")
    print(f"   Book: {valid_chapters[0].get('book')}")
    print(f"   Chapter: {valid_chapters[0].get('chapter')}")
    print(f"   Book ISO: {valid_chapters[0].get('book_iso')}")
    print(f"   Language: {valid_chapters[0].get('language')}")
    print(f"   Text length: {len(valid_chapters[0].get('text_content', ''))}")
else:
    print("❌ هیچ فصل معتبری یافت نشد!")
