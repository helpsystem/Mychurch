#!/usr/bin/env python3
"""
🎵 Batch Processing Script for All Worship Songs
پردازش دسته‌ای همه سرودها و استخراج زمان‌بندی

استفاده:
python batch_process_worship_songs.py
"""

import os
import json
import sys
from pathlib import Path
from typing import List, Dict
import time
from generate_lyrics_timing import LyricSyncGenerator

# مسیرهای پروژه
PROJECT_ROOT = Path(__file__).parent.parent
WORSHIP_DATA_FILE = PROJECT_ROOT / 'public' / 'worship' / 'data' / 'worship_songs.json'
TIMING_OUTPUT_DIR = PROJECT_ROOT / 'public' / 'worship' / 'data' / 'timings'


class BatchProcessor:
    def __init__(self, api_key: str = None):
        """راه‌اندازی batch processor"""
        self.generator = LyricSyncGenerator(api_key=api_key)
        self.timing_output_dir = TIMING_OUTPUT_DIR
        self.timing_output_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"📁 دایرکتوری خروجی: {self.timing_output_dir}")

    def load_worship_songs(self) -> List[Dict]:
        """بارگذاری لیست سرودها از JSON"""
        if not WORSHIP_DATA_FILE.exists():
            raise FileNotFoundError(f"❌ فایل پیدا نشد: {WORSHIP_DATA_FILE}")
        
        with open(WORSHIP_DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        songs = data if isinstance(data, list) else data.get('songs', [])
        print(f"✅ {len(songs)} سرود بارگذاری شد")
        return songs

    def process_all_songs(self, max_songs: int = None, skip_existing: bool = True):
        """
        پردازش همه سرودها
        
        Args:
            max_songs: حداکثر تعداد سرود برای پردازش (None = همه)
            skip_existing: از سرودهایی که قبلاً پردازش شده‌اند رد شو
        """
        songs = self.load_worship_songs()
        
        if max_songs:
            songs = songs[:max_songs]
            print(f"⚠️ فقط {max_songs} سرود اول پردازش می‌شود")
        
        total = len(songs)
        processed = 0
        skipped = 0
        failed = []
        
        print(f"\n{'='*70}")
        print(f"🎵 شروع پردازش {total} سرود")
        print(f"{'='*70}\n")
        
        for i, song in enumerate(songs, 1):
            song_id = song.get('id')
            title = song.get('title', {}).get('fa', 'Unknown')
            audio_url = song.get('audioUrl')
            lyrics = song.get('lyrics', {}).get('fa', '')
            
            print(f"\n[{i}/{total}] {title}")
            
            # بررسی وجود فایل صوتی
            if not audio_url:
                print(f"   ⏭️  رد شد: فایل صوتی ندارد")
                skipped += 1
                continue
            
            # بررسی وجود timing قبلی
            timing_file = self.timing_output_dir / f"song_{song_id}_timing.json"
            if skip_existing and timing_file.exists():
                print(f"   ⏭️  رد شد: قبلاً پردازش شده")
                skipped += 1
                continue
            
            # پردازش سرود
            try:
                self.process_single_song(
                    song_id=song_id,
                    title=title,
                    audio_url=audio_url,
                    lyrics=lyrics,
                    artist=song.get('artist', '')
                )
                processed += 1
                print(f"   ✅ پردازش شد")
                
                # تاخیر برای جلوگیری از rate limiting
                time.sleep(2)
                
            except Exception as e:
                print(f"   ❌ خطا: {str(e)}")
                failed.append({
                    'song_id': song_id,
                    'title': title,
                    'error': str(e)
                })
        
        # خلاصه نتایج
        print(f"\n{'='*70}")
        print(f"📊 خلاصه پردازش:")
        print(f"   ✅ پردازش شده: {processed}")
        print(f"   ⏭️  رد شده: {skipped}")
        print(f"   ❌ خطا: {len(failed)}")
        print(f"{'='*70}\n")
        
        if failed:
            print("❌ سرودهایی که با خطا مواجه شدند:")
            for item in failed:
                print(f"   - {item['title']} (ID: {item['song_id']}): {item['error']}")

    def process_single_song(
        self,
        song_id: int,
        title: str,
        audio_url: str,
        lyrics: str,
        artist: str = ''
    ):
        """پردازش یک سرود"""
        
        # دانلود فایل صوتی (اگر URL است)
        audio_path = self._download_audio_if_url(audio_url, song_id)
        
        # تشخیص زبان از متن
        # اگر متن فارسی داشته باشه، زبان = فارسی
        has_persian = any('\u0600' <= char <= '\u06FF' for char in lyrics[:100] if lyrics)
        language = 'fa' if has_persian else None
        
        print(f"   🗣️  زبان تشخیص داده شده: {language or 'auto'}")
        
        # Transcription
        transcription = self.generator.transcribe_with_timestamps(
            audio_file_path=audio_path,
            language=language
        )
        
        # استخراج کلمات
        words = self.generator.align_lyrics_with_transcription(
            transcription,
            provided_lyrics=lyrics
        )
        
        # گروه‌بندی به خطوط
        lines = self.generator.group_words_into_lines(words)
        
        # ذخیره خروجی
        output_path = self.timing_output_dir / f"song_{song_id}_timing"
        self.generator.export_to_formats(
            words=words,
            lines=lines,
            output_base_path=str(output_path),
            audio_url=audio_url,
            song_title=title,
            artist=artist
        )
        
        # حذف فایل موقت (اگر دانلود شده)
        if audio_url.startswith('http'):
            Path(audio_path).unlink(missing_ok=True)

    def _download_audio_if_url(self, audio_url: str, song_id: int) -> str:
        """دانلود فایل صوتی اگر URL است"""
        if not audio_url.startswith('http'):
            # مسیر محلی
            return audio_url
        
        # دانلود موقت
        import requests
        
        temp_path = self.timing_output_dir / f"temp_song_{song_id}.mp3"
        
        print(f"   📥 در حال دانلود...")
        response = requests.get(audio_url, stream=True, timeout=30)
        response.raise_for_status()
        
        with open(temp_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        print(f"   ✅ دانلود کامل شد")
        return str(temp_path)

    def update_worship_songs_json(self):
        """
        آپدیت فایل worship_songs.json با اضافه کردن مسیر timing files
        """
        songs = self.load_worship_songs()
        updated_count = 0
        
        for song in songs:
            song_id = song.get('id')
            timing_file = self.timing_output_dir / f"song_{song_id}_timing.json"
            
            if timing_file.exists():
                # مسیر نسبی برای استفاده در frontend
                relative_path = f"/worship/data/timings/song_{song_id}_timing.json"
                song['timingFile'] = relative_path
                updated_count += 1
        
        # ذخیره فایل آپدیت شده
        with open(WORSHIP_DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(songs, f, ensure_ascii=False, indent=2)
        
        print(f"\n✅ {updated_count} سرود در worship_songs.json آپدیت شد")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description='🎵 پردازش دسته‌ای سرودها'
    )
    parser.add_argument(
        '--max-songs',
        type=int,
        help='حداکثر تعداد سرود برای پردازش'
    )
    parser.add_argument(
        '--skip-existing',
        action='store_true',
        default=True,
        help='از سرودهای پردازش شده رد شو'
    )
    parser.add_argument(
        '--update-json',
        action='store_true',
        help='آپدیت worship_songs.json با مسیرهای timing'
    )
    parser.add_argument(
        '--api-key',
        help='OpenAI API Key'
    )
    
    args = parser.parse_args()
    
    try:
        processor = BatchProcessor(api_key=args.api_key)
        
        # پردازش سرودها
        processor.process_all_songs(
            max_songs=args.max_songs,
            skip_existing=args.skip_existing
        )
        
        # آپدیت JSON (اگر درخواست شده)
        if args.update_json:
            processor.update_worship_songs_json()
        
    except Exception as e:
        print(f"\n❌ خطای کلی: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
