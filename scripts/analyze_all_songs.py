#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Extract ALL Worship Songs from Multiple HTML Files
==================================================

این اسکریپت همه فایل‌های HTML بزرگ را پردازش می‌کند
"""

import os
import glob
from bs4 import BeautifulSoup

BASE_DIR = r"D:\Windows.old\Users\Sami\Desktop\Iran Church DC\My Web Sites\Bible\www.kalameh.com"

# پیدا کردن همه فایل‌های song-archive که بزرگتر از 100KB هستند
html_files = []
for file in glob.glob(os.path.join(BASE_DIR, "song-archive*.html")):
    size = os.path.getsize(file)
    if size > 100000:  # بزرگتر از 100KB
        html_files.append((file, size))

# مرتب‌سازی بر اساس حجم (بزرگترها اول)
html_files.sort(key=lambda x: x[1], reverse=True)

print(f"📂 تعداد فایل‌های HTML یافت شده: {len(html_files)}")
print()

total_songs = 0
songs_per_file = {}

for idx, (file_path, size) in enumerate(html_files, 1):
    file_name = os.path.basename(file_path)
    
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            soup = BeautifulSoup(f.read(), "html.parser")
        
        headers = soup.find_all("h3", class_="views-accordion-songs_and_video-page-header")
        song_count = len(headers)
        total_songs += song_count
        songs_per_file[file_name] = song_count
        
        # نمایش اولین سرود برای تأیید
        first_song = ""
        if song_count > 0:
            title_fa = headers[0].find("span", class_="song_title")
            if title_fa:
                first_song = title_fa.text.strip()[:30]
        
        size_kb = size / 1024
        print(f"{idx:2}. {file_name:30} | {size_kb:6.1f}KB | {song_count:3} سرود | {first_song}")
        
    except Exception as e:
        print(f"{idx:2}. {file_name:30} | خطا: {e}")

print()
print("="*80)
print(f"📊 جمع کل سرودها: {total_songs}")
print()

# نمایش فایل‌هایی که بیشترین سرود دارند
top_files = sorted(songs_per_file.items(), key=lambda x: x[1], reverse=True)[:10]
print("🏆 فایل‌های با بیشترین سرود:")
for idx, (fname, count) in enumerate(top_files, 1):
    print(f"   {idx}. {fname}: {count} سرود")
