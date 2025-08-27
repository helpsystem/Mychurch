import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { getApiBaseUrl, setApiBaseUrl } from '../lib/api';
import { CheckCircle, AlertCircle, RefreshCw, Save, Globe, Trash2 } from 'lucide-react';
import Spinner from '../components/Spinner';

const EnvironmentPage: React.FC = () => {
    const { t } = useLanguage();
    const [apiUrl, setApiUrl] = useState('');
    const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'ok' | 'error' | 'testing'>('unknown');
    const [saveStatus, setSaveStatus] = useState('');
    const [isClearing, setIsClearing] = useState(false);

    useEffect(() => {
        setApiUrl(getApiBaseUrl());
    }, []);

    const testConnection = useCallback(async () => {
        const urlToTest = apiUrl.replace(/\/+$/, '');
        setConnectionStatus('testing');
        try {
            // We test against a simple, likely-to-exist, unauthenticated endpoint
            const response = await fetch(`${urlToTest}/api/settings`);
            if (response.ok) {
                setConnectionStatus('ok');
            } else {
                throw new Error(`Status: ${response.status}`);
            }
        } catch (error) {
            console.error("Connection test failed:", error);
            setConnectionStatus('error');
        }
    }, [apiUrl]);
    
    // Test connection on initial load if a URL is already set
    useEffect(() => {
        if(apiUrl) {
            testConnection();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const handleSave = () => {
        setSaveStatus('');
        setApiBaseUrl(apiUrl);
        setSaveStatus('API URL saved. Please refresh the application for changes to take full effect.');
        setTimeout(() => setSaveStatus(''), 5000);
        testConnection(); 
    };
    
    const handleClearCache = async () => {
        if (window.confirm(t('clearCacheConfirm'))) {
            setIsClearing(true);
            try {
                // Unregister all service workers.
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const registration of registrations) {
                        await registration.unregister();
                    }
                }
    
                // Clear all caches.
                if ('caches' in window) {
                    const keys = await caches.keys();
                    await Promise.all(keys.map(key => caches.delete(key)));
                }
    
                alert(t('cacheCleared'));
                window.location.reload(); // Force reload from server
            } catch (error) {
                console.error('Failed to clear cache:', error);
                alert(t('cacheClearError'));
                setIsClearing(false);
            }
        }
    };

    const renderStatus = () => {
        switch(connectionStatus) {
            case 'testing':
                return <div className="flex items-center gap-2 text-yellow-400"><Spinner size="4" /> Testing connection...</div>;
            case 'ok':
                return <div className="flex items-center gap-2 text-green-400"><CheckCircle size={18} /> Connection successful!</div>;
            case 'error':
                return <div className="flex items-center gap-2 text-red-400"><AlertCircle size={18} /> Connection failed. Check URL and backend CORS policy.</div>;
            default:
                 return <div className="flex items-center gap-2 text-gray-500">Enter a URL and test the connection.</div>;
        }
    };

    return (
        <div className="space-y-8 max-w-3xl mx-auto">
            <div className="bg-black-gradient p-6 rounded-[20px] box-shadow">
                <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
                    <Globe /> {t('apiConfiguration')}
                </h2>
                <p className="text-dimWhite mb-6">
                    Set the base URL for the backend API. All content and user data will be fetched from this address. If this is incorrect, the application will fall back to mock data.
                </p>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="api-url" className="block text-sm font-medium text-dimWhite mb-1">Backend API Base URL</label>
                        <div className="flex gap-2">
                             <input
                                id="api-url"
                                type="text"
                                value={apiUrl}
                                onChange={(e) => setApiUrl(e.target.value)}
                                placeholder="e.g., https://your-api.com (or leave empty)"
                                className="w-full p-2 border border-gray-600 bg-primary rounded-md focus:outline-none focus:ring-2 focus:ring-secondary text-white font-mono"
                            />
                            <button onClick={testConnection} disabled={connectionStatus === 'testing'} className="py-2 px-4 bg-gray-700 text-white rounded-md hover:bg-gray-600 flex items-center gap-2 disabled:opacity-50">
                               {connectionStatus === 'testing' ? <Spinner size="4"/> : <RefreshCw size={16}/>} Test
                            </button>
                        </div>
                    </div>
                    
                    <div className="text-sm h-6">
                        {renderStatus()}
                    </div>

                    <div className="pt-4 flex items-center justify-between gap-4">
                        <button onClick={handleSave} className="py-2 px-6 bg-blue-gradient text-primary font-bold rounded-md flex items-center gap-2">
                            <Save size={16} /> Save URL
                        </button>
                         {saveStatus && <p className="text-green-400 text-sm">{saveStatus}</p>}
                    </div>
                </div>

                <div className="mt-8 p-4 bg-primary border border-dashed border-gray-700 rounded-lg text-sm text-dimWhite">
                    <h3 className="font-bold text-white mb-2">Important Notes:</h3>
                    <ul className="list-disc list-inside space-y-1">
                        <li>If your API is hosted on the same domain as this frontend, <strong className="text-secondary">leave this field empty</strong> to use relative paths (e.g., /api/...).</li>
                        <li>The URL should not include a trailing slash (e.g., <code className="text-secondary">/</code>).</li>
                        <li>After saving, a page refresh might be required for all changes to apply.</li>
                        <li>If the connection test fails, ensure your backend server is running and that the frontend's origin is allowed by the backend's CORS policy.</li>
                    </ul>
                </div>
            </div>

            <div className="bg-black-gradient p-6 rounded-[20px] box-shadow">
                <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
                    <Trash2 /> {t('cacheManagement')}
                </h2>
                <p className="text-dimWhite mb-6">
                    {t('cacheManagementDesc')}
                </p>
                 <button onClick={handleClearCache} disabled={isClearing} className="py-2 px-6 bg-red-800 hover:bg-red-700 text-white font-bold rounded-md flex items-center gap-2 disabled:opacity-50">
                    {isClearing ? <Spinner size="4" /> : <Trash2 size={16} />} {t('clearCache')}
                </button>
            </div>
        </div>
    );
};

export default EnvironmentPage;