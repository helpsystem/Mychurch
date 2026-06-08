"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { fetchGalleryImages, type GalleryImage } from "@/actions/gallery";
import { cn } from "@/lib/utils";

interface MediaCarouselProps {
    initialImages?: GalleryImage[];
    autoplayInterval?: number;
    className?: string;
}

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? "100%" : "-100%",
        opacity: 0,
        scale: 0.95
    }),
    center: {
        x: 0,
        opacity: 1,
        scale: 1,
        transition: {
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.4 },
            scale: { duration: 0.4 }
        }
    },
    exit: (direction: number) => ({
        x: direction < 0 ? "100%" : "-100%",
        opacity: 0,
        scale: 0.95,
        transition: {
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.4 },
            scale: { duration: 0.4 }
        }
    })
};

export function MediaCarousel({ 
    initialImages, 
    autoplayInterval = 5000, 
    className 
}: MediaCarouselProps) {
    const [images, setImages] = useState<GalleryImage[]>(initialImages || []);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const [isAutoplay, setIsAutoplay] = useState(true);
    const [isLoading, setIsLoading] = useState(!initialImages);

    // Fetch images from gallery DB if not provided
    useEffect(() => {
        if (!initialImages) {
            setIsLoading(true);
            fetchGalleryImages(true)
                .then(data => {
                    // Filter down to public images
                    setImages(data || []);
                })
                .catch(err => console.error("Failed to load carousel images:", err))
                .finally(() => setIsLoading(false));
        }
    }, [initialImages]);

    // Autoplay Timer
    useEffect(() => {
        if (!isAutoplay || images.length <= 1) return;

        const timer = setInterval(() => {
            handleNext();
        }, autoplayInterval);

        return () => clearInterval(timer);
    }, [isAutoplay, currentIndex, images.length, autoplayInterval]);

    const handleNext = () => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const handlePrev = () => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    if (isLoading) {
        return (
            <div className={cn("relative w-full aspect-video rounded-3xl bg-neutral-900/50 border border-white/10 flex items-center justify-center animate-pulse", className)}>
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                    <span className="text-sm font-[Vazirmatn] text-muted-foreground">در حال دریافت تصاویر...</span>
                </div>
            </div>
        );
    }

    if (images.length === 0) {
        return (
            <div className={cn("relative w-full aspect-video rounded-3xl bg-neutral-900/50 border border-white/10 flex items-center justify-center p-8 text-center", className)}>
                <p className="text-muted-foreground font-[Vazirmatn]">تصویری در گالری جهت نمایش یافت نشد.</p>
            </div>
        );
    }

    const currentImg = images[currentIndex];

    return (
        <div 
            className={cn(
                "relative w-full aspect-video rounded-[2rem] bg-black overflow-hidden border border-white/10 shadow-2xl group",
                className
            )}
            onMouseEnter={() => setIsAutoplay(false)}
            onMouseLeave={() => setIsAutoplay(true)}
        >
            {/* Slide Images */}
            <div className="absolute inset-0">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                        key={currentIndex}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="absolute inset-0 w-full h-full"
                    >
                        <img 
                            src={currentImg.src} 
                            alt={currentImg.title || "تصویر اسلایدر"} 
                            className="w-full h-full object-cover select-none pointer-events-none"
                        />
                        {/* Shadows and Vignette */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30" />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Content Details Overlay */}
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 z-10 flex flex-col justify-end text-right font-[Vazirmatn]" dir="rtl">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-2 max-w-2xl"
                    >
                        {currentImg.category && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary/25 text-primary border border-primary/30 text-[10px] font-black uppercase tracking-wider">
                                {currentImg.category}
                            </span>
                        )}
                        {currentImg.title && (
                            <h3 className="text-xl sm:text-3xl font-black text-white leading-tight">
                                {currentImg.title}
                            </h3>
                        )}
                        {currentImg.description && (
                            <p className="text-xs sm:text-base text-muted-foreground font-medium leading-relaxed">
                                {currentImg.description}
                            </p>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation Controls */}
            {images.length > 1 && (
                <>
                    {/* Left/Right Buttons */}
                    <button
                        onClick={handlePrev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95 z-20"
                        title="Previous Slide"
                    >
                        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                    <button
                        onClick={handleNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95 z-20"
                        title="Next Slide"
                    >
                        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>

                    {/* Indicators & Control Toolbar */}
                    <div className="absolute top-4 right-4 z-20 flex items-center gap-3 bg-black/35 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full">
                        {/* Play/Pause Button */}
                        <button
                            onClick={() => setIsAutoplay(!isAutoplay)}
                            className="text-white hover:text-primary transition-colors cursor-pointer"
                            title={isAutoplay ? "Pause Autoplay" : "Start Autoplay"}
                        >
                            {isAutoplay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>
                        <span className="w-px h-3 bg-white/15" />
                        {/* Slide Dots */}
                        <div className="flex gap-1.5">
                            {images.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setDirection(idx > currentIndex ? 1 : -1);
                                        setCurrentIndex(idx);
                                    }}
                                    className={cn(
                                        "w-2 h-2 rounded-full transition-all cursor-pointer",
                                        currentIndex === idx ? "bg-primary w-5" : "bg-white/40 hover:bg-white/60"
                                    )}
                                    title={`Go to slide ${idx + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
