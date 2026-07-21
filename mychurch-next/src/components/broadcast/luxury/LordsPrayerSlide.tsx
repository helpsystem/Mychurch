"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlideContentLordsPrayer } from '@/types/broadcast';
import prayerTiming from '@/data/lords-prayer-timing.json';

// --- Luxury Particle System ---
const ParticleBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Array<{
            x: number; y: number; radius: number;
            vx: number; vy: number; alpha: number;
            glow: number;
        }> = [];

        const initParticles = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            particles = [];
            const numParticles = window.innerWidth < 768 ? 50 : 120;
            
            for (let i = 0; i < numParticles; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 2 + 0.5,
                    vx: (Math.random() - 0.5) * 0.3,
                    vy: (Math.random() - 0.5) * 0.3 - 0.2, // Drift upwards
                    alpha: Math.random() * 0.5 + 0.1,
                    glow: Math.random() * 15 + 5
                });
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw ambient luxury gradient
            const gradient = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, 0,
                canvas.width / 2, canvas.height / 2, canvas.width
            );
            gradient.addColorStop(0, 'rgba(214, 178, 94, 0.08)');
            gradient.addColorStop(1, 'rgba(14, 16, 19, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw particles
            particles.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.y < -10) p.y = canvas.height + 10;
                if (p.x < -10) p.x = canvas.width + 10;
                if (p.x > canvas.width + 10) p.x = -10;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(243, 217, 152, ${p.alpha})`;
                ctx.shadowBlur = p.glow;
                ctx.shadowColor = 'rgba(214, 178, 94, 0.8)';
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        initParticles();
        draw();

        window.addEventListener('resize', initParticles);
        return () => {
            window.removeEventListener('resize', initParticles);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
};

export const LordsPrayerSlide: React.FC<{ content: SlideContentLordsPrayer; isActive: boolean }> = ({ content, isActive }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [activeIndex, setActiveIndex] = useState(0);

    // Sync Logic (Audio or Timer)
    useEffect(() => {
        if (!isActive) {
            if (audioRef.current) audioRef.current.pause();
            return;
        }

        const audio = audioRef.current;
        if (audio && content.audioUrl) {
            audio.play().catch(e => console.warn("Auto-play prevented", e));
        }

        let animationFrame: number;
        let intervalId: NodeJS.Timeout;

        if (audio && content.audioUrl) {
            const updateTime = () => {
                const time = audio.currentTime;
                setCurrentTime(time);
                
                const active = prayerTiming.reduce((acc, curr, index) => {
                    if (time >= curr.time) return index;
                    return acc;
                }, 0);
                
                if (active !== activeIndex) {
                    setActiveIndex(active);
                }
                animationFrame = requestAnimationFrame(updateTime);
            };
            animationFrame = requestAnimationFrame(updateTime);
        } else {
            // Fallback Timer Mode (4 seconds per sentence)
            intervalId = setInterval(() => {
                setActiveIndex(prev => {
                    if (prev < prayerTiming.length - 1) return prev + 1;
                    return prev;
                });
            }, 4500);
        }

        return () => {
            if (animationFrame) cancelAnimationFrame(animationFrame);
            if (intervalId) clearInterval(intervalId);
        };
    }, [isActive, content.audioUrl, activeIndex]);

    const activeSentence = prayerTiming[activeIndex];

    return (
        <div className="relative w-full h-full overflow-hidden bg-[var(--luxury-bg)] font-[Vazirmatn] flex flex-col items-center justify-center">
            
            {/* Background Layers */}
            {content.backgroundType === 'video' && content.backgroundUrl ? (
                <video 
                    src={content.backgroundUrl} 
                    autoPlay loop muted playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
            ) : null}
            
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--luxury-bg)]/50 to-[var(--luxury-bg)] z-0" />
            <ParticleBackground />

            {/* Audio Element */}
            {content.audioUrl && (
                <audio ref={audioRef} src={content.audioUrl} preload="auto" />
            )}

            {/* Main Content Area */}
            <div className="relative z-10 w-[90%] max-w-5xl h-[80%] flex flex-col items-center justify-center">
                
                {/* Header Cross or Title */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 flex flex-col items-center"
                >
                    <svg className="w-8 h-8 text-[var(--gold)] mb-4 drop-shadow-[0_0_15px_rgba(214,178,94,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m-4-10h8" />
                    </svg>
                    <h1 className="text-2xl tracking-[0.2em] font-serif text-[var(--gold-light)] opacity-80 uppercase">The Lord's Prayer</h1>
                </motion.div>

                {/* Glass Card Container for Sentences */}
                <div className="relative w-full h-[400px] flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        {activeSentence && (
                            <motion.div
                                key={activeSentence.id}
                                initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                                className="absolute w-full flex flex-col items-center text-center p-12 rounded-[40px] border border-[var(--luxury-glass)] bg-white/[0.02] backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                                style={{ boxShadow: 'inset 0 0 40px rgba(214, 178, 94, 0.05)' }}
                            >
                                {/* Farsi Text */}
                                <h2 
                                    className="text-4xl md:text-6xl text-[var(--text)] mb-8 leading-tight drop-shadow-[0_0_20px_rgba(214,178,94,0.3)]"
                                    style={{ fontFamily: content.fontFa || 'var(--font-nastaliq)' }}
                                    dir="rtl"
                                >
                                    {activeSentence.fa}
                                </h2>
                                
                                {/* Decorative Separator */}
                                <div className="w-24 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-50 mb-8" />

                                {/* English Text */}
                                <h3 
                                    className="text-2xl md:text-4xl text-[var(--gold-light)] leading-relaxed italic drop-shadow-[0_0_15px_rgba(243,217,152,0.4)]"
                                    style={{ fontFamily: content.fontEn || "'Cormorant Garamond', serif" }}
                                >
                                    {activeSentence.en}
                                </h3>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Optional Progress Bar */}
                {content.audioUrl && (
                    <div className="absolute bottom-0 w-64 h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                            className="h-full bg-[var(--gold)] shadow-[0_0_10px_var(--gold)]"
                            style={{ width: `${audioRef.current && audioRef.current.duration ? (currentTime / audioRef.current.duration) * 100 : 0}%` }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
