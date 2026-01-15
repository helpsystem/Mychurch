"""
اسکریپت تبدیل سرودهای SeppoWP به فرمت MyChurch
و دانلود فایل‌های PPT
"""

import json
import os
import re
import requests
from pathlib import Path
from urllib.parse import urlparse
import time

# مسیرها
SEPPO_SONGS_PATH = r"D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\data\seppo_songs_utf8.json"
OUTPUT_DIR = r"D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\data\converted_songs"
PPTX_DIR = os.path.join(OUTPUT_DIR, "pptx")
MYCHURCH_SONGS_PATH = r"D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\data\worship_songs.json"

# ایجاد پوشه‌ها
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(PPTX_DIR, exist_ok=True)


def clean_title(title_fa):
    """پاکسازی عنوان فارسی از کاراکترهای اضافی"""
    if not title_fa:
        return ""
    # حذف نام خواننده از انتهای عنوان (معمولاً بدون فاصله چسبیده)
    # الگوهای معمول: نام‌های انگلیسی، نام‌های فارسی
    cleaned = title_fa.strip()
    return cleaned


def extract_english_title(title_fa):
    """استخراج عنوان انگلیسی از عنوان فارسی (اگر وجود داشته باشد)"""
    # جستجوی الگوهای انگلیسی در متن
    english_pattern = r'([A-Za-z][A-Za-z\s\-\']+(?:\s[A-Za-z][A-Za-z\s\-\']+)*)'
    matches = re.findall(english_pattern, title_fa)
    
    for match in matches:
        # فیلتر کردن موارد کوتاه یا بی‌معنی
        if len(match) > 3 and not match.lower() in ['and', 'the', 'for', 'you']:
            return match.strip()
    return ""


def extract_artist(title_fa):
    """استخراج نام خواننده از عنوان (اگر در انتهای عنوان باشد)"""
    # الگوهای معمول خوانندگان
    known_artists = [
        "Hillsong", "Chris Tomlin", "Michael Card", "Matt Redman",
        "روزبه نجارنژاد", "وحید نوروزی", "دریا", "نیلوفر",
        "ژیلبرت هوسپیان", "کاوه رفیعی", "پیمان", "آزاده تقی پور"
    ]
    
    for artist in known_artists:
        if artist.lower() in title_fa.lower():
            return artist
    return ""


def download_pptx(url, song_id):
    """دانلود فایل PPTX"""
    if not url or not url.startswith("http"):
        return None
    
    try:
        filename = f"{song_id:03d}.pptx"
        filepath = os.path.join(PPTX_DIR, filename)
        
        if os.path.exists(filepath):
            print(f"  ⏭️ PPT موجود: {filename}")
            return f"/worship/pptx/{filename}"
        
        print(f"  ⬇️ دانلود PPT: {filename}")
        response = requests.get(url, timeout=30, allow_redirects=True)
        
        if response.status_code == 200:
            with open(filepath, 'wb') as f:
                f.write(response.content)
            return f"/worship/pptx/{filename}"
        else:
            print(f"  ❌ خطا در دانلود: {response.status_code}")
            return url  # نگه داشتن لینک اصلی
            
    except Exception as e:
        print(f"  ❌ خطا: {e}")
        return url  # نگه داشتن لینک اصلی


def convert_songs():
    """تبدیل سرودهای SeppoWP به فرمت MyChurch"""
    
    print("\n" + "="*50)
    print("  تبدیل سرودهای SeppoWP به فرمت MyChurch")
    print("="*50 + "\n")
    
    # خواندن فایل SeppoWP با چندین encoding
    seppo_songs = None
    for encoding in ['utf-8', 'utf-8-sig', 'utf-16', 'utf-16-le', 'cp1256', 'latin-1']:
        try:
            with open(SEPPO_SONGS_PATH, 'r', encoding=encoding) as f:
                content = f.read()
                # حذف BOM اگر وجود دارد
                if content.startswith('\ufeff'):
                    content = content[1:]
                seppo_songs = json.loads(content)
                print(f"✅ فایل با encoding {encoding} خوانده شد")
                break
        except Exception as e:
            print(f"❌ خطا با {encoding}: {str(e)[:50]}")
            continue
    
    if seppo_songs is None:
        print("❌ نتوانستیم فایل را بخوانیم!")
        return []
    
    print(f"📊 تعداد سرودهای SeppoWP: {len(seppo_songs)}")
    
    # خواندن سرودهای موجود MyChurch
    existing_songs = []
    if os.path.exists(MYCHURCH_SONGS_PATH):
        with open(MYCHURCH_SONGS_PATH, 'r', encoding='utf-8') as f:
            existing_songs = json.load(f)
    
    print(f"📊 تعداد سرودهای موجود MyChurch: {len(existing_songs)}")
    
    # شناسایی یوتیوب آیدی‌های موجود برای جلوگیری از تکرار
    existing_youtube_ids = {s.get('youtubeId') for s in existing_songs if s.get('youtubeId')}
    
    converted_songs = []
    new_id = max([s.get('id', 0) for s in existing_songs], default=0) + 1
    
    for idx, song in enumerate(seppo_songs):
        title_fa = song.get('title', {}).get('fa', '')
        youtube_id = song.get('youtubeId', '')
        ppt_url = song.get('pptUrl', '')
        
        # رد کردن سرودهای تکراری
        if youtube_id in existing_youtube_ids:
            print(f"⏭️ تکراری: {title_fa[:30]}...")
            continue
        
        # پاکسازی و استخراج اطلاعات
        clean_fa_title = clean_title(title_fa)
        en_title = extract_english_title(title_fa)
        artist = extract_artist(title_fa) or song.get('artist', '')
        
        # دانلود PPT
        local_ppt = None
        if ppt_url:
            local_ppt = download_pptx(ppt_url, new_id)
        
        # ساخت آبجکت سرود جدید
        new_song = {
            "id": new_id,
            "title": {
                "fa": clean_fa_title,
                "en": en_title,
                "es": ""
            },
            "artist": artist,
            "youtubeId": youtube_id,
            "audioUrl": "",
            "videoUrl": f"https://www.youtube.com/embed/{youtube_id}" if youtube_id else "",
            "presentationFileUrl": local_ppt or ppt_url,
            "sourceUrl": song.get('sourceUrl', ''),
            "lyrics": {
                "fa": "",
                "en": "",
                "es": ""
            },
            "category": song.get('category', ''),
            "key": song.get('key', '')
        }
        
        converted_songs.append(new_song)
        existing_youtube_ids.add(youtube_id)
        new_id += 1
        
        print(f"✅ {new_id-1}: {clean_fa_title[:40]}...")
        
        # کمی صبر برای جلوگیری از بلاک شدن
        time.sleep(0.1)
    
    # ذخیره سرودهای تبدیل شده
    output_file = os.path.join(OUTPUT_DIR, "converted_songs.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(converted_songs, f, ensure_ascii=False, indent=2)
    
    print(f"\n\n📊 آمار نهایی:")
    print(f"   سرودهای جدید: {len(converted_songs)}")
    print(f"   ذخیره شده در: {output_file}")
    
    # ادغام با سرودهای موجود
    all_songs = existing_songs + converted_songs
    merged_file = os.path.join(OUTPUT_DIR, "all_songs_merged.json")
    with open(merged_file, 'w', encoding='utf-8') as f:
        json.dump(all_songs, f, ensure_ascii=False, indent=2)
    
    print(f"   مجموع سرودها: {len(all_songs)}")
    print(f"   فایل ادغام شده: {merged_file}")
    
    return converted_songs


if __name__ == "__main__":
    convert_songs()
    print("\n✅ تبدیل کامل شد!")
