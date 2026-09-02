'use client';

import React, { useEffect, useRef } from 'react';

interface AlHayatGPTWidgetProps {
  containerId?: string;
  theme?: 'dark' | 'light';
  character?: string;
  showCharacterSelector?: boolean;
  height?: string;
  className?: string;
}

export default function AlHayatGPTWidget({
  containerId = 'ahgpt-react-widget',
  theme = 'dark',
  character = 'jesus',
  showCharacterSelector = true,
  height = '100%',
  className = '',
}: AlHayatGPTWidgetProps) {
  const initializedRef = useRef(false);

  useEffect(() => {
    const initWidget = () => {
      const container = document.getElementById(containerId);
      const sdk = (window as any).AlHayatGPT;

      if (sdk && container && !initializedRef.current) {
        initializedRef.current = true;
        container.setAttribute('data-initialized', 'true');
        sdk.createWidget({
          containerId,
          theme,
          character,
          showCharacterSelector,
          allowCharacterSelection: showCharacterSelector,
          height,
        });
      }
    };

    // If SDK already loaded
    if ((window as any).AlHayatGPT) {
      initWidget();
      return;
    }

    window.addEventListener('AlHayatGPTSDKReady', initWidget);

    // Load the SDK script once
    if (!document.getElementById('ahgpt-sdk-loader-script')) {
      const script = document.createElement('script');
      script.id = 'ahgpt-sdk-loader-script';
      script.src = 'https://www.alhayatgpt.com/widget-sdk.js';
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      window.removeEventListener('AlHayatGPTSDKReady', initWidget);
    };
  }, [containerId, theme, character, showCharacterSelector, height]);

  return (
    <div
      id={containerId}
      className={className}
      style={{ width: '100%', height, borderRadius: '12px', overflow: 'hidden' }}
    />
  );
}
