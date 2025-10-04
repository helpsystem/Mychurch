import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { ScheduleEvent } from '../types';
import { downloadIcsFile } from '../lib/calendar';
import { Download } from 'lucide-react';
import BilingualDateDisplay from './BilingualDateDisplay';

const ScheduleCard: React.FC<{ event: ScheduleEvent }> = ({ event }) => {
    const { lang, t } = useLanguage();

    const locationIsUrl = event.location.startsWith('http');

    return (
        <div className="flex flex-col sm:flex-row gap-6 bg-primary p-6 rounded-lg border border-gray-800 feature-card items-center">
            {/* Left side: Add to Calendar button */}
            <div className="flex-shrink-0">
                 <button
                    onClick={() => downloadIcsFile(event, lang)}
                    className="py-3 px-5 font-medium text-[16px] text-primary bg-blue-gradient rounded-[10px] outline-none flex items-center gap-2"
                >
                    <Download size={18} /> {t('addToCalendar')}
                </button>
            </div>

            {/* Middle: Details */}
            <div className="flex-grow text-center sm:text-left rtl:sm:text-right">
                <h4 className="font-semibold text-xl text-white">{event.title[lang]}</h4>
                <p className="text-sm text-dimWhite mt-2">{event.description[lang]}</p>
                <div className="text-sm text-dimWhite mt-2">
                    {locationIsUrl ? (
                        <a href={event.location} target="_blank" rel="noopener noreferrer" className="hover:text-secondary">{event.location}</a>
                    ) : (
                        <span>{event.location}</span>
                    )}
                </div>
            </div>
            
            <div className="w-px bg-gray-700 hidden sm:block"></div>

            {/* Right side: Calendar widget */}
            <div className="flex-shrink-0 text-center w-40">
                <BilingualDateDisplay 
                    dateStr={event.date}
                    timeRange={`${event.startTime} - ${event.endTime}`}
                />
            </div>
        </div>
    );
};

export default ScheduleCard;
