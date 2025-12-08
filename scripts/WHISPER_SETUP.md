# Whisper Timestamp Pipeline Setup Guide

## Prerequisites

### 1. Python Environment
```bash
# Check Python version (need 3.8+)
python --version

# Create virtual environment (recommended)
python -m venv whisper_env
.\whisper_env\Scripts\activate  # Windows
```

### 2. Install Dependencies
```bash
# Install Whisper
pip install -U openai-whisper

# Install ffmpeg (required for audio processing)
# Option A: Chocolatey (Windows)
choco install ffmpeg

# Option B: Manual download
# Download from: https://ffmpeg.org/download.html
# Add to PATH
```

### 3. Verify Installation
```bash
python -c "import whisper; print(whisper.__version__)"
ffmpeg -version
```

## Usage

### Basic Usage
```bash
# From scripts directory
cd scripts
python generate_whisper_timestamps.py
```

### Configuration Options

Edit `generate_whisper_timestamps.py`:

```python
# Model size (tiny/base/small/medium/large-v3)
MODEL_SIZE = "large-v3"  # Best accuracy, slowest
# MODEL_SIZE = "medium"   # Good balance
# MODEL_SIZE = "small"    # Fast, lower accuracy
```

### Performance Comparison

| Model    | GPU Time/Chapter | CPU Time/Chapter | Accuracy |
|----------|------------------|------------------|----------|
| tiny     | 5s              | 20s              | 70%      |
| base     | 10s             | 40s              | 75%      |
| small    | 20s             | 1m30s            | 80%      |
| medium   | 30s             | 2m               | 85%      |
| large-v3 | 45s             | 3m               | 95%      |

### Estimated Total Time

**For 1,189 chapters:**
- GPU (large-v3): ~14 hours
- CPU (large-v3): ~60 hours
- GPU (medium): ~10 hours
- CPU (medium): ~40 hours

## Output Format

Generated files: `bible_data/timestamps/TPV/GEN/1.json`

```json
{
  "translation": "TPV",
  "book": "GEN",
  "chapter": 1,
  "intro": {
    "text": "پیدایش فصل اول",
    "start": 0.0,
    "end": 2.3,
    "words": [
      {"word": "پیدایش", "start": 0.0, "end": 0.8},
      {"word": "فصل", "start": 1.0, "end": 1.5},
      {"word": "اول", "start": 1.7, "end": 2.3}
    ]
  },
  "verses": [
    {
      "verse": 1,
      "start": 2.5,
      "end": 8.7,
      "text": "در ابتدا، خدا آسمانها و زمین را آفرید.",
      "words": [
        {"word": "در", "start": 2.5, "end": 2.65},
        {"word": "ابتدا", "start": 2.7, "end": 3.2},
        {"word": "خدا", "start": 3.5, "end": 3.9},
        {"word": "آسمانها", "start": 4.0, "end": 4.7},
        {"word": "و", "start": 4.75, "end": 4.85},
        {"word": "زمین", "start": 4.9, "end": 5.3},
        {"word": "را", "start": 5.35, "end": 5.5},
        {"word": "آفرید", "start": 5.6, "end": 6.2}
      ]
    }
  ]
}
```

## Monitoring Progress

The script outputs:
- Real-time progress percentage
- Estimated remaining time
- Success/failure counts
- Updates every 50 chapters

## Troubleshooting

### Error: "No module named 'whisper'"
```bash
pip install -U openai-whisper
```

### Error: "ffmpeg not found"
```bash
# Windows:
choco install ffmpeg
# Or download manually and add to PATH
```

### CUDA/GPU Issues
```bash
# For NVIDIA GPU acceleration:
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### Out of Memory
- Use smaller model (medium instead of large-v3)
- Process chapters one at a time
- Close other applications

## Next Steps After Generation

1. **Verify Quality**: Check sample chapters
2. **Update Frontend**: Integrate timestamps in ReadAlongView
3. **Upload to Storage**: Sync timestamps to HiDrive
4. **Database Import**: Add timing data to Supabase

## Running as Background Job

```bash
# Windows Task Scheduler
# Or use Python script wrapper:
python generate_whisper_timestamps.py > whisper_log.txt 2>&1
```
