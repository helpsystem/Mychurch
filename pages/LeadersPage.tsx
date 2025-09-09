
import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { Leader } from '../types';
import { useContent } from '../hooks/useContent';
import { Phone } from 'lucide-react';

const LeaderCard: React.FC<{ leader: Leader }> = ({ leader }) => {
  const { lang, t } = useLanguage();

  const getWhatsAppUrl = (number: string) => {
      const sanitizedPhone = number.replace(/[^0-9+]/g, '');
      const text = t('whatsappMessage');
      return `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(text)}`;
  }

  return (
    <div className="bg-black-gradient rounded-[20px] box-shadow overflow-hidden text-center transition-all duration-300 hover:-translate-y-1 p-1 interactive-card interactive-card-glow">
      <div className="bg-primary rounded-[18px] h-full flex flex-col">
        <div className="w-full h-72 image-container rounded-t-[18px]">
          <img src={leader.imageUrl} alt="" className="image-background" aria-hidden="true" />
          <img src={leader.imageUrl} alt={leader.name[lang]} className="image-foreground" />
        </div>
        <div className="p-6 flex flex-col flex-grow">
          <h3 className="text-2xl font-semibold text-white">{leader.name[lang]}</h3>
          <p className="text-dimWhite mt-1">{leader.title[lang]}</p>
          <div className="flex-grow my-4 flex justify-between items-start gap-4">
            <p className="text-dimWhite text-left flex-grow">{leader.bio[lang]}</p>
            {leader.whatsappNumber && (
              <a 
                href={getWhatsAppUrl(leader.whatsappNumber)} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex-shrink-0 p-2 text-green-400 hover:text-green-300 bg-green-900/50 rounded-full"
                title={t('connectOnWhatsApp')}
              >
                <Phone size={20} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const LeadersPage: React.FC = () => {
  const { t } = useLanguage();
  const { content } = useContent();
  const leadersData = content.leaders;

  return (
    <div className="sm:px-16 px-6 sm:py-12 py-4">
      <div className="text-center mb-12">
        <h1 className="font-semibold text-4xl md:text-5xl text-white mb-2 leading-tight">
          {t('meetOurLeaders')}
        </h1>
        <p className="font-normal text-dimWhite text-lg max-w-2xl mx-auto">{t('welcomeMessage')}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {leadersData.map(leader => (
          <LeaderCard key={leader.id} leader={leader} />
        ))}
      </div>
    </div>
  );
};

export default LeadersPage;
