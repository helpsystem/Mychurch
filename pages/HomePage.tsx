

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { ArrowUpRight, Quote, Sparkles, Heart, Users, Calendar, Book, MessageCircle } from 'lucide-react';
import { useContent } from '../hooks/useContent';
import { getRandomImage } from '../lib/theme';
import WeeklySchedule from '../components/WeeklySchedule';
import { Leader } from '../types';
import ScrambledText from '../components/ScrambledText';
import { DEFAULT_AVATAR_URL } from '../lib/constants';
import { useAuth } from '../hooks/useAuth';
import ImageSlider from '../components/ImageSlider';
import SEOHead from '../components/SEO/SEOHead';
import { getPageSEOConfig } from '../lib/seoConfig';
import './HomePage.css';

const ParticleCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        
        const setCanvasDimensions = () => {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.offsetWidth;
                canvas.height = parent.offsetHeight;
            }
        };
        setCanvasDimensions();

        const particles: { x: number; y: number; size: number; speedX: number; speedY: number; }[] = [];
        const numberOfParticles = 50;

        const initParticles = () => {
            particles.length = 0;
            for (let i = 0; i < numberOfParticles; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 2 + 1,
                    speedX: Math.random() * 0.5 - 0.25,
                    speedY: Math.random() * 0.5 - 0.25,
                });
            }
        };
        initParticles();

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.x += p.speedX;
                p.y += p.speedY;

                if (p.x > canvas.width || p.x < 0) p.x = Math.random() * canvas.width;
                if (p.y > canvas.height || p.y < 0) p.y = Math.random() * canvas.height;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0, 246, 255, 0.5)';
                ctx.fill();
            });
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        const handleResize = () => {
            setCanvasDimensions();
            initParticles();
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0" />;
};


const Button: React.FC<{ styles?: string; text: string; to?: string }> = ({ styles, text, to = "/about" }) => (
  <Link to={to} className={`py-4 px-6 font-medium text-[18px] text-primary bg-blue-gradient rounded-[10px] outline-none ${styles}`}>
    {text}
  </Link>
);

const FeatureCard: React.FC<{ icon: string; title: string; content: string; index: number }> = ({ icon, title, content, index }) => (
  <div className={`flex flex-row p-6 rounded-[20px] ${index !== 2 ? "mb-6" : "mb-0"} feature-card`}>
    <div className="w-[64px] h-[64px] rounded-full flex justify-center items-center bg-dimBlue">
      <img src={icon} alt="icon" className="w-[50%] h-[50%] object-contain" />
    </div>
    <div className="flex-1 flex flex-col ml-3 rtl:mr-3 rtl:ml-0">
      <h4 className="font-semibold text-white text-[18px] leading-[23px] mb-1">
        {title}
      </h4>
      <p className="font-normal text-dimWhite text-[16px] leading-[24px] mb-1">
        {content}
      </p>
    </div>
  </div>
);

const FeedbackCard: React.FC<{ content: string; name: string; title: string; img: string; delay: number }> = ({ content, name, title, img, delay }) => (
  <div className={`flex justify-between flex-col px-10 py-12 rounded-[20px] max-w-[370px] md:mr-10 sm:mr-5 mr-0 my-5 feedback-card reveal-on-scroll delay-${delay}`}>
    <Quote className="w-[42px] h-[27px] object-contain text-secondary" />
    <p className="font-normal text-[18px] leading-[32px] text-white my-10">
      {content}
    </p>
    <div className="flex flex-row">
      <img src={img} alt={name} className="w-[48px] h-[48px] rounded-full" />
      <div className="flex flex-col ml-4 rtl:mr-4 rtl:ml-0">
        <h4 className="font-semibold text-[20px] leading-[32px] text-white">{name}</h4>
        <p className="font-normal text-[16px] leading-[24px] text-dimWhite">{title}</p>
      </div>
    </div>
  </div>
);

const LeaderCardHome: React.FC<{ leader: Leader }> = ({ leader }) => {
    const { lang, t } = useLanguage();

    const shortBio = leader.bio[lang].length > 100 
        ? leader.bio[lang].substring(0, 100) + '...' 
        : leader.bio[lang];

    return (
        <div className="flex flex-col p-6 rounded-[20px] max-w-[370px] md:mr-10 sm:mr-5 mr-0 my-5 feature-card interactive-card-glow">
            <div className="w-full h-60 mb-4 rounded-[10px] overflow-hidden image-container">
                 <img src={leader.imageUrl} alt="" className="image-background" aria-hidden="true" />
                 <img src={leader.imageUrl} alt={leader.name[lang]} className="image-foreground" />
            </div>
            <h4 className="font-semibold text-white text-[20px] leading-[32px]">{leader.name[lang]}</h4>
            <p className="font-normal text-dimWhite text-[16px] leading-[24px] mb-4">{leader.title[lang]}</p>
            <p className="font-normal text-dimWhite text-[16px] leading-[24px] mb-4 flex-grow">{shortBio}</p>
            <Link to="/leaders" className="text-secondary hover:text-white font-semibold mt-auto">{t('viewProfile')}</Link>
        </div>
    );
};

const LeadersSection: React.FC = () => {
  const { t } = useLanguage();
  const { content } = useContent();
  const leaders = content.leaders.slice(0, 3); // Show max 3 on homepage

  return (
    <section className="sm:py-16 py-6 flex justify-center items-center flex-col relative reveal-on-scroll">
      <div className="w-full flex justify-between items-center md:flex-row flex-col sm:mb-16 mb-6 relative z-[1]">
        <h2 className="font-semibold xs:text-[48px] text-[40px] text-white xs:leading-[76.8px] leading-[66.8px] w-full">{t('meetOurLeadersHomeTitle')}</h2>
        <div className="w-full md:mt-0 mt-6">
            <p className="font-normal text-dimWhite text-[18px] leading-[30.8px] text-left max-w-[450px]">{t('meetOurLeadersHomeParagraph')}</p>
        </div>
      </div>
      <div className="flex flex-wrap sm:justify-start justify-center w-full relative z-[1]">
        {leaders.map(leader => (
          <LeaderCardHome key={leader.id} leader={leader} />
        ))}
      </div>
    </section>
  );
};


const Stats: React.FC = () => {
    const { t } = useLanguage();
    const stats = [
      { id: "stats-1", title: t('statsMembers'), value: "150+", icon: Users },
      { id: "stats-2", title: t('statsEvents'), value: "10+", icon: Calendar },
      { id: "stats-3", title: t('statsSermons'), value: "500+", icon: Book },
    ];
    return (
      <section className="flex-row flex-wrap sm:mb-20 mb-6 flex justify-center items-center">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={stat.id} className={`flex-1 flex justify-start items-center flex-col m-3 glass-card hover:scale-105 transition-all duration-300`}>
              <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-secondary to-blue-400 flex items-center justify-center pulse-animation">
                <Icon className="w-8 h-8 text-black" />
              </div>
              <h4 className="font-semibold xs:text-[40px] text-[30px] xs:leading-[53px] leading-[43px] text-white counter">{stat.value}</h4>
              <p className="font-normal xs:text-[20px] text-[15px] xs:leading-[26px] leading-[21px] text-gradient uppercase text-center">{stat.title}</p>
            </div>
          );
        })}
      </section>
    );
};

const HomePage: React.FC = () => {
  const { t, lang } = useLanguage();
  const { content } = useContent();
  const { isAuthenticated, user } = useAuth();
  
  // Get SEO configuration for home page
  const seoConfig = getPageSEOConfig('home', lang);
  const [aboutImage, setAboutImage] = useState('/images/jesus-cross-sunset.jpg');

  useEffect(() => {
    // Set a beautiful default image instead of random
    setAboutImage('/images/jesus-cross-sunset.jpg');
    
    // Reveal on scroll animation
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.reveal-on-scroll').forEach(el => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <SEOHead {...seoConfig} />
      <div className="bg-primary w-full overflow-hidden">
        {/* Hero Section */}
        <div className="flex justify-center items-start">
        <div className="xl:max-w-[1280px] w-full">
            <section id="home" className="flex md:flex-row flex-col sm:py-16 py-6 relative">
                <ParticleCanvas />
                <div className="flex-1 flex justify-center items-start flex-col xl:px-0 sm:px-16 px-6 z-10">
                    <div className="flex flex-row items-center py-[6px] px-4 bg-gray-gradient rounded-[10px] mb-2">
                        <img src={content.settings.logoUrl} alt="discount" className="w-[32px] h-[32px]" />
                        <p className="font-normal text-dimWhite text-[18px] leading-[30.8px] ml-2 rtl:mr-2 rtl:ml-0">
                           {isAuthenticated && user ? `${t('welcomeBack')}, ${user.profileData.name}` : t('heroWelcome')}
                        </p>
                    </div>

                    <div className="flex flex-row justify-between items-center w-full">
                        <h1 className="flex-1 font-semibold ss:text-[72px] text-[52px] text-white ss:leading-[100px] leading-[75px]">
                            {t('heroSlogan1')} <br className="sm:block hidden" /> {" "}
                            <span className="text-gradient">{t('heroSlogan2')}</span>
                        </h1>
                        <div className="ss:flex hidden md:mr-4 mr-0 rtl:ml-4 rtl:mr-0">
                             <div className="flex justify-center items-center w-[140px] h-[140px] rounded-full bg-blue-gradient p-[2px] cursor-pointer">
                                <Link to="/ai-helper" className="flex justify-center items-center flex-col bg-primary w-[100%] h-[100%] rounded-full">
                                    <div className="flex justify-center items-start flex-row">
                                        <p className="font-medium text-[18px] leading-[23px] mr-2 rtl:ml-2 rtl:mr-0">
                                            <span className="text-gradient">{t('askNow')}</span>
                                        </p>
                                        <ArrowUpRight className="w-[23px] h-[23px] object-contain text-secondary" />
                                    </div>
                                    <p className="font-medium text-[18px] leading-[23px]">
                                        <span className="text-gradient">AI</span>
                                    </p>
                                </Link>
                            </div>
                        </div>
                    </div>
                    <div className="font-normal text-dimWhite text-[18px] leading-[30.8px] max-w-[470px] mt-5">
                      <ScrambledText text={t('heroParagraph')} />
                    </div>
                </div>
                
                <div className={`flex-1 flex justify-center items-center md:my-0 my-10 relative ${lang === 'fa' ? 'md:ml-10 ml-0' : 'md:mr-10 mr-0'} z-10`}>
                    <ImageSlider 
                        images={[
                            '/images/Church_interior_worship_space_70ed9ac2.png',
                            '/images/Church_community_gathering_a97f90e1.png',
                            '/images/Modern_church_building_exterior_83da6dba.png',
                            '/images/Persian_Christian_choir_singing_bfe3adf8.png'
                        ]}
                        autoplay={true}
                        autoplayInterval={4000}
                        className="w-full max-w-[600px] relative z-[5]"
                    />
                    <div className="absolute z-[0] w-[40%] h-[35%] top-0 pink__gradient" />
                    <div className="absolute z-[1] w-[80%] h-[80%] rounded-full bottom-40 white__gradient" />
                    <div className="absolute z-[0] w-[50%] h-[50%] right-20 bottom-20 blue__gradient" />
                </div>

                <div className="ss:hidden flex justify-center items-center z-10">
                    <div className="flex justify-center items-center w-[140px] h-[140px] rounded-full bg-blue-gradient p-[2px] cursor-pointer">
                        <Link to="/ai-helper" className="flex justify-center items-center flex-col bg-primary w-[100%] h-[100%] rounded-full">
                            <div className="flex justify-center items-start flex-row">
                                <p className="font-medium text-[18px] leading-[23px] mr-2 rtl:ml-2 rtl:mr-0">
                                    <span className="text-gradient">{t('askNow')}</span>
                                </p>
                                 <ArrowUpRight className="w-[23px] h-[23px] object-contain text-secondary" />
                            </div>
                             <p className="font-medium text-[18px] leading-[23px]">
                                <span className="text-gradient">AI</span>
                            </p>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
      </div>
      
      {/* Content Sections */}
      <div className="flex justify-center items-start sm:px-16 px-6">
          <div className="xl:max-w-[1280px] w-full">
              {/* Quick Access Cards */}
              <section className="sm:py-16 py-6 reveal-on-scroll">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Link to="/bible-reader" className="group glass-card interactive-card-glow text-center hover:scale-105 transition-all duration-300">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center group-hover:rotate-12 transition-transform">
                      <Book className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-white font-semibold text-xl mb-2">{lang === 'fa' ? 'کتاب مقدس' : 'Holy Bible'}</h3>
                    <p className="text-dimWhite text-sm">{lang === 'fa' ? 'خواندن و مطالعه کلام خدا' : 'Read and study God\'s Word'}</p>
                  </Link>

                  <Link to="/sermons" className="group glass-card interactive-card-glow text-center hover:scale-105 transition-all duration-300">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center group-hover:rotate-12 transition-transform">
                      <MessageCircle className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-white font-semibold text-xl mb-2">{lang === 'fa' ? 'موعظه‌ها' : 'Sermons'}</h3>
                    <p className="text-dimWhite text-sm">{lang === 'fa' ? 'گوش دادن به موعظه‌های هفتگی' : 'Listen to weekly messages'}</p>
                  </Link>

                  <Link to="/events" className="group glass-card interactive-card-glow text-center hover:scale-105 transition-all duration-300">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center group-hover:rotate-12 transition-transform">
                      <Calendar className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-white font-semibold text-xl mb-2">{lang === 'fa' ? 'رویدادها' : 'Events'}</h3>
                    <p className="text-dimWhite text-sm">{lang === 'fa' ? 'برنامه‌های کلیسا و رویدادها' : 'Church programs and events'}</p>
                  </Link>

                  <Link to="/prayer-requests" className="group glass-card interactive-card-glow text-center hover:scale-105 transition-all duration-300">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center group-hover:rotate-12 transition-transform">
                      <Heart className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-white font-semibold text-xl mb-2">{lang === 'fa' ? 'درخواست دعا' : 'Prayer Requests'}</h3>
                    <p className="text-dimWhite text-sm">{lang === 'fa' ? 'درخواست دعا و شفاعت' : 'Share prayer requests'}</p>
                  </Link>
                </div>
              </section>

              <div className="reveal-on-scroll delay-3"><Stats /></div>
              <div className="reveal-on-scroll delay-4"><WeeklySchedule /></div>

              {/* Daily Verse Section */}
              <section className="sm:py-16 py-6 reveal-on-scroll delay-5">
                <div className="text-center mb-12">
                    <h2 className="font-semibold xs:text-[48px] text-[40px] text-white xs:leading-[76.8px] leading-[66.8px] mb-4">{lang === 'fa' ? 'آیه امروز' : 'Today\'s Verse'}</h2>
                    <p className="font-normal text-dimWhite text-[18px] leading-[30.8px] max-w-[600px] mx-auto mb-8">{lang === 'fa' ? 'کلام خدا را در قلب خود نگه دارید و از برکات آن بهره‌مند شوید' : 'Keep God\'s word in your heart and be blessed by its wisdom'}</p>
                    
                    <div className="flex justify-center">
                        <button 
                            onClick={() => {
                                // Find parent with onOpenVerseModal
                                const event = new CustomEvent('openVerseModal');
                                window.dispatchEvent(event);
                            }}
                            className="group relative bg-gradient-to-r from-secondary to-blue-400 hover:from-blue-400 hover:to-secondary text-black font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-secondary/25"
                        >
                            <div className="flex items-center space-x-3 rtl:space-x-reverse">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:rotate-12 transition-transform">
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                                </svg>
                                <span>{lang === 'fa' ? 'مشاهده آیه امروز' : 'Read Today\'s Verse'}</span>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </button>
                    </div>
                </div>
              </section>

              {/* Gallery Section */}
              <section className="sm:py-16 py-6 reveal-on-scroll delay-6">
                <div className="text-center mb-12">
                    <h2 className="font-semibold xs:text-[48px] text-[40px] text-white xs:leading-[76.8px] leading-[66.8px] mb-4 heading-glow">{lang === 'fa' ? 'گالری تصاویر کلیسا' : 'Church Gallery'}</h2>
                    <p className="font-normal text-dimWhite text-[18px] leading-[30.8px] max-w-[600px] mx-auto">{lang === 'fa' ? 'نگاهی به فضاهای زیبا و لحظات مقدس کلیسای ما' : 'A glimpse into the beautiful spaces and sacred moments of our church community'}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    <div className="gallery-item aspect-video bg-gray-900 rounded-xl overflow-hidden cursor-pointer">
                        <img src="/images/Prayer_circle_hands_together_feb88f83.png" alt="Prayer Circle" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 z-10">
                          <Sparkles className="w-12 h-12 text-white" />
                        </div>
                    </div>
                    <div className="gallery-item aspect-video bg-gray-900 rounded-xl overflow-hidden cursor-pointer">
                        <img src="/images/Bible_study_peaceful_setting_6bb44b27.png" alt="Bible Study" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 z-10">
                          <Sparkles className="w-12 h-12 text-white" />
                        </div>
                    </div>
                    <div className="gallery-item aspect-video bg-gray-900 rounded-xl overflow-hidden cursor-pointer">
                        <img src="/images/Children_Sunday_school_class_ade575b6.png" alt="Sunday School" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 z-10">
                          <Sparkles className="w-12 h-12 text-white" />
                        </div>
                    </div>
                </div>
                <div className="text-center">
                    <Link to="/gallery" className="neon-button inline-block">
                      <span>{lang === 'fa' ? 'مشاهده گالری کامل' : 'View Full Gallery'}</span>
                    </Link>
                </div>
              </section>

              {/* About Section */}
              <section className="flex md:flex-row flex-col sm:py-16 py-6 reveal-on-scroll delay-7">
                <div className="flex-1 flex justify-center items-center md:mr-10 mr-0 md:mt-0 mt-10 relative rtl:md:ml-10 rtl:md:mr-0">
                    <div className="w-full h-80 image-container rounded-xl">
                        <img src={aboutImage} alt="" className="image-background" aria-hidden="true" />
                        <img src={aboutImage} alt="community" className="image-foreground" />
                        <button 
                            onClick={() => setAboutImage(getRandomImage())}
                            className="absolute top-3 right-3 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full text-sm transition-all duration-300 opacity-75 hover:opacity-100"
                            title={lang === 'fa' ? 'تغییر تصویر' : 'Change Image'}
                        >
                            🔄
                        </button>
                    </div>
                </div>
                <div className="flex-1 flex justify-center items-start flex-col">
                    <h2 className="font-semibold xs:text-[48px] text-[40px] text-white xs:leading-[76.8px] leading-[66.8px] w-full">{t('aboutTitle')}</h2>
                    <p className="font-normal text-dimWhite text-[18px] leading-[30.8px] max-w-[470px] mt-5">{t('aboutParagraph')}</p>
                    <Button styles="mt-10" text={t('aboutButton')} to="/about"/>
                </div>
              </section>

              {/* Sermons Section */}
              <section className="flex md:flex-row flex-col-reverse sm:py-16 py-6 reveal-on-scroll">
                 <div className="flex-1 flex justify-center items-start flex-col">
                    <h2 className="font-semibold xs:text-[48px] text-[40px] text-white xs:leading-[76.8px] leading-[66.8px] w-full">{t('sermonsHomeTitle')}</h2>
                    <p className="font-normal text-dimWhite text-[18px] leading-[30.8px] max-w-[470px] mt-5">{t('sermonsHomeParagraph')}</p>
                     <div className="flex flex-row flex-wrap sm:mt-10 mt-6">
                        <Link to="/sermons"><img src="https://i.ibb.co/kM0G5xX/apple.png" alt="apple_store" className="w-[128px] h-[42px] object-contain mr-5 cursor-pointer rtl:ml-5 rtl:mr-0"/></Link>
                        <Link to="/sermons"><img src="https://i.ibb.co/2SYxL06/google.png" alt="google_play" className="w-[128px] h-[42px] object-contain cursor-pointer" /></Link>
                    </div>
                </div>
                 <div className="flex-1 flex justify-center items-center md:ml-10 ml-0 md:mt-0 mt-10 relative rtl:md:mr-10 rtl:md:ml-0">
                    <img src="https://i.ibb.co/B4g4sP3/card.png" alt="card" className="w-[100%] h-[100%] relative z-[5]"/>
                </div>
              </section>
              
              {/* Testimonials Section */}
              <section className="sm:py-16 py-6 flex justify-center items-center flex-col relative reveal-on-scroll">
                <div className="absolute z-0 w-[60%] h-[60%] -right-[50%] rtl:-left-[50%] rounded-full blue__gradient"/>
                <div className="w-full flex justify-between items-center md:flex-row flex-col sm:mb-16 mb-6 relative z-[1]">
                    <h2 className="font-semibold xs:text-[48px] text-[40px] text-white xs:leading-[76.8px] leading-[66.8px] w-full">{t('testimonialsTitle')}</h2>
                    <div className="w-full md:mt-0 mt-6">
                        <p className="font-normal text-dimWhite text-[18px] leading-[30.8px] text-left max-w-[450px]">{t('testimonialsParagraph')}</p>
                    </div>
                </div>
                <div className="flex flex-wrap sm:justify-start justify-center w-full feedback-container relative z-[1]">
                    <FeedbackCard delay={1} content={t('testimonial1Text')} name={t('testimonial1Name')} title={t('testimonial1Role')} img={DEFAULT_AVATAR_URL}/>
                    <FeedbackCard delay={2} content={t('testimonial2Text')} name={t('testimonial2Name')} title={t('testimonial2Role')} img={DEFAULT_AVATAR_URL}/>
                    <FeedbackCard delay={3} content={t('testimonial3Text')} name={t('testimonial3Name')} title={t('testimonial3Role')} img={DEFAULT_AVATAR_URL}/>
                </div>
              </section>

              {/* Leaders Section */}
              <LeadersSection />

              {/* CTA Section */}
              <section className="sm:my-16 my-6 sm:px-16 px-6 sm:py-12 py-4 reveal-on-scroll">
                <div className="glass-card p-12 rounded-2xl text-center border border-white/20 hover:border-white/40 transition-all duration-500 cta-glow-effect">
                    <Heart className="w-16 h-16 mx-auto mb-6 text-pink-400 pulse-animation" />
                    <h2 className="font-semibold xs:text-[48px] text-[40px] text-white xs:leading-[76.8px] leading-[66.8px] mb-6 gradient-text">{t('ctaTitle')}</h2>
                    <p className="font-normal text-white text-[18px] leading-[30.8px] max-w-[700px] mx-auto mb-8">{t('ctaParagraph')}</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link to="/ai-helper" className="neon-button">
                          <span>{t('ctaButton')}</span>
                        </Link>
                        <Link to="/contact" className="glass-card px-8 py-4 rounded-full border-2 border-white/50 text-white hover:border-white hover:bg-white/10 transition-all duration-300 inline-flex items-center gap-2 hover:scale-105">
                          <MessageCircle className="w-5 h-5" />
                          <span className="font-medium">{lang === 'fa' ? 'تماس با ما' : 'Contact Us'}</span>
                        </Link>
                    </div>
                </div>
              </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;