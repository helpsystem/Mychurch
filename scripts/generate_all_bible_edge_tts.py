#!/usr/bin/env python3
"""
Generate audio for all Bible books using Edge TTS
==================================================
Automatically generates TTS audio for the entire Bible

Usage:
    py -3.12 generate_all_bible_edge_tts.py
    py -3.12 generate_all_bible_edge_tts.py --start-from EPH
    py -3.12 generate_all_bible_edge_tts.py --books GEN EXO MAT JHN
    py -3.12 generate_all_bible_edge_tts.py --voice fa-IR-DilaraNeural
"""

import json
import sys
import os
import argparse
from pathlib import Path
import asyncio
import edge_tts

# کتاب‌های کتاب مقدس به ترتیب
BIBLE_BOOKS = [
    # عهد عتیق (39 کتاب)
    'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA',
    '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST', 'JOB', 'PSA', 'PRO',
    'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO',
    'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL',
    # عهد جدید (27 کتاب)
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

async def generate_verse_audio(text, output_path, voice="fa-IR-FaridNeural"):
    """تولید صوت برای یک آیه"""
    try:
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(str(output_path))
        return True
    except Exception as e:
        print(f"❌ خطا: {e}")
        return False

async def generate_chapter_audio(bible_data, book_code, chapter_num, output_dir, voice, skip_existing=True):
    """تولید صوت برای تمام آیات یک فصل"""
    try:
        # دریافت داده‌های فصل
        chapter_data = bible_data['bible_text']['118'][book_code][str(chapter_num)]
        verses_fa = chapter_data.get('fa', {})
        
        if not verses_fa:
            return 0
        
        # ساخت پوشه خروجی
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # تولید صوت برای هر آیه
        success_count = 0
        
        for verse_num, verse_text in verses_fa.items():
            output_file = output_dir / f"{verse_num}.mp3"
            
            # رد شدن از فایل‌های موجود
            if skip_existing and output_file.exists():
                success_count += 1
                continue
            
            # تولید صوت
            success = await generate_verse_audio(verse_text, output_file, voice)
            
            if success:
                success_count += 1
                print(f"   ✓ {book_code} {chapter_num}:{verse_num}")
            else:
                print(f"   ✗ {book_code} {chapter_num}:{verse_num}")
        
        return success_count
        
    except Exception as e:
        print(f"❌ خطا در فصل {chapter_num}: {e}")
        return 0

async def generate_book(bible_data, book_code, output_dir, voice, skip_existing=True):
    """تولید صوت برای تمام فصل‌های یک کتاب"""
    chapter_count = get_chapter_count(bible_data, book_code)
    
    if chapter_count == 0:
        print(f"⚠️  {book_code}: بدون داده")
        return {'book': book_code, 'chapters': 0, 'verses': 0}
    
    # دریافت نام کتاب
    book_info = bible_data['books_info'].get(book_code, {})
    book_name_fa = book_info.get('name', {}).get('fa', book_code)
    
    print(f"\n📖 {book_code} - {book_name_fa}")
    print(f"   {chapter_count} فصل")
    
    total_verses = 0
    
    for chapter in range(1, chapter_count + 1):
        chapter_dir = output_dir / book_code / str(chapter)
        
        verse_count = await generate_chapter_audio(
            bible_data, book_code, chapter, chapter_dir, voice, skip_existing
        )
        
        total_verses += verse_count
        
        if verse_count > 0:
            print(f"   📄 فصل {chapter}: {verse_count} آیه")
    
    print(f"   ✅ کل: {total_verses} آیه")
    
    return {
        'book': book_code,
        'name_fa': book_name_fa,
        'chapters': chapter_count,
        'verses': total_verses
    }

async def main():
    parser = argparse.ArgumentParser(description='تولید صوت برای کل کتاب مقدس')
    parser.add_argument('--books', nargs='+', help='کدهای کتاب‌ها (مثلاً GEN EXO MAT)')
    parser.add_argument('--start-from', help='شروع از کتاب خاص (مثلاً EPH)')
    parser.add_argument('--voice', default='fa-IR-FaridNeural',
                       help='صدا (fa-IR-FaridNeural یا fa-IR-DilaraNeural)')
    parser.add_argument('--output-dir', default='../public/audio/bible/edge-tts',
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
    print(f"🎤 صدا: {args.voice}")
    print(f"📁 مسیر خروجی: {output_dir}")
    print(f"{'⏭️' if args.skip_existing else '🔄'} رد کردن فایل‌های موجود: {args.skip_existing}")
    print("\n" + "=" * 60)
    
    # تولید صوت برای هر کتاب
    results = []
    total_books = len(books_to_process)
    
    for idx, book_code in enumerate(books_to_process, 1):
        print(f"\n📊 پیشرفت: {idx}/{total_books}")
        try:
            result = await generate_book(
                bible_data, book_code, output_dir, args.voice, args.skip_existing
            )
            results.append(result)
        except KeyboardInterrupt:
            print("\n\n⚠️  متوقف شد توسط کاربر")
            print(f"✓ {idx-1} کتاب کامل شد")
            break
        except Exception as e:
            print(f"\n❌ خطای غیرمنتظره در {book_code}: {e}")
            continue
    
    # خلاصه نهایی
    print("\n" + "=" * 60)
    print("📊 خلاصه:")
    print("=" * 60)
    
    total_chapters = sum(r['chapters'] for r in results)
    total_verses = sum(r['verses'] for r in results)
    
    print(f"\n✅ کتاب‌های پردازش شده: {len(results)}")
    print(f"📄 کل فصل‌ها: {total_chapters}")
    print(f"📝 کل آیات: {total_verses}")
    print(f"\n📁 فایل‌ها در: {output_dir}")
    
    # نمایش 10 کتاب اول
    if results:
        print("\n📖 کتاب‌های تولید شده:")
        for r in results[:10]:
            print(f"   • {r['book']}: {r['verses']} آیه در {r['chapters']} فصل")
        if len(results) > 10:
            print(f"   ... و {len(results) - 10} کتاب دیگر")
    
    print("\n✅ تمام!")

if __name__ == '__main__':
    asyncio.run(main())
