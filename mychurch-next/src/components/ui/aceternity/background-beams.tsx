'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function BackgroundBeams({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const beams: Array<{
      x: number;
      y: number;
      length: number;
      angle: number;
      speed: number;
      opacity: number;
    }> = [];

    for (let i = 0; i < 50; i++) {
      beams.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        length: Math.random() * 200 + 100,
        angle: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.5 + 0.1,
        opacity: Math.random() * 0.3 + 0.1,
      });
    }

    function animate() {
      if (!ctx || !canvas) return;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      beams.forEach((beam) => {
        beam.x += Math.cos(beam.angle) * beam.speed;
        beam.y += Math.sin(beam.angle) * beam.speed;

        if (beam.x < 0) beam.x = canvas.width;
        if (beam.x > canvas.width) beam.x = 0;
        if (beam.y < 0) beam.y = canvas.height;
        if (beam.y > canvas.height) beam.y = 0;

        const gradient = ctx.createLinearGradient(
          beam.x,
          beam.y,
          beam.x + Math.cos(beam.angle) * beam.length,
          beam.y + Math.sin(beam.angle) * beam.length
        );
        gradient.addColorStop(0, `rgba(168, 85, 247, ${beam.opacity})`);
        gradient.addColorStop(1, 'rgba(168, 85, 247, 0)');

        ctx.beginPath();
        ctx.moveTo(beam.x, beam.y);
        ctx.lineTo(
          beam.x + Math.cos(beam.angle) * beam.length,
          beam.y + Math.sin(beam.angle) * beam.length
        );
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-0"
      />
    </div>
  );
}
