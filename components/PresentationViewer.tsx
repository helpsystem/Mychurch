import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize, 
  Minimize, 
  Volume2, 
  Settings,
  BookOpen,
  Music,
  Timer,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface PresentationSlide {
  id: string;
  type: 'song' | 'scripture' | 'image' | 'video';
  title: string;
  content: {
    en: string;
    fa: string;
  };
  metadata?: {
    book?: string;
    chapter?: number;
    verse?: string;
    artist?: string;
    copyright?: string;
    background?: string;
    textColor?: string;
    fontSize?: 'small' | 'medium' | 'large' | 'extra-large';
  };
}

interface PresentationViewerProps {
  slides: PresentationSlide[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showControls?: boolean;
  className?: string;
  onSlideChange?: (slideIndex: number) => void;
}

const PresentationViewer: React.FC<PresentationViewerProps> = ({
  slides = [],
  autoPlay = false,
  autoPlayInterval = 5000,
  showControls = true,
  className = '',
  onSlideChange
}) => {
  const { lang } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'left' | 'right'>('right');
  const [isFlipping, setIsFlipping] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && slides.length > 1) {
      intervalRef.current = setInterval(() => {
        nextSlide();
      }, autoPlayInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, autoPlayInterval, slides.length]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          prevSlide();
          break;
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
          event.preventDefault();
          nextSlide();
          break;
        case 'f':
        case 'F11':
          event.preventDefault();
          toggleFullscreen();
          break;
        case 'p':
          event.preventDefault();
          togglePlayPause();
          break;
        case 'r':
          event.preventDefault();
          resetPresentation();
          break;
        case 'Escape':
          if (isFullscreen) {
            event.preventDefault();
            exitFullscreen();
          }
          break;
      }
    };

    if (isFullscreen || showControls) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, showControls]);

  // Fullscreen change detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const nextSlide = useCallback(() => {
    if (slides.length === 0) return;
    
    setFlipDirection('right');
    setIsFlipping(true);
    
    setTimeout(() => {
      const nextIndex = (currentSlide + 1) % slides.length;
      setCurrentSlide(nextIndex);
      onSlideChange?.(nextIndex);
      
      setTimeout(() => {
        setIsFlipping(false);
      }, 300);
    }, 150);
  }, [currentSlide, slides.length, onSlideChange]);

  const prevSlide = useCallback(() => {
    if (slides.length === 0) return;
    
    setFlipDirection('left');
    setIsFlipping(true);
    
    setTimeout(() => {
      const prevIndex = currentSlide === 0 ? slides.length - 1 : currentSlide - 1;
      setCurrentSlide(prevIndex);
      onSlideChange?.(prevIndex);
      
      setTimeout(() => {
        setIsFlipping(false);
      }, 300);
    }, 150);
  }, [currentSlide, slides.length, onSlideChange]);

  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < slides.length && index !== currentSlide) {
      setFlipDirection(index > currentSlide ? 'right' : 'left');
      setIsFlipping(true);
      
      setTimeout(() => {
        setCurrentSlide(index);
        onSlideChange?.(index);
        
        setTimeout(() => {
          setIsFlipping(false);
        }, 300);
      }, 150);
    }
  }, [currentSlide, slides.length, onSlideChange]);

  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  const resetPresentation = () => {
    setCurrentSlide(0);
    setIsPlaying(false);
    onSlideChange?.(0);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Exit fullscreen failed:', error);
    }
  };

  const getCurrentSlideData = () => {
    return slides[currentSlide] || null;
  };

  const getSlideContent = (slide: PresentationSlide) => {
    return slide.content[lang] || slide.content.en || slide.content.fa || '';
  };

  const getBackgroundStyle = (slide: PresentationSlide) => {
    const metadata = slide.metadata || {};
    return {
      background: metadata.background || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: metadata.textColor || '#ffffff'
    };
  };

  const getFontSizeClass = (size?: string) => {
    switch (size) {
      case 'small': return 'text-lg md:text-xl lg:text-2xl';
      case 'medium': return 'text-xl md:text-2xl lg:text-3xl';
      case 'large': return 'text-2xl md:text-3xl lg:text-4xl';
      case 'extra-large': return 'text-3xl md:text-4xl lg:text-5xl';
      default: return 'text-xl md:text-2xl lg:text-3xl';
    }
  };

  const currentSlideData = getCurrentSlideData();

  if (slides.length === 0) {
    return (
      <div className={`flex items-center justify-center h-96 bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {lang === 'fa' ? 'هیچ اسلایدی موجود نیست' : 'No slides available'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden ${isFullscreen ? 'h-screen w-screen' : 'h-96 lg:h-[500px]'} ${className}`}
    >
      {/* Main Slide Display */}
      <div 
        ref={slideRef}
        className={`relative w-full h-full transition-all duration-300 ${
          isFlipping 
            ? flipDirection === 'right' 
              ? 'transform -translate-x-full' 
              : 'transform translate-x-full'
            : 'transform translate-x-0'
        }`}
        style={currentSlideData ? getBackgroundStyle(currentSlideData) : {}}
      >
        {currentSlideData && (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            {/* Slide Header */}
            <div className="mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                {currentSlideData.type === 'song' && <Music className="w-6 h-6" />}
                {currentSlideData.type === 'scripture' && <BookOpen className="w-6 h-6" />}
                <h2 className="text-lg md:text-xl font-semibold opacity-90">
                  {currentSlideData.title}
                </h2>
              </div>
              
              {currentSlideData.metadata && (
                <div className="text-sm opacity-75">
                  {currentSlideData.type === 'scripture' && currentSlideData.metadata.book && (
                    <span>
                      {currentSlideData.metadata.book} {currentSlideData.metadata.chapter}
                      {currentSlideData.metadata.verse && `:${currentSlideData.metadata.verse}`}
                    </span>
                  )}
                  {currentSlideData.type === 'song' && currentSlideData.metadata.artist && (
                    <span>{currentSlideData.metadata.artist}</span>
                  )}
                </div>
              )}
            </div>

            {/* Slide Content */}
            <div 
              className={`max-w-4xl mx-auto leading-relaxed ${getFontSizeClass(currentSlideData.metadata?.fontSize)}`}
            >
              <pre className="whitespace-pre-wrap font-sans">
                {getSlideContent(currentSlideData)}
              </pre>
            </div>

            {/* Copyright */}
            {currentSlideData.metadata?.copyright && (
              <div className="absolute bottom-4 right-4 text-xs opacity-60">
                {currentSlideData.metadata.copyright}
              </div>
            )}
          </div>
        )}

        {/* Page Flip Effect Overlay */}
        {isFlipping && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse" />
        )}
      </div>

      {/* Navigation Controls */}
      {showControls && (
        <>
          {/* Previous Button */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all z-10"
            title={lang === 'fa' ? 'اسلاید قبلی' : 'Previous slide'}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Next Button */}
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all z-10"
            title={lang === 'fa' ? 'اسلاید بعدی' : 'Next slide'}
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Bottom Controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black bg-opacity-70 rounded-full px-4 py-2 z-10">
            {/* Play/Pause */}
            <button
              onClick={togglePlayPause}
              className="p-2 text-white hover:text-yellow-400 transition-colors"
              title={isPlaying ? (lang === 'fa' ? 'توقف' : 'Pause') : (lang === 'fa' ? 'شروع' : 'Play')}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            {/* Reset */}
            <button
              onClick={resetPresentation}
              className="p-2 text-white hover:text-yellow-400 transition-colors"
              title={lang === 'fa' ? 'شروع مجدد' : 'Reset'}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Slide Indicator */}
            <div className="px-3 py-1 text-white text-sm">
              {currentSlide + 1} / {slides.length}
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-white hover:text-yellow-400 transition-colors"
              title={isFullscreen ? (lang === 'fa' ? 'خروج از تمام صفحه' : 'Exit fullscreen') : (lang === 'fa' ? 'تمام صفحه' : 'Fullscreen')}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>

          {/* Slide Navigation Dots */}
          {slides.length <= 10 && (
            <div className="absolute bottom-4 right-4 flex flex-wrap gap-1 max-w-32">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentSlide 
                      ? 'bg-yellow-400 scale-125' 
                      : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                  }`}
                  title={`${lang === 'fa' ? 'اسلاید' : 'Slide'} ${index + 1}`}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Keyboard Shortcuts Help */}
      {isFullscreen && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-70 rounded-lg p-3 text-white text-sm z-10">
          <div className="font-semibold mb-1">
            {lang === 'fa' ? 'کلیدهای میانبر:' : 'Keyboard Shortcuts:'}
          </div>
          <div className="space-y-1 text-xs">
            <div>← → {lang === 'fa' ? 'ناوبری' : 'Navigate'}</div>
            <div>Space {lang === 'fa' ? 'بعدی' : 'Next'}</div>
            <div>F {lang === 'fa' ? 'تمام صفحه' : 'Fullscreen'}</div>
            <div>P {lang === 'fa' ? 'توقف/شروع' : 'Play/Pause'}</div>
            <div>R {lang === 'fa' ? 'ریست' : 'Reset'}</div>
            <div>Esc {lang === 'fa' ? 'خروج' : 'Exit'}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresentationViewer;