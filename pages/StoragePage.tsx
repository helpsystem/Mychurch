
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useContent } from '../hooks/useContent';
import { StorageSettings } from '../types';
import { Server, Share2, Save, RefreshCw } from 'lucide-react';
import Spinner from '../components/Spinner';

const StoragePage: React.FC = () => {
    const { t } = useLanguage();
    const { content, updateStorageSettings } = useContent();
    const [settings, setSettings] = useState<StorageSettings>(content.storage);
    const [activeTab, setActiveTab] = useState('ftp');
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
    
    useEffect(() => {
        setSettings(content.storage);
    }, [content.storage]);

    const handleFtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        if (name === 'defaultImageStorage') {
             setSettings(prev => ({ ...prev, defaultImageStorage: checked ? 'ftp' : 'local' }));
        } else {
             setSettings(prev => ({
                ...prev,
                ftp: {
                    ...prev.ftp,
                    [name]: type === 'number' ? parseInt(value, 10) : value,
                }
            }));
        }
    };
    
    const handleSave = async () => {
        setIsSaving(true);
        setStatusMessage({ type: '', text: '' });
        try {
            await updateStorageSettings(settings);
            setStatusMessage({ type: 'success', text: t('settingsSavedSuccessfully') });
        } catch (error) {
            setStatusMessage({ type: 'error', text: 'Failed to save settings.' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setStatusMessage({ type: '', text: '' }), 3000);
        }
    };
    
    const handleTestConnection = () => {
        setIsTesting(true);
        setStatusMessage({ type: '', text: '' });
        // Simulate a connection test
        setTimeout(() => {
            const success = Math.random() > 0.3; // Simulate 70% success rate
            if (success) {
                setStatusMessage({ type: 'success', text: t('connectionSuccess') });
            } else {
                setStatusMessage({ type: 'error', text: t('connectionFailed') });
            }
            setIsTesting(false);
            setTimeout(() => setStatusMessage({ type: '', text: '' }), 3000);
        }, 1500);
    };

    const tabs = [
        { id: 'ftp', name: t('externalFtpSftp'), icon: <Server /> },
        { id: 'sharing', name: t('fileSharingLinks'), icon: <Share2 /> },
    ];
    const inputClass = "w-full p-2 border border-gray-600 bg-primary rounded-md focus:outline-none focus:ring-2 focus:ring-secondary text-white";

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2">{t('navStorage')}</h1>
            <p className="text-dimWhite mb-6">{t('storageSettingsDescription')}</p>

            <div className="bg-black-gradient rounded-xl shadow-lg border border-gray-700">
                 <div className="border-b border-gray-700">
                    <nav className="flex space-x-4 px-6" aria-label="Tabs">
                         {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === tab.id
                                    ? 'border-secondary text-secondary'
                                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                                }`}
                            >
                                {tab.icon}
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-6">
                    {activeTab === 'ftp' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-dimWhite mb-1">{t('ftpHost')}</label>
                                    <input name="host" value={settings.ftp.host} onChange={handleFtpChange} className={inputClass} placeholder="ftp.yourdomain.com"/>
                                </div>
                                <div>
                                    <label className="block text-sm text-dimWhite mb-1">{t('ftpPort')}</label>
                                    <input name="port" type="number" value={settings.ftp.port} onChange={handleFtpChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-sm text-dimWhite mb-1">{t('ftpUser')}</label>
                                    <input name="user" value={settings.ftp.user} onChange={handleFtpChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-sm text-dimWhite mb-1">{t('ftpPassword')}</label>
                                    <input name="pass" type="password" value={settings.ftp.pass} onChange={handleFtpChange} className={inputClass} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm text-dimWhite mb-1">{t('basePath')}</label>
                                    <input name="path" value={settings.ftp.path} onChange={handleFtpChange} className={inputClass} placeholder="/public_html/uploads" />
                                </div>
                            </div>
                             <label className="flex items-center gap-3 text-dimWhite cursor-pointer">
                                <input type="checkbox" name="defaultImageStorage" checked={settings.defaultImageStorage === 'ftp'} onChange={handleFtpChange} className="form-checkbox h-5 w-5 bg-gray-700 border-gray-600 text-secondary rounded focus:ring-secondary focus:ring-offset-primary"/>
                                {t('useFtpForImages')}
                            </label>
                             <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-700">
                                <div className="h-6 text-sm">
                                    {statusMessage.text && (
                                        <p className={statusMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}>{statusMessage.text}</p>
                                    )}
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={handleTestConnection} disabled={isTesting || isSaving} className="py-2 px-4 bg-gray-700 text-white rounded-md hover:bg-gray-600 flex items-center gap-2 disabled:opacity-50">
                                        {isTesting ? <Spinner size="4"/> : <RefreshCw size={16}/>}
                                        {isTesting ? t('testingConnection') : t('testConnection')}
                                    </button>
                                    <button onClick={handleSave} disabled={isSaving || isTesting} className="py-2 px-6 bg-blue-gradient text-primary font-bold rounded-md flex items-center gap-2 disabled:opacity-50">
                                        {isSaving ? <Spinner size="4"/> : <Save size={16}/>}
                                        {t('saveSettings')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'sharing' && (
                        <div>
                             <p className="text-dimWhite mb-4">Manage external file sharing links. These can be integrated throughout the site.</p>
                             <div className="bg-primary p-4 rounded-lg border border-gray-700">
                                <h4 className="font-bold text-white">HiDrive File Share</h4>
                                <a href="https://hidrive.ionos.com/upl/IzAt51PFG" target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-white break-all text-sm">
                                    https://hidrive.ionos.com/upl/IzAt51PFG
                                </a>
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StoragePage;
