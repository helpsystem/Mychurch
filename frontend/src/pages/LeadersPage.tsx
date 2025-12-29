
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { Leader } from '../types';
import { useContent } from '../hooks/useContent';
import { Phone, AlertTriangle, RefreshCw } from 'lucide-react';
import Spinner from '../components/Spinner';

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
          <img src={leader.imageUrl || '/images/church-logo.png'} alt="" className="image-background" aria-hidden="true" />
          <img src={leader.imageUrl || '/images/church-logo.png'} alt={leader.name?.[lang] || leader.name} className="image-foreground" />
        </div>
        <div className="p-6 flex flex-col flex-grow">
          <h3 className="text-2xl font-semibold text-white">{leader.name[lang]}</h3>
          <p className="text-dimWhite mt-1">{leader.title[lang]}</p>
          <div className="flex-grow my-4 flex justify-between items-start gap-4">
            <p className={`text-dimWhite flex-grow ${lang === 'fa' ? 'text-right' : 'text-left'}`}>{leader.bio[lang]}</p>
            {leader.whatsappNumber && (
              <a
                href={getWhatsAppUrl(leader.whatsappNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 p-2 text-green-400 hover:text-green-300 bg-green-900/50 rounded-full transition-colors"
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
  const { t, lang } = useLanguage();
  const { content, loading } = useContent();
  const [error, setError] = useState<string | null>(null);
  const leadersData = content.leaders;

  useEffect(() => {
    // Check for errors when content finishes loading
    if (!loading && (!Array.isArray(leadersData) || leadersData.length === 0)) {
      // This is not necessarily an error, just no data
      setError(null);
    }
  }, [loading, leadersData]);

  // Loading state
  if (loading) {
    return (
      <div className="sm:px-16 px-6 sm:py-12 py-4 flex justify-center items-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="sm:px-16 px-6 sm:py-12 py-4">
        <div className="max-w-md mx-auto text-center bg-red-900/20 border border-red-500/50 rounded-lg p-8">
          <AlertTriangle className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-2xl font-bold text-white mb-2">
            {lang === 'fa' ? 'خطا در بارگذاری' : 'Error Loading'}
          </h2>
          <p className="text-dimWhite mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw size={18} />
            {lang === 'fa' ? 'تلاش مجدد' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sm:px-16 px-6 sm:py-12 py-4">
      <div className="text-center mb-12">
        <h1 className="font-semibold text-4xl md:text-5xl text-white mb-2 leading-tight">
          {t('meetOurLeaders')}
        </h1>
        <p className="font-normal text-dimWhite text-lg max-w-2xl mx-auto">{t('welcomeMessage')}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {Array.isArray(leadersData) && leadersData.length > 0 ? (
          leadersData.map(leader => (
            <LeaderCard key={leader.id} leader={leader} />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-dimWhite text-lg">
              {lang === 'fa' ? 'هنوز رهبری اضافه نشده است.' : 'No leaders available yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadersPage;
