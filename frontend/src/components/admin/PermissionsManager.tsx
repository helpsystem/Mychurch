
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { User, ActivityLog } from '../../types';
import Spinner from '../Spinner';
import { UserPlus, Edit, Eye, Send, Key, RefreshCw, AlertCircle } from 'lucide-react';
import UserFormModal from '../UserFormModal';
import ActivityLogModal from '../ActivityLogModal';
import InviteUserModal from '../InviteUserModal';
import { getProfilePictureUrl } from '../../lib/utils';

const PermissionsManager: React.FC = () => {
    const { getUsers, updateUserRole, createUser, updateUser, sendInvitation } = useAuth();
    const { t, lang } = useLanguage();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isSaving, setIsSaving] = useState(false);
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
    
    const showStatus = (message: string) => {
        setStatusMessage(message);
        setTimeout(() => setStatusMessage(''), 3000);
    };

    const handleRoleChange = async (email: string, role: 'USER' | 'MANAGER' | 'SUPER_ADMIN') => {
        await updateUserRole(email, role);
        showStatus(t('roleUpdatedSuccess'));
        fetchUsers();
    };
    
    const handleOpenModal = (user: User | null = null) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };
    
    const handleViewActivity = (user: User) => {
        setSelectedUser(user);
        setIsActivityModalOpen(true);
    };
    
    const handleSendInvitation = async (email: string) => {
        setIsSaving(true);
        try {
            await sendInvitation(email);
            showStatus(`${t('invitationSentSuccess')} ${email}`);
            setIsInviteModalOpen(false);
        } catch (error: any) {
            console.error("Failed to send invitation", error);
            showStatus(error.message || t('invitationSentError'));
        } finally {
            setIsSaving(false);
        }
    }

    const handleSaveUser = async (data: any) => {
        setIsSaving(true);
        try {
            if (selectedUser) {
                await updateUser(selectedUser.email, data);
                 showStatus(t('userUpdatedSuccess') || 'User updated successfully');
            } else {
                await createUser(data);
                 showStatus(t('userCreatedSuccess') || 'User created successfully');
            }
            fetchUsers();
            setIsModalOpen(false);
        } catch (error: any) {
            console.error("Failed to save user", error);
             alert(error.message || 'Failed to save user.');
        } finally {
            setIsSaving(false);
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
                <h2 className="text-2xl font-semibold text-white">{t('managePermissions') || 'User Management'}</h2>
                <div className="flex gap-2">
                    <button 
                        onClick={fetchUsers} 
                        className="p-2 bg-gray-700 rounded-md hover:bg-gray-600"
                        title={lang === 'fa' ? 'بروزرسانی' : 'Refresh'}
                    >
                        <RefreshCw size={16} className="text-white" />
                    </button>
                     <button onClick={() => setIsInviteModalOpen(true)} className="py-2 px-4 bg-gray-700 text-white rounded-md hover:bg-gray-600 flex items-center gap-2">
                        <Send size={16}/> {t('sendInvitation') || 'Invite'}
                    </button>
                    <button onClick={() => handleOpenModal()} className="py-2 px-4 bg-blue-gradient text-primary font-bold rounded-md flex items-center gap-2">
                        <UserPlus size={16}/> {t('addNewUser') || 'Add User'}
                    </button>
                </div>
            </div>
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
                                    <img src={getProfilePictureUrl(user)} alt={user.profileData.name} className="w-10 h-10 rounded-full object-cover"/>
                                    <div>
                                        <p className="font-medium text-white">{user.profileData.name}</p>
                                        <p className="text-xs text-gray-500">{user.email}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                     <select
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user.email, e.target.value as any)}
                                        className="p-1 border border-gray-600 bg-primary rounded-md focus:outline-none focus:ring-1 focus:ring-secondary text-white"
                                    >
                                        <option value="USER">{t('roleUser')}</option>
                                        <option value="MANAGER">{t('roleManager')}</option>
                                        <option value="SUPER_ADMIN">{t('roleSuperAdmin')}</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4 space-x-2">
                                    <button onClick={() => handleOpenModal(user)} title={t('editUser')} className="p-2 text-dimWhite hover:text-secondary"><Edit size={16}/></button>
                                    <button onClick={() => handleViewActivity(user)} title={t('viewActivity')} className="p-2 text-dimWhite hover:text-secondary"><Eye size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <UserFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveUser}
                isLoading={isSaving}
                userToEdit={selectedUser}
            />
            <ActivityLogModal 
                isOpen={isActivityModalOpen}
                onClose={() => setIsActivityModalOpen(false)}
                user={selectedUser}
            />
            <InviteUserModal 
                 isOpen={isInviteModalOpen}
                 onClose={() => setIsInviteModalOpen(false)}
                 onSend={handleSendInvitation}
            />
        </div>
    );
};

export default PermissionsManager;
