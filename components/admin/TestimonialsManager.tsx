import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useContent } from '../../hooks/useContent';
import { Testimonial } from '../../types';
import { Check, Trash2, X } from 'lucide-react';
import Spinner from '../Spinner';

const TestimonialsManager: React.FC = () => {
    const { t, lang } = useLanguage();
    const { content, updateItem, deleteItem, loading } = useContent();
    const [isSaving, setIsSaving] = useState<number | null>(null);

    const { pending, approved } = useMemo(() => {
        const pending: Testimonial[] = [];
        const approved: Testimonial[] = [];
        content.testimonials.forEach(t => {
            if (t.status === 'pending') pending.push(t);
            else approved.push(t);
        });
        return { pending, approved };
    }, [content.testimonials]);

    const handleApprove = async (testimonial: Testimonial) => {
        setIsSaving(testimonial.id);
        await updateItem('testimonials', testimonial.id, { ...testimonial, status: 'approved' });
        setIsSaving(null);
    };

    const handleUnapprove = async (testimonial: Testimonial) => {
        setIsSaving(testimonial.id);
        await updateItem('testimonials', testimonial.id, { ...testimonial, status: 'pending' });
        setIsSaving(null);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm(t('confirmDelete'))) {
            setIsSaving(id);
            await deleteItem('testimonials', id);
            setIsSaving(null);
        }
    };

    const renderTestimonialCard = (testimonial: Testimonial, isApproved: boolean) => (
        <div key={testimonial.id} className="bg-primary p-4 rounded-lg border border-gray-700 flex flex-col justify-between">
            <div>
                <p className="text-sm text-dimWhite italic">"{testimonial.text[lang] || testimonial.text[lang === 'en' ? 'fa' : 'en']}"</p>
                <p className="text-xs text-gray-500 mt-2">- {testimonial.isAnonymous ? 'Anonymous' : testimonial.authorName}</p>
            </div>
            <div className="flex justify-end items-center gap-2 mt-4 pt-2 border-t border-gray-800">
                {isSaving === testimonial.id ? <Spinner size="5" /> : (
                    <>
                        {isApproved ? (
                            <button onClick={() => handleUnapprove(testimonial)} className="p-2 text-yellow-400 hover:text-yellow-300" title="Move to Pending"><X size={16}/></button>
                        ) : (
                            <button onClick={() => handleApprove(testimonial)} className="p-2 text-green-400 hover:text-green-300" title={t('approve')}><Check size={16}/></button>
                        )}
                        <button onClick={() => handleDelete(testimonial.id)} className="p-2 text-red-500 hover:text-red-400" title={t('delete')}><Trash2 size={16}/></button>
                    </>
                )}
            </div>
        </div>
    );

    if (loading) return <div className="flex justify-center"><Spinner size="10"/></div>

    return (
        <div className="bg-black-gradient p-6 rounded-[20px] box-shadow">
            <h2 className="text-2xl font-semibold text-white mb-6">{t('manageTestimonials')}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-xl font-bold text-gradient mb-4">{t('pending')} ({pending.length})</h3>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {pending.length > 0 ? pending.map(t => renderTestimonialCard(t, false)) : <p className="text-gray-500">{t('noNewMessages')}</p>}
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gradient mb-4">{t('approved')} ({approved.length})</h3>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {approved.length > 0 ? approved.map(t => renderTestimonialCard(t, true)) : <p className="text-gray-500">{t('noNewMessages')}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestimonialsManager;