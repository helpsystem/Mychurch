import React, { useState, useCallback } from 'react';
import { X, Wand2, Download, Eye, Loader2, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

interface PresentationSlide {
  text: string;
  style: PresentationStyle;
  slideNumber: number;
}

type PresentationStyle = 'worship' | 'nature' | 'minimal' | 'modern';
type SlideCount = 'auto' | 5 | 10 | 15;

interface PresentationGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  songTitle: { fa: string; en: string };
  lyrics: string;
  lang?: 'fa' | 'en';
}

const STYLE_GRADIENTS: Record<PresentationStyle, string> = {
  worship: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  nature: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
  minimal: 'linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)',
  modern: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
};

const STYLE_LABELS: Record<PresentationStyle, { fa: string; en: string }> = {
  worship: { fa: 'پرستشی (زمینه تیره)', en: 'Worship (Dark)' },
  nature: { fa: 'طبیعت', en: 'Nature' },
  minimal: { fa: 'ساده', en: 'Minimal' },
  modern: { fa: 'مدرن', en: 'Modern' }
};

const PresentationGenerator: React.FC<PresentationGeneratorProps> = ({
  isOpen,
  onClose,
  songTitle,
  lyrics,
  lang = 'fa'
}) => {
  const [slideCount, setSlideCount] = useState<SlideCount>('auto');
  const [style, setStyle] = useState<PresentationStyle>('worship');
  const [slides, setSlides] = useState<PresentationSlide[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Clean lyrics from chord notations
  const cleanLyrics = lyrics
    ?.replace(/\[[A-Ga-g][#b]?[a-zA-Z0-9\/]*\]/g, '')
    .replace(/\b[Vv]\d+\b/g, '')
    .replace(/\b(Chorus|Bridge|Pre-Chorus|Outro|Intro|Verse)\s*(\(\d+\)|\(\d*x\d*\))?/gi, '')
    .replace(/\([x×]\d+\)/gi, '')
    .replace(/\[column\]/gi, '')
    .trim() || '';

  const generateSlides = useCallback(() => {
    setIsGenerating(true);

    // Simulate AI processing
    setTimeout(() => {
      const lines = cleanLyrics.split('\n').filter(line => line.trim().length > 0);
      
      // Calculate slide count
      let targetSlideCount: number;
      if (slideCount === 'auto') {
        targetSlideCount = Math.max(3, Math.ceil(lines.length / 4));
      } else {
        targetSlideCount = slideCount;
      }

      // Group lines into slides
      const linesPerSlide = Math.ceil(lines.length / targetSlideCount);
      const generatedSlides: PresentationSlide[] = [];

      for (let i = 0; i < lines.length; i += linesPerSlide) {
        const slideLines = lines.slice(i, i + linesPerSlide);
        generatedSlides.push({
          text: slideLines.join('\n'),
          style: style,
          slideNumber: generatedSlides.length + 1
        });
      }

      setSlides(generatedSlides);
      setPreviewIndex(0);
      setIsGenerating(false);
    }, 1500);
  }, [cleanLyrics, slideCount, style]);

  const exportToHTML = useCallback(() => {
    if (slides.length === 0) return;

    const html = `<!DOCTYPE html>
<html lang="${lang}" dir="${lang === 'fa' ? 'rtl' : 'ltr'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${songTitle[lang] || songTitle.fa} - پرزنتیشن</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: 'Vazirmatn', Tahoma, sans-serif; 
            overflow: hidden;
            background: #000;
        }
        
        .slide {
            width: 100vw;
            height: 100vh;
            display: none;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: clamp(2em, 5vw, 4em);
            text-align: center;
            padding: 50px;
            line-height: 1.8;
            white-space: pre-wrap;
            text-shadow: 2px 2px 10px rgba(0,0,0,0.5);
        }
        
        .slide.active { display: flex; }
        
        .controls {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 15px;
            z-index: 100;
            opacity: 0;
            transition: opacity 0.3s;
        }
        
        body:hover .controls { opacity: 1; }
        
        .controls button {
            padding: 12px 30px;
            font-size: 1.2em;
            border: none;
            border-radius: 30px;
            cursor: pointer;
            background: rgba(255,255,255,0.15);
            color: white;
            backdrop-filter: blur(10px);
            transition: all 0.2s;
        }
        
        .controls button:hover { 
            background: rgba(255,255,255,0.3);
            transform: scale(1.05);
        }
        
        .slide-counter {
            position: fixed;
            bottom: 30px;
            right: 30px;
            color: rgba(255,255,255,0.4);
            font-size: 1em;
        }
        
        .title-slide {
            font-size: clamp(3em, 8vw, 6em);
            font-weight: bold;
        }
    </style>
</head>
<body>
    <!-- Title Slide -->
    <div class="slide active title-slide" data-index="0" style="background: ${STYLE_GRADIENTS[style]}">
        ${songTitle[lang] || songTitle.fa}
    </div>
    
    ${slides.map((slide, idx) => `
    <div class="slide" data-index="${idx + 1}" style="background: ${STYLE_GRADIENTS[slide.style]}">
        ${slide.text}
    </div>
    `).join('')}
    
    <div class="controls">
        <button onclick="prevSlide()">◀ ${lang === 'fa' ? 'قبلی' : 'Previous'}</button>
        <button onclick="nextSlide()">${lang === 'fa' ? 'بعدی' : 'Next'} ▶</button>
    </div>
    
    <div class="slide-counter" id="counter">1 / ${slides.length + 1}</div>
    
    <script>
        let current = 0;
        const slides = document.querySelectorAll('.slide');
        const counter = document.getElementById('counter');
        
        function showSlide(n) {
            slides.forEach(s => s.classList.remove('active'));
            current = (n + slides.length) % slides.length;
            slides[current].classList.add('active');
            counter.textContent = (current + 1) + ' / ' + slides.length;
        }
        
        function nextSlide() { showSlide(current + 1); }
        function prevSlide() { showSlide(current - 1); }
        
        document.addEventListener('keydown', e => {
            if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                nextSlide();
            }
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevSlide();
            }
            if (e.key === 'Home') {
                e.preventDefault();
                showSlide(0);
            }
            if (e.key === 'End') {
                e.preventDefault();
                showSlide(slides.length - 1);
            }
        });
        
        // Touch support
        let touchStartX = 0;
        document.addEventListener('touchstart', e => {
            touchStartX = e.touches[0].clientX;
        });
        document.addEventListener('touchend', e => {
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) nextSlide();
                else prevSlide();
            }
        });
    </script>
</body>
</html>`;

    // Download
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${songTitle.fa || 'presentation'}_slides.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [slides, songTitle, lang, style]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-400 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                📊 {lang === 'fa' ? 'ساخت پرزنتیشن با AI' : 'AI Presentation Generator'}
              </h2>
              <p className="text-white/80 text-sm mt-1">{songTitle[lang] || songTitle.fa}</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="bg-gray-50 px-6 py-4 border-b flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {lang === 'fa' ? 'تعداد اسلاید:' : 'Slide Count:'}
            </label>
            <select
              value={slideCount}
              onChange={(e) => setSlideCount(e.target.value as SlideCount)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="auto">{lang === 'fa' ? 'خودکار' : 'Auto'}</option>
              <option value={5}>5 {lang === 'fa' ? 'اسلاید' : 'Slides'}</option>
              <option value={10}>10 {lang === 'fa' ? 'اسلاید' : 'Slides'}</option>
              <option value={15}>15 {lang === 'fa' ? 'اسلاید' : 'Slides'}</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {lang === 'fa' ? 'استایل:' : 'Style:'}
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as PresentationStyle)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(STYLE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label[lang]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-hidden p-6 bg-gray-100">
          {slides.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-lg">
                  📄 {lang === 'fa' ? 'پیش‌نمایش اسلایدها اینجا نمایش داده می‌شود...' : 'Slide preview will appear here...'}
                </p>
                <p className="text-sm mt-2">
                  {lang === 'fa' ? 'روی "ساخت اسلاید" کلیک کنید' : 'Click "Generate Slides"'}
                </p>
              </div>
            </div>
          ) : isFullscreen ? (
            // Fullscreen Preview
            <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
              <button
                onClick={() => setIsFullscreen(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
              >
                <X size={20} />
              </button>
              <div
                className="w-full h-full flex items-center justify-center p-12 text-white text-center"
                style={{ background: STYLE_GRADIENTS[slides[previewIndex]?.style || style] }}
                dir={lang === 'fa' ? 'rtl' : 'ltr'}
              >
                <p className="text-4xl leading-relaxed whitespace-pre-wrap">
                  {slides[previewIndex]?.text}
                </p>
              </div>
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
                <button
                  onClick={() => setPreviewIndex(prev => Math.max(0, prev - 1))}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-full"
                  disabled={previewIndex === 0}
                >
                  <ChevronRight size={20} />
                </button>
                <span className="text-white px-4 py-2">
                  {previewIndex + 1} / {slides.length}
                </span>
                <button
                  onClick={() => setPreviewIndex(prev => Math.min(slides.length - 1, prev + 1))}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-full"
                  disabled={previewIndex === slides.length - 1}
                >
                  <ChevronLeft size={20} />
                </button>
              </div>
            </div>
          ) : (
            // Grid Preview
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto max-h-[400px]">
              {slides.map((slide, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setPreviewIndex(idx);
                    setIsFullscreen(true);
                  }}
                  className={`
                    aspect-video rounded-lg cursor-pointer transition-all hover:scale-105 overflow-hidden
                    ${idx === previewIndex ? 'ring-4 ring-blue-500' : ''}
                  `}
                  style={{ background: STYLE_GRADIENTS[slide.style] }}
                >
                  <div
                    className="w-full h-full flex items-center justify-center p-3 text-white text-center"
                    dir={lang === 'fa' ? 'rtl' : 'ltr'}
                  >
                    <p className="text-xs leading-snug line-clamp-4 whitespace-pre-wrap">
                      {slide.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t bg-white flex items-center justify-between flex-wrap gap-3">
          <div className="text-sm text-gray-500">
            {slides.length > 0 && (
              <span>✅ {slides.length} {lang === 'fa' ? 'اسلاید ساخته شد' : 'slides generated'}</span>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={generateSlides}
              disabled={isGenerating || !lyrics}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {lang === 'fa' ? 'در حال ساخت...' : 'Generating...'}
                </>
              ) : (
                <>
                  <Wand2 size={18} />
                  {lang === 'fa' ? 'ساخت اسلاید' : 'Generate Slides'}
                </>
              )}
            </button>

            {slides.length > 0 && (
              <>
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full font-medium transition-colors"
                >
                  <Eye size={18} />
                  {lang === 'fa' ? 'پیش‌نمایش' : 'Preview'}
                </button>

                <button
                  onClick={exportToHTML}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full font-medium transition-colors"
                >
                  <Download size={18} />
                  {lang === 'fa' ? 'دانلود HTML' : 'Download HTML'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresentationGenerator;
