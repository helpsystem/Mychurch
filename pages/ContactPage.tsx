import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useContent } from '../hooks/useContent';
import { 
    GOOGLE_MAPS_EMBED_URL, 
    ONLINE_MEETING_URL,
    CONFERENCE_CALL_PHONE
} from '../lib/constants';
import { MapPin, Phone, Clock, Facebook, Youtube, Instagram, Globe, PhoneCall, Link as LinkIcon } from 'lucide-react';

const ContactPage: React.FC = () => {
  const { t } = useLanguage();
  const { content } = useContent();
  const { settings } = content;

  return (
    <div className="space-y-12 sm:px-16 px-6 sm:py-12 py-4">
      <div className="text-center">
        <h1 className="font-semibold text-4xl md:text-5xl text-white mb-2">{t('contactTitle')}</h1>
        <p className="font-normal text-dimWhite text-lg max-w-3xl mx-auto">{t('contactDescription')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Info */}
        <div className="bg-black-gradient p-8 rounded-[20px] box-shadow space-y-6">
          <h2 className="font-semibold text-2xl text-white border-b border-gray-700 pb-2 mb-4">{t('contactTitle')}</h2>
          <div className="flex items-start gap-4">
            <MapPin className="text-secondary mt-1 h-6 w-6 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-lg text-white">{t('ourAddress')}</h3>
              <p className="text-dimWhite">{settings.address}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Phone className="text-secondary mt-1 h-6 w-6 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-lg text-white">{settings.phone}</h3>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Clock className="text-secondary mt-1 h-6 w-6 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-lg text-white">{t('meetingTime')}</h3>
              <p className="text-dimWhite">{settings.meetingTime.en}</p>
              <p className="text-dimWhite">{settings.meetingTime.fa}</p>
            </div>
          </div>
          
          {/* Online Info Section */}
          <div className="pt-4 border-t border-gray-700">
             <h3 className="font-semibold text-lg mb-2 text-white flex items-center gap-2"><Globe className="text-secondary"/>{t('onlineMeetingTitle')}</h3>
             <p className="text-sm text-dimWhite mb-4">{t('onlineMeetingDescription')}</p>
             
             <div className="space-y-4 pl-6">
                <div className="flex items-start gap-4">
                    <LinkIcon className="text-secondary mt-1 h-5 w-5 flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold text-white">{t('joinByLink')}</h4>
                        <a href={ONLINE_MEETING_URL} target="_blank" rel="noopener noreferrer" className="text-dimWhite hover:text-secondary break-all">{ONLINE_MEETING_URL}</a>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <PhoneCall className="text-secondary mt-1 h-5 w-5 flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold text-white">{t('joinByPhone')}</h4>
                        <p className="text-dimWhite">{CONFERENCE_CALL_PHONE}</p>
                    </div>
                </div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-700">
             <h3 className="font-semibold text-lg mb-2 text-white">{t('socialMedia')}</h3>
             <div className="flex space-x-4">
              <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-dimWhite hover:text-white transition-colors">
                <Facebook size={28} />
              </a>
              <a href={settings.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-dimWhite hover:text-white transition-colors">
                <Youtube size={28} />
              </a>
              <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-dimWhite hover:text-white transition-colors">
                <Instagram size={28} />
              </a>
            </div>
          </div>
        </div>

        {/* Google Map */}
        <div className="rounded-[20px] shadow-lg overflow-hidden">
          <iframe
            src={GOOGLE_MAPS_EMBED_URL}
            width="100%"
            height="100%"
            style={{ border: 0, minHeight: '450px' }}
            allowFullScreen={true}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Church Location"
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;