"use client";

import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  intensity?: number;
}

export default function TiltCard({ 
  children, 
  className = "", 
  glowColor = "rgba(245,166,35,0.4)",
  intensity = 15
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 300, damping: 30 });
  const springY = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(springY, [-0.5, 0.5], [intensity, -intensity]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-intensity, intensity]);

  // Shine position
  const shineX = useTransform(springX, [-0.5, 0.5], [0, 100]);
  const shineY = useTransform(springY, [-0.5, 0.5], [0, 100]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(nx);
    y.set(ny);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      className={`relative group cursor-pointer ${className}`}
    >
      {/* Card body */}
      <div
        className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden transition-all duration-300"
        style={{
          boxShadow: isHovered
            ? `0 25px 50px rgba(0,0,0,0.5), 0 0 40px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.1)`
            : "0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        {/* Shine overlay */}
        {isHovered && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: `radial-gradient(circle at ${shineX.get()}% ${shineY.get()}%, rgba(255,255,255,0.08) 0%, transparent 60%)`,
            }}
          />
        )}

        {/* Top glow line */}
        <div
          className="absolute top-0 inset-x-0 h-px transition-opacity duration-300"
          style={{
            background: `linear-gradient(90deg, transparent, ${glowColor}, transparent)`,
            opacity: isHovered ? 1 : 0.3,
          }}
        />

        {children}
      </div>
    </motion.div>
  );
}
