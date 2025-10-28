"""
Persian TTS Service using Coqui TTS
====================================

این سرویس از مدل‌های Coqui TTS برای تولید صدای فارسی با کیفیت بالا استفاده می‌کند.

نصب:
    pip install TTS flask flask-cors pydub
    
    # Linux/Mac:
    sudo apt-get install espeak-ng
    
    # Windows:
    # دانلود از: http://espeak.sourceforge.net/

استفاده:
    python scripts/tts_server.py
    
    # یا با gunicorn برای production:
    gunicorn -w 4 -b 0.0.0.0:5000 scripts.tts_server:app
"""

from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os
import hashlib
import tempfile
from pathlib import Path
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests

# Cache directory
CACHE_DIR = Path(__file__).parent.parent / 'cache' / 'tts'
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# TTS model - lazy load
_tts_model = None

def get_tts_model():
    """Load TTS model (singleton)"""
    global _tts_model
    if _tts_model is None:
        try:
            from TTS.api import TTS
            
            logger.info("🔄 Loading Persian TTS model...")
            
            # استفاده از مدل از پیش آموزش‌دیده Kamtera
            _tts_model = TTS(
                model_path="https://huggingface.co/Kamtera/persian-tts-male1-vits/resolve/main/checkpoint_88000.pth",
                config_path="https://huggingface.co/Kamtera/persian-tts-male1-vits/resolve/main/config.json",
                progress_bar=False
            )
            
            logger.info("✅ Persian TTS model loaded successfully!")
            
        except Exception as e:
            logger.error(f"❌ Failed to load TTS model: {e}")
            raise
    
    return _tts_model

def get_cache_key(text, voice='male'):
    """Generate cache key from text"""
    return hashlib.md5(f"{voice}:{text}".encode()).hexdigest()

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'Persian TTS Server',
        'model': 'Coqui VITS (Kamtera)',
        'cache_files': len(list(CACHE_DIR.glob('*.wav')))
    })

@app.route('/api/tts/synthesize', methods=['POST'])
def synthesize():
    """
    Synthesize Persian text to speech
    
    Request JSON:
    {
        "text": "سلام دنیا",
        "voice": "male",  // optional: male or female
        "format": "mp3"   // optional: wav or mp3
    }
    
    Returns:
        Audio file (wav or mp3)
    """
    try:
        data = request.json
        text = data.get('text', '').strip()
        voice = data.get('voice', 'male')
        output_format = data.get('format', 'mp3')
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        logger.info(f"🎤 TTS Request: {text[:50]}... (voice={voice}, format={output_format})")
        
        # Check cache
        cache_key = get_cache_key(text, voice)
        cache_file = CACHE_DIR / f"{cache_key}.{output_format}"
        
        if cache_file.exists():
            logger.info(f"✅ Cache hit: {cache_key}")
            return send_file(
                cache_file,
                mimetype=f'audio/{output_format}',
                as_attachment=True,
                download_name=f'tts_{cache_key}.{output_format}'
            )
        
        # Generate audio
        tts = get_tts_model()
        
        # Generate to temporary WAV file
        temp_wav = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
        tts.tts_to_file(text=text, file_path=temp_wav.name)
        
        # Convert to MP3 if requested
        if output_format == 'mp3':
            try:
                from pydub import AudioSegment
                
                audio = AudioSegment.from_wav(temp_wav.name)
                audio.export(str(cache_file), format='mp3', bitrate='128k')
                os.unlink(temp_wav.name)
                
            except ImportError:
                logger.warning("pydub not installed, falling back to WAV")
                output_format = 'wav'
                cache_file = CACHE_DIR / f"{cache_key}.wav"
                os.rename(temp_wav.name, cache_file)
        else:
            # Keep as WAV
            os.rename(temp_wav.name, cache_file)
        
        logger.info(f"✅ Generated: {cache_file.name}")
        
        return send_file(
            cache_file,
            mimetype=f'audio/{output_format}',
            as_attachment=True,
            download_name=f'tts_{cache_key}.{output_format}'
        )
        
    except Exception as e:
        logger.error(f"❌ TTS Error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/tts/cache/clear', methods=['POST'])
def clear_cache():
    """Clear TTS cache"""
    try:
        files = list(CACHE_DIR.glob('*'))
        for f in files:
            f.unlink()
        
        return jsonify({
            'success': True,
            'cleared': len(files)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tts/cache/info', methods=['GET'])
def cache_info():
    """Get cache information"""
    files = list(CACHE_DIR.glob('*'))
    total_size = sum(f.stat().st_size for f in files)
    
    return jsonify({
        'files': len(files),
        'total_size_mb': round(total_size / 1024 / 1024, 2),
        'cache_dir': str(CACHE_DIR)
    })

if __name__ == '__main__':
    # Development server
    port = int(os.environ.get('TTS_PORT', 5000))
    logger.info(f"🚀 Starting Persian TTS Server on port {port}")
    logger.info(f"📁 Cache directory: {CACHE_DIR}")
    
    # Pre-load model
    try:
        get_tts_model()
    except Exception as e:
        logger.error(f"⚠️ Failed to pre-load model: {e}")
        logger.info("Model will be loaded on first request")
    
    app.run(host='0.0.0.0', port=port, debug=False)
