
import React, { useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useContent } from '../../hooks/useContent';
import { ContentType, CustomPage, FieldConfig } from '../../types';
import Spinner from '../Spinner';
import ContentFormModal from '../ContentFormModal';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const PagesView: React.FC = () => {
    const { t } = useLanguage();
    const { content, addItem, updateItem, deleteItem, loading: contentLoading } = useContent();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fields: FieldConfig[] = [
        { name: 'title', label: t('titleEn'), type: 'text', lang: 'en' },
        { name: 'title', label: t('titleFa'), type: 'text', lang: 'fa' },
        { name: 'slug', label: t('slug'), type: 'text' },
        { name: 'content', label: t('contentEn'), type: 'textarea', lang: 'en' },
        { name: 'content', label: t('contentFa'), type: 'textarea', lang: 'fa' },
        { name: 'status', label: t('status'), type: 'select', options: [{ value: 'published', label: t('published') }, { value: 'draft', label: t('draft') }] },
    ];

    const handleOpenModal = (item: any = null) => {
        setItemToEdit(item);
        setIsModalOpen(true);
    };

    const handleSave = async (data: any) => {
        setIsLoading(true);
        try {
            if (itemToEdit) {
                await updateItem('pages', itemToEdit.id, data);
            } else {
                await addItem('pages', data);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Failed to save page", error);
            alert("Failed to save page.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (itemId: number) => {
        if (window.confirm(t('confirmDelete'))) {
            await deleteItem('pages', itemId);
        }
    };
    
    if (contentLoading) {
        return <div className="flex justify-center items-center h-64"><Spinner size="12" /></div>;
    }

    return (
        <div className="bg-black-gradient p-6 rounded-[20px] box-shadow">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-white">{t('pages')}</h2>
                <button onClick={() => handleOpenModal()} className="py-2 px-4 bg-blue-gradient text-primary font-bold rounded-md flex items-center gap-2">
                    <Plus size={16}/> {t('addNewPage')}
                </button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700/20">
                        <tr>
                            <th className="px-6 py-3">{t('titleEn')}</th>
                            <th className="px-6 py-3">{t('slug')}</th>
                            <th className="px-6 py-3">{t('status')}</th>
                            <th className="px-6 py-3">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {content.pages.map((page: CustomPage) => (
                            <tr key={page.id} className="border-b border-gray-700 hover:bg-gray-800/50">
                                <td className="px-6 py-4 font-medium text-white">{page.title.en}</td>
                                <td className="px-6 py-4 font-mono text-sm">/{page.slug}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${page.status === 'published' ? 'bg-green-800 text-green-300' : 'bg-yellow-800 text-yellow-300'}`}>
                                        {t(page.status)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 flex items-center gap-2">
                                     <Link to={`/p/${page.slug}`} target="_blank" className="p-2 text-dimWhite hover:text-secondary"><Eye size={16}/></Link>
                                     <button onClick={() => handleOpenModal(page)} className="p-2 text-dimWhite hover:text-secondary"><Edit size={16}/></button>
                                     <button onClick={() => handleDelete(page.id)} className="p-2 text-dimWhite hover:text-red-500"><Trash2 size={16}/></button>
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
                    title={itemToEdit ? t('edit') : t('addNewPage')}
                    isLoading={isLoading}
                />
            )}
        </div>
    );
};

export default PagesView;
