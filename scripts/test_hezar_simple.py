#!/usr/bin/env python3
"""تست ساده Hezar TTS"""

print("🔍 تست کتابخانه‌ها...\n")

# تست hezar
try:
    import hezar
    print(f"✅ hezar {hezar.__version__}")
except Exception as e:
    print(f"❌ hezar: {e}")
    exit(1)

# تست scipy
try:
    from scipy.io import wavfile
    print("✅ scipy.io.wavfile")
except Exception as e:
    print(f"❌ scipy: {e}")
    exit(1)

# تست numpy
try:
    import numpy as np
    print(f"✅ numpy {np.__version__}")
except Exception as e:
    print(f"❌ numpy: {e}")
    exit(1)

# تست pydub (اختیاری - فقط برای ترکیب فایل‌ها)
try:
    from pydub import AudioSegment
    print("✅ pydub")
    PYDUB_AVAILABLE = True
except Exception as e:
    print(f"⚠️  pydub: {e}")
    print("   (اختیاری - فقط برای ترکیب فایل‌ها لازم است)")
    PYDUB_AVAILABLE = False

print("\n🔄 بارگذاری مدل TTS...")
print("   (اولین بار ممکن است 2-3 دقیقه طول بکشد)\n")

try:
    from hezar.models import Model
    
    # بارگذاری مدل
    model = Model.load("hezarai/fastspeech2-persian-tts")
    print("✅ مدل TTS بارگذاری شد\n")
    
    # تولید صوت تست
    print("🎤 تولید صوت تست...")
    test_text = "در آغاز کلام بود"
    outputs = model.predict(test_text)
    
    print(f"✅ صوت تولید شد: {len(outputs[0])} نمونه")
    print(f"   طول: {len(outputs[0])/22050:.2f} ثانیه")
    
    # ذخیره فایل
    from pathlib import Path
    test_dir = Path(__file__).parent.parent / 'public' / 'audio' / 'test'
    test_dir.mkdir(parents=True, exist_ok=True)
    
    output_file = test_dir / 'hezar_test.wav'
    
    # ذخیره با scipy
    audio_data = np.array(outputs[0], dtype=np.float32)
    wavfile.write(str(output_file), 22050, audio_data)
    
    print(f"✅ فایل ذخیره شد: {output_file}")
    print(f"\n🎉 همه تست‌ها موفق!")
    print(f"\nمرحله بعدی:")
    print(f"  python scripts/hezar_tts_generator.py --book EPH --chapter 1")
    
except Exception as e:
    print(f"\n❌ خطا: {e}")
    import traceback
    traceback.print_exc()
    exit(1)
