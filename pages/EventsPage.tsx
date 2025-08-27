import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { Event } from '../types';
import { useContent } from '../hooks/useContent';
import BilingualDateDisplay from '../components/BilingualDateDisplay';

const EventCard: React.FC<{ event: Event }> = ({ event }) => {
  const { lang } = useLanguage();
  return (
    <div className="bg-black-gradient rounded-[20px] box-shadow overflow-hidden flex flex-col md:flex-row interactive-card interactive-card-glow">
      <div className="w-full md:w-1/3 h-56 md:h-auto image-container">
        <img src={event.imageUrl} alt="" className="image-background" aria-hidden="true" />
        <img src={event.imageUrl} alt={event.title[lang]} className="image-foreground" />
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="font-semibold text-2xl text-white">{event.title[lang]}</h3>
        <p className="text-dimWhite my-4 flex-grow">{event.description[lang]}</p>
        <div className="mt-auto">
            <BilingualDateDisplay dateStr={event.date} />
        </div>
      </div>
    </div>
  );
};

const EventsPage: React.FC = () => {
  const { t } = useLanguage();
  const { content } = useContent();
  const eventsData = content.events;
  return (
    <div className="space-y-8 sm:px-16 px-6 sm:py-12 py-4">
      <div className="text-center mb-12 reveal-on-scroll">
        <h1 className="font-semibold text-4xl md:text-5xl text-white mb-2">{t('eventsTitle')}</h1>
        <p className="font-normal text-dimWhite text-lg max-w-3xl mx-auto">{t('eventsDescription')}</p>
      </div>
      <div className="max-w-5xl mx-auto space-y-8">
        {eventsData.map((event, index) => (
          <div key={event.id} className="reveal-on-scroll" style={{transitionDelay: `${index * 150}ms`}}>
            <EventCard event={event} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventsPage;