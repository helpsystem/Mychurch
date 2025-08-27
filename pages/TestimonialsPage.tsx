import React, { useState, useMemo } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useContent } from '../hooks/useContent';
import { Testimonial } from '../types';
import Spinner from '../components/Spinner';
import { Quote, Send } from 'lucide-react';
import { DEFAULT_AVATAR_URL } from '../lib/constants';

const TestimonialCard: React.FC<{ testimonial: Testimonial }> = ({ testimonial }) => {
    const { lang } = useLanguage();
    return (
        <div className="flex flex-col p-8 rounded-[20px] bg-primary border border-gray-800 feature-card break-inside-avoid-column mb-6">
            <Quote className="w-10 h-10 object-contain text-secondary mb-4" />
            <p className="font-normal text-dimWhite my-4 flex-grow">
                {testimonial.text[lang]}
            </p>
            <div className="flex flex-row items-center mt-4">
                <img src={DEFAULT_AVATAR_URL} alt={testimonial.authorName} className="w-12 h-12 rounded-full" />
                <div className="flex flex-col ml-4 rtl:mr-4 rtl:ml-0">
                    <h4 className="font-semibold text-white">{testimonial.isAnonymous ? 'Anonymous' : testimonial.authorName}</h4>
                </div>
            </div>
        </div>
    );
};

const TestimonialsPage: React.FC = () => {
    const { t, lang } = useLanguage();
    const { content, addItem } = useContent();
    const [authorName, setAuthorName] = useState('');
    const [text, setText] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const approvedTestimonials = useMemo(() => {
        return content.testimonials.filter(t => t.status === 'approved');
    }, [content.testimonials]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || (!isAnonymous && !authorName.trim())) {
            setStatus({ message: 'Please fill out all required fields.', type: 'error' });
            return;
        }
        setIsLoading(true);
        setStatus(null);
        try {
            const newTestimonial: Omit<Testimonial, 'id'> = {
                authorName: isAnonymous ? 'Anonymous' : authorName,
                text: {
                    en: lang === 'en' ? text : '',
                    fa: lang === 'fa' ? text : '',
                },
                isAnonymous,
                status: 'pending',
                createdAt: new Date().toISOString()
            };
            await addItem('testimonials', newTestimonial);
            setStatus({ message: t('testimonialSuccess'), type: 'success' });
            setAuthorName('');
            setText('');
            setIsAnonymous(false);
        } catch (error) {
            console.error(error);
            setStatus({ message: 'An error occurred. Please try again.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="sm:px-16 px-6 sm:py-12 py-4 max-w-5xl mx-auto">
            <div className="text-center mb-12">
                <h1 className="font-semibold text-4xl md:text-5xl text-white mb-2 text-gradient">{t('testimonialsPageTitle')}</h1>
                <p className="font-normal text-dimWhite text-lg">{t('testimonialsPageDescription')}</p>
            </div>
            
            <div className="bg-black-gradient p-8 rounded-[20px] box-shadow mb-12">
                <h2 className="text-2xl font-semibold text-white mb-4">{t('submitTestimonial')}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-dimWhite mb-1">{t('name')}</label>
                        <input type="text" id="name" value={authorName} onChange={e => setAuthorName(e.target.value)} disabled={isAnonymous} className="w-full p-2 border border-gray-600 bg-primary rounded-md focus:outline-none focus:ring-2 focus:ring-secondary text-white disabled:bg-gray-800" />
                    </div>
                    <div>
                        <label htmlFor="story" className="block text-sm font-medium text-dimWhite mb-1">{t('yourStory')}</label>
                        <textarea id="story" rows={5} value={text} onChange={e => setText(e.target.value)} required className="w-full p-2 border border-gray-600 bg-primary rounded-md focus:outline-none focus:ring-2 focus:ring-secondary text-white" />
                    </div>
                     <div className="flex items-center">
                        <input id="anonymous" type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary" />
                        <label htmlFor="anonymous" className="ml-2 rtl:mr-2 rtl:ml-0 block text-sm text-dimWhite">{t('postAnonymously')}</label>
                      </div>
                      {status && (
                        <div className={`p-3 text-center rounded-lg border ${status.type === 'success' ? 'text-green-300 bg-green-900/50 border-green-500/50' : 'text-red-300 bg-red-900/50 border-red-500/50'}`}>{status.message}</div>
                      )}
                    <button type="submit" disabled={isLoading} className="w-full py-3 px-4 bg-blue-gradient text-primary font-bold rounded-md flex items-center justify-center gap-2 disabled:opacity-50">
                        {isLoading ? <Spinner /> : <><Send size={18}/> {t('submitTestimonial')}</>}
                    </button>
                </form>
            </div>

            <div className="column-count-1 md:column-count-2 lg:column-count-3 gap-6">
                {approvedTestimonials.map(testimonial => (
                    <TestimonialCard key={testimonial.id} testimonial={testimonial} />
                ))}
            </div>
        </div>
    );
};

export default TestimonialsPage;