#!/usr/bin/env python3
"""
🧪 تست سریع سیستم Whisper
"""

import sys
from pathlib import Path

def test_imports():
    """تست import پکیج‌ها"""
    print("🧪 در حال تست import پکیج‌ها...\n")
    
    packages = ['openai', 'dotenv', 'requests']
    all_ok = True
    
    for pkg in packages:
        try:
            if pkg == 'dotenv':
                import dotenv
            else:
                __import__(pkg)
            print(f"   ✅ {pkg}")
        except ImportError:
            print(f"   ❌ {pkg} - نصب نشده!")
            all_ok = False
    
    return all_ok

def test_api_key():
    """تست API Key"""
    print("\n🧪 در حال تست API Key...\n")
    
    import os
    from dotenv import load_dotenv
    
    load_dotenv()
    api_key = os.getenv('OPENAI_API_KEY')
    
    if not api_key:
        print("   ❌ OPENAI_API_KEY در فایل .env پیدا نشد!")
        print("\n💡 راهنما:")
        print("   1. فایل .env بساز در دایرکتوری scripts/")
        print("   2. این خط رو اضافه کن:")
        print("      OPENAI_API_KEY=sk-your-api-key-here")
        return False
    
    if not api_key.startswith('sk-'):
        print(f"   ⚠️  API Key با sk- شروع نمیشه: {api_key[:10]}...")
        return False
    
    print(f"   ✅ API Key پیدا شد: {api_key[:15]}...")
    return True

def test_openai_connection():
    """تست اتصال به OpenAI"""
    print("\n🧪 در حال تست اتصال به OpenAI...\n")
    
    try:
        from openai import OpenAI
        import os
        
        client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
        # تست ساده: لیست مدل‌ها
        models = client.models.list()
        print(f"   ✅ اتصال موفق! {len(models.data)} مدل در دسترس")
        
        # بررسی وجود whisper-1
        has_whisper = any('whisper' in model.id for model in models.data)
        if has_whisper:
            print("   ✅ مدل whisper-1 در دسترس است")
        else:
            print("   ⚠️  مدل whisper-1 پیدا نشد")
        
        return True
        
    except Exception as e:
        print(f"   ❌ خطا در اتصال: {str(e)}")
        return False

def main():
    print("=" * 60)
    print("🎵 تست سیستم Lyric Synchronization")
    print("=" * 60)
    
    # تست 1: Import پکیج‌ها
    if not test_imports():
        print("\n❌ لطفاً پکیج‌های لازم رو نصب کنید:")
        print("   pip install -r requirements-whisper.txt")
        sys.exit(1)
    
    # تست 2: API Key
    if not test_api_key():
        sys.exit(1)
    
    # تست 3: اتصال
    if not test_openai_connection():
        print("\n❌ اتصال به OpenAI با مشکل مواجه شد")
        print("   - API Key رو چک کنید")
        print("   - اینترنت رو چک کنید")
        print("   - اعتبار حساب OpenAI رو چک کنید")
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("✅ همه تست‌ها موفق بودند!")
    print("=" * 60)
    print("\n💡 حالا می‌تونید اسکریپت‌ها رو اجرا کنید:")
    print("   python generate_lyrics_timing.py --audio song.mp3")
    print("   python batch_process_worship_songs.py --max-songs 1")

if __name__ == '__main__':
    main()
