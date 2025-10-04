import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useContent } from '../hooks/useContent';
import { ScheduleEvent } from '../types';
import { downloadIcsFile } from '../lib/calendar';
import { Download } from 'lucide-react';
import BilingualDateDisplay from './BilingualDateDisplay';
import ScheduleCard from './ScheduleCard';

const WeeklySchedule: React.FC = () => {
    const { t } = useLanguage();
    const { content } = useContent();
    
    const upcomingEvents = content.scheduleEvents
        .filter(event => new Date(event.date) >= new Date(new Date().toDateString())) // From today
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5); // Show next 5

    if (upcomingEvents.length === 0) {
        return null;
    }

    return (
        <section className="sm:py-16 py-6">
            <h2 className="font-semibold xs:text-[48px] text-[40px] text-white xs:leading-[76.8px] leading-[66.8px] w-full text-center mb-8">
                {t('scheduleTitle')}
            </h2>
            <div className="space-y-4 max-w-4xl mx-auto">
                {upcomingEvents.map(event => <ScheduleCard key={event.id} event={event} />)}
            </div>
        </section>
    );
};

export default WeeklySchedule;