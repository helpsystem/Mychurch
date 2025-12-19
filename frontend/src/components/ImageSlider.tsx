import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import './ImageSlider.css';

interface ImageSliderProps {
  images: string[];
  autoplay?: boolean;
  autoplayInterval?: number;
  className?: string;
}

const ImageSlider: React.FC<ImageSliderProps> = ({ 
  images, 
  autoplay = true, 
  autoplayInterval = 5000,
  className = ""
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!isPlaying || images.length <= 1) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        setIsTransitioning(false);
      }, 300);
    }, autoplayInterval);

    return () => clearInterval(interval);
  }, [images.length, autoplayInterval, isPlaying]);

  const goToPrevious = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === 0 ? images.length - 1 : prevIndex - 1
      );
      setIsTransitioning(false);
    }, 300);
  };

  const goToNext = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
      setIsTransitioning(false);
    }, 300);
  };

  const goToSlide = (index: number) => {
    if (index !== currentIndex) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(index);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  if (images.length === 0) return null;

  return (
    <div className={`image-slider-modern ${className}`}>
      {/* Main Image Display */}
      <div className="image-slider-container">
        <div className={`image-slider-main ${isTransitioning ? 'transitioning' : ''}`}>
          <img 
            src={images[currentIndex]} 
            alt={`Slide ${currentIndex + 1}`}
            className="image-slider-img"
          />
          
          {/* Enhanced Gradient Overlays */}
          <div className="image-slider-gradient-top"></div>
          <div className="image-slider-gradient-bottom"></div>
          <div className="image-slider-vignette"></div>
          
          {/* Decorative Frame Effect */}
          <div className="image-slider-frame"></div>
        </div>
        
        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="slider-nav-btn slider-nav-left"
              aria-label="Previous image"
            >
              <ChevronLeft size={28} />
              <span className="nav-btn-glow"></span>
            </button>
            
            <button
              onClick={goToNext}
              className="slider-nav-btn slider-nav-right"
              aria-label="Next image"
            >
              <ChevronRight size={28} />
              <span className="nav-btn-glow"></span>
            </button>
          </>
        )}
        
        {/* Play/Pause Button */}
        {autoplay && images.length > 1 && (
          <button
            onClick={togglePlayPause}
            className="slider-control-btn"
            aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
          >
            {isPlaying ? <Pause size={22} /> : <Play size={22} />}
            <span className="control-btn-glow"></span>
          </button>
        )}
        
        {/* Slide Counter */}
        <div className="slider-counter">
          <span className="counter-current">{currentIndex + 1}</span>
          <span className="counter-separator">/</span>
          <span className="counter-total">{images.length}</span>
        </div>
      </div>
      
      {/* Enhanced Dots Indicator */}
      {images.length > 1 && (
        <div className="slider-dots-container">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`slider-dot ${index === currentIndex ? 'active' : ''}`}
              aria-label={`Go to slide ${index + 1}`}
            >
              <span className="dot-glow"></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageSlider;