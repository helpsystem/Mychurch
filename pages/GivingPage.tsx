
import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { Gift } from 'lucide-react';

const GivingPage: React.FC = () => {
  const { t } = useLanguage();

  const handleGiveClick = () => {
    alert(t('givingUnavailableMessage'));
  };

  return (
    <div className="sm:px-16 px-6 sm:py-12 py-4 max-w-4xl mx-auto text-center">
      <h1 className="font-semibold text-4xl md:text-5xl text-white mb-4">{t('givingTitle')}</h1>
      
      <div className="bg-black-gradient rounded-[20px] box-shadow p-8 my-8">
        <blockquote className="text-xl italic text-dimWhite border-s-4 border-secondary ps-4 rtl:border-e-4 rtl:ps-0 rtl:pe-4">
          <p>{t('givingVerse')}</p>
        </blockquote>
      </div>

      <p className="font-normal text-dimWhite text-lg mb-8 leading-relaxed">
        {t('givingDescription')}
      </p>

      <div className="bg-gray-gradient p-8 rounded-[20px] border border-gray-700">
        <h2 className="font-semibold text-2xl text-white mb-4">{t('giveOnline')}</h2>
        <p className="text-dimWhite mb-6">You can securely give online through our trusted partner.</p>
        <button 
          onClick={handleGiveClick}
          className="py-4 px-8 font-medium text-[18px] text-primary bg-blue-gradient rounded-[10px] outline-none inline-flex items-center gap-2"
        >
          <Gift size={20} />
          {t('giveOnline')}
        </button>
      </div>
    </div>
  );
};

export default GivingPage;
