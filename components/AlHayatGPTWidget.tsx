'use client';

import React from 'react';

interface Props {
    containerId?: string;
    style?: React.CSSProperties;
    className?: string;
}

export default function AlHayatGPTWidget({ 
    containerId = 'alhayat-gpt-widget-container',
    style = { width: '100%', height: '100%' },
    className = ''
}: Props) {
    // Use iframe directly as the most reliable method
    return (
        <iframe 
            id={containerId}
            src="https://www.alhayatgpt.com/chat"
            style={{
                ...style,
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
            }}
            className={className}
            title="Al Hayat GPT - Christian AI Assistant"
            allow="microphone; clipboard-write"
            loading="lazy"
        />
    );
}
