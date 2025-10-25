#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
استخراج سرودهای کلمه از فایل‌های تک‌تک سرودها در پوشه /song/
این اسکریپت فایل‌های HTML در پوشه song را پارس می‌کند
و اطلاعات کامل هر سرود را استخراج می‌کند.
"""

import os
import re
import json
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote
import argparse


class IndividualSongParser(HTMLParser):
    """پارسر HTML برای استخراج اطلاعات از صفحات تک‌تک سرودها"""
    
    def __init__(self):
        super().__init__()
        self.song = {
            'title': {'fa': '', 'en': ''},
            'artist': '',
            'composer': '',
            'chord': '',
            'mode': '',
            'youtubeId': '',
            'audioUrl': '',
            'pdfFileUrl': '',
            'presentationFileUrl': '',
            'sheetMusicUrl': '',
            'lyrics': {'fa': '', 'en': ''},
            'notation': '',
            'notes': ''
        }
        self.in_title = False
        self.in_artist = False
        self.current_tag = None
        
    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        self.current_tag = tag
        
        # Title در h2 یا title tag
        if tag in ['h1', 'h2', 'title']:
            self.in_title = True
            
        # Author/Artist spans
        if tag == 'span':
            classes = attrs_dict.get('class', '')
            if 'song_author' in classes or 'artist' in classes:
                self.in_artist = True
                
        # Links و media files
        if tag == 'a':
            href = attrs_dict.get('href', '')
            
            # YouTube video
            if 'youtube.com/embed/' in href:
                youtube_id = self.extract_youtube_id(href)
                if youtube_id:
                    self.song['youtubeId'] = youtube_id
                    
            # PDF files
            elif href.endswith('.pdf') or 'pdf' in href.lower():
                if not self.song['pdfFileUrl']:
                    self.song['pdfFileUrl'] = self.normalize_url(href)
                    
            # PowerPoint files
            elif href.endswith('.pptx') or href.endswith('.ppt'):
                if not self.song['presentationFileUrl']:
                    self.song['presentationFileUrl'] = self.normalize_url(href)
                    
            # MP3 files
            elif href.endswith('.mp3') or 'mp3' in href.lower():
                if not self.song['audioUrl']:
                    self.song['audioUrl'] = self.normalize_url(href)
                    
        # Audio source tags
        if tag == 'source':
            src = attrs_dict.get('src', '')
            if src and '.mp3' in src.lower():
                if not self.song['audioUrl']:
                    self.song['audioUrl'] = self.normalize_url(src)
                    
        # Select for chord base
        if tag == 'select':
            select_id = attrs_dict.get('id', '')
            if 'acordes' in select_id.lower():
                chord_base = attrs_dict.get('chord_base', '')
                if chord_base:
                    self.song['chord'] = chord_base
                    
    def handle_data(self, data):
        data = data.strip()
        if not data:
            return
            
        # Extract title
        if self.in_title and not self.song['title']['fa']:
            # حذف " | کلمه" از عنوان
            title = re.sub(r'\s*\|\s*کلمه\s*$', '', data)
            if title and title != 'کلمه':
                self.song['title']['fa'] = title
                
        # Extract artist
        if self.in_artist:
            if data and data not in self.song['artist']:
                self.song['artist'] = data
                
        # Check for major/minor mode
        if 'مینور' in data or 'Minor' in data:
            self.song['mode'] = 'Minor'
        elif 'ماژور' in data or 'Major' in data:
            self.song['mode'] = 'Major'
            
    def handle_endtag(self, tag):
        if tag in ['h1', 'h2', 'title']:
            self.in_title = False
        if tag == 'span':
            self.in_artist = False
            
    def extract_youtube_id(self, url):
        """استخراج ID یوتیوب از URL"""
        patterns = [
            r'youtube\.com/embed/([a-zA-Z0-9_-]+)',
            r'youtube\.com/watch\?v=([a-zA-Z0-9_-]+)',
            r'youtu\.be/([a-zA-Z0-9_-]+)'
        ]
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return None
        
    def normalize_url(self, url):
        """نرمال‌سازی URL برای استفاده در پروژه"""
        if url.startswith('http'):
            return url
        # حذف ../ از ابتدای مسیر
        url = re.sub(r'^\.\./', '', url)
        # اگر با sites/ شروع می‌شود، به URL کامل تبدیل کن
        if url.startswith('sites/'):
            return f'https://www.kalameh.com/{url}'
        return url


def extract_song_from_html_regex(html_content, filename):
    """استخراج اطلاعات سرود با استفاده از regex (backup method)"""
    song = {
        'title': {'fa': '', 'en': ''},
        'artist': '',
        'composer': '',
        'chord': '',
        'mode': '',
        'youtubeId': '',
        'audioUrl': '',
        'pdfFileUrl': '',
        'presentationFileUrl': '',
        'sheetMusicUrl': '',
        'lyrics': {'fa': '', 'en': ''},
        'notation': '',
        'notes': ''
    }
    
    # Title from <title> tag
    title_match = re.search(r'<title>([^<]+?)\s*\|\s*کلمه</title>', html_content)
    if title_match:
        song['title']['fa'] = title_match.group(1).strip()
    
    # Alternative: h2 title
    if not song['title']['fa']:
        h2_match = re.search(r'<h2[^>]*>([^<]+)</h2>', html_content)
        if h2_match:
            song['title']['fa'] = h2_match.group(1).strip()
    
    # Artist from span with song_author class
    artist_match = re.search(r'<span class="song_author">([^<]+)</span>', html_content)
    if artist_match:
        song['artist'] = artist_match.group(1).strip()
    
    # Composer from span with song_compositor class
    composer_match = re.search(r'<span class="song_compositor">([^<]+)</span>', html_content)
    if composer_match:
        song['composer'] = composer_match.group(1).strip()
    
    # Chord base
    chord_match = re.search(r'chord_base="([A-G][#b]?)"', html_content)
    if chord_match:
        song['chord'] = chord_match.group(1)
    
    # Mode (Major/Minor)
    if 'مینور' in html_content or '>Minor' in html_content:
        song['mode'] = 'Minor'
    elif 'ماژور' in html_content or '>Major' in html_content:
        song['mode'] = 'Major'
    
    # YouTube ID
    youtube_patterns = [
        r"youtube\.com/embed/([a-zA-Z0-9_-]+)",
        r"youtube\.com/watch\?v=([a-zA-Z0-9_-]+)",
        r"youtu\.be/([a-zA-Z0-9_-]+)"
    ]
    for pattern in youtube_patterns:
        match = re.search(pattern, html_content)
        if match:
            song['youtubeId'] = match.group(1)
            break
    
    # PDF file
    pdf_match = re.search(r'href="([^"]+\.pdf)"', html_content)
    if pdf_match:
        url = pdf_match.group(1)
        if not url.startswith('http'):
            url = f"https://www.kalameh.com/{url.lstrip('../')}"
        song['pdfFileUrl'] = url
    
    # PowerPoint file
    pptx_match = re.search(r'href="([^"]+\.pptx?)"', html_content)
    if pptx_match:
        url = pptx_match.group(1)
        if not url.startswith('http'):
            url = f"https://www.kalameh.com/{url.lstrip('../')}"
        song['presentationFileUrl'] = url
    
    # MP3 file
    mp3_patterns = [
        r'<source src="([^"]+\.mp3)"',
        r'href="([^"]+\.mp3)"'
    ]
    for pattern in mp3_patterns:
        match = re.search(pattern, html_content)
        if match:
            url = match.group(1)
            if not url.startswith('http'):
                url = f"https://www.kalameh.com/{url.lstrip('../')}"
            song['audioUrl'] = url
            break
    
    return song


def process_song_file(file_path):
    """پردازش یک فایل HTML سرود"""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            html_content = f.read()
        
        # روش اول: استفاده از parser
        parser = IndividualSongParser()
        try:
            parser.feed(html_content)
            song = parser.song
        except Exception as e:
            print(f"⚠️  Parser error for {file_path.name}, using regex fallback")
            song = extract_song_from_html_regex(html_content, file_path.name)
        
        # اگر عنوان خالی است، از نام فایل استفاده کن
        if not song['title']['fa']:
            # حذف .html و -2, -3 etc از نام فایل
            title = re.sub(r'-\d+\.html$', '', file_path.name)
            title = re.sub(r'\.html$', '', title)
            # تبدیل - به فاصه
            title = title.replace('-', ' ')
            song['title']['fa'] = unquote(title)
        
        # اگر عنوان انگلیسی خالی است، از فارسی استفاده کن
        if not song['title']['en'] and song['title']['fa']:
            song['title']['en'] = song['title']['fa']
        
        # اضافه کردن ID منحصر به فرد
        song['id'] = re.sub(r'[^a-zA-Z0-9]', '_', file_path.stem)
        
        return song
        
    except Exception as e:
        print(f"❌ Error processing {file_path.name}: {e}")
        return None


def process_all_songs(input_dir, output_file):
    """پردازش تمام فایل‌های HTML در پوشه song"""
    input_path = Path(input_dir)
    
    if not input_path.exists():
        print(f"❌ پوشه پیدا نشد: {input_dir}")
        return
    
    html_files = list(input_path.glob('*.html'))
    print(f"📁 تعداد فایل‌های HTML پیدا شده: {len(html_files)}")
    
    songs = []
    processed = 0
    
    for html_file in html_files:
        song = process_song_file(html_file)
        if song and song['title']['fa']:
            songs.append(song)
            processed += 1
            if processed % 50 == 0:
                print(f"✅ پردازش شده: {processed}/{len(html_files)}")
    
    print(f"\n📊 نتیجه نهایی:")
    print(f"   • تعداد فایل‌های پردازش شده: {len(html_files)}")
    print(f"   • تعداد سرودهای استخراج شده: {len(songs)}")
    print(f"   • سرودها با YouTube: {sum(1 for s in songs if s.get('youtubeId'))}")
    print(f"   • سرودها با MP3: {sum(1 for s in songs if s.get('audioUrl'))}")
    print(f"   • سرودها با PDF: {sum(1 for s in songs if s.get('pdfFileUrl'))}")
    print(f"   • سرودها با PowerPoint: {sum(1 for s in songs if s.get('presentationFileUrl'))}")
    
    # ذخیره در فایل JSON
    output_path = Path(output_file)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(songs, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ فایل JSON ذخیره شد: {output_file}")
    print(f"📦 حجم فایل: {output_path.stat().st_size / 1024:.2f} KB")
    
    # نمایش 3 سرود اول به عنوان نمونه
    if songs:
        print(f"\n📋 نمونه 3 سرود اول:")
        for i, song in enumerate(songs[:3], 1):
            print(f"\n{i}. {song['title']['fa']}")
            print(f"   نویسنده: {song['artist']}")
            print(f"   آکورد: {song['chord']} {song['mode']}")
            print(f"   YouTube: {'✓' if song['youtubeId'] else '✗'}")
            print(f"   MP3: {'✓' if song['audioUrl'] else '✗'}")
            print(f"   PDF: {'✓' if song['pdfFileUrl'] else '✗'}")
            print(f"   PPTX: {'✓' if song['presentationFileUrl'] else '✗'}")


def main():
    parser = argparse.ArgumentParser(
        description='استخراج سرودهای کلمه از فایل‌های تک‌تک سرودها',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument(
        '-i', '--input',
        default=r'D:\Windows.old\Users\Sami\Desktop\Iran Church DC\My Web Sites\Bible\www.kalameh.com\song',
        help='مسیر پوشه حاوی فایل‌های HTML سرودها'
    )
    
    parser.add_argument(
        '-o', '--output',
        default='kalameh_songs_final.json',
        help='نام فایل خروجی JSON'
    )
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("🎵 استخراج سرودهای کلمه از فایل‌های تک‌تک سرودها")
    print("=" * 60)
    print(f"📂 پوشه ورودی: {args.input}")
    print(f"💾 فایل خروجی: {args.output}")
    print("=" * 60)
    print()
    
    process_all_songs(args.input, args.output)
    
    print("\n" + "=" * 60)
    print("✅ استخراج با موفقیت به پایان رسید!")
    print("=" * 60)


if __name__ == '__main__':
    main()
