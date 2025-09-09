import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { Facebook, Youtube, Instagram } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { useContent } from '../hooks/useContent';

const Footer: React.FC<{ onOpenVerseModal: () => void }> = ({ onOpenVerseModal }) => {
  const { t, lang } = useLanguage();
  const { content } = useContent();
  const { settings } = content;

  const footerLinks = [
    {
      title: t('usefulLinks'),
      links: [
        { name: t('navAbout'), link: '/about' },
        { name: t('navSermons'), link: '/sermons' },
        { name: t('navEvents'), link: '/events' },
        { name: t('navBible'), link: '/bible' },
        { name: t('navGiving'), link: '/giving' },
      ],
    },
    {
      title: t('community'),
      links: [
        { name: t('verseForToday'), action: onOpenVerseModal },
        { name: t('navPrayer'), link: '/prayer' },
        { name: t('navContact'), link: '/contact' },
        { name: t('navAiHelper'), link: '/ai-helper' },
        { name: t('leaders'), link: '/leaders' },
        { name: t('footerLinkHelp'), link: '/help-center' },
      ],
    },
     {
      title: t('partner'),
      links: [
        { name: t('login'), link: '/login' },
        { name: t('signup'), link: '/signup' },
      ],
    },
  ];

  const socialMedia = [
    { id: 'social-media-1', icon: Instagram, link: settings.instagramUrl },
    { id: 'social-media-2', icon: Facebook, link: settings.facebookUrl },
    { id: 'social-media-3', icon: Youtube, link: settings.youtubeUrl },
  ];

  return (
    <section className="flex justify-center items-center sm:py-16 py-6 flex-col">
      <div className="flex justify-center items-start md:flex-row flex-col mb-8 w-full">
        <div className="flex-1 flex flex-col justify-start mr-10 rtl:ml-10 rtl:mr-0">
          <div className="flex items-center gap-3">
            <img src={settings.logoUrl} alt="Church Logo" className="w-12 h-12 object-contain" />
            <span className="text-white text-xl font-semibold">{settings.churchName[lang]}</span>
          </div>
          <p className="font-normal text-dimWhite text-[18px] leading-[30.8px] mt-4 max-w-[310px]">
            {settings.footerDescription[lang]}
          </p>
        </div>

        <div className="flex-[1.5] w-full flex flex-row justify-between flex-wrap md:mt-0 mt-10">
          {footerLinks.map((footerLink) => (
            <div key={footerLink.title} className="flex flex-col ss:my-0 my-4 min-w-[150px]">
              <h4 className="font-medium text-[18px] leading-[27px] text-white">
                {footerLink.title}
              </h4>
              <ul className="list-none mt-4">
                {footerLink.links.map((link, index) => {
                    const linkClasses = `font-normal text-[16px] leading-[24px] text-dimWhite hover:text-secondary cursor-pointer ${index !== footerLink.links.length - 1 ? 'mb-4' : 'mb-0'}`;
                    if ('action' in link && link.action) {
                        return (
                             <li key={link.name}>
                                <button onClick={link.action} className={linkClasses}>
                                    {link.name}
                                </button>
                            </li>
                        )
                    }
                    if ('link' in link) {
                        return (
                            <li key={link.name} className={linkClasses}>
                                <Link to={link.link!}>{link.name}</Link>
                            </li>
                        )
                    }
                    return null;
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full flex justify-between items-center md:flex-row flex-col pt-6 border-t-[1px] border-t-[#3F3E45]">
        <div className="text-center md:text-left">
          <p className="font-normal text-[14px] leading-[27px] text-dimWhite">
            {t('copyright')}
          </p>
          <p className="font-normal text-[12px] leading-[20px] text-dimWhite/70 mt-1">
            {lang === 'fa' ? 'طراحی و توسعه توسط سامان آبیار' : 'Designed & Developed by Saman Abyar'}
          </p>
        </div>
        
        <div className="flex flex-row items-center md:mt-0 mt-6">
            <LanguageSwitcher />
            <div className="w-px h-6 bg-white/20 mx-4"></div>
            {socialMedia.map((social, index) => (
                <a key={social.id} href={social.link} target="_blank" rel="noopener noreferrer" className={`social-icon-link ${index !== socialMedia.length - 1 ? 'mr-6 rtl:ml-6 rtl:mr-0' : 'mr-0'}`}>
                    <social.icon className="w-[21px] h-[21px] object-contain cursor-pointer text-dimWhite" />
                </a>
            ))}
        </div>
      </div>
    </section>
  );
};

export default Footer;