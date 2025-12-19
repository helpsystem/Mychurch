

import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { AlertTriangle, Key, Clipboard, ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const ConfigureBackendPage: React.FC = () => {
    const { t } = useLanguage();
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [jwtSecret, setJwtSecret] = useState('');

    const copyToClipboard = (text: string, key: string) => {
        if(!text) return;
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const generateJwtSecret = () => {
        const array = new Uint32Array(16);
        window.crypto.getRandomValues(array);
        const secret = Array.from(array, dec => dec.toString(16).padStart(2, '0')).join('');
        setJwtSecret(secret);
        copyToClipboard(secret, 'JWT_SECRET');
    };

    const variables = [
        { name: 'DB_HOST', value: 'YOUR_PROJECT_ID:YOUR_REGION:YOUR_INSTANCE_ID', note: t('dbHostNote') },
        { name: 'DB_USER', value: 'temp_admin', note: t('dbUserNote') },
        { name: 'DB_PASSWORD', value: 'your_db_user_password', note: t('dbPasswordNote') },
        { name: 'DB_DATABASE', value: 'mydatabase', note: t('dbDatabaseNote') },
        { name: 'JWT_SECRET', value: jwtSecret, note: t('jwtSecretNote'), isJwt: true },
    ];

    return (
        <main className="min-h-screen bg-primary text-white p-4 sm:p-8 flex justify-center items-center">
            <div className="w-full max-w-4xl bg-black-gradient rounded-2xl shadow-2xl border border-gray-700 p-6 sm:p-8">
                <h1 className="text-3xl font-bold text-gradient mb-2 flex items-center gap-3">
                    <AlertTriangle /> {t('configureBackendTitle')}
                </h1>
                <p className="text-dimWhite mb-6">{t('configureBackendDescription')}</p>

                <div className="bg-primary p-4 rounded-lg border border-gray-700">
                    <h2 className="text-xl font-semibold mb-3 text-white">{t('configureBackendInstructions')}</h2>
                    <p className="text-sm text-dimWhite mb-4">{t('configureBackendInstructionsDetail')}</p>

                    <div className="space-y-3">
                        {variables.map(v => (
                            <div key={v.name} className="bg-black/40 p-3 rounded-md border border-gray-800">
                                <label className="block text-sm font-bold text-secondary font-mono">{v.name}</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <input type="text" readOnly value={v.value} className="w-full bg-gray-900 text-white font-mono p-2 rounded-md border border-gray-600" placeholder={v.isJwt ? t('generateSecretPlaceholder') : ''} />
                                    {v.isJwt ? (
                                         <button onClick={generateJwtSecret} className="py-2 px-3 bg-blue-gradient text-primary font-bold rounded-md flex items-center gap-2 text-sm whitespace-nowrap">
                                            <Key size={16}/> {t('generateSecret')}
                                        </button>
                                    ) : (
                                        <button onClick={() => copyToClipboard(v.value, v.name)} className="p-2 bg-gray-600 rounded-md hover:bg-gray-500">
                                            {copiedKey === v.name ? <ClipboardCheck size={20} className="text-green-400"/> : <Clipboard size={20} />}
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-dimWhite mt-2">{v.note}</p>
                            </div>
                        ))}
                    </div>

                    <h2 className="text-xl font-semibold mt-6 mb-3 text-white">{t('deployInstructionsTitle')}</h2>
                    <p className="text-sm text-dimWhite mb-4">{t('deployInstructions')}</p>
                     <Link to="/" className="inline-block py-3 px-5 font-medium text-primary bg-blue-gradient rounded-[10px] outline-none">
                        {t('goHome')}
                    </Link>
                </div>
            </div>
        </main>
    );
};

export default ConfigureBackendPage;