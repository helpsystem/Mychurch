import React, { useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useContent } from '../../hooks/useContent';
import { ChurchLetter, FieldConfig, User } from '../../types';
import Spinner from '../Spinner';
import ContentFormModal from '../ContentFormModal';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const LettersManager: React.FC = () => {
    const { t, lang } = useLanguage();
    const { content, addItem, updateItem, deleteItem, loading: contentLoading } = useContent();
    const { user: adminUser } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fields: FieldConfig[] = [
        { name: 'from', label: t('letterFromEn'), type: 'text', lang: 'en' },
        { name: 'from', label: t('letterFromFa'), type: 'text', lang: 'fa' },
        { name: 'to', label: t('letterToEn'), type: 'text', lang: 'en' },
        { name: 'to', label: t('letterToFa'), type: 'text', lang: 'fa' },
        { name: 'requestedBy', label: t('letterRequestedByEn'), type: 'text', lang: 'en' },
        { name: 'requestedBy', label: t('letterRequestedByFa'), type: 'text', lang: 'fa' },
        { name: 'body', label: `${t('letterBody')} (EN)`, type: 'textarea', lang: 'en' },
        { name: 'body', label: `${t('letterBody')} (FA)`, type: 'textarea', lang: 'fa' },
        { name: 'authorizedUsers', label: t('authorizedUsers'), type: 'user-select' },
    ];

    const handleOpenModal = (item: any = null) => {
        setItemToEdit(item);
        setIsModalOpen(true);
    };

    const handleSave = async (data: any) => {
        setIsLoading(true);
        try {
            const payload = { ...data };
            if (!itemToEdit) {
                payload.createdAt = new Date().toISOString();
                payload.authorEmail = adminUser?.email; 
            }
            if (itemToEdit) {
                await updateItem('churchLetters', itemToEdit.id, payload);
            } else {
                await addItem('churchLetters', payload);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Failed to save letter", error);
            alert("Failed to save letter.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (itemId: number) => {
        if (window.confirm(t('confirmDelete'))) {
            await deleteItem('churchLetters', itemId);
        }
    };

    if (contentLoading) {
        return <div className="flex justify-center items-center h-64"><Spinner size="12" /></div>;
    }

    return (
        <div className="bg-black-gradient p-6 rounded-[20px] box-shadow">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-white">{t('navLetters')}</h2>
                <button onClick={() => handleOpenModal()} className="py-2 px-4 bg-blue-gradient text-primary font-bold rounded-md flex items-center gap-2">
                    <Plus size={16}/> {t('addLetter')}
                </button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700/20">
                        <tr>
                            <th className="px-6 py-3">{t('letterTo')}</th>
                            <th className="px-6 py-3">{t('letterFrom')}</th>
                            <th className="px-6 py-3">{t('date')}</th>
                            <th className="px-6 py-3">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {content.churchLetters.map((letter: ChurchLetter) => (
                            <tr key={letter.id} className="border-b border-gray-700 hover:bg-gray-800/50">
                                <td className="px-6 py-4 font-medium text-white">{letter.to[lang]}</td>
                                <td className="px-6 py-4">{letter.from[lang]}</td>
                                <td className="px-6 py-4">{new Date(letter.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4 flex items-center gap-2">
                                     <Link to={`/letters/${letter.id}`} target="_blank" className="p-2 text-dimWhite hover:text-secondary" title={t('viewLetter')}><Eye size={16}/></Link>
                                     <button onClick={() => handleOpenModal(letter)} className="p-2 text-dimWhite hover:text-secondary" title={t('edit')}><Edit size={16}/></button>
                                     <button onClick={() => handleDelete(letter.id)} className="p-2 text-dimWhite hover:text-red-500" title={t('delete')}><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <ContentFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    itemToEdit={itemToEdit}
                    fields={fields}
                    title={itemToEdit ? t('edit') : t('addLetter')}
                    isLoading={isLoading}
                />
            )}
        </div>
    );
};

export default LettersManager;
