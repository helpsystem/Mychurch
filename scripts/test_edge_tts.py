#!/usr/bin/env python3
"""تست Edge TTS"""

import asyncio
import edge_tts
from pathlib import Path

async def test_edge_tts():
    print("🔍 تست Edge TTS...\n")
    
    # لیست صداهای فارسی
    print("🎤 صداهای فارسی موجود:\n")
    voices = await edge_tts.list_voices()
    fa_voices = [v for v in voices if v['Locale'].startswith('fa')]
    
    for v in fa_voices:
        print(f"  • {v['ShortName']}")
        print(f"    جنسیت: {v['Gender']}")
        print(f"    نام: {v.get('FriendlyName', v['Name'])}\n")
    
    # تولید صوت تست
    print("🔊 تولید صوت تست...\n")
    test_text = "در آغاز کلام بود و کلام نزد خدا بود و کلام خدا بود"
    
    # تست با صدای مرد
    print(f"   متن: {test_text}")
    print(f"   صدا: fa-IR-FaridNeural (مرد)\n")
    
    test_dir = Path(__file__).parent.parent / 'public' / 'audio' / 'test'
    test_dir.mkdir(parents=True, exist_ok=True)
    
    output_file = test_dir / 'edge_tts_test_male.mp3'
    
    communicate = edge_tts.Communicate(test_text, "fa-IR-FaridNeural")
    await communicate.save(str(output_file))
    
    print(f"✅ فایل ذخیره شد: {output_file}\n")
    
    # تست با صدای زن
    print(f"   صدا: fa-IR-DilaraNeural (زن)\n")
    output_file2 = test_dir / 'edge_tts_test_female.mp3'
    
    communicate2 = edge_tts.Communicate(test_text, "fa-IR-DilaraNeural")
    await communicate2.save(str(output_file2))
    
    print(f"✅ فایل ذخیره شد: {output_file2}\n")
    
    print("🎉 تست موفق!\n")
    print("مرحله بعدی:")
    print("  py -3.12 scripts/edge_tts_generator.py --book EPH --chapter 1")

if __name__ == '__main__':
    asyncio.run(test_edge_tts())
