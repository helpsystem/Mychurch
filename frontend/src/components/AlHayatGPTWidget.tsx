'use client';

import React, { useState, useEffect } from 'react';
import BibleAIChatWidget from './BibleAIChatWidget';

interface Props {
    containerId?: string;
    style?: React.CSSProperties;
    className?: string;
    width?: string;
    height?: string;
    customStyle?: Record<string, string>;
}

export default function AlHayatGPTWidget({ 
    containerId = 'alhayat-gpt-widget-container',
    style = { width: '100%', height: '100%' },
    className = '',
    width,
    height,
    customStyle = {}
}: Props) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    // Simple timeout to handle loading state
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setIsLoading(false);
        }, 3000); // Show loading for 3 seconds

        return () => clearTimeout(timeoutId);
    }, []);

    // Use our local Bible AI Chat Widget instead of external service
    return (
        <div style={{ position: 'relative', ...style }} className={className}>
            {isLoading && (
                <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="flex flex-col items-center text-white">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                        <p className="text-sm">آماده‌سازی دستیار هوشمند...</p>
                    </div>
                </div>
            )}
            
            {!isLoading && (
                <div className="w-full h-full">
                    <BibleAIChatWidget />
                </div>
            )}
        </div>
    );
}
