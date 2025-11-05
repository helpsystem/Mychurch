"""
Generate sample audio files for Bible Audio-Text Sync demo
"""
import asyncio
import edge_tts
import os

async def generate_sample_audio():
    # Create output directory
    os.makedirs('public/audio/bible/sample', exist_ok=True)
    
    # English text (Ephesians 1:15-16)
    text_en = """For this reason, ever since I heard about your faith in the Lord Jesus 
    and your love for all God's people, I have not stopped giving thanks for you, 
    remembering you in my prayers."""
    
    # Persian text (Ephesians 1:15-16)
    text_fa = """از آن جهت که چون خبر ایمان شما را به خداوند عیسی و محبت شما را به همه مقدسین شنیدم، 
    از شکرگزاری برای شما خسته نمی‌شوم و در دعاهای خود همیشه شما را یاد می‌کنم."""
    
    print("🎵 Generating English audio...")
    tts_en = edge_tts.Communicate(text_en, 'en-US-GuyNeural', rate='+0%')
    await tts_en.save('public/audio/bible/sample/ephesians_1_15-16.mp3')
    print("✅ English audio created: public/audio/bible/sample/ephesians_1_15-16.mp3")
    
    print("\n🎵 Generating Persian audio...")
    tts_fa = edge_tts.Communicate(text_fa, 'fa-IR-FaridNeural', rate='+0%')  # Male voice for spiritual content
    await tts_fa.save('public/audio/bible/sample/ephesians_1_15-16_fa.mp3')
    print("✅ Persian audio created: public/audio/bible/sample/ephesians_1_15-16_fa.mp3")
    
    print("\n" + "="*60)
    print("✅ Sample audio files generated successfully!")
    print("="*60)
    print("\n📁 Files created:")
    print("  1. public/audio/bible/sample/ephesians_1_15-16.mp3(English)")
    print("  2. public/audio/bible/sample/ephesians_1_15-16_fa.mp3(Persian)")
    print("\n🌐 Test the demo at:")
    print("  http://localhost:5173/#/bible/audio-sync-demo")
    print("="*60)

if __name__ == '__main__':
    asyncio.run(generate_sample_audio())
