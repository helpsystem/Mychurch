

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import Spinner from './Spinner';
import { X, Eye, EyeOff, Edit } from 'lucide-react';
import { MANAGEABLE_PAGES } from '../lib/constants';
import { User } from '../types';
import { getProfilePictureUrl } from '../lib/utils';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    isLoading: boolean;
    userToEdit: User | null;
}

const UserFormModal: React.FC<Props> = ({ isOpen, onClose, onSave, isLoading, userToEdit }) => {
    const { t } = useLanguage();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'USER' | 'MANAGER' | 'SUPER_ADMIN'>('USER');
    const [permissions, setPermissions] = useState<string[]>([]);
    const [gender, setGender] = useState<'male' | 'female' | 'neutral'>('neutral');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (userToEdit) {
                setName(userToEdit.profileData.name);
                setEmail(userToEdit.email);
                setRole(userToEdit.role);
                setPermissions(userToEdit.permissions);
                setGender(userToEdit.profileData.gender || 'neutral');
                setPassword('');
                setImageFile(null);
                setImagePreview(null);
            } else {
                // Reset for new user
                setName('');
                setEmail('');
                setPassword('');
                setRole('USER');
                setPermissions([]);
                setGender('neutral');
                setImageFile(null);
                setImagePreview(null);
            }
        }
    }, [isOpen, userToEdit]);

    if (!isOpen) return null;

    const profileImageUrl = imagePreview || getProfilePictureUrl(userToEdit);

    const handlePermissionChange = (page: string, isChecked: boolean) => {
        setPermissions(currentPermissions =>
            isChecked
                ? [...currentPermissions, page]
                : currentPermissions.filter(p => p !== page)
        );
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setImageFile(file);
          const reader = new FileReader();
          reader.onloadend = () => setImagePreview(reader.result as string);
          reader.readAsDataURL(file);
      }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data: any = { 
            profileData: { name, gender },
            role, 
            permissions
        };
        if (!userToEdit) { // Only send email/password on creation
            data.email = email;
            data.password = password;
        }
        if (imagePreview) { // If a new image was selected
            data.profileData.imageUrl = imagePreview;
        }

        onSave(data);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="bg-black-gradient rounded-xl shadow-lg w-full max-w-2xl border border-gray-700 max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-semibold text-white">{userToEdit ? t('editUser') : t('addNewUser')}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <img src={profileImageUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-gray-700"/>
                            <label htmlFor="profile-pic-upload" className="absolute inset-0 bg-black/60 flex items-center justify-center text-white cursor-pointer rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <Edit size={24}/>
                            </label>
                            <input id="profile-pic-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                        </div>
                        <div className="flex-grow space-y-4">
                             <div>
                                <label className="block text-sm font-medium text-dimWhite mb-1">{t('name')}</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border border-gray-600 bg-primary rounded-md focus:outline-none focus:ring-2 focus:ring-secondary text-white"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dimWhite mb-1">{t('gender')}</label>
                                <select value={gender} onChange={e => setGender(e.target.value as any)} className="w-full p-2 border border-gray-600 bg-primary rounded-md focus:outline-none focus:ring-2 focus:ring-secondary text-white">
                                    <option value="neutral">{t('neutral')}</option>
                                    <option value="male">{t('male')}</option>
                                    <option value="female">{t('female')}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <hr className="border-gray-700"/>
                     <div>
                        <label className="block text-sm font-medium text-dimWhite mb-1">{t('emailAddress')}</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={!!userToEdit} className="w-full p-2 border border-gray-600 bg-primary rounded-md focus:outline-none focus:ring-2 focus:ring-secondary text-white disabled:bg-gray-800 disabled:cursor-not-allowed"/>
                    </div>
                    {!userToEdit && (
                         <div>
                            <label className="block text-sm font-medium text-dimWhite mb-1">{t('password')}</label>
                            <div className="relative">
                                <input type={isPasswordVisible ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-2 border border-gray-600 bg-primary rounded-md focus:outline-none focus:ring-2 focus:ring-secondary text-white pr-10"/>
                                 <button type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white">
                                    {isPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-dimWhite mb-1">{t('role')}</label>
                        <select value={role} onChange={e => setRole(e.target.value as any)} className="w-full p-2 border border-gray-600 bg-primary rounded-md focus:outline-none focus:ring-2 focus:ring-secondary text-white">
                            <option value="USER">{t('roleUser')}</option>
                            <option value="MANAGER">{t('roleManager')}</option>
                            <option value="SUPER_ADMIN">{t('roleSuperAdmin')}</option>
                        </select>
                    </div>
                    {role === 'MANAGER' && (
                        <div className="pt-2">
                            <h4 className="font-semibold mb-2 text-white">{t('permissions')}:</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {MANAGEABLE_PAGES.map(page => (
                                    <label key={page} className="flex items-center gap-2 text-sm text-dimWhite">
                                        <input
                                            type="checkbox"
                                            className="form-checkbox h-4 w-4 bg-gray-700 border-gray-600 text-secondary rounded focus:ring-secondary focus:ring-offset-primary"
                                            checked={permissions.includes(page)}
                                            onChange={(e) => handlePermissionChange(page, e.target.checked)}
                                        />
                                        {page}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </form>
                <footer className="p-4 border-t border-gray-700 mt-auto">
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-500">
                            {t('cancel')}
                        </button>
                        <button type="submit" onClick={handleSubmit} disabled={isLoading} className="py-2 px-4 bg-blue-gradient text-primary font-bold rounded-md disabled:opacity-50 w-36 flex justify-center items-center">
                            {isLoading ? <Spinner size="5" /> : (userToEdit ? t('saveChanges') : t('createUser'))}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default UserFormModal;