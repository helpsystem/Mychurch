#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""بررسی تعداد سرودها در فایل HTML"""

from bs4 import BeautifulSoup
import os

BASE_DIR = r"D:\Windows.old\Users\Sami\Desktop\Iran Church DC\My Web Sites\Bible\www.kalameh.com"
HTML_FILE = os.path.join(BASE_DIR, "song-archive00ed.html")

print(f"📂 بررسی فایل: {HTML_FILE}")
print(f"✅ وجود فایل: {os.path.exists(HTML_FILE)}")

if os.path.exists(HTML_FILE):
    with open(HTML_FILE, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
        soup = BeautifulSoup(content, "html.parser")
    
    print(f"📏 حجم فایل: {len(content):,} بایت")
    print()
    
    # پیدا کردن هدرها
    headers = soup.find_all("h3", class_="views-accordion-songs_and_video-page-header")
    print(f"🎵 تعداد سرودها: {len(headers)}")
    print()
    
    # نمایش 5 سرود اول
    print("📝 نمونه سرودها:")
    for idx, h in enumerate(headers[:5], 1):
        title_fa = h.find("span", class_="song_title")
        title_en = h.find("span", class_="song_author")
        print(f"{idx}. {title_fa.text.strip() if title_fa else 'N/A'} - {title_en.text.strip() if title_en else 'N/A'}")
    
    # بررسی فایل‌های صوتی و PPTX
    audio_files = [f for f in os.listdir(BASE_DIR) if f.lower().endswith('.mp3')]
    pptx_files = [f for f in os.listdir(BASE_DIR) if f.lower().endswith('.pptx')]
    
    print()
    print(f"🎵 فایل‌های MP3 در پوشه: {len(audio_files)}")
    print(f"📊 فایل‌های PPTX در پوشه: {len(pptx_files)}")
    
    # بررسی پیوندهای داخل HTML
    all_links = soup.find_all("a", href=True)
    mp3_links = [a for a in all_links if '.mp3' in a['href'].lower()]
    pptx_links = [a for a in all_links if '.pptx' in a['href'].lower()]
    
    print()
    print(f"🔗 لینک‌های MP3 در HTML: {len(mp3_links)}")
    print(f"🔗 لینک‌های PPTX در HTML: {len(pptx_links)}")
    
    if len(mp3_links) > len(headers):
        print()
        print("⚠️  تعداد لینک‌های MP3 بیشتر از سرودهاست!")
        print("💡 احتمالاً سرودها در چندین صفحه هستند")
