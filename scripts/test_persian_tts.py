"""
تست ساده Coqui TTS فارسی
===========================

این اسکریپت مدل از پیش آموزش‌دیده را دانلود و تست می‌کند.

نصب:
    pip install TTS

استفاده:
    python scripts/test_persian_tts.py
"""

from TTS.api import TTS
import os

def test_persian_tts():
    """تست مدل TTS فارسی"""
    
    print("🔄 در حال بارگذاری مدل TTS فارسی...")
    print("   این ممکن است چند دقیقه طول بکشد...")
    
    try:
        # استفاده از مدل Male VITS (بهترین کیفیت)
        tts = TTS(
            model_path="https://huggingface.co/Kamtera/persian-tts-male1-vits/resolve/main/checkpoint_88000.pth",
            config_path="https://huggingface.co/Kamtera/persian-tts-male1-vits/resolve/main/config.json",
            progress_bar=True
        )
        
        print("✅ مدل با موفقیت بارگذاری شد!")
        
        # تست متن‌های نمونه
        test_texts = [
            "سلام! این یک تست صدای فارسی است.",
            "خداوند شما را برکت دهد.",
            "در ابتدا خدا آسمان‌ها و زمین را آفرید.",
        ]
        
        output_dir = "cache/tts/test"
        os.makedirs(output_dir, exist_ok=True)
        
        for i, text in enumerate(test_texts, 1):
            output_file = os.path.join(output_dir, f"test_{i}.wav")
            
            print(f"\n🎤 تولید صدا {i}/{len(test_texts)}: {text[:50]}...")
            tts.tts_to_file(text=text, file_path=output_file)
            
            # نمایش اطلاعات فایل
            file_size = os.path.getsize(output_file)
            print(f"   ✅ ذخیره شد: {output_file}")
            print(f"   📊 حجم: {file_size / 1024:.2f} KB")
        
        print("\n" + "="*60)
        print("✨ تست با موفقیت انجام شد!")
        print(f"📁 فایل‌ها در: {output_dir}")
        print("="*60)
        
        return True
        
    except Exception as e:
        print(f"\n❌ خطا: {e}")
        print("\n💡 نکات:")
        print("   1. آیا TTS نصب است? pip install TTS")
        print("   2. آیا اینترنت متصل است؟ (برای دانلود مدل)")
        print("   3. آیا espeak-ng نصب است؟ (اختیاری)")
        return False

if __name__ == "__main__":
    print("="*60)
    print("   تست Coqui TTS فارسی")
    print("="*60)
    
    success = test_persian_tts()
    
    if success:
        print("\n🎉 همه چیز کار می‌کند!")
        print("   می‌توانید TTS Server را راه‌اندازی کنید:")
        print("   python scripts/tts_server.py")
    else:
        print("\n⚠️ لطفاً ابتدا مشکلات را حل کنید.")
