import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export type WatermarkPosition =
    | 'top-left' | 'top-right' | 'top-center'
    | 'bottom-left' | 'bottom-right' | 'bottom-center'
    | 'center'
    | 'custom'; // Use className for custom absolute positioning

export interface WatermarkLogoProps {
    size?: number;
    position?: WatermarkPosition;
    opacity?: number; // 0 to 100
    className?: string;
    imageUrl?: string; // Optional custom URL
    customOffsets?: { x: number; y: number }; // X, Y percentages for custom dragging
}

export const WatermarkLogo: React.FC<WatermarkLogoProps> = ({
    size = 400,
    position = 'custom',
    opacity = 4,
    className,
    imageUrl,
    customOffsets
}) => {
    const positionClasses = {
        'top-left': 'top-0 left-0 -translate-x-1/4 -translate-y-1/4',
        'top-right': 'top-0 right-0 translate-x-1/4 -translate-y-1/4',
        'top-center': 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/4',
        'bottom-left': 'bottom-0 left-0 -translate-x-1/4 translate-y-1/4',
        'bottom-right': 'bottom-0 right-0 translate-x-1/4 translate-y-1/4',
        'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/4',
        'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
        'custom': ''
    };

    return (
        <div
            className={cn(
                "absolute pointer-events-none grayscale mix-blend-overlay transition-all duration-1000",
                positionClasses[position],
                className
            )}
            style={{
                opacity: opacity / 100,
                ...(position === 'custom' && customOffsets ? {
                    left: `${customOffsets.x}%`,
                    top: `${customOffsets.y}%`,
                    transform: 'translate(-50%, -50%)',
                    transition: 'none' // Disable transition during drag
                } : {})
            }}
        >
            <Image
                src={imageUrl || "/logo-transparent.png"}
                alt="Watermark"
                width={size}
                height={size}
                className="object-contain"
                priority={size > 400 && !imageUrl}
            />
        </div>
    );
};
