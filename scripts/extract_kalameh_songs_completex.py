#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
اسکریپت استخراج کامل سرودهای کلمه از فایل‌های HTML
این اسکریپت تمام فایل‌های HTML در فولدر song-archive را پارس می‌کند
و اطلاعات کامل هر سرود را استخراج می‌کند.
"""

import os
import re
import json
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote, urljoin
import argparse


class KalamehSongParser(HTMLParser):
    """پارسر HTML برای استخراج اطلاعات سرودها"""
    
    def __init__(self):
        super().__init__()
        self.songs = []
        self.current_song = None
        self.in_song_item = False
        self.in_title = False
        self.in_artist = False
        self.in_description = False
        self.current_tag = None
        self.current_attrs = {}
        
    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        self.current_tag = tag
        self.current_attrs = attrs_dict
        
        # شناسایی شروع یک سرود (معمولا در div یا article)
        if tag in ['div', 'article', 'li']:
            classes = attrs_dict.get('class', '')
            if any(keyword in classes.lower() for keyword in ['song', 'track', 'item', 'entry', 'post']):
                self.in_song_item = True
                self.current_song = {
                    'title': {'fa': '', 'en': ''},
                    'artist': '',
                    'description': '',
                    'youtubeId': '',
                    'audioUrl': '',
                    'pdfFileUrl': '',
                    'presentationFileUrl': '',
                    'sheetMusicUrl': '',
                    'lyrics': {'fa': '', 'en': ''},
                    'category': '',
                    'tags': [],
                    'sourceUrl': '',
                }
        
        # شناسایی عنوان
        if tag in ['h1', 'h2', 'h3', 'h4', 'a']:
            classes = attrs_dict.get('class', '')
            if any(keyword in classes.lower() for keyword in ['title', 'heading', 'name']):
                self.in_title = True
                if tag == 'a':
                    self.current_song['sourceUrl'] = attrs_dict.get('href', '')
        
        # شناسایی نام خواننده
        if tag in ['span', 'div', 'p']:
            classes = attrs_dict.get('class', '')
            if any(keyword in classes.lower() for keyword in ['artist', 'singer', 'author', 'by']):
                self.in_artist = True
        
        # شناسایی توضیحات
        if tag == 'p':
            classes = attrs_dict.get('class', '')
            if any(keyword in classes.lower() for keyword in ['description', 'excerpt', 'summary', 'content']):
                self.in_description = True
        
        # استخراج لینک‌ها
        if tag == 'a' and self.in_song_item:
            href = attrs_dict.get('href', '')
            text = attrs_dict.get('title', '').lower()
            
            # یوتیوب
            if 'youtube.com' in href or 'youtu.be' in href:
                video_id = self._extract_youtube_id(href)
                if video_id:
                    self.current_song['youtubeId'] = video_id
            
            # فایل صوتی
            elif any(ext in href.lower() for ext in ['.mp3', '.wav', '.m4a', '.ogg']):
                self.current_song['audioUrl'] = href
            
            # PDF
            elif '.pdf' in href.lower():
                if any(keyword in text for keyword in ['sheet', 'نت', 'موسیقی']):
                    self.current_song['sheetMusicUrl'] = href
                else:
                    self.current_song['pdfFileUrl'] = href
            
            # پاورپوینت
            elif any(ext in href.lower() for ext in ['.ppt', '.pptx']):
                self.current_song['presentationFileUrl'] = href
    
    def handle_endtag(self, tag):
        if tag in ['div', 'article', 'li'] and self.in_song_item:
            # پایان یک سرود
            if self.current_song and self.current_song['title']['fa']:
                self.songs.append(self.current_song)
            self.in_song_item = False
            self.current_song = None
        
        if tag in ['h1', 'h2', 'h3', 'h4', 'a']:
            self.in_title = False
        
        if tag in ['span', 'div', 'p']:
            self.in_artist = False
            self.in_description = False
    
    def handle_data(self, data):
        data = data.strip()
        if not data or not self.in_song_item:
            return
        
        if self.in_title and self.current_song:
            self.current_song['title']['fa'] = data
            self.current_song['title']['en'] = data  # می‌تونیم بعدا ترجمه کنیم
        
        elif self.in_artist and self.current_song:
            self.current_song['artist'] = data
        
        elif self.in_description and self.current_song:
            self.current_song['description'] = data
    
    @staticmethod
    def _extract_youtube_id(url):
        """استخراج ID ویدیو از URL یوتیوب"""
        patterns = [
            r'(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})',
            r'youtube\.com\/embed\/([a-zA-Z0-9_-]{11})',
        ]
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return None


def extract_songs_from_html_file(file_path):
    """استخراج سرودها از یک فایل HTML"""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            html_content = f.read()
        
        parser = KalamehSongParser()
        parser.feed(html_content)
        
        return parser.songs
    except Exception as e:
        print(f"❌ خطا در خواندن {file_path}: {e}")
        return []


def extract_songs_from_html_simple(file_path):
    """استخراج ساده با regex برای فایل‌های HTML ساده"""
    songs = []
    
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # الگوی عنوان سرود
        title_pattern = r'<(?:h[1-6]|a)[^>]*>([^<]+)</(?:h[1-6]|a)>'
        titles = re.findall(title_pattern, content, re.IGNORECASE)
        
        # الگوی لینک یوتیوب
        youtube_pattern = r'(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})'
        youtube_ids = re.findall(youtube_pattern, content)
        
        # الگوی لینک MP3
        audio_pattern = r'href=["\']([^"\']*\.mp3[^"\']*)["\']'
        audio_urls = re.findall(audio_pattern, content, re.IGNORECASE)
        
        # الگوی لینک PDF
        pdf_pattern = r'href=["\']([^"\']*\.pdf[^"\']*)["\']'
        pdf_urls = re.findall(pdf_pattern, content, re.IGNORECASE)
        
        # الگوی لینک PPTX
        ppt_pattern = r'href=["\']([^"\']*\.pptx?[^"\']*)["\']'
        ppt_urls = re.findall(ppt_pattern, content, re.IGNORECASE)
        
        # ترکیب نتایج
        max_items = max(len(titles), len(youtube_ids), len(audio_urls))
        
        for i in range(max_items):
            song = {
                'title': {
                    'fa': titles[i] if i < len(titles) else f'سرود {i+1}',
                    'en': titles[i] if i < len(titles) else f'Song {i+1}'
                },
                'artist': 'نامشخص',
                'youtubeId': youtube_ids[i] if i < len(youtube_ids) else '',
                'audioUrl': audio_urls[i] if i < len(audio_urls) else '',
                'pdfFileUrl': pdf_urls[i] if i < len(pdf_urls) else '',
                'presentationFileUrl': ppt_urls[i] if i < len(ppt_urls) else '',
                'sheetMusicUrl': '',
                'lyrics': {'fa': '', 'en': ''},
                'category': '',
                'tags': [],
            }
            songs.append(song)
        
        return songs
    
    except Exception as e:
        print(f"❌ خطا در پارس {file_path}: {e}")
        return []


def process_all_html_files(base_folder):
    """پردازش تمام فایل‌های HTML در فولدر"""
    all_songs = []
    base_path = Path(base_folder)
    
    print(f"\n📂 جستجو در فولدر: {base_folder}")
    print("=" * 70)
    
    # پیدا کردن تمام فایل‌های HTML
    html_files = list(base_path.glob('*.html')) + list(base_path.glob('*.htm'))
    
    print(f"✅ {len(html_files)} فایل HTML پیدا شد\n")
    
    for idx, html_file in enumerate(html_files, 1):
        print(f"[{idx}/{len(html_files)}] پردازش: {html_file.name}")
        
        # امتحان با parser اصلی
        songs = extract_songs_from_html_file(html_file)
        
        # اگر نتیجه نداد، از روش ساده استفاده کن
        if not songs:
            songs = extract_songs_from_html_simple(html_file)
        
        if songs:
            print(f"    ✅ {len(songs)} سرود استخراج شد")
            all_songs.extend(songs)
        else:
            print(f"    ⚠️  هیچ سرودی پیدا نشد")
    
    return all_songs


def clean_and_deduplicate(songs):
    """پاک‌سازی و حذف تکراری‌ها"""
    seen_titles = set()
    unique_songs = []
    
    for song in songs:
        title = song['title']['fa'].strip()
        
        # فیلتر سرودهای خالی یا بی‌معنی
        if not title or len(title) < 3:
            continue
        
        # حذف تکراری‌ها
        if title in seen_titles:
            continue
        
        seen_titles.add(title)
        
        # اضافه کردن ID یکتا
        song['id'] = f"song_{len(unique_songs) + 1}"
        
        unique_songs.append(song)
    
    return unique_songs


def save_to_json(songs, output_file):
    """ذخیره نتایج در فایل JSON"""
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(songs, f, ensure_ascii=False, indent=2)
        
        print(f"\n✅ فایل ذخیره شد: {output_file}")
        print(f"📊 تعداد کل سرودها: {len(songs)}")
        
        # آمار
        with_youtube = sum(1 for s in songs if s.get('youtubeId'))
        with_audio = sum(1 for s in songs if s.get('audioUrl'))
        with_pdf = sum(1 for s in songs if s.get('pdfFileUrl'))
        with_ppt = sum(1 for s in songs if s.get('presentationFileUrl'))
        
        print(f"\n📈 آمار:")
        print(f"   🎥 با ویدیو یوتیوب: {with_youtube}")
        print(f"   🎵 با فایل صوتی: {with_audio}")
        print(f"   📄 با فایل PDF: {with_pdf}")
        print(f"   📑 با فایل پاورپوینت: {with_ppt}")
        
        return True
    
    except Exception as e:
        print(f"❌ خطا در ذخیره فایل: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description='استخراج کامل سرودهای کلمه از فایل‌های HTML',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
مثال‌ها:
  # استخراج از فولدر پیش‌فرض
  python extract_kalameh_songs_complete.py

  # مشخص کردن فولدر ورودی و خروجی
  python extract_kalameh_songs_complete.py -i "D:/path/to/song-archive" -o kalameh_output.json
        """
    )
    
    parser.add_argument(
        '-i', '--input',
        default=r'D:\Windows.old\Users\Sami\Desktop\Iran Church DC\My Web Sites\Bible\www.kalameh.com\song-archive',
        help='مسیر فولدر ورودی که فایل‌های HTML در آن قرار دارند'
    )
    
    parser.add_argument(
        '-o', '--output',
        default='kalameh_songs_extracted.json',
        help='نام فایل خروجی JSON'
    )
    
    args = parser.parse_args()
    
    print("=" * 70)
    print("🎵 استخراج کامل سرودهای کلمه از فایل‌های HTML")
    print("=" * 70)
    
    # بررسی وجود فولدر
    if not os.path.exists(args.input):
        print(f"❌ فولدر پیدا نشد: {args.input}")
        return
    
    # پردازش تمام فایل‌ها
    all_songs = process_all_html_files(args.input)
    
    if not all_songs:
        print("\n⚠️  هیچ سرودی استخراج نشد!")
        return
    
    # پاک‌سازی و حذف تکراری
    print(f"\n🧹 پاک‌سازی و حذف تکراری‌ها...")
    unique_songs = clean_and_deduplicate(all_songs)
    
    # ذخیره
    output_path = Path(args.output)
    if not output_path.is_absolute():
        output_path = Path(__file__).parent / output_path
    
    save_to_json(unique_songs, output_path)
    
    print("\n" + "=" * 70)
    print("✅ استخراج با موفقیت به پایان رسید!")
    print("=" * 70)


if __name__ == '__main__':
    main()
