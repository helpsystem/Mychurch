'use client';

import React, { useEffect } from 'react';

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
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        
        const initWidget = () => {
            const container = document.getElementById(containerId);
            const windowObj = window as unknown as Record<string, unknown>;
            const sdk = windowObj['AlHayatGPT'];
            
            console.log('🤖 Al Hayat GPT: Initializing widget...', {
                container: !!container,
                sdk: !!sdk,
                containerId
            });
            
            // Final check to ensure the container exists and hasn't been initialized
            if (sdk && typeof sdk === 'object' && sdk !== null && 
                'createWidget' in sdk && typeof sdk.createWidget === 'function' &&
                container && !container.hasAttribute('data-ahgpt-widget-initialized')) {
                container.setAttribute('data-ahgpt-widget-initialized', 'true');
                console.log('✅ Al Hayat GPT: Widget initialized successfully!');
                setIsLoading(false);
                setError(null);
                (sdk.createWidget as (options: { 
                    containerId: string;
                    apiKey?: string;
                }) => void)({ 
                    containerId,
                    apiKey: 'b27dc6902b00019756980695a12eb0da'
                });
            } else {
                const errorMsg = !sdk ? 'SDK not loaded' : 
                                !container ? 'Container not found' : 
                                'Already initialized';
                console.warn('⚠️ Al Hayat GPT: Widget initialization failed', {
                    sdkExists: !!sdk,
                    containerExists: !!container,
                    alreadyInitialized: container?.hasAttribute('data-ahgpt-widget-initialized')
                });
                if (!container?.hasAttribute('data-ahgpt-widget-initialized')) {
                    setError(errorMsg);
                }
            }
        };

        const loadAndInit = () => {
            const windowObj = window as unknown as Record<string, unknown>;
            
            console.log('🔄 Al Hayat GPT: Loading SDK...');
            
            // Set timeout for loading
            timeoutId = setTimeout(() => {
                if (!windowObj['AlHayatGPTSDKReady']) {
                    console.error('⏱️ Al Hayat GPT: SDK loading timeout');
                    setError('Failed to load Al Hayat GPT SDK. Please check your internet connection.');
                    setIsLoading(false);
                }
            }, 10000); // 10 second timeout
            
            // If SDK is already ready, initialize now
            if (windowObj['AlHayatGPTSDKReady']) {
                console.log('✅ Al Hayat GPT: SDK already ready');
                clearTimeout(timeoutId);
                initWidget();
                return;
            }

            // If not ready, add a listener for when it is
            window.addEventListener('AlHayatGPTSDKReady', () => {
                console.log('✅ Al Hayat GPT: SDK ready event received');
                clearTimeout(timeoutId);
                initWidget();
            });

            // Check if script is already being loaded or has been loaded
            if (document.getElementById('ahgpt-sdk-script')) {
                console.log('ℹ️ Al Hayat GPT: SDK script already exists');
                return;
            }

            // If not, create and load the script
            const script = document.createElement('script');
            script.id = 'ahgpt-sdk-script';
            script.src = 'https://www.alhayatgpt.com/sdk.js';
            script.async = true;
            script.onload = () => console.log('✅ Al Hayat GPT: SDK script loaded');
            script.onerror = () => {
                console.error('❌ Al Hayat GPT: Failed to load SDK script');
                setError('Failed to load Al Hayat GPT. Please refresh the page.');
                setIsLoading(false);
                clearTimeout(timeoutId);
            };
            document.body.appendChild(script);
            console.log('📥 Al Hayat GPT: SDK script added to page');
        };

        loadAndInit();

        // Cleanup: remove the event listener when the component unmounts
        return () => {
            window.removeEventListener('AlHayatGPTSDKReady', initWidget);
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [containerId]);

    return (
        <div id={containerId} style={style} className={className}>
            {isLoading && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    gap: '1rem',
                    color: '#fff'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid rgba(255,255,255,0.3)',
                        borderTop: '4px solid #fff',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <p>Loading Al Hayat GPT...</p>
                    <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            )}
            {error && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    gap: '1rem',
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#ef4444'
                }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p style={{ fontSize: '1.125rem', fontWeight: '600' }}>Error Loading Chat</p>
                    <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '1rem',
                            padding: '0.5rem 1.5rem',
                            background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '600'
                        }}
                    >
                        Reload Page
                    </button>
                </div>
            )}
        </div>
    );
}
