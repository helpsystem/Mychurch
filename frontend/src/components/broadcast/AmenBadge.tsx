/**
 * 🙏 Amen Badge Component
 * نمایش آمین + صلیب با انیمیشن ضربان قلب
 * قابلیت Drag & Drop برای جابجایی موقعیت
 */

import React, { useState, useRef, useEffect } from 'react';
import type { AmenBadgeConfig } from './types';

interface AmenBadgeProps {
  config: AmenBadgeConfig;
  onPositionChange?: (position: { x: number; y: number }) => void;
  isEditable?: boolean; // آیا قابل جابجایی است (فقط در کنسول)
  className?: string;
}

const AmenBadge: React.FC<AmenBadgeProps> = ({
  config,
  onPositionChange,
  isEditable = false,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const badgeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!config.show) return null;

  // Size classes
  const sizeClasses = {
    small: 'text-3xl',
    medium: 'text-5xl',
    large: 'text-7xl'
  };

  // Animation speed
  const animationDuration = {
    slow: '2s',
    normal: '1.2s',
    fast: '0.7s'
  };

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditable) return;
    e.preventDefault();
    
    const badge = badgeRef.current;
    if (!badge) return;
    
    const rect = badge.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  };

  // Handle drag move
  useEffect(() => {
    if (!isDragging || !isEditable) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current?.parentElement;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      
      // Calculate new position as percentage
      const newX = ((e.clientX - containerRect.left - dragOffset.x) / containerRect.width) * 100;
      const newY = ((e.clientY - containerRect.top - dragOffset.y) / containerRect.height) * 100;
      
      // Clamp values between 0 and 95
      const clampedX = Math.max(0, Math.min(95, newX));
      const clampedY = Math.max(0, Math.min(95, newY));
      
      onPositionChange?.({ x: clampedX, y: clampedY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, isEditable, onPositionChange]);

  // Render cross icon
  const renderCross = () => (
    <span className="inline-block" style={{ 
      filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.8)) drop-shadow(0 0 20px rgba(255, 215, 0, 0.5))'
    }}>
      ✝️
    </span>
  );

  // Render content based on style
  const renderContent = () => {
    switch (config.style) {
      case 'amen-only':
        return (
          <span className="font-bold font-[Vazirmatn] text-white drop-shadow-lg"
                style={{ textShadow: '0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.5)' }}>
            آمین
          </span>
        );
      case 'cross-only':
        return renderCross();
      case 'amen-cross':
      default:
        return (
          <div className="flex items-center gap-2">
            {renderCross()}
            <span className="font-bold font-[Vazirmatn] text-white drop-shadow-lg"
                  style={{ textShadow: '0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.5)' }}>
              آمین
            </span>
            {renderCross()}
          </div>
        );
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`absolute z-40 ${className}`}
      style={{
        left: `${config.position.x}%`,
        top: `${config.position.y}%`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div
        ref={badgeRef}
        className={`
          ${sizeClasses[config.size]}
          ${isEditable ? 'cursor-move hover:ring-2 hover:ring-yellow-400 hover:ring-offset-2 hover:ring-offset-transparent' : ''}
          ${isDragging ? 'ring-2 ring-yellow-400 scale-110' : ''}
          transition-transform duration-200
          select-none
          px-4 py-2 rounded-xl
          bg-gradient-to-br from-amber-600/30 via-yellow-500/20 to-amber-700/30
          backdrop-blur-sm
          border border-yellow-400/30
        `}
        style={{
          animation: `heartbeat ${animationDuration[config.animationSpeed]} ease-in-out infinite`
        }}
        onMouseDown={handleMouseDown}
        title={isEditable ? 'Drag to reposition' : undefined}
      >
        {renderContent()}
      </div>

      {/* Heartbeat Animation Keyframes */}
      <style>{`
        @keyframes heartbeat {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          25% {
            transform: scale(1.08);
            opacity: 0.95;
          }
          50% {
            transform: scale(1);
            opacity: 1;
          }
          75% {
            transform: scale(1.05);
            opacity: 0.97;
          }
        }
      `}</style>
    </div>
  );
};

export default AmenBadge;
