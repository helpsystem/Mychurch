#!/usr/bin/env python3
"""
🎵 Automatic Lyric Synchronization Script
استخراج زمان‌بندی دقیق کلمات از فایل صوتی با استفاده از Whisper API

نیازمندی‌ها:
pip install openai python-dotenv requests

استفاده:
python generate_lyrics_timing.py --audio "song.mp3" --lyrics "lyrics.txt" --output "timing.json"
"""

import os
import json
import sys
import argparse
from pathlib import Path
from typing import List, Dict, Any
import requests
from openai import OpenAI
from dotenv import load_dotenv

# بارگذاری environment variables
load_dotenv()

class LyricSyncGenerator:
    def __init__(self, api_key: str = None):
        """
        راه‌اندازی کلاینت OpenAI
        
        Args:
            api_key: کلید API از OpenAI (اگر None باشد، از متغیر محیطی می‌خواند)
        """
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        if not self.api_key:
            raise ValueError(
                "❌ OpenAI API Key پیدا نشد!\n"
                "یکی از این کارها رو بکنید:\n"
                "1. فایل .env بسازید و OPENAI_API_KEY=sk-... اضافه کنید\n"
                "2. یا مستقیم در کد api_key رو پاس بدید"
            )
        
        self.client = OpenAI(api_key=self.api_key)
        print(f"✅ OpenAI Client راه‌اندازی شد")

    def transcribe_with_timestamps(
        self, 
        audio_file_path: str,
        language: str = None
    ) -> Dict[str, Any]:
        """
        استخراج متن و زمان‌بندی کلمات از فایل صوتی
        
        Args:
            audio_file_path: مسیر فایل صوتی (MP3, WAV, M4A, ...)
            language: زبان صوت (fa برای فارسی، en برای انگلیسی، یا None برای تشخیص خودکار)
        
        Returns:
            دیکشنری شامل متن و timestamps
        """
        print(f"🎧 در حال پردازش فایل صوتی: {audio_file_path}")
        
        if not os.path.exists(audio_file_path):
            raise FileNotFoundError(f"❌ فایل پیدا نشد: {audio_file_path}")
        
        with open(audio_file_path, 'rb') as audio_file:
            # درخواست transcription با word timestamps
            response = self.client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="verbose_json",
                timestamp_granularities=["word"],
                language=language
            )
        
        print(f"✅ Transcription کامل شد")
        return response

    def align_lyrics_with_transcription(
        self,
        transcription: Dict[str, Any],
        provided_lyrics: str = None
    ) -> List[Dict[str, Any]]:
        """
        هماهنگ‌سازی متن ارائه شده با transcription
        
        Args:
            transcription: خروجی Whisper API
            provided_lyrics: متن اصلی سرود (اختیاری)
        
        Returns:
            لیست کلمات با زمان‌بندی دقیق
        """
        words_with_timing = []
        
        # استخراج کلمات از Whisper response
        if hasattr(transcription, 'words') and transcription.words:
            for word_obj in transcription.words:
                words_with_timing.append({
                    'word': word_obj.word.strip(),
                    'start': round(word_obj.start, 2),
                    'end': round(word_obj.end, 2)
                })
        
        print(f"✅ {len(words_with_timing)} کلمه با زمان‌بندی استخراج شد")
        
        # اگر متن اصلی ارائه شده و Whisper کلمات درست تشخیص نداده
        # از timestamps موجود برای توزیع روی متن واقعی استفاده می‌کنیم
        if provided_lyrics and words_with_timing:
            # پاکسازی متن
            clean_lyrics = provided_lyrics.replace('\n', ' ').replace('\r', ' ')
            # حذف آکوردها
            clean_lyrics = self._remove_chords(clean_lyrics)
            # تقسیم به کلمات
            actual_words = [w.strip() for w in clean_lyrics.split() if w.strip()]
            
            # اگر تعداد کلمات Whisper خیلی کم یا نامعتبر است
            whisper_words_count = len(words_with_timing)
            actual_words_count = len(actual_words)
            
            if whisper_words_count <= actual_words_count * 0.6:  # اگر کمتر از 60% باشه
                print(f"⚠️  Whisper فقط {whisper_words_count} کلمه تشخیص داد ولی متن اصلی {actual_words_count} کلمه داره")
                print(f"📝 استفاده از timestamps Whisper برای توزیع روی متن واقعی...")
                
                # از اولین و آخرین timestamp برای محاسبه
                start_time = words_with_timing[0]['start']
                end_time = words_with_timing[-1]['end']
                total_duration = end_time - start_time
                
                # توزیع مساوی زمان روی کلمات واقعی
                word_duration = total_duration / actual_words_count if actual_words_count > 0 else 0.5
                
                words_with_timing = []
                for i, word in enumerate(actual_words):
                    word_start = start_time + (i * word_duration)
                    word_end = word_start + word_duration
                    words_with_timing.append({
                        'word': word,
                        'start': round(word_start, 2),
                        'end': round(word_end, 2)
                    })
                
                print(f"✅ {len(words_with_timing)} کلمه از متن اصلی با timestamps توزیع شد")
        
        return words_with_timing
    
    def _remove_chords(self, text: str) -> str:
        """حذف آکوردها و برچسب‌ها از متن"""
        import re
        # حذف آکوردهای درون کروشه مثل [Em], [G], [C#/A]
        text = re.sub(r'\[([A-G][#b]?m?\d?[\/]?[A-G]?[#b]?)\]', '', text)
        # حذف برچسب‌های V1, V2, Chorus, Bridge و غیره
        text = re.sub(r'\b(V\d+|Chorus\d*|Bridge|Intro|Outro|Verse\s*\d*|Tag)\b', '', text, flags=re.IGNORECASE)
        # حذف علائم نقطه‌گذاری standalone
        text = re.sub(r'\s*[،؛,;.!؟?]+\s*', ' ', text)
        # حذف خطوط خالی اضافی
        text = re.sub(r'\n+', '\n', text)
        return text.strip()

    def group_words_into_lines(
        self,
        words: List[Dict],
        max_line_duration: float = 5.0,
        max_words_per_line: int = 10
    ) -> List[Dict]:
        """
        گروه‌بندی کلمات به خطوط (برای نمایش راحت‌تر)
        
        Args:
            words: لیست کلمات با timing
            max_line_duration: حداکثر مدت زمان یک خط (ثانیه)
            max_words_per_line: حداکثر تعداد کلمات در هر خط
        
        Returns:
            لیست خطوط با کلمات و زمان‌بندی
        """
        lines = []
        current_line_words = []
        line_start = None
        
        for i, word in enumerate(words):
            if not current_line_words:
                line_start = word['start']
            
            current_line_words.append(word)
            
            # شرط‌های پایان خط
            is_last_word = (i == len(words) - 1)
            line_too_long = (word['end'] - line_start) > max_line_duration
            too_many_words = len(current_line_words) >= max_words_per_line
            
            if is_last_word or line_too_long or too_many_words:
                lines.append({
                    'line': ' '.join([w['word'] for w in current_line_words]),
                    'start': line_start,
                    'end': current_line_words[-1]['end'],
                    'words': current_line_words.copy()
                })
                current_line_words = []
        
        print(f"✅ کلمات به {len(lines)} خط گروه‌بندی شدند")
        return lines

    def export_to_formats(
        self,
        words: List[Dict],
        lines: List[Dict],
        output_base_path: str,
        audio_url: str = None,
        song_title: str = None,
        artist: str = None
    ):
        """
        خروجی در فرمت‌های مختلف
        
        Args:
            words: لیست کلمات با timing
            lines: لیست خطوط
            output_base_path: مسیر پایه برای ذخیره فایل‌ها
            audio_url: لینک فایل صوتی
            song_title: نام سرود
            artist: خواننده
        """
        output_path = Path(output_base_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # 1. JSON کامل (برای استفاده در React)
        json_output = {
            'metadata': {
                'title': song_title,
                'artist': artist,
                'audioUrl': audio_url,
                'totalDuration': lines[-1]['end'] if lines else 0,
                'wordCount': len(words),
                'lineCount': len(lines)
            },
            'words': words,
            'lines': lines
        }
        
        json_path = output_path.with_suffix('.json')
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(json_output, f, ensure_ascii=False, indent=2)
        print(f"✅ JSON ذخیره شد: {json_path}")
        
        # 2. WebVTT (برای subtitle)
        vtt_path = output_path.with_suffix('.vtt')
        self._export_webvtt(lines, vtt_path)
        print(f"✅ WebVTT ذخیره شد: {vtt_path}")
        
        # 3. SRT (فرمت استاندارد subtitle)
        srt_path = output_path.with_suffix('.srt')
        self._export_srt(lines, srt_path)
        print(f"✅ SRT ذخیره شد: {srt_path}")

    def _export_webvtt(self, lines: List[Dict], output_path: Path):
        """خروجی WebVTT"""
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("WEBVTT\n\n")
            for i, line in enumerate(lines, 1):
                start_time = self._format_timestamp_vtt(line['start'])
                end_time = self._format_timestamp_vtt(line['end'])
                f.write(f"{i}\n")
                f.write(f"{start_time} --> {end_time}\n")
                f.write(f"{line['line']}\n\n")

    def _export_srt(self, lines: List[Dict], output_path: Path):
        """خروجی SRT"""
        with open(output_path, 'w', encoding='utf-8') as f:
            for i, line in enumerate(lines, 1):
                start_time = self._format_timestamp_srt(line['start'])
                end_time = self._format_timestamp_srt(line['end'])
                f.write(f"{i}\n")
                f.write(f"{start_time} --> {end_time}\n")
                f.write(f"{line['line']}\n\n")

    def _format_timestamp_vtt(self, seconds: float) -> str:
        """فرمت زمان برای WebVTT: 00:00:00.000"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = seconds % 60
        return f"{hours:02d}:{minutes:02d}:{secs:06.3f}"

    def _format_timestamp_srt(self, seconds: float) -> str:
        """فرمت زمان برای SRT: 00:00:00,000"""
        timestamp = self._format_timestamp_vtt(seconds)
        return timestamp.replace('.', ',')


def process_single_song(
    audio_path: str,
    lyrics_path: str = None,
    output_path: str = None,
    language: str = None,
    api_key: str = None
):
    """
    پردازش یک سرود
    
    Args:
        audio_path: مسیر فایل صوتی
        lyrics_path: مسیر فایل متن (اختیاری)
        output_path: مسیر خروجی
        language: زبان (fa/en)
        api_key: کلید API
    """
    print(f"\n{'='*60}")
    print(f"🎵 شروع پردازش: {Path(audio_path).name}")
    print(f"{'='*60}\n")
    
    # راه‌اندازی generator
    generator = LyricSyncGenerator(api_key=api_key)
    
    # بارگذاری متن (اگر ارائه شده)
    provided_lyrics = None
    if lyrics_path and os.path.exists(lyrics_path):
        with open(lyrics_path, 'r', encoding='utf-8') as f:
            provided_lyrics = f.read()
        print(f"📝 متن از فایل بارگذاری شد: {lyrics_path}")
    
    # Transcription با Whisper
    transcription = generator.transcribe_with_timestamps(
        audio_path,
        language=language
    )
    
    # استخراج کلمات با زمان
    words = generator.align_lyrics_with_transcription(
        transcription,
        provided_lyrics
    )
    
    # گروه‌بندی به خطوط
    lines = generator.group_words_into_lines(words)
    
    # تعیین مسیر خروجی
    if not output_path:
        audio_name = Path(audio_path).stem
        output_path = f"output/{audio_name}_timing"
    
    # خروجی در فرمت‌های مختلف
    generator.export_to_formats(
        words=words,
        lines=lines,
        output_base_path=output_path,
        song_title=Path(audio_path).stem
    )
    
    print(f"\n{'='*60}")
    print(f"✅ پردازش کامل شد!")
    print(f"{'='*60}\n")
    
    return output_path + '.json'


def main():
    parser = argparse.ArgumentParser(
        description='🎵 استخراج زمان‌بندی دقیق کلمات از فایل صوتی'
    )
    parser.add_argument(
        '--audio',
        required=True,
        help='مسیر فایل صوتی (MP3, WAV, M4A)'
    )
    parser.add_argument(
        '--lyrics',
        help='مسیر فایل متن سرود (اختیاری)'
    )
    parser.add_argument(
        '--output',
        help='مسیر خروجی (پیش‌فرض: output/<نام_فایل>_timing)'
    )
    parser.add_argument(
        '--language',
        choices=['fa', 'en', 'auto'],
        default='auto',
        help='زبان صوت (fa=فارسی, en=انگلیسی, auto=تشخیص خودکار)'
    )
    parser.add_argument(
        '--api-key',
        help='OpenAI API Key (یا از .env خوانده می‌شود)'
    )
    
    args = parser.parse_args()
    
    try:
        output_file = process_single_song(
            audio_path=args.audio,
            lyrics_path=args.lyrics,
            output_path=args.output,
            language=None if args.language == 'auto' else args.language,
            api_key=args.api_key
        )
        
        print(f"\n📦 فایل JSON آماده: {output_file}")
        print(f"\n💡 برای استفاده در React:")
        print(f"   import timingData from './{Path(output_file).name}'")
        
    except Exception as e:
        print(f"\n❌ خطا: {str(e)}")
        sys.exit(1)


if __name__ == '__main__':
    main()
