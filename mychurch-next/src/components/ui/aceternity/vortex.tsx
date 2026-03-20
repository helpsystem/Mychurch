'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function Vortex({
  className,
  children,
  particleCount = 200,
}: {
  className?: string;
  children?: React.ReactNode;
  particleCount?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      rotation: number;
      vRotation: number;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 1.5 + 1.5,
        color: Math.random() > 0.5 ? 'rgba(168, 85, 247, 0.8)' : 'rgba(6, 182, 212, 0.8)',
        rotation: (Math.random() - 0.5) * 0.5, // Start with a slight random tilt
        vRotation: (Math.random() - 0.5) * 0.01, // Very slow elegant rotation
      });
    }

      let animationFrameId: number;

      function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, i) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        particle.rotation += particle.vRotation;

        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        
        ctx.beginPath();
        // A crisp, elegant cross shape
        const size = particle.radius * 2.2;
        
        ctx.moveTo(0, -size);
        ctx.lineTo(0, size * 1.5);
        ctx.moveTo(-size * 1.2, -size * 0.1);
        ctx.lineTo(size * 1.2, -size * 0.1);
        
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = 1.6; // Sleek and crisp
        ctx.lineCap = 'round';
        ctx.shadowBlur = 10;
        ctx.shadowColor = particle.color;
        
        ctx.stroke();
        ctx.restore();

        // Connect nearby particles
        particles.slice(i + 1).forEach((p2) => {
          const dx = particle.x - p2.x;
          const dy = particle.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(168, 85, 247, ${0.25 * (1 - distance / 100)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        });
      });

      animationFrameId = requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [particleCount]);

  return (
    <div className={cn('relative flex h-screen w-full flex-col overflow-hidden', className)}>
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-0"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
