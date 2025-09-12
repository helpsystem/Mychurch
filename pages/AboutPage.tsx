import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { BookOpen, Target, ShieldCheck, HeartHandshake } from 'lucide-react';
import { getRandomImage } from '../lib/theme';
import SEOHead from '../components/SEO/SEOHead';
import { getPageSEOConfig } from '../lib/seoConfig';

const BeliefCard: React.FC<{ icon: React.ReactNode; title: string; text: string }> = ({ icon, title, text }) => (
  <div className="flex flex-row p-6 rounded-[20px] feature-card interactive-card-glow">
    <div className="w-[64px] h-[64px] rounded-full flex justify-center items-center bg-dimBlue">
      {icon}
    </div>
    <div className="flex-1 flex flex-col ml-3 rtl:mr-3 rtl:ml-0">
      <h3 className="font-semibold text-white text-[18px] leading-[23px] mb-1">{title}</h3>
      <p className="font-normal text-dimWhite text-[16px] leading-[24px]">{text}</p>
    </div>
  </div>
);

const AboutPage: React.FC = () => {
  const { t, lang } = useLanguage();
  const [storyImage, setStoryImage] = useState('');
  const [missionImage, setMissionImage] = useState('');
  
  // Get SEO configuration for about page
  const seoConfig = getPageSEOConfig('about', lang);

  useEffect(() => {
    setStoryImage(getRandomImage());
    setMissionImage(getRandomImage());
  }, []);

  const beliefs = [
    { icon: <BookOpen size={32} className="text-secondary" />, title: t('beliefBible'), text: t('beliefBibleText') },
    { icon: <HeartHandshake size={32} className="text-secondary" />, title: t('beliefTrinity'), text: t('beliefTrinityText') },
    { icon: <ShieldCheck size={32} className="text-secondary" />, title: t('beliefJesus'), text: t('beliefJesusText') },
    { icon: <Target size={32} className="text-secondary" />, title: t('beliefSalvation'), text: t('beliefSalvationText') },
  ];

  return (
    <>
      <SEOHead {...seoConfig} />
      <div className="sm:px-16 px-6 sm:py-12 py-4">
      <div className="text-center mb-16 reveal-on-scroll">
        <h1 className="font-semibold text-4xl md:text-5xl text-white mb-2 leading-tight">
          {t('navAbout')} <span className="text-gradient">{t('churchTitle')}</span>
        </h1>
        <p className="font-normal text-dimWhite text-lg max-w-2xl mx-auto">{t('welcomeMessage')}</p>
      </div>

      <div className="flex md:flex-row flex-col-reverse gap-12 items-center mb-16 reveal-on-scroll">
        <div className="flex-1 space-y-4">
          <h2 className="font-semibold text-3xl text-white">{t('ourStory')}</h2>
          <p className="font-normal text-dimWhite leading-relaxed">{t('ourStoryText')}</p>
        </div>
        <div className="flex-1">
          <div className="w-full h-80 image-container rounded-xl shadow-lg">
              <img src={storyImage} alt="" className="image-background" aria-hidden="true" />
              <img src={storyImage} alt="Church community" className="image-foreground" />
          </div>
        </div>
      </div>

      <div className="flex md:flex-row flex-col gap-12 items-center mb-16 reveal-on-scroll">
        <div className="flex-1">
          <div className="w-full h-80 image-container rounded-xl shadow-lg">
              <img src={missionImage} alt="" className="image-background" aria-hidden="true" />
              <img src={missionImage} alt="Church mission" className="image-foreground" />
          </div>
        </div>
        <div className="flex-1 space-y-4">
          <h2 className="font-semibold text-3xl text-white">{t('ourMission')}</h2>
          <p className="font-normal text-dimWhite leading-relaxed">{t('ourMissionText')}</p>
        </div>
      </div>

      <div className="reveal-on-scroll">
        <h2 className="font-semibold text-3xl text-center mb-8 text-white">{t('ourBeliefs')}</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {beliefs.map(belief => (
            <BeliefCard key={belief.title} {...belief} />
          ))}
        </div>
      </div>
      </div>
    </>
  );
};

export default AboutPage;