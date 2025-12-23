'use client';

import React, { useEffect } from 'react';

interface Props {
    containerId?: string;
    style?: React.CSSProperties;
}

export default function AlHayatGPTWidget({
    containerId = 'alhayat-gpt-widget-container',
    style = { width: '100%', height: '100%' }
}: Props) {
    useEffect(() => {
        const initWidget = () => {
            const container = document.getElementById(containerId);
            const windowObj = window as unknown as Record<string, unknown>;
            const sdk = windowObj['AlHayatGPT'];

            // Final check to ensure the container exists and hasn't been initialized
            if (sdk && typeof sdk === 'object' && sdk !== null &&
                'createWidget' in sdk && typeof sdk.createWidget === 'function' &&
                container && !container.hasAttribute('data-ahgpt-widget-initialized')) {
                container.setAttribute('data-ahgpt-widget-initialized', 'true');
                (sdk.createWidget as (options: { containerId: string }) => void)({ containerId });
            }
        };

        const loadAndInit = () => {
            const windowObj = window as unknown as Record<string, unknown>;

            // If SDK is already ready, initialize now
            if (windowObj['AlHayatGPTSDKReady']) {
                initWidget();
                return;
            }

            // If not ready, add a listener for when it is
            window.addEventListener('AlHayatGPTSDKReady', initWidget);

            // Check if script is already being loaded or has been loaded
            if (document.getElementById('ahgpt-sdk-script')) {
                return;
            }

            // If not, create and load the script
            const script = document.createElement('script');
            script.id = 'ahgpt-sdk-script';
            script.src = 'https://www.alhayatgpt.com/sdk.js';
            script.async = true;
            document.body.appendChild(script);
        };

        loadAndInit();

        // Cleanup: remove the event listener when the component unmounts
        return () => {
            window.removeEventListener('AlHayatGPTSDKReady', initWidget);
        };
    }, [containerId]);

    return <div id={containerId} style={style} />;
}
