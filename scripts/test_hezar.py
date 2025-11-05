#!/usr/bin/env python3
"""
اسکریپت تست Hezar TTS
برای بررسی اینکه Hezar به درستی نصب شده و کار می‌کند
"""

import sys
import os

def test_imports():
    """تست import کتابخانه‌ها"""
    print("🔍 بررسی کتابخانه‌ها...")
    
    try:
        import hezar
        print("✅ hezar نصب شده")
        print(f"   نسخه: {hezar.__version__}")
    except ImportError:
        print("❌ hezar نصب نشده - pip install hezar")
        return False
    
    try:
        import soundfile
        print("✅ soundfile نصب شده")
    except ImportError:
        print("❌ soundfile نصب نشده - pip install soundfile")
        return False
    
    try:
        import librosa
        print("✅ librosa نصب شده")
    except ImportError:
        print("⚠️  librosa نصب نشده (اختیاری - برای Python 3.14 در دسترس نیست)")
    
    try:
        from pydub import AudioSegment
        print("✅ pydub نصب شده")
    except ImportError:
        print("❌ pydub نصب نشده - pip install pydub")
        return False
    
    return True

def test_model_load():
    """تست بارگذاری مدل"""
    print("\n🔄 بارگذاری مدل TTS...")
    print("   (اولین بار ممکن است چند دقیقه طول بکشد)")
    
    try:
        from hezar.models import Model
        
        model = Model.load("hezarai/fastspeech2-persian-tts")
        print("✅ مدل بارگذاری شد")
        return model
    except Exception as e:
        print(f"❌ خطا در بارگذاری مدل: {e}")
        return None

def test_tts_generation(model):
    """تست تولید صوت"""
    print("\n🎤 تست تولید صوت...")
    
    test_text = "در آغاز کلام بود و کلام نزد خدا بود و کلام خدا بود"
    
    try:
        import soundfile as sf
        from pathlib import Path
        
        # تولید صوت
        outputs = model.predict(test_text)
        
        # ذخیره فایل تست
        test_dir = Path(__file__).parent.parent / 'public' / 'audio' / 'test'
        test_dir.mkdir(parents=True, exist_ok=True)
        
        output_file = test_dir / 'hezar_test.wav'
        
        # دریافت نرخ نمونه‌برداری از مدل
        sample_rate = model.config.sampling_rate if hasattr(model.config, 'sampling_rate') else 22050
        
        sf.write(str(output_file), outputs[0], samplerate=sample_rate)
        
        print(f"✅ فایل صوتی تولید شد: {output_file}")
        print(f"   متن: {test_text}")
        print(f"   طول: {len(outputs[0])/sample_rate:.2f} ثانیه")
        
        return True
    except Exception as e:
        print(f"❌ خطا در تولید صوت: {e}")
        return False

def main():
    print("=" * 60)
    print("تست نصب و عملکرد Hezar TTS")
    print("=" * 60)
    print()
    
    # تست 1: Import کتابخانه‌ها
    if not test_imports():
        print("\n❌ برخی کتابخانه‌ها نصب نیستند")
        print("   برای نصب: python install-hezar.bat یا pip install hezar soundfile librosa pydub")
        sys.exit(1)
    
    # تست 2: بارگذاری مدل
    model = test_model_load()
    if model is None:
        print("\n❌ مدل بارگذاری نشد")
        sys.exit(1)
    
    # تست 3: تولید صوت
    if not test_tts_generation(model):
        print("\n❌ تولید صوت موفق نبود")
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("✅ همه تست‌ها موفق! Hezar آماده استفاده است")
    print("=" * 60)
    print("\nمرحله بعدی:")
    print("  python scripts/hezar_tts_generator.py --book EPH --chapter 1")

if __name__ == '__main__':
    main()
