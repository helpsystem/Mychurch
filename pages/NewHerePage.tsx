import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useContent } from '../hooks/useContent';
import { Link } from 'react-router-dom';
import { Clock, MapPin, Users, Heart } from 'lucide-react';

const InfoCard: React.FC<{ icon: React.ReactNode, title: string, children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-black-gradient p-6 rounded-[20px] box-shadow flex items-start gap-4">
        <div className="flex-shrink-0 text-secondary mt-1">
            {icon}
        </div>
        <div>
            <h3 className="font-semibold text-xl text-white mb-2">{title}</h3>
            <div className="text-dimWhite space-y-1">{children}</div>
        </div>
    </div>
);

const NewHerePage: React.FC = () => {
    const { t, lang } = useLanguage();
    const { content } = useContent();
    const { settings } = content;

    return (
        <div className="sm:px-16 px-6 sm:py-12 py-4 max-w-4xl mx-auto">
            <div className="text-center mb-12">
                <h1 className="font-semibold text-4xl md:text-5xl text-white mb-2 text-gradient">
                    {t('newHereTitle')}
                </h1>
                <p className="font-normal text-dimWhite text-lg max-w-2xl mx-auto">
                    {t('newHereWelcome')}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <InfoCard icon={<Clock size={28} />} title={t('meetingTime')}>
                    <p>{settings.meetingTime[lang]}</p>
                </InfoCard>
                <InfoCard icon={<MapPin size={28} />} title={t('ourAddress')}>
                    <p>{settings.address}</p>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`} target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-white">Get Directions</a>
                </InfoCard>
            </div>

            <div className="bg-primary p-8 rounded-2xl border border-gray-800 space-y-8">
                <div>
                    <h2 className="font-semibold text-3xl text-white mb-4">{t('whatToExpect')}</h2>
                    <p className="text-dimWhite leading-relaxed">
                        Our Sunday service is a time of vibrant worship, heartfelt prayer, and relevant teaching from the Bible, all in Farsi. We are a friendly and casual community, so come as you are! The service typically lasts about 90 minutes. After the service, we invite you to stay for fellowship and refreshments.
                    </p>
                </div>
                 <div>
                    <h2 className="font-semibold text-3xl text-white mb-4">{t('forYourKids')}</h2>
                    <p className="text-dimWhite leading-relaxed">
                        We love having children as part of our church family! We provide a safe and fun environment for kids during the service where they can learn about Jesus in an age-appropriate way. Our trained volunteers are ready to welcome your children.
                    </p>
                </div>
            </div>

            <div className="text-center mt-12">
                 <Link to="/about" className="py-4 px-8 font-medium text-[18px] text-primary bg-blue-gradient rounded-[10px] outline-none inline-flex items-center gap-2">
                    <Heart size={20}/>
                    Learn More About Our Beliefs
                </Link>
            </div>
        </div>
    );
};

export default NewHerePage;