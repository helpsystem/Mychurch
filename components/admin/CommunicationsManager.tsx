import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { User } from '../../types';
import Spinner from '../Spinner';
import { Send } from 'lucide-react';
import { getProfilePictureUrl } from '../../lib/utils';
import SendMessageModal from '../SendMessageModal';

const CommunicationsManager: React.FC = () => {
    const { getUsers, sendMessage } = useAuth();
    const { t } = useLanguage();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [statusMessage, setStatusMessage] = useState('');

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const userList = await getUsers();
            setUsers(userList);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setIsLoading(false);
        }
    }, [getUsers]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const showStatus = (message: string) => {
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
            showStatus(t('messageSentSuccess'));
            setIsModalOpen(false);
        } catch (error: any) {
            console.error("Failed to send message", error);
            showStatus(error.message || t('messageSentError'));
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Spinner size="12" /></div>;
    }

    return (
        <div className="bg-black-gradient p-6 rounded-[20px] box-shadow">
            <h2 className="text-2xl font-semibold text-white mb-6">{t('communications')}</h2>
            {statusMessage && <div className="mb-4 p-3 text-center rounded-lg bg-green-900/50 border border-green-500/50 text-green-300">{statusMessage}</div>}

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700/20">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('user')}</th>
                            <th scope="col" className="px-6 py-3">{t('role')}</th>
                            <th scope="col" className="px-6 py-3">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.email} className="border-b border-gray-700 hover:bg-gray-800/50">
                                <td className="px-6 py-4 flex items-center gap-3">
                                    <img src={getProfilePictureUrl(user)} alt={user.profileData.name} className="w-10 h-10 rounded-full object-cover" />
                                    <div>
                                        <p className="font-medium text-white">{user.profileData.name}</p>
                                        <p className="text-xs text-gray-500">{user.email}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4">{t(`role${user.role.replace('_', '')}`)}</td>
                                <td className="px-6 py-4">
                                    <button onClick={() => handleOpenModal(user)} className="py-1 px-3 bg-blue-gradient text-primary text-xs font-bold rounded-md flex items-center gap-1">
                                        <Send size={14} /> {t('sendMessage')}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

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