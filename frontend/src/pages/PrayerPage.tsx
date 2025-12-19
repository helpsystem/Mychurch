import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useContent } from '../hooks/useContent';
import PrayerRequestForm from '../components/PrayerRequestForm';
import PrayerWall from '../components/PrayerWall';
import Spinner from '../components/Spinner';

const PrayerPage: React.FC = () => {
  const { t } = useLanguage();
  const { content, loading } = useContent();

  return (
    <div className="max-w-5xl mx-auto space-y-12 sm:px-16 px-6 sm:py-12 py-4">
      <div className="text-center">
        <h1 className="font-semibold text-4xl text-white mb-2">{t('prayerTitle')}</h1>
        <p className="font-normal text-dimWhite text-lg">{t('prayerDescription')}</p>
      </div>
      <PrayerRequestForm />
      
      <div className="mt-12">
        {loading ? (
            <div className="flex justify-center"><Spinner /></div>
        ) : (
            <PrayerWall prayerRequests={content.prayerRequests} />
        )}
      </div>
    </div>
  );
};

export default PrayerPage;