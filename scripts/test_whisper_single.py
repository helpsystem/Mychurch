"""
Simple test to debug Whisper issue
Tests just ONE file to see exact error
"""
import whisper
from pathlib import Path
import os

print("="*60)
print("WHISPER SINGLE FILE TEST")
print("="*60)

# Paths
PROJECT_ROOT = Path(__file__).parent.parent
audio_file = PROJECT_ROOT / "bible_data" / "audio" / "TPV" / "GEN" / "1.mp3"

print(f"\nAudio file: {audio_file}")
print(f"Exists: {audio_file.exists()}")
print(f"Size: {audio_file.stat().st_size if audio_file.exists() else 'N/A'} bytes")
print(f"Absolute path: {audio_file.absolute()}")

# Convert to string
audio_str = str(audio_file)
print(f"\nString path: {audio_str}")
print(f"String type: {type(audio_str)}")

try:
    print("\n" + "="*60)
    print("Loading Whisper model (medium)...")
    print("="*60)
    model = whisper.load_model("medium")
    print("OK Model loaded!")
    
    print("\n" + "="*60)
    print("Attempting transcription...")
    print("="*60)
    
    result = model.transcribe(
        audio_str,
        language="fa",
        word_timestamps=True,
        verbose=True  # Show detailed output
    )
    
    print("\n" + "="*60)
    print("SUCCESS!")
    print("="*60)
    print(f"Detected language: {result.get('language', 'unknown')}")
    print(f"Number of segments: {len(result.get('segments', []))}")
    
    if result.get('segments'):
        first_seg = result['segments'][0]
        print(f"\nFirst segment:")
        print(f"  Text: {first_seg.get('text', '')}")
        print(f"  Start: {first_seg.get('start', 0)}")
        print(f"  End: {first_seg.get('end', 0)}")
        
except Exception as e:
    print("\n" + "="*60)
    print("ERROR!")
    print("="*60)
    print(f"Exception type: {type(e).__name__}")
    print(f"Exception message: {str(e)}")
    
    import traceback
    print("\nFull traceback:")
    traceback.print_exc()
