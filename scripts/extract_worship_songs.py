#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Worship Songs Extractor from Kalameh.com Archive
================================================

این اسکریپت تمام سرودها را از فایل HTML استخراج می‌کند و:
- فایل‌های صوتی را کپی می‌کند
- فایل‌های پاورپوینت را کپی می‌کند
- لینک‌های ویدیو را استخراج می‌کند
- یک فایل JSON کامل تولید می‌کند

نیازمندی‌ها:
    pip install beautifulsoup4 lxml

استفاده:
    python extract_worship_songs.py
"""

import os
import re
import json
import shutil
from pathlib import Path
from bs4 import BeautifulSoup
from urllib.parse import unquote

# ═══════════════════════════════════════════════════════════
# 📁 تنظیمات مسیرها
# ═══════════════════════════════════════════════════════════

# مسیر لوکال که فایل HTML و فولدرهای آن داخلش است
BASE_DIR = r"D:\Windows.old\Users\Sami\Desktop\Iran Church DC\My Web Sites\Bible\www.kalameh.com"
HTML_FILE = os.path.join(BASE_DIR, "song-archive00ed.html")

# مسیر خروجی - پوشه worship در پروژه React
PROJECT_DIR = r"D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch"
EXPORT_DIR = os.path.join(PROJECT_DIR, "public", "worship")
AUDIO_DIR = os.path.join(EXPORT_DIR, "audio")
PPTX_DIR = os.path.join(EXPORT_DIR, "pptx")
VIDEO_DIR = os.path.join(EXPORT_DIR, "videos")
LYRICS_DIR = os.path.join(EXPORT_DIR, "lyrics")
DATA_DIR = os.path.join(EXPORT_DIR, "data")
TIMEPOINTS_DIR = os.path.join(DATA_DIR, "timepoints")

# ═══════════════════════════════════════════════════════════
# 🛠️ توابع کمکی
# ═══════════════════════════════════════════════════════════

def safe_filename(name):
    """تبدیل نام به فرمت امن برای فایل"""
    # حذف کاراکترهای غیرمجاز
    name = re.sub(r'[<>:"/\\|?*]', '', name)
    # جایگزینی فاصله با underscore
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
    # اولویت با عنوان انگلیسی
    text = title_en if title_en else title_fa
    slug = text.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')

def copy_file_safe(src, dest_dir, new_name=None):
    """کپی امن فایل با چک کردن وجود"""
    if not os.path.exists(src):
        return None
    
    os.makedirs(dest_dir, exist_ok=True)
    
    if new_name:
        dest_path = os.path.join(dest_dir, new_name)
    else:
        dest_path = os.path.join(dest_dir, os.path.basename(src))
    
    try:
        shutil.copy2(src, dest_path)
        return os.path.basename(dest_path)
    except Exception as e:
        print(f"⚠️  خطا در کپی فایل {src}: {e}")
        return None

# ═══════════════════════════════════════════════════════════
# 📦 ساخت پوشه‌ها
# ═══════════════════════════════════════════════════════════

print("🚀 شروع استخراج سرودها از Kalameh.com...")
print(f"📂 مسیر مبدا: {BASE_DIR}")
print(f"📂 مسیر مقصد: {EXPORT_DIR}")
print()

for path in [EXPORT_DIR, AUDIO_DIR, PPTX_DIR, VIDEO_DIR, LYRICS_DIR, DATA_DIR, TIMEPOINTS_DIR]:
    os.makedirs(path, exist_ok=True)

# ═══════════════════════════════════════════════════════════
# 📖 خواندن و پارس HTML
# ═══════════════════════════════════════════════════════════

if not os.path.exists(HTML_FILE):
    print(f"❌ فایل HTML یافت نشد: {HTML_FILE}")
    exit(1)

print("🔍 در حال خواندن فایل HTML...")

with open(HTML_FILE, "r", encoding="utf-8", errors="ignore") as f:
    soup = BeautifulSoup(f.read(), "html.parser")

songs = []
song_id = 1

# ═══════════════════════════════════════════════════════════
# 🎵 استخراج سرودها
# ═══════════════════════════════════════════════════════════

print("📝 در حال استخراج اطلاعات سرودها...")

# پیدا کردن تمام هدرهای سرود
headers = soup.find_all("h3", class_="views-accordion-songs_and_video-page-header")

print(f"✅ تعداد سرودهای یافت شده: {len(headers)}")
print()

for idx, h in enumerate(headers, 1):
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
        "tags": [],
        "language": "fa",
        "dateAdded": "2025-01-24"
    }
    
    # استخراج عناوین
    title_fa_elem = h.find("span", class_="song_title")
    title_en_elem = h.find("span", class_="song_author")
    composer_elem = h.find("span", class_="song_compositor")
    
    title_fa = title_fa_elem.text.strip() if title_fa_elem else ""
    title_en = title_en_elem.text.strip() if title_en_elem else ""
    composer = composer_elem.text.strip() if composer_elem else ""
    
    song["title"]["fa"] = title_fa
    song["title"]["en"] = title_en
    song["title"]["es"] = title_en  # پیش‌فرض همان انگلیسی
    song["composer"] = composer
    song["artist"] = composer  # برای سازگاری
    
    # ساخت slug
    slug = create_slug(title_en, title_fa)
    song["slug"] = slug
    
    print(f"🎵 [{idx}/{len(headers)}] {title_fa} - {title_en}")
    
    # پیدا کردن بلوک محتوا
    block = h.find_next("div", class_="views-row")
    if not block:
        print(f"   ⚠️  بلوک محتوا یافت نشد")
        continue
    
    # آکورد و مد (مینور/ماژور)
    chord_select = block.find("select")
    if chord_select:
        song["chord"] = chord_select.get("chord_base", "")
    
    mode_elem = block.find("p", class_="major-minor-value")
    if mode_elem:
        song["mode"] = mode_elem.text.strip()
    
    # ═══════════════════════════════════════════════════════════
    # 📊 استخراج و کپی فایل پاورپوینت
    # ═══════════════════════════════════════════════════════════
    
    ppt_link = block.find("a", href=re.compile(r"\.pptx", re.I))
    if ppt_link:
        ppt_href = ppt_link.get("href", "")
        ppt_href = unquote(ppt_href)  # decode URL encoding
        
        # مسیر فایل در سیستم لوکال
        ppt_src = os.path.join(BASE_DIR, ppt_href.lstrip("/").replace("/", os.sep))
        
        # نام فایل جدید
        safe_name = safe_filename(title_en if title_en else title_fa)
        ppt_new_name = f"{safe_name}.pptx"
        
        copied = copy_file_safe(ppt_src, PPTX_DIR, ppt_new_name)
        if copied:
            song["presentationFileUrl"] = f"/worship/pptx/{copied}"
            print(f"   📊 PPTX: {copied}")
    
    # ═══════════════════════════════════════════════════════════
    # 🎵 استخراج و کپی فایل صوتی
    # ═══════════════════════════════════════════════════════════
    
    audio_link = block.find("a", href=re.compile(r"\.mp3", re.I))
    if audio_link:
        audio_href = audio_link.get("href", "")
        audio_href = unquote(audio_href)
        
        audio_src = os.path.join(BASE_DIR, audio_href.lstrip("/").replace("/", os.sep))
        
        # نام فایل جدید
        safe_name = safe_filename(title_en if title_en else title_fa)
        audio_new_name = f"{safe_name}.mp3"
        
        copied = copy_file_safe(audio_src, AUDIO_DIR, audio_new_name)
        if copied:
            song["audioUrl"] = f"/worship/audio/{copied}"
            print(f"   🎵 MP3: {copied}")
    
    # ═══════════════════════════════════════════════════════════
    # 🎬 استخراج لینک یوتیوب
    # ═══════════════════════════════════════════════════════════
    
    video_link = block.find("a", href=re.compile(r"youtube", re.I))
    if video_link:
        video_url = video_link.get("href", "")
        youtube_id = extract_youtube_id(video_url)
        
        if youtube_id:
            song["youtubeId"] = youtube_id
            song["videoUrl"] = f"https://www.youtube.com/embed/{youtube_id}"
            print(f"   🎬 YouTube: {youtube_id}")
    
    # ═══════════════════════════════════════════════════════════
    # 📝 استخراج متن سرود (lyrics)
    # ═══════════════════════════════════════════════════════════
    
    lyrics_div = block.find("div", class_="lyrics-text")
    if lyrics_div:
        lyrics_text = lyrics_div.get_text(separator="\n", strip=True)
        song["lyrics"]["fa"] = lyrics_text
        song["lyrics"]["en"] = lyrics_text  # اگر ترجمه نداریم
        song["lyrics"]["es"] = lyrics_text
        
        # ذخیره در فایل جداگانه
        lyrics_fa_file = f"{slug}_fa.txt"
        lyrics_en_file = f"{slug}_en.txt"
        
        with open(os.path.join(LYRICS_DIR, lyrics_fa_file), "w", encoding="utf-8") as f:
            f.write(lyrics_text)
        
        song["lyricsFiles"]["fa"] = f"/worship/lyrics/{lyrics_fa_file}"
        song["lyricsFiles"]["en"] = f"/worship/lyrics/{lyrics_en_file}"
        
        print(f"   📝 متن سرود ذخیره شد")
    
    # ═══════════════════════════════════════════════════════════
    # 🏷️ تگ‌ها و دسته‌بندی
    # ═══════════════════════════════════════════════════════════
    
    song["tags"] = ["worship", "persian"]
    if "praise" in title_en.lower() or "praise" in title_fa:
        song["tags"].append("praise")
    if song["mode"].lower() == "minor":
        song["tags"].append("minor")
    elif song["mode"].lower() == "major":
        song["tags"].append("major")
    
    songs.append(song)
    song_id += 1
    print()

# ═══════════════════════════════════════════════════════════
# 💾 ذخیره فایل JSON نهایی
# ═══════════════════════════════════════════════════════════

json_file = os.path.join(DATA_DIR, "worship_songs.json")

print("💾 در حال ذخیره فایل JSON...")

with open(json_file, "w", encoding="utf-8") as f:
    json.dump(songs, f, ensure_ascii=False, indent=2)

# ═══════════════════════════════════════════════════════════
# 📊 گزارش نهایی
# ═══════════════════════════════════════════════════════════

print()
print("═" * 60)
print("✅ استخراج با موفقیت انجام شد!")
print("═" * 60)
print()
print(f"📊 تعداد کل سرودها: {len(songs)}")
print(f"📁 مسیر خروجی: {EXPORT_DIR}")
print()
print(f"📂 پوشه‌های ایجاد شده:")
print(f"   🎵 صوت‌ها:        {AUDIO_DIR}")
print(f"   📊 پاورپوینت‌ها:   {PPTX_DIR}")
print(f"   📝 متن سرودها:    {LYRICS_DIR}")
print(f"   💾 داده‌ها:       {DATA_DIR}")
print()
print(f"📄 فایل JSON: {json_file}")
print()

# آمار تفصیلی
songs_with_audio = sum(1 for s in songs if s["audioUrl"])
songs_with_pptx = sum(1 for s in songs if s["presentationFileUrl"])
songs_with_video = sum(1 for s in songs if s["youtubeId"])
songs_with_lyrics = sum(1 for s in songs if s["lyrics"]["fa"])

print("📈 آمار:")
print(f"   🎵 با فایل صوتی:    {songs_with_audio}/{len(songs)}")
print(f"   📊 با پاورپوینت:    {songs_with_pptx}/{len(songs)}")
print(f"   🎬 با ویدیو یوتیوب: {songs_with_video}/{len(songs)}")
print(f"   📝 با متن:          {songs_with_lyrics}/{len(songs)}")
print()

print("═" * 60)
print("🚀 مراحل بعدی:")
print("═" * 60)
print()
print("1. فایل‌ها را مرور کنید و از صحت آن‌ها اطمینان حاصل کنید")
print("2. فایل worship_songs.json را در ContentContext بارگذاری کنید")
print("3. اگر نیاز به timepoints دارید، آن‌ها را به صورت دستی اضافه کنید")
print("4. فایل‌های بزرگ را روی سرور یا CDN آپلود کنید")
print()
print("✨ موفق باشید!")
