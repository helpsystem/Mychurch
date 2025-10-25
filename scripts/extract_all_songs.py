#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Extract ALL Worship Songs from Multiple HTML Files
==================================================

این اسکریپت همه سرودها را از تمام فایل‌های HTML استخراج می‌کند
"""

import os
import re
import json
import glob
import shutil
from pathlib import Path
from bs4 import BeautifulSoup

# ═══════════════════════════════════════════════════════════
# 📁 تنظیمات مسیرها
# ═══════════════════════════════════════════════════════════

BASE_DIR = r"D:\Windows.old\Users\Sami\Desktop\Iran Church DC\My Web Sites\Bible\www.kalameh.com"
PROJECT_DIR = r"D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch"
EXPORT_DIR = os.path.join(PROJECT_DIR, "public", "worship")
AUDIO_DIR = os.path.join(EXPORT_DIR, "audio")
PPTX_DIR = os.path.join(EXPORT_DIR, "pptx")
DATA_DIR = os.path.join(EXPORT_DIR, "data")

# ═══════════════════════════════════════════════════════════
# 🛠️ توابع کمکی
# ═══════════════════════════════════════════════════════════

def safe_filename(name):
    """تبدیل نام به فرمت امن برای فایل"""
    name = re.sub(r'[<>:"/\\|?*]', '', name)
    name = name.replace(' ', '_')
    return name

def extract_youtube_id(url):
    """استخراج YouTube ID از URL"""
    patterns = [
        r'youtube\.com/watch\?v=([^&]+)',
        r'youtube\.com/embed/([^?]+)',
        r'youtu\.be/([^?]+)',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

def create_slug(title_en, title_fa):
    """ساخت slug منحصر به فرد برای URL"""
    text = title_en if title_en else title_fa
    slug = text.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')

def copy_file_safe(src, dest_dir, new_name=None):
    """کپی امن فایل"""
    if not os.path.exists(src):
        return None
    
    os.makedirs(dest_dir, exist_ok=True)
    
    if new_name:
        dest_path = os.path.join(dest_dir, new_name)
    else:
        dest_path = os.path.join(dest_dir, os.path.basename(src))
    
    try:
        shutil.copy2(src, dest_path)
        return dest_path
    except Exception as e:
        print(f"      ❌ خطا در کپی: {e}")
        return None

# ═══════════════════════════════════════════════════════════
# 📂 یافتن همه فایل‌های HTML
# ═══════════════════════════════════════════════════════════

print("="*80)
print("  Extracting Worship Songs from Kalameh.com Archive")
print("="*80)
print()

# پیدا کردن فایل‌های بزرگتر از 100KB
html_files = []
for file in glob.glob(os.path.join(BASE_DIR, "song-archive*.html")):
    size = os.path.getsize(file)
    if size > 100000:
        html_files.append(file)

html_files.sort()

print(f"📂 تعداد فایل‌های HTML: {len(html_files)}")
print()

# ساخت پوشه‌های خروجی
for dir_path in [AUDIO_DIR, PPTX_DIR, DATA_DIR]:
    os.makedirs(dir_path, exist_ok=True)

# ═══════════════════════════════════════════════════════════
# 🎵 استخراج سرودها از همه فایل‌ها
# ═══════════════════════════════════════════════════════════

all_songs = []
song_id = 1
seen_titles = set()  # برای جلوگیری از تکراری
stats = {
    "total_files": len(html_files),
    "total_songs": 0,
    "with_youtube": 0,
    "with_pptx": 0,
    "duplicates": 0
}

for file_idx, html_file in enumerate(html_files, 1):
    file_name = os.path.basename(html_file)
    print(f"📄 [{file_idx}/{len(html_files)}] {file_name}")
    
    try:
        with open(html_file, "r", encoding="utf-8", errors="ignore") as f:
            soup = BeautifulSoup(f.read(), "html.parser")
        
        headers = soup.find_all("h3", class_="views-accordion-songs_and_video-page-header")
        print(f"   🎵 {len(headers)} سرود یافت شد")
        
        for h in headers:
            song = {
                "id": song_id,
                "title": {"fa": "", "en": "", "es": ""},
                "artist": "",
                "composer": "",
                "youtubeId": "",
                "audioUrl": "",
                "videoUrl": "",
                "presentationFileUrl": "",
                "lyricsFiles": {"fa": "", "en": ""},
                "lyrics": {"fa": "", "en": "", "es": ""},
                "chord": "",
                "mode": "",
                "duration": 0,
                "tags": ["worship", "persian"],
                "language": "fa",
                "dateAdded": "2025-01-24"
            }
            
            # عناوین
            title_fa_elem = h.find("span", class_="song_title")
            title_en_elem = h.find("span", class_="song_author")
            composer_elem = h.find("span", class_="song_compositor")
            
            title_fa = title_fa_elem.text.strip() if title_fa_elem else ""
            title_en = title_en_elem.text.strip() if title_en_elem else ""
            composer = composer_elem.text.strip() if composer_elem else ""
            
            # چک تکراری
            title_key = f"{title_fa}|{title_en}".lower()
            if title_key in seen_titles:
                stats["duplicates"] += 1
                continue
            
            seen_titles.add(title_key)
            
            song["title"]["fa"] = title_fa
            song["title"]["en"] = title_en
            song["title"]["es"] = title_en
            song["composer"] = composer
            song["artist"] = composer
            song["slug"] = create_slug(title_en, title_fa)
            
            # پیدا کردن بلوک محتوا
            block = h.find_next("div", class_="views-row")
            if not block:
                continue
            
            # آکورد و مد
            chord_select = block.find("select")
            if chord_select:
                song["chord"] = chord_select.get("chord_base", "")
            
            mode_elem = block.find("p", class_="major-minor-value")
            if mode_elem:
                song["mode"] = mode_elem.text.strip()
            
            # پاورپوینت
            ppt_link = block.find("a", href=re.compile(r"\.pptx", re.I))
            if ppt_link:
                ppt_href = ppt_link['href']
                ppt_filename = os.path.basename(ppt_href)
                ppt_source = os.path.join(BASE_DIR, ppt_filename)
                
                if os.path.exists(ppt_source):
                    safe_name = safe_filename(ppt_filename)
                    if copy_file_safe(ppt_source, PPTX_DIR, safe_name):
                        song["presentationFileUrl"] = f"/worship/pptx/{safe_name}"
                        stats["with_pptx"] += 1
            
            # YouTube
            yt_link = block.find("a", href=re.compile(r"youtube\.com|youtu\.be", re.I))
            if yt_link:
                yt_id = extract_youtube_id(yt_link['href'])
                if yt_id:
                    song["youtubeId"] = yt_id
                    song["videoUrl"] = f"https://www.youtube.com/embed/{yt_id}"
                    stats["with_youtube"] += 1
            
            all_songs.append(song)
            song_id += 1
        
        stats["total_songs"] += len(headers)
        
    except Exception as e:
        print(f"   ❌ خطا: {e}")

# ═══════════════════════════════════════════════════════════
# 💾 ذخیره JSON
# ═══════════════════════════════════════════════════════════

print()
print("="*80)
print("💾 ذخیره فایل JSON...")

output_file = os.path.join(DATA_DIR, "worship_songs.json")
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(all_songs, f, ensure_ascii=False, indent=2)

print(f"✅ فایل ذخیره شد: {output_file}")
print()

# ═══════════════════════════════════════════════════════════
# 📊 آمار نهایی
# ═══════════════════════════════════════════════════════════

print("="*80)
print("📊 آمار استخراج:")
print("="*80)
print(f"   📄 تعداد فایل‌های پردازش شده: {stats['total_files']}")
print(f"   🎵 تعداد کل سرودها (با تکراری): {stats['total_songs']}")
print(f"   ✨ سرودهای یکتا: {len(all_songs)}")
print(f"   🔁 سرودهای تکراری (حذف شد): {stats['duplicates']}")
print(f"   📹 با لینک YouTube: {stats['with_youtube']}")
print(f"   📊 با فایل PPTX: {stats['with_pptx']}")
print()
print(f"📁 فایل‌ها در: {EXPORT_DIR}")
print("="*80)
