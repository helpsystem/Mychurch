import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { DATABASE_UPDATES } from '../lib/databaseUpdates';
import { Check, Clipboard, ClipboardCheck, DatabaseZap, ChevronDown, ChevronUp } from 'lucide-react';

const UPDATE_STATUS_KEY = 'db-update-statuses';

const DatabaseUpdateManager: React.FC = () => {
    const { t } = useLanguage();
    const [isCompletedVisible, setIsCompletedVisible] = useState(false);
    const [copiedSqlId, setCopiedSqlId] = useState<string | null>(null);

    const [completedUpdates, setCompletedUpdates] = useState<Record<string, boolean>>(() => {
        try {
            const saved = localStorage.getItem(UPDATE_STATUS_KEY);
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(UPDATE_STATUS_KEY, JSON.stringify(completedUpdates));
        } catch (error) {
            console.error("Failed to save update statuses to localStorage", error);
        }
    }, [completedUpdates]);

    const handleMarkAsComplete = (id: string) => {
        setCompletedUpdates(prev => ({ ...prev, [id]: true }));
    };

    const handleCopySql = (sql: string, id: string) => {
        navigator.clipboard.writeText(sql).then(() => {
            setCopiedSqlId(id);
            setTimeout(() => setCopiedSqlId(null), 2000);
        });
    };

    const pendingUpdates = DATABASE_UPDATES.filter(u => !completedUpdates[u.id]);
    const completedUpdateItems = DATABASE_UPDATES.filter(u => completedUpdates[u.id]).sort((a, b) => b.date.localeCompare(a.date));

    return (
        <div className="bg-black-gradient p-6 rounded-[20px] box-shadow">
            <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
                <DatabaseZap /> {t('dbUpdatesTitle')}
            </h2>
            <p className="text-dimWhite mb-4 text-sm">{t('dbUpdateDescription')}</p>

            {/* Pending Updates */}
            <div className="space-y-4">
                <h3 className="font-semibold text-lg text-secondary border-b-2 border-secondary/30 pb-2">{t('dbUpdatePending')}</h3>
                {pendingUpdates.length > 0 ? (
                    pendingUpdates.map(update => (
                        <div key={update.id} className="bg-primary/50 p-4 rounded-lg border border-gray-700">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-white">{update.title}</h4>
                                    <p className="text-xs text-dimWhite">{update.date}</p>
                                </div>
                                <button
                                    onClick={() => handleMarkAsComplete(update.id)}
                                    className="py-2 px-4 font-medium text-[14px] text-primary bg-blue-gradient rounded-[10px] outline-none flex items-center gap-2"
                                >
                                    <Check size={16} /> {t('dbUpdateCompleteButton')}
                                </button>
                            </div>
                            <p className="text-dimWhite my-3 text-sm">{update.description}</p>
                            <p className="text-xs text-gray-500 mb-2">{t('dbUpdateFile')}: <span className="font-mono text-gray-400">{update.filePath}</span></p>
                            <div>
                                <label className="block text-sm font-semibold text-dimWhite mb-1">{t('dbUpdateSQL')}</label>
                                <div className="relative">
                                    <pre className="bg-primary p-3 rounded-md text-white overflow-x-auto text-sm">
                                        <code>{update.sql}</code>
                                    </pre>
                                    <button onClick={() => handleCopySql(update.sql, update.id)} className="absolute top-2 right-2 p-1 bg-gray-600 rounded-md hover:bg-gray-500">
                                        {copiedSqlId === update.id ? <ClipboardCheck size={16} className="text-green-400" /> : <Clipboard size={16} />}
                                    </button>
                                </div>
                                {copiedSqlId === update.id && <span className="text-xs text-green-400 mt-1">{t('dbUpdateCopied')}</span>}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-4 text-green-400 bg-green-900/30 rounded-lg border border-green-700/50">
                        <p>{t('dbUpdateNonePending')}</p>
                    </div>
                )}
            </div>

            {/* Completed Updates */}
            <div className="mt-6">
                <button
                    onClick={() => setIsCompletedVisible(!isCompletedVisible)}
                    className="flex justify-between items-center w-full text-left font-semibold text-lg text-dimWhite hover:text-white"
                >
                    <span>{t('dbUpdateCompleted')} ({completedUpdateItems.length})</span>
                    {isCompletedVisible ? <ChevronUp /> : <ChevronDown />}
                </button>
                {isCompletedVisible && (
                    <div className="mt-4 space-y-2">
                        {completedUpdateItems.length > 0 ? (
                            completedUpdateItems.map(update => (
                                <div key={update.id} className="flex items-center gap-3 p-3 bg-primary/30 rounded-md">
                                    <Check className="text-green-500 flex-shrink-0" />
                                    <div className="flex-grow">
                                        <p className="text-white text-sm">{update.title}</p>
                                        <p className="text-xs text-gray-500">{update.date}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-dimWhite text-center py-3">{t('dbUpdateNoneCompleted')}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DatabaseUpdateManager;