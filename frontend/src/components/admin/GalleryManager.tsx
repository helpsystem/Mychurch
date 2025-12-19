

import React, { useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useContent } from '../../hooks/useContent';
import { Gallery, ImageItem, FieldConfig } from '../../types';
import { Plus, Edit, Trash2, ImageUp, ArrowLeft } from 'lucide-react';
import ContentFormModal from '../ContentFormModal';
import Spinner from '../Spinner';
import ImagePickerModal from '../ImagePickerModal';

const GalleryManager: React.FC = () => {
    const { t } = useLanguage();
    const { content, addItem, updateItem, deleteItem, loading: contentLoading } = useContent();
    const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
    const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<any | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    const galleryFields: FieldConfig[] = [
        { name: 'title', label: t('titleEn'), type: 'text', lang: 'en' },
        { name: 'title', label: t('titleFa'), type: 'text', lang: 'fa' },
        { name: 'description', label: 'Description (EN)', type: 'textarea', lang: 'en' },
        { name: 'description', label: 'Description (FA)', type: 'textarea', lang: 'fa' },
    ];
    
     const imageFields: FieldConfig[] = [
        { name: 'url', label: t('imageUrl'), type: 'text' },
        { name: 'caption', label: t('captionEn'), type: 'text', lang: 'en' },
        { name: 'caption', label: t('captionFa'), type: 'text', lang: 'fa' },
    ];
    
    const handleOpenGalleryModal = (gallery: Gallery | null = null) => {
        setItemToEdit(gallery);
        setIsGalleryModalOpen(true);
    };

    const handleOpenImageModal = (image: ImageItem | null = null) => {
        setItemToEdit(image);
        setIsImageModalOpen(true);
    };

    const handleSaveGallery = async (data: any) => {
        setIsSaving(true);
        try {
            if (itemToEdit) {
                await updateItem('galleries', itemToEdit.id, data);
            } else {
                await addItem('galleries', {...data, images: []});
            }
            setIsGalleryModalOpen(false);
        } catch (error) {
             console.error("Failed to save gallery", error);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleSaveImage = async (data: Partial<ImageItem>) => {
        if (!selectedGallery) return;
        setIsSaving(true);
        try {
            let updatedImages;
            if (itemToEdit) { // Editing existing image
                updatedImages = selectedGallery.images.map(img => img.id === itemToEdit.id ? { ...img, ...data } : img);
            } else { // Adding new image
                const newImage = { id: Date.now(), ...data } as ImageItem;
                updatedImages = [...selectedGallery.images, newImage];
            }
            const updatedGallery = await updateItem('galleries', selectedGallery.id, { ...selectedGallery, images: updatedImages });
            setSelectedGallery(updatedGallery as Gallery);
            setIsImageModalOpen(false);
        } catch (error) {
            console.error("Failed to save image", error);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDeleteGallery = async (galleryId: number) => {
        if (window.confirm(t('confirmDelete'))) {
            await deleteItem('galleries', galleryId);
        }
    };

    const handleDeleteImage = async (imageId: number) => {
         if (!selectedGallery || !window.confirm(t('confirmDelete'))) return;
         const updatedImages = selectedGallery.images.filter(img => img.id !== imageId);
         const updatedGallery = await updateItem('galleries', selectedGallery.id, { ...selectedGallery, images: updatedImages });
         setSelectedGallery(updatedGallery as Gallery);
    };

    if (contentLoading) {
        return <div className="flex justify-center items-center h-64"><Spinner size="12" /></div>;
    }
    
    if (selectedGallery) {
        return (
            <div className="bg-black-gradient p-6 rounded-[20px] box-shadow">
                <button onClick={() => setSelectedGallery(null)} className="flex items-center gap-2 text-dimWhite hover:text-white mb-4">
                    <ArrowLeft size={18} /> {t('backToGalleries')}
                </button>
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-white">{selectedGallery.title[t('lang') as 'en'|'fa']}</h2>
                     <button onClick={() => handleOpenImageModal(null)} className="py-2 px-4 bg-blue-gradient text-primary font-bold rounded-md flex items-center gap-2">
                        <ImageUp size={16}/> {t('addImage')}
                    </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                     {selectedGallery.images.map(image => (
                        <div key={image.id} className="relative group bg-primary rounded-lg border border-gray-700 p-2">
                            <img src={image.url} alt={image.caption.en} className="w-full h-40 object-cover rounded-md"/>
                             <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                <p className="text-white text-xs">{image.caption[t('lang') as 'en'|'fa']}</p>
                                <div className="self-end">
                                    <button onClick={() => handleOpenImageModal(image)} className="p-1 text-white hover:text-secondary"><Edit size={16}/></button>
                                    <button onClick={() => handleDeleteImage(image.id)} className="p-1 text-white hover:text-red-500"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {isImageModalOpen && (
                    <ContentFormModal
                        isOpen={isImageModalOpen}
                        onClose={() => setIsImageModalOpen(false)}
                        onSave={handleSaveImage}
                        itemToEdit={itemToEdit}
                        fields={imageFields}
                        title={itemToEdit ? t('edit') : t('addImage')}
                        isLoading={isSaving}
                    />
                )}
            </div>
        )
    }

    return (
        <div className="bg-black-gradient p-6 rounded-[20px] box-shadow">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-white">{t('manageGalleries')}</h2>
                <button onClick={() => handleOpenGalleryModal()} className="py-2 px-4 bg-blue-gradient text-primary font-bold rounded-md flex items-center gap-2">
                    <Plus size={16}/> {t('addNewGallery')}
                </button>
            </div>
            <div className="space-y-4">
                {content.galleries.map(gallery => (
                    <div key={gallery.id} className="bg-primary p-4 rounded-lg border border-gray-700 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-white text-lg">{gallery.title[t('lang') as 'en'|'fa']}</h3>
                            <p className="text-sm text-dimWhite">{gallery.images.length} images</p>
                        </div>
                        <div className="flex gap-2">
                             <button onClick={() => setSelectedGallery(gallery)} className="py-2 px-3 text-sm bg-gray-700 text-white rounded-md hover:bg-gray-600">{t('manageImages')}</button>
                             <button onClick={() => handleOpenGalleryModal(gallery)} className="p-2 text-dimWhite hover:text-secondary"><Edit size={16}/></button>
                             <button onClick={() => handleDeleteGallery(gallery.id)} className="p-2 text-dimWhite hover:text-red-500"><Trash2 size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>
            {isGalleryModalOpen && (
                <ContentFormModal
                    isOpen={isGalleryModalOpen}
                    onClose={() => setIsGalleryModalOpen(false)}
                    onSave={handleSaveGallery}
                    itemToEdit={itemToEdit}
                    fields={galleryFields}
                    title={itemToEdit ? t('edit') : t('addNewGallery')}
                    isLoading={isSaving}
                />
            )}
        </div>
    );
};

export default GalleryManager;