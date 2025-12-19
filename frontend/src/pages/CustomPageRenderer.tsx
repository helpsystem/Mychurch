import React from 'react';
import { useParams } from 'react-router-dom';
import { useContent } from '../hooks/useContent';
import { useLanguage } from '../hooks/useLanguage';
import NotFoundPage from './NotFoundPage';
import PrayerRequestForm from '../components/PrayerRequestForm';
import WeeklySchedule from '../components/WeeklySchedule';

const CustomPageRenderer: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const { content } = useContent();
    const { lang } = useLanguage();

    const page = content.pages.find(p => p.slug === slug && p.status === 'published');

    if (!page) {
        return <NotFoundPage />;
    }

    const renderContent = () => {
        const pageContent = page.content[lang] || '';
        const parts = pageContent.split(/(\[PRAYER_FORM\]|\[WEEKLY_SCHEDULE\])/g).filter(Boolean);

        return parts.map((part, index) => {
            if (part === '[PRAYER_FORM]') {
                return <PrayerRequestForm key={index} />;
            }
            if (part === '[WEEKLY_SCHEDULE]') {
                return <div key={index}><WeeklySchedule /></div>;
            }
            return <div key={index} dangerouslySetInnerHTML={{ __html: part }} />;
        });
    };

    return (
        <div className="sm:px-16 px-6 sm:py-12 py-4 max-w-4xl mx-auto">
            <article>
                <h1 className="font-semibold text-4xl md:text-5xl text-white mb-8 text-center text-gradient">
                    {page.title[lang]}
                </h1>
                <div 
                    className="prose prose-lg max-w-none text-dimWhite"
                >
                    {renderContent()}
                </div>
            </article>
        </div>
    );
};

export default CustomPageRenderer;