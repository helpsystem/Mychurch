#!/usr/bin/env python3
"""
Generate TTS audio for all Bible books using Hezar

Usage:
    python generate_all_bible_audio.py
    python generate_all_bible_audio.py --books GEN EXO MAT JHN
    python generate_all_bible_audio.py --start-from EPH
"""

import json
import sys
import os
import argparse
from pathlib import Path
from hezar_tts_generator import generate_chapter_audio, combine_verse_audio

# کتاب‌های کتاب مقدس به ترتیب
BIBLE_BOOKS = [
    # عهد عتیق
    'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA',
    '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST', 'JOB', 'PSA', 'PRO',
    'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO',
    'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL',
    # عهد جدید
    'MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH',
    'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS',
    '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV'
]

def load_bible_data():
    """بارگذاری داده‌های کتاب مقدس"""
    bible_json_path = Path(__file__).parent.parent / 'public' / 'bible_data.json'
    
    if not bible_json_path.exists():
        print(f"❌ خطا: فایل {bible_json_path} پیدا نشد")
        sys.exit(1)
    
    with open(bible_json_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def get_chapter_count(bible_data, book_code):
    """تعداد فصل‌های یک کتاب را بازگردان"""
    version = list(bible_data['bible_text'].keys())[0]
    book_data = bible_data['bible_text'][version].get(book_code, {})
    return len(book_data)

def generate_book(bible_data, book_code, output_dir, skip_existing=True):
    """تولید صوت برای تمام فصل‌های یک کتاب"""
    chapter_count = get_chapter_count(bible_data, book_code)
    
    if chapter_count == 0:
        print(f"⚠️  کتاب {book_code} داده ندارد")
        return
    
    print(f"\n📖 {book_code} - {chapter_count} فصل")
    print("=" * 50)
    
    for chapter in range(1, chapter_count + 1):
        chapter_dir = output_dir / book_code / str(chapter)
        output_file = output_dir / book_code / f"{chapter}.mp3"
        
        # چک کردن اینکه فایل از قبل وجود دارد
        if skip_existing and output_file.exists():
            print(f"✓ فصل {chapter} از قبل موجود است")
            continue
        
        try:
            print(f"\n🔊 تولید صوت فصل {chapter}...")
            
            # تولید صوت برای هر آیه
            success = generate_chapter_audio(bible_data, book_code, chapter, chapter_dir)
            
            if not success:
                print(f"❌ خطا در تولید فصل {chapter}")
                continue
            
            # ترکیب آیات
            print(f"🔗 ترکیب آیات فصل {chapter}...")
            combine_verse_audio(chapter_dir, output_file)
            
            print(f"✅ فصل {chapter} کامل شد")
            
        except Exception as e:
            print(f"❌ خطا در فصل {chapter}: {e}")
            continue

def main():
    parser = argparse.ArgumentParser(description='تولید صوت TTS برای تمام کتاب مقدس')
    parser.add_argument('--books', nargs='+', help='کدهای کتاب‌ها (مثلاً GEN EXO MAT)')
    parser.add_argument('--start-from', help='شروع از کتاب خاص (مثلاً EPH)')
    parser.add_argument('--output-dir', default='../public/audio/bible/hezar', 
                       help='مسیر خروجی فایل‌ها')
    parser.add_argument('--skip-existing', action='store_true', default=True,
                       help='رد شدن از فصل‌هایی که قبلاً تولید شده‌اند')
    parser.add_argument('--no-skip', action='store_false', dest='skip_existing',
                       help='تولید مجدد فایل‌های موجود')
    
    args = parser.parse_args()
    
    # بارگذاری داده‌های کتاب مقدس
    print("📚 بارگذاری داده‌های کتاب مقدس...")
    bible_data = load_bible_data()
    
    # تعیین مسیر خروجی
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # تعیین کتاب‌ها
    if args.books:
        books_to_process = args.books
    elif args.start_from:
        if args.start_from not in BIBLE_BOOKS:
            print(f"❌ خطا: کتاب {args.start_from} پیدا نشد")
            sys.exit(1)
        start_index = BIBLE_BOOKS.index(args.start_from)
        books_to_process = BIBLE_BOOKS[start_index:]
    else:
        books_to_process = BIBLE_BOOKS
    
    print(f"\n🎯 تولید صوت برای {len(books_to_process)} کتاب")
    print(f"📁 مسیر خروجی: {output_dir}")
    print(f"{'🔁' if args.skip_existing else '🔄'} رد کردن فایل‌های موجود: {args.skip_existing}")
    print("\n" + "=" * 50)
    
    # تولید صوت برای هر کتاب
    total_books = len(books_to_process)
    for idx, book_code in enumerate(books_to_process, 1):
        print(f"\n📊 پیشرفت: {idx}/{total_books}")
        try:
            generate_book(bible_data, book_code, output_dir, args.skip_existing)
        except KeyboardInterrupt:
            print("\n\n⚠️  متوقف شد توسط کاربر")
            print(f"✓ {idx-1} کتاب کامل شد")
            sys.exit(0)
        except Exception as e:
            print(f"\n❌ خطای غیرمنتظره در {book_code}: {e}")
            continue
    
    print("\n" + "=" * 50)
    print(f"✅ اتمام! {total_books} کتاب پردازش شد")
    print(f"📁 فایل‌ها در: {output_dir}")

if __name__ == '__main__':
    main()
