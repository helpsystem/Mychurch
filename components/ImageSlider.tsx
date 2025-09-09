import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

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

  useEffect(() => {
    if (!isPlaying || images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, autoplayInterval);

    return () => clearInterval(interval);
  }, [images.length, autoplayInterval, isPlaying]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  if (images.length === 0) return null;

  return (
    <div className={`relative overflow-hidden rounded-xl bg-gray-900 ${className}`}>
      {/* Main Image Display */}
      <div className="relative aspect-video">
        <img 
          src={images[currentIndex]} 
          alt={`Slide ${currentIndex + 1}`}
          className="w-full h-full object-cover transition-opacity duration-500"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        
        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-2 rounded-full transition-all duration-300 backdrop-blur-sm"
              aria-label="Previous image"
            >
              <ChevronLeft size={24} />
            </button>
            
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-2 rounded-full transition-all duration-300 backdrop-blur-sm"
              aria-label="Next image"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
        
        {/* Play/Pause Button */}
        {autoplay && images.length > 1 && (
          <button
            onClick={togglePlayPause}
            className="absolute top-4 right-4 bg-black/30 hover:bg-black/60 text-white p-2 rounded-full transition-all duration-300 backdrop-blur-sm"
            aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
        )}
        
        {/* Slide Counter */}
        <div className="absolute bottom-4 left-4 bg-black/30 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
      
      {/* Dots Indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-white scale-125' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageSlider;