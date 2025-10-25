#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ادغام و تمیزسازی داده‌های سرودهای کلمه
این اسکریپت JSON فعلی را می‌خواند، تمیز می‌کند و برای استفاده در پروژه آماده می‌سازد
"""

import json
import re
from pathlib import Path


def clean_title(title):
    """تمیزسازی عنوان از متن‌های اضافی"""
    if not title:
        return ""
    
    # حذف متن‌های منو و ناوبری
    unwanted_patterns = [
        r'Jump to navigation.*',
        r'Main Menu.*',
        r'Search.*Login.*',
        r'بخش‌های اصلی.*',
        r'front.*Close.*',
    ]
    
    for pattern in unwanted_patterns:
        title = re.sub(pattern, '', title, flags=re.DOTALL | re.IGNORECASE)
    
    # حذف فاصله‌های اضافی
    title = ' '.join(title.split())
    
    # اگر عنوان بیش از حد بلند است (احتمالا اشتباه استخراج شده)
    if len(title) > 200:
        return ""
    
    return title.strip()


def is_valid_song(song):
    """بررسی معتبر بودن سرود"""
    # باید حداقل عنوان داشته باشد
    title_fa = song.get('title', {}).get('fa', '').strip()
    
    if not title_fa:
        return False
    
    # اگر عنوان شبیه متن منو است
    if any(word in title_fa.lower() for word in ['jump to', 'main menu', 'search', 'login', 'front', 'close']):
        return False
    
    # اگر عنوان بیش از حد طولانی است
    if len(title_fa) > 200:
        return False
    
    return True


def normalize_url(url):
    """نرمال‌سازی URL"""
    if not url:
        return ""
    
    # اگر URL کامل است، همان را برگردان
    if url.startswith('http'):
        return url
    
    # اگر با sites/ شروع می‌شود
    if 'sites/' in url:
        # حذف ../ از ابتدا
        url = re.sub(r'^\.\./', '', url)
        return f"https://www.kalameh.com/{url}"
    
    return url


def extract_youtube_id(url):
    """استخراج ID یوتیوب از URL"""
    if not url:
        return ""
    
    patterns = [
        r'youtube\.com/embed/([a-zA-Z0-9_-]+)',
        r'youtube\.com/watch\?v=([a-zA-Z0-9_-]+)',
        r'youtu\.be/([a-zA-Z0-9_-]+)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    return ""


def clean_and_prepare_songs(input_file, output_file):
    """تمیزسازی و آماده‌سازی داده‌های سرودها"""
    
    print(f"📂 در حال خواندن فایل: {input_file}")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        songs = json.load(f)
    
    print(f"📊 تعداد کل سرودها: {len(songs)}")
    
    # تمیزسازی و فیلتر کردن
    cleaned_songs = []
    seen_titles = set()
    
    for song in songs:
        # تمیزسازی عنوان
        title_fa = clean_title(song.get('title', {}).get('fa', ''))
        
        if not title_fa:
            continue
        
        # حذف تکراری‌ها
        if title_fa.lower() in seen_titles:
            continue
        
        seen_titles.add(title_fa.lower())
        
        # ساخت سرود تمیز
        clean_song = {
            'id': song.get('id', '') or f"song_{len(cleaned_songs) + 1}",
            'title': {
                'fa': title_fa,
                'en': song.get('title', {}).get('en', '') or title_fa
            },
            'artist': song.get('artist', '').strip(),
            'composer': song.get('composer', '').strip(),
            'chord': song.get('chord', '').strip(),
            'mode': song.get('mode', '').strip(),
            'youtubeId': extract_youtube_id(song.get('youtubeId', '') or song.get('videoUrl', '')),
            'audioUrl': normalize_url(song.get('audioUrl', '')),
            'pdfFileUrl': normalize_url(song.get('pdfFileUrl', '')),
            'presentationFileUrl': normalize_url(song.get('presentationFileUrl', '')),
            'sheetMusicUrl': normalize_url(song.get('sheetMusicUrl', '')),
            'lyrics': {
                'fa': song.get('lyrics', {}).get('fa', '').strip(),
                'en': song.get('lyrics', {}).get('en', '').strip()
            },
            'notation': song.get('notation', '').strip(),
            'notes': song.get('notes', '').strip()
        }
        
        # فقط سرودهای معتبر را اضافه کن
        if is_valid_song(clean_song):
            cleaned_songs.append(clean_song)
    
    print(f"\n📊 نتایج:")
    print(f"   • سرودهای معتبر: {len(cleaned_songs)}")
    print(f"   • سرودها با YouTube: {sum(1 for s in cleaned_songs if s.get('youtubeId'))}")
    print(f"   • سرودها با MP3: {sum(1 for s in cleaned_songs if s.get('audioUrl'))}")
    print(f"   • سرودها با PDF: {sum(1 for s in cleaned_songs if s.get('pdfFileUrl'))}")
    print(f"   • سرودها با PowerPoint: {sum(1 for s in cleaned_songs if s.get('presentationFileUrl'))}")
    print(f"   • سرودها با متن: {sum(1 for s in cleaned_songs if s.get('lyrics', {}).get('fa'))}")
    
    # ذخیره
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(cleaned_songs, f, ensure_ascii=False, indent=2)
    
    output_path = Path(output_file)
    print(f"\n✅ فایل ذخیره شد: {output_file}")
    print(f"📦 حجم: {output_path.stat().st_size / 1024:.2f} KB")
    
    # نمونه
    if cleaned_songs:
        print(f"\n📋 نمونه 5 سرود:")
        for i, song in enumerate(cleaned_songs[:5], 1):
            print(f"\n{i}. {song['title']['fa']}")
            if song['artist']:
                print(f"   نویسنده: {song['artist']}")
            if song['youtubeId']:
                print(f"   YouTube: ✓ ({song['youtubeId']})")
            if song['audioUrl']:
                print(f"   MP3: ✓")
            if song['pdfFileUrl']:
                print(f"   PDF: ✓")
            if song['presentationFileUrl']:
                print(f"   PPTX: ✓")


def main():
    input_file = 'kalameh_all_songs.json'
    output_file = 'worship_songs_cleaned.json'
    
    print("=" * 60)
    print("🎵 تمیزسازی و آماده‌سازی داده‌های سرودهای کلمه")
    print("=" * 60)
    print()
    
    clean_and_prepare_songs(input_file, output_file)
    
    print("\n" * 60)
    print("✅ تمیزسازی با موفقیت انجام شد!")
    print("=" * 60)


if __name__ == '__main__':
    main()
