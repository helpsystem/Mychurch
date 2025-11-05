#!/usr/bin/env python3
"""
Generate audio for all Bible books using Edge TTS (IMPROVED VERSION)
====================================================================
نسخه بهبود یافته با:
- Retry logic (تلاش مجدد)
- Delay بین درخواست‌ها (جلوگیری از rate limit)
- Error handling قوی‌تر
- Progress tracking بهتر

Usage:
    py -3.12 generate_all_bible_edge_tts_improved.py
    py -3.12 generate_all_bible_edge_tts_improved.py --start-from MAT
    py -3.12 generate_all_bible_edge_tts_improved.py --delay 1.0
    py -3.12 generate_all_bible_edge_tts_improved.py --max-retries 5
"""

import json
import sys
import os
import argparse
from pathlib import Path
import asyncio
import edge_tts
from datetime import datetime
import time

# Fix encoding for Windows terminal
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

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

async def generate_verse_audio(text, output_path, voice="fa-IR-FaridNeural", 
                               max_retries=3, delay=0.5):
    """
    تولید صوت برای یک آیه با قابلیت retry و delay
    
    Args:
        text: متن آیه
        output_path: مسیر فایل خروجی
        voice: نام صدا
        max_retries: تعداد دفعات تلاش مجدد
        delay: تأخیر بین درخواست‌ها (ثانیه)
    
    Returns:
        bool: True در صورت موفقیت
    """
    # تأخیر قبل از درخواست (جلوگیری از rate limit)
    if delay > 0:
        await asyncio.sleep(delay)
    
    for attempt in range(max_retries):
        try:
            # ساخت پوشه اگر وجود ندارد
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            # تولید صوت با Edge TTS
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(str(output_path))
            
            return True
            
        except asyncio.exceptions.CancelledError:
            # درخواست لغو شد (Ctrl+C)
            print(f"   ⚠️ لغو شد توسط کاربر")
            return False
            
        except Exception as e:
            error_msg = str(e)
            
            # بررسی نوع خطا
            if "429" in error_msg or "rate limit" in error_msg.lower():
                # خطای rate limit - منتظر بیشتری بمان
                wait_time = (2 ** attempt) * 2  # Exponential backoff
                print(f"   ⚠️ Rate limit! منتظر {wait_time} ثانیه...")
                await asyncio.sleep(wait_time)
                
            elif attempt < max_retries - 1:
                # سایر خطاها - تلاش مجدد با تأخیر
                wait_time = 2 ** attempt
                print(f"   ⚠️ خطا (تلاش {attempt + 1}/{max_retries}): {error_msg[:50]}")
                print(f"   ⏳ منتظر {wait_time} ثانیه...")
                await asyncio.sleep(wait_time)
                
            else:
                # آخرین تلاش - شکست خورد
                print(f"   ❌ شکست نهایی: {error_msg[:50]}")
                return False
    
    return False

async def generate_chapter_audio(bible_data, book_code, chapter_num, output_dir, 
                                 voice, skip_existing=True, delay=0.5, max_retries=3):
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
        failed_verses = []
        
        for verse_num, verse_text in verses_fa.items():
            output_file = output_dir / f"{verse_num}.mp3"
            
            # رد شدن از فایل‌های موجود
            if skip_existing and output_file.exists():
                success_count += 1
                continue
            
            # تولید صوت
            success = await generate_verse_audio(
                verse_text, output_file, voice, max_retries, delay
            )
            
            if success:
                success_count += 1
                print(f"   ✓ {book_code} {chapter_num}:{verse_num}")
            else:
                failed_verses.append(verse_num)
                print(f"   ✗ {book_code} {chapter_num}:{verse_num}")
        
        # گزارش آیات ناموفق
        if failed_verses:
            print(f"   ⚠️ آیات ناموفق: {', '.join(map(str, failed_verses))}")
        
        return success_count
        
    except KeyboardInterrupt:
        print(f"   ⚠️ متوقف شد در فصل {chapter_num}")
        raise
        
    except Exception as e:
        print(f"   ❌ خطا در فصل {chapter_num}: {e}")
        return 0

async def generate_book(bible_data, book_code, output_dir, voice, 
                       skip_existing=True, delay=0.5, max_retries=3):
    """تولید صوت برای تمام فصل‌های یک کتاب"""
    try:
        chapter_count = get_chapter_count(bible_data, book_code)
        
        if chapter_count == 0:
            print(f"⚠️  {book_code}: بدون داده")
            return {'book': book_code, 'chapters': 0, 'verses': 0, 'success': False}
        
        # دریافت نام کتاب
        book_info = bible_data['books_info'].get(book_code, {})
        book_name_fa = book_info.get('name', {}).get('fa', book_code)
        
        print(f"\n📖 {book_code} - {book_name_fa}")
        print(f"   {chapter_count} فصل")
        
        start_time = time.time()
        total_verses = 0
        failed_chapters = []
        
        for chapter in range(1, chapter_count + 1):
            chapter_dir = output_dir / book_code / str(chapter)
            
            try:
                verse_count = await generate_chapter_audio(
                    bible_data, book_code, chapter, chapter_dir, 
                    voice, skip_existing, delay, max_retries
                )
                
                total_verses += verse_count
                
                if verse_count > 0:
                    print(f"   📄 فصل {chapter}: {verse_count} آیه")
                else:
                    failed_chapters.append(chapter)
                    
            except KeyboardInterrupt:
                print(f"\n   ⚠️ متوقف شد در فصل {chapter}")
                raise
                
            except Exception as e:
                print(f"   ❌ خطا در فصل {chapter}: {e}")
                failed_chapters.append(chapter)
                continue
        
        elapsed = time.time() - start_time
        
        print(f"   ✅ کل: {total_verses} آیه در {elapsed:.1f} ثانیه")
        
        if failed_chapters:
            print(f"   ⚠️ فصل‌های ناموفق: {', '.join(map(str, failed_chapters))}")
        
        return {
            'book': book_code,
            'name_fa': book_name_fa,
            'chapters': chapter_count,
            'verses': total_verses,
            'failed_chapters': failed_chapters,
            'elapsed': elapsed,
            'success': len(failed_chapters) == 0
        }
        
    except KeyboardInterrupt:
        print(f"\n⚠️  کتاب {book_code} ناتمام ماند")
        raise

async def main():
    parser = argparse.ArgumentParser(
        description='تولید صوت برای کل کتاب مقدس (نسخه بهبود یافته)',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
مثال‌ها:
  py -3.12 generate_all_bible_edge_tts_improved.py --start-from MAT
  py -3.12 generate_all_bible_edge_tts_improved.py --delay 1.0 --max-retries 5
  py -3.12 generate_all_bible_edge_tts_improved.py --books GEN EXO MAT
        """
    )
    
    parser.add_argument('--books', nargs='+', 
                       help='کدهای کتاب‌ها (مثلاً GEN EXO MAT)')
    parser.add_argument('--start-from', 
                       help='شروع از کتاب خاص (مثلاً MAT)')
    parser.add_argument('--voice', default='fa-IR-FaridNeural',
                       help='صدا (پیش‌فرض: fa-IR-FaridNeural مرد، fa-IR-DilaraNeural زن)')
    parser.add_argument('--output-dir', default='../public/audio/bible/edge-tts',
                       help='مسیر خروجی فایل‌ها')
    parser.add_argument('--delay', type=float, default=0.5,
                       help='تأخیر بین درخواست‌ها (ثانیه) - پیش‌فرض: 0.5')
    parser.add_argument('--max-retries', type=int, default=3,
                       help='تعداد دفعات تلاش مجدد - پیش‌فرض: 3')
    parser.add_argument('--skip-existing', action='store_true', default=True,
                       help='رد شدن از فایل‌های موجود')
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
    print(f"⏱️  تأخیر بین درخواست‌ها: {args.delay} ثانیه")
    print(f"🔄 تعداد تلاش مجدد: {args.max_retries}")
    print(f"{'⏭️' if args.skip_existing else '🔄'} رد کردن فایل‌های موجود: {args.skip_existing}")
    print("\n" + "=" * 60)
    
    # شروع زمان کلی
    total_start_time = time.time()
    
    # تولید صوت برای هر کتاب
    results = []
    total_books = len(books_to_process)
    
    for idx, book_code in enumerate(books_to_process, 1):
        print(f"\n📊 پیشرفت: {idx}/{total_books} ({idx/total_books*100:.1f}%)")
        print(f"⏱️  زمان سپری شده: {(time.time() - total_start_time)/60:.1f} دقیقه")
        
        try:
            result = await generate_book(
                bible_data, book_code, output_dir, args.voice, 
                args.skip_existing, args.delay, args.max_retries
            )
            results.append(result)
            
            # تأخیر بین کتاب‌ها
            if idx < total_books:
                await asyncio.sleep(2)
                
        except KeyboardInterrupt:
            print("\n\n⚠️  متوقف شد توسط کاربر (Ctrl+C)")
            print(f"✓ {idx-1} کتاب کامل شد")
            print(f"📌 برای ادامه: --start-from {book_code}")
            break
            
        except Exception as e:
            print(f"\n❌ خطای غیرمنتظره در {book_code}: {e}")
            results.append({
                'book': book_code,
                'chapters': 0,
                'verses': 0,
                'success': False,
                'error': str(e)
            })
            continue
    
    # زمان کلی
    total_elapsed = time.time() - total_start_time
    
    # خلاصه نهایی
    print("\n" + "=" * 60)
    print("📊 خلاصه نهایی")
    print("=" * 60)
    
    successful_books = [r for r in results if r.get('success', False)]
    failed_books = [r for r in results if not r.get('success', False)]
    
    total_chapters = sum(r['chapters'] for r in results)
    total_verses = sum(r['verses'] for r in results)
    
    print(f"\n✅ کتاب‌های موفق: {len(successful_books)}/{len(results)}")
    if failed_books:
        print(f"❌ کتاب‌های ناموفق: {len(failed_books)}")
        for fb in failed_books:
            error_msg = fb.get('error', 'نامشخص')
            print(f"   • {fb['book']}: {error_msg[:50]}")
    
    print(f"\n📄 کل فصل‌ها: {total_chapters}")
    print(f"📝 کل آیات: {total_verses}")
    print(f"⏱️  زمان کل: {total_elapsed/60:.1f} دقیقه ({total_elapsed/3600:.2f} ساعت)")
    
    if total_verses > 0:
        avg_per_verse = total_elapsed / total_verses
        print(f"📊 میانگین: {avg_per_verse:.2f} ثانیه/آیه")
    
    print(f"\n📁 فایل‌ها در: {output_dir}")
    
    # نمایش 10 کتاب اول
    if successful_books:
        print("\n📖 کتاب‌های تولید شده:")
        for r in successful_books[:10]:
            print(f"   • {r['book']}: {r['verses']} آیه در {r['chapters']} فصل")
        if len(successful_books) > 10:
            print(f"   ... و {len(successful_books) - 10} کتاب دیگر")
    
    print("\n✅ تمام!")
    
    # ذخیره گزارش
    report_file = output_dir / f"generation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'total_books': len(results),
            'successful_books': len(successful_books),
            'failed_books': len(failed_books),
            'total_chapters': total_chapters,
            'total_verses': total_verses,
            'total_time_seconds': total_elapsed,
            'results': results,
            'settings': {
                'voice': args.voice,
                'delay': args.delay,
                'max_retries': args.max_retries,
                'skip_existing': args.skip_existing
            }
        }, f, ensure_ascii=False, indent=2)
    
    print(f"\n📄 گزارش ذخیره شد: {report_file.name}")

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  برنامه متوقف شد")
        sys.exit(0)

