import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useContent } from '../../hooks/useContent';
import { Testimonial } from '../../types';
import { Check, Trash2, X, RefreshCw, AlertCircle, MessageCircle } from 'lucide-react';
import Spinner from '../Spinner';

const TestimonialsManager: React.FC = () => {
    const { t, lang } = useLanguage();
    const { content, updateItem, deleteItem, loading, refreshContent } = useContent();
    const [isSaving, setIsSaving] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { pending, approved } = useMemo(() => {
        const pending: Testimonial[] = [];
        const approved: Testimonial[] = [];
        const testimonials = content?.testimonials || [];
        
        testimonials.forEach((item: Testimonial) => {
            if (item.status === 'pending') pending.push(item);
            else approved.push(item);
        });
        return { pending, approved };
    }, [content?.testimonials]);

    const handleApprove = async (testimonial: Testimonial) => {
        setIsSaving(testimonial.id);
        setError(null);
        try {
            await updateItem('testimonials', testimonial.id, { ...testimonial, status: 'approved' });
        } catch (err: any) {
            setError(err.message || 'Failed to approve testimonial');
        } finally {
            setIsSaving(null);
        }
    };

    const handleUnapprove = async (testimonial: Testimonial) => {
        setIsSaving(testimonial.id);
        setError(null);
        try {
            await updateItem('testimonials', testimonial.id, { ...testimonial, status: 'pending' });
        } catch (err: any) {
            setError(err.message || 'Failed to update testimonial');
        } finally {
            setIsSaving(null);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm(t('confirmDelete') || 'Are you sure you want to delete?')) {
            setIsSaving(id);
            setError(null);
            try {
                await deleteItem('testimonials', id);
            } catch (err: any) {
                setError(err.message || 'Failed to delete testimonial');
            } finally {
                setIsSaving(null);
            }
        }
    };

    const renderTestimonialCard = (testimonial: Testimonial, isApproved: boolean) => (
        <div key={testimonial.id} className="bg-primary p-4 rounded-lg border border-gray-700 flex flex-col justify-between">
            <div>
                <p className="text-sm text-dimWhite italic">
                    "{testimonial.text?.[lang] || testimonial.text?.[lang === 'en' ? 'fa' : 'en'] || 'No content'}"
                </p>
                <p className="text-xs text-gray-500 mt-2">
                    - {testimonial.isAnonymous ? (lang === 'fa' ? 'ناشناس' : 'Anonymous') : (testimonial.authorName || 'Unknown')}
                </p>
            </div>
            <div className="flex justify-end items-center gap-2 mt-4 pt-2 border-t border-gray-800">
                {isSaving === testimonial.id ? <Spinner size="5" /> : (
                    <>
                        {isApproved ? (
                            <button onClick={() => handleUnapprove(testimonial)} className="p-2 text-yellow-400 hover:text-yellow-300" title={lang === 'fa' ? 'بازگشت به در انتظار' : 'Move to Pending'}><X size={16}/></button>
                        ) : (
                            <button onClick={() => handleApprove(testimonial)} className="p-2 text-green-400 hover:text-green-300" title={t('approve') || 'Approve'}><Check size={16}/></button>
                        )}
                        <button onClick={() => handleDelete(testimonial.id)} className="p-2 text-red-500 hover:text-red-400" title={t('delete') || 'Delete'}><Trash2 size={16}/></button>
                    </>
                )}
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="bg-black-gradient p-6 rounded-[20px] box-shadow">
                <div className="flex justify-center py-12">
                    <Spinner size="10"/>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-black-gradient p-6 rounded-[20px] box-shadow">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                    <MessageCircle size={24} />
                    {t('manageTestimonials') || 'Testimonials'}
                </h2>
                {refreshContent && (
                    <button 
                        onClick={refreshContent}
                        className="p-2 bg-gray-700 rounded-md hover:bg-gray-600"
                        title={lang === 'fa' ? 'بروزرسانی' : 'Refresh'}
                    >
                        <RefreshCw size={16} className="text-white" />
                    </button>
                )}
            </div>
            
            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-900/50 border border-red-500/50 text-red-300 flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-xl font-bold text-gradient mb-4">
                        {t('pending') || 'Pending'} ({pending.length})
                    </h3>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {pending.length > 0 ? pending.map(item => renderTestimonialCard(item, false)) : (
                            <p className="text-gray-500 text-center py-4">
                                {lang === 'fa' ? 'هیچ شهادت جدیدی در انتظار نیست' : 'No pending testimonials'}
                            </p>
                        )}
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gradient mb-4">
                        {t('approved') || 'Approved'} ({approved.length})
                    </h3>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {approved.length > 0 ? approved.map(item => renderTestimonialCard(item, true)) : (
                            <p className="text-gray-500 text-center py-4">
                                {lang === 'fa' ? 'هیچ شهادت تایید شده‌ای وجود ندارد' : 'No approved testimonials'}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestimonialsManager;