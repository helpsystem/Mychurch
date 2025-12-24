import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { User } from '../../types';
import Spinner from '../Spinner';
import { Send, RefreshCw, AlertCircle, Users } from 'lucide-react';
import { getProfilePictureUrl } from '../../lib/utils';
import SendMessageModal from '../SendMessageModal';

const CommunicationsManager: React.FC = () => {
    const { getUsers, sendMessage } = useAuth();
    const { t, lang } = useLanguage();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [statusMessage, setStatusMessage] = useState('');

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const userList = await getUsers();
            setUsers(Array.isArray(userList) ? userList : []);
        } catch (err: any) {
            console.error("Failed to fetch users", err);
            setError(err.message || (lang === 'fa' ? 'خطا در بارگذاری کاربران' : 'Failed to load users'));
        } finally {
            setIsLoading(false);
        }
    }, [getUsers, lang]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const showStatus = (message: string, isError = false) => {
        setStatusMessage(message);
        setTimeout(() => setStatusMessage(''), 3000);
    };

    const handleOpenModal = (user: User) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleSendMessage = async (data: { subject: any, body: any, methods: ('inbox' | 'email')[] }) => {
        if (!selectedUser) return;
        try {
            await sendMessage(selectedUser.email, data.subject, data.body, data.methods);
            showStatus(t('messageSentSuccess') || 'Message sent successfully');
            setIsModalOpen(false);
        } catch (error: any) {
            console.error("Failed to send message", error);
            showStatus(error.message || t('messageSentError') || 'Failed to send message', true);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-black-gradient p-6 rounded-[20px] box-shadow">
                <div className="flex justify-center items-center h-64">
                    <Spinner size="12" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-black-gradient p-6 rounded-[20px] box-shadow">
                <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">
                        {lang === 'fa' ? 'خطا در بارگذاری' : 'Error Loading Data'}
                    </h3>
                    <p className="text-gray-400 mb-4">{error}</p>
                    <button 
                        onClick={fetchUsers}
                        className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 mx-auto"
                    >
                        <RefreshCw size={16} />
                        {lang === 'fa' ? 'تلاش مجدد' : 'Retry'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-black-gradient p-6 rounded-[20px] box-shadow">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                    <Users size={24} />
                    {t('communications') || 'Communications'}
                </h2>
                <button 
                    onClick={fetchUsers}
                    className="p-2 bg-gray-700 rounded-md hover:bg-gray-600"
                    title={lang === 'fa' ? 'بروزرسانی' : 'Refresh'}
                >
                    <RefreshCw size={16} className="text-white" />
                </button>
            </div>
            
            {statusMessage && (
                <div className="mb-4 p-3 text-center rounded-lg bg-green-900/50 border border-green-500/50 text-green-300">
                    {statusMessage}
                </div>
            )}

            {users.length === 0 ? (
                <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">
                        {lang === 'fa' ? 'هیچ کاربری یافت نشد' : 'No users found'}
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700/20">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('user') || 'User'}</th>
                                <th scope="col" className="px-6 py-3">{t('role') || 'Role'}</th>
                                <th scope="col" className="px-6 py-3">{t('actions') || 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.email} className="border-b border-gray-700 hover:bg-gray-800/50">
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        <img 
                                            src={getProfilePictureUrl(user)} 
                                            alt={user.profileData?.name || user.email} 
                                            className="w-10 h-10 rounded-full object-cover"
                                            onError={(e) => { (e.target as HTMLImageElement).src = '/images/default-avatar.png'; }}
                                        />
                                        <div>
                                            <p className="font-medium text-white">{user.profileData?.name || user.first_name || 'Unknown'}</p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs ${
                                            user.role === 'SUPER_ADMIN' ? 'bg-purple-500/20 text-purple-400' :
                                            user.role === 'MANAGER' ? 'bg-blue-500/20 text-blue-400' :
                                            'bg-gray-500/20 text-gray-400'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button 
                                            onClick={() => handleOpenModal(user)} 
                                            className="py-1 px-3 bg-blue-gradient text-primary text-xs font-bold rounded-md flex items-center gap-1 hover:opacity-80"
                                        >
                                            <Send size={14} /> {t('sendMessage') || 'Send'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && selectedUser && (
                <SendMessageModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSend={handleSendMessage}
                    user={selectedUser}
                />
            )}
        </div>
    );
};

export default CommunicationsManager;