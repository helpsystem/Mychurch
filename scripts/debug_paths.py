"""
Debug script to check paths for Whisper
"""
from pathlib import Path
import os

print("="*60)
print("PATH DIAGNOSTICS")
print("="*60)

# Current working directory
print(f"\nCurrent Working Dir: {os.getcwd()}")

# Script location
script_path = Path(__file__)
print(f"\n__file__: {script_path}")
print(f"Script absolute: {script_path.absolute()}")
print(f"Script parent: {script_path.parent}")
print(f"Script parent absolute: {script_path.parent.absolute()}")

# Project root (parent of scripts/)
PROJECT_ROOT = Path(__file__).parent.parent
print(f"\nPROJECT_ROOT: {PROJECT_ROOT}")
print(f"PROJECT_ROOT absolute: {PROJECT_ROOT.absolute()}")
print(f"PROJECT_ROOT exists: {PROJECT_ROOT.exists()}")

# Bible data paths
AUDIO_DIR = PROJECT_ROOT / "bible_data" / "audio"
print(f"\nAUDIO_DIR: {AUDIO_DIR}")
print(f"AUDIO_DIR absolute: {AUDIO_DIR.absolute()}")
print(f"AUDIO_DIR exists: {AUDIO_DIR.exists()}")

# Test specific file
test_file = AUDIO_DIR / "TPV" / "GEN" / "1.mp3"
print(f"\nTest file: {test_file}")
print(f"Test file absolute: {test_file.absolute()}")
print(f"Test file exists: {test_file.exists()}")

# Try to list what's in audio dir
if AUDIO_DIR.exists():
    print(f"\nContents of AUDIO_DIR:")
    for item in list(AUDIO_DIR.iterdir())[:5]:
        print(f"  - {item.name}")
else:
    print(f"\nAUDIO_DIR does NOT exist!")
    
# Check alternative paths
alt_root = Path(os.getcwd())
alt_audio = alt_root / "bible_data" / "audio"
print(f"\nAlternative (from cwd):")
print(f"  Root: {alt_root}")
print(f"  Audio: {alt_audio}")
print(f"  Exists: {alt_audio.exists()}")

if alt_audio.exists():
    test_alt = alt_audio / "TPV" / "GEN" / "1.mp3"
    print(f"  Test file: {test_alt}")
    print(f"  Test exists: {test_alt.exists()}")
