import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { User, ActivityLog } from '../types';
import Spinner from './Spinner';
import { X, History } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
}

const ActivityLogModal: React.FC<Props> = ({ isOpen, onClose, user }) => {
    const { t } = useLanguage();
    const { getUserActivity } = useAuth();
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            setIsLoading(true);
            getUserActivity(user.email)
                .then(setLogs)
                .catch(console.error)
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, user, getUserActivity]);

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="bg-black-gradient rounded-xl shadow-lg w-full max-w-2xl border border-gray-700 max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <History size={20} />
                        {t('userActivity')}: {user.profileData.name}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </header>
                <div className="p-6 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <Spinner size="8" />
                        </div>
                    ) : logs.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-400">
                                <thead className="text-xs text-gray-400 uppercase bg-gray-700/20">
                                    <tr>
                                        <th scope="col" className="px-4 py-3">{t('activityDate')}</th>
                                        <th scope="col" className="px-4 py-3">{t('activityAction')}</th>
                                        <th scope="col" className="px-4 py-3">{t('activityDetails')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log, index) => (
                                        <tr key={index} className="border-b border-gray-700 hover:bg-gray-800/50">
                                            <td className="px-4 py-3 whitespace-nowrap">{log.date}</td>
                                            <td className="px-4 py-3 font-medium text-secondary">{log.action}</td>
                                            <td className="px-4 py-3 text-white">{log.details}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            <p>{t('noActivity')}</p>
                        </div>
                    )}
                </div>
                <footer className="p-4 border-t border-gray-700 mt-auto">
                    <div className="flex justify-end">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-500">
                            {t('close')}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default ActivityLogModal;