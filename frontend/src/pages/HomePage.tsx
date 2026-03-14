import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { ArrowUpRight, Quote, Sparkles, Heart, Users, Calendar, Book, MessageCircle, Play, Music, Radio, Clock, Video } from 'lucide-react';
import { useContent } from '../hooks/useContent';

import WeeklySchedule from '../components/WeeklySchedule';
import { Leader } from '../types';
import ScrambledText from '../components/ScrambledText';
import { DEFAULT_AVATAR_URL } from '../lib/constants';
import { useAuth } from '../hooks/useAuth';
import ImageSlider from '../components/ImageSlider';
import AIImageSlider from '../components/AIImageSlider';
import SEOHead from '../components/SEO/SEOHead';
import { getPageSEOConfig } from '../lib/seoConfig';
import './HomePage.css';

const ParticleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    // 🚀 در موبایل انیمیشن ذرات رو غیرفعال کن برای بهبود عملکرد
    if (isMobile) return;

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
    // 🚀 کاهش تعداد ذرات برای بهبود عملکرد
    const numberOfParticles = 30;

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
  }, [isMobile]);

  // 🚀 در موبایل اصلاً canvas رو رندر نکن
  if (isMobile) return null;

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
      <div className="relative w-[50%] h-[50%]">
        <img src={icon} alt="" className="absolute inset-0 w-full h-full object-contain blur-sm opacity-50" aria-hidden="true" />
        <img src={icon} alt="icon" className="relative w-full h-full object-contain" />
      </div>
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
    <div className="flex flex-row items-center">
      <div className="w-[48px] h-[48px] rounded-full overflow-hidden relative">
        <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover blur-sm opacity-50" aria-hidden="true" />
        <img src={img} alt={name} className="relative w-full h-full object-cover" />
      </div>
      <div className="flex flex-col ml-4 rtl:mr-4 rtl:ml-0">
        <h4 className="font-semibold text-[20px] leading-[32px] text-white">{name}</h4>
        <p className="font-normal text-[16px] leading-[24px] text-dimWhite">{title}</p>
      </div>
    </div>
  </div>
);

const LeaderCardHome: React.FC<{ leader: Leader }> = ({ leader }) => {
  const { lang, t } = useLanguage();

  // Extra safety checks
  if (!leader) {
    console.warn('LeaderCardHome: leader is undefined');
    return null;
  }

  const shortBio = leader.bio?.[lang]?.length > 100
    ? leader.bio[lang].substring(0, 100) + '...'
    : (leader.bio?.[lang] || '');

  const imageUrl = leader.imageUrl || DEFAULT_AVATAR_URL;
  const leaderName = leader.name?.[lang] || leader.name || 'Unknown';
  const leaderTitle = leader.title?.[lang] || leader.title || '';

  return (
    <div className="flex flex-col p-6 rounded-[20px] max-w-[370px] md:mr-10 sm:mr-5 mr-0 my-5 feature-card interactive-card-glow hover:scale-105 transition-all duration-300">
      <div className="w-full h-60 mb-4 rounded-[10px] overflow-hidden image-container relative group">
        <img src={imageUrl} alt="" className="image-background" aria-hidden="true" />
        <img src={imageUrl} alt={leaderName} className="image-foreground" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <h4 className={`font-semibold text-white text-[20px] leading-[32px] mb-1 ${lang === 'fa' ? 'text-right' : 'text-left'}`}>{typeof leaderName === 'string' ? leaderName : (leaderName as any)[lang] || 'Unknown'}</h4>
      <p className={`font-normal text-secondary text-[16px] leading-[24px] mb-4 ${lang === 'fa' ? 'text-right' : 'text-left'}`}>{typeof leaderTitle === 'string' ? leaderTitle : (leaderTitle as any)[lang] || ''}</p>
      <p className={`font-normal text-dimWhite text-[16px] leading-[24px] mb-4 flex-grow ${lang === 'fa' ? 'text-right' : 'text-left'}`}>{shortBio || t('noDescription')}</p>
      <Link to="/leaders" className="text-secondary hover:text-white font-semibold mt-auto inline-flex items-center gap-2 group">
        {t('viewProfile')}
        <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
      </Link>
    </div>
  );
};

const LeadersSection: React.FC = () => {
  const { t, lang } = useLanguage();
  const { content, loading } = useContent();
  const leaders = content.leaders?.slice(0, 3) || []; // Show max 3 on homepage

  if (loading) {
    return (
      <section className="sm:py-16 py-6 flex justify-center items-center flex-col relative reveal-on-scroll">
        <div className="w-full flex justify-center items-center">
          <div className="animate-pulse text-dimWhite text-lg">
            {lang === 'fa' ? '🔄 در حال بارگذاری رهبران...' : '🔄 Loading leaders...'}
          </div>
        </div>
      </section>
    );
  }

  if (leaders.length === 0) {
    return (
      <section className="sm:py-16 py-6 flex justify-center items-center flex-col relative reveal-on-scroll">
        <div className="w-full flex flex-col items-center justify-center p-8 glass-card rounded-[20px]">
          <Users className="w-16 h-16 text-dimWhite mb-4" />
          <p className="text-dimWhite text-lg text-center">
            {lang === 'fa' ? 'اطلاعات رهبران در حال حاضر در دسترس نیست' : 'Leader information is currently unavailable'}
          </p>
          <Link to="/leaders" className="mt-4 px-6 py-3 bg-gradient-to-r from-secondary to-blue-400 text-white rounded-full font-semibold hover:scale-105 transition-all">
            {lang === 'fa' ? 'مشاهده صفحه رهبران' : 'View Leaders Page'}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="sm:py-16 py-6 flex justify-center items-center flex-col relative reveal-on-scroll">
      <div className="w-full flex justify-between items-center md:flex-row flex-col sm:mb-16 mb-6 relative z-[1]">
        <h2 className="font-semibold xs:text-[48px] text-[40px] text-white xs:leading-[76.8px] leading-[66.8px] w-full heading-glow">
          {t('meetOurLeadersHomeTitle')}
        </h2>
        <div className="w-full md:mt-0 mt-6">
          <p className={`font-normal text-dimWhite text-[18px] leading-[30.8px] max-w-[450px] ${lang === 'fa' ? 'text-right' : 'text-left'}`}>
            {t('meetOurLeadersHomeParagraph')}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap sm:justify-start justify-center w-full relative z-[1] gap-4">
        {leaders.map(leader => (
          <LeaderCardHome key={leader.id} leader={leader} />
        ))}
      </div>
      <div className="w-full flex justify-center mt-8">
        <Link
          to="/leaders"
          className="px-8 py-4 bg-gradient-to-r from-secondary to-blue-400 text-white rounded-full font-semibold hover:scale-105 transition-all inline-flex items-center gap-2 shadow-lg hover:shadow-secondary/50"
        >
          {lang === 'fa' ? '👥 مشاهده همه رهبران' : '👥 View All Leaders'}
          <ArrowUpRight className="w-5 h-5" />
        </Link>
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

// --- New Feature: Countdown Timer ---
const getNextSunday = () => {
  const now = new Date();
  const nextSunday = new Date();
  nextSunday.setDate(now.getDate() + ((7 - now.getDay()) % 7 || 7));
  nextSunday.setHours(10, 30, 0, 0); // 10:30 AM Service
  
  if (now > nextSunday) {
      nextSunday.setDate(nextSunday.getDate() + 7);
  }
  return nextSunday;
};

const SmartCountdown: React.FC = () => {
  const { lang } = useLanguage();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetDate = getNextSunday().getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-center w-full mb-10 z-20 relative">
      <div className="glass-card flex items-center gap-6 py-4 px-8 rounded-full border border-secondary/30 shadow-[0_0_30px_rgba(0,246,255,0.15)] animate-fade-in-up delay-100">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-secondary animate-pulse" />
          <span className="text-white font-medium whitespace-nowrap">
            {lang === 'fa' ? 'جلسه پرستشی بعدی:' : 'Next Worship Service:'}
          </span>
        </div>
        
        <div className="flex gap-4 font-mono font-bold text-xl text-gradient">
            <div className="flex flex-col items-center leading-none">
                <span>{String(timeLeft.days).padStart(2, '0')}</span>
                <span className="text-[10px] text-dimWhite uppercase tracking-widest mt-1">{lang === 'fa' ? 'روز' : 'Days'}</span>
            </div>
            <span className="text-dimWhite">:</span>
            <div className="flex flex-col items-center leading-none">
                <span>{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="text-[10px] text-dimWhite uppercase tracking-widest mt-1">{lang === 'fa' ? 'ساعت' : 'Hrs'}</span>
            </div>
            <span className="text-dimWhite">:</span>
            <div className="flex flex-col items-center leading-none">
                <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="text-[10px] text-dimWhite uppercase tracking-widest mt-1">{lang === 'fa' ? 'دقیقه' : 'Min'}</span>
            </div>
            <span className="text-dimWhite">:</span>
            <div className="flex flex-col items-center leading-none">
                <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="text-[10px] text-dimWhite uppercase tracking-widest mt-1">{lang === 'fa' ? 'ثانیه' : 'Sec'}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

const HomePage: React.FC = () => {
  const { t, lang } = useLanguage();
  const { content } = useContent();
  const { isAuthenticated, user } = useAuth();

  // Get SEO configuration for home page
  const seoConfig = getPageSEOConfig('home', lang === 'fa' ? 'fa' : 'en');

  useEffect(() => {
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
        <div className="flex justify-center items-start min-h-[90vh] relative pt-10">
          
          {/* Smart Live Banner (Mock logic: displays if it's Sunday 10:30-12:30) */}
          {new Date().getDay() === 0 && new Date().getHours() >= 10 && new Date().getHours() <= 12 && (
            <div className="absolute top-0 left-0 w-full z-50">
                <Link to="/live" className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white py-3 px-4 transition-colors font-semibold group cursor-pointer shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                    <Radio className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0 animate-pulse" />
                    <span>{lang === 'fa' ? 'اکنون: پخش زنده کلیسای ایرانیان 디سی شروع شد! کلیک کنید.' : 'LIVE NOW: Iranian Church DC Worship Service! Click to join.'}</span>
                    <ArrowUpRight className="w-4 h-4 ml-2 rtl:mr-2 rtl:ml-0 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </Link>
            </div>
          )}

          <div className="xl:max-w-[1280px] w-full">
            <section id="home" className="flex flex-col sm:py-16 py-6 relative items-center">
              <ParticleCanvas />
              
              <SmartCountdown />

              <div className="flex md:flex-row flex-col w-full items-center">
                  {/* Text Content */}
                  <div className="flex-1 flex justify-center items-start flex-col xl:px-0 sm:px-16 px-6 z-10 animate-fade-in-up w-full">

                    {/* Discount / Welcome Label */}
                    <div className="flex flex-row items-center py-[8px] px-6 bg-glass-gradient rounded-[20px] mb-6 backdrop-blur-md border border-white/10 shadow-lg">
                      <img src={content.settings.logoUrl} alt="logo" className="w-[32px] h-[32px]" />
                      <p className="font-normal text-dimWhite text-[16px] leading-[24px] ml-3 rtl:mr-3 rtl:ml-0 uppercase tracking-wider">
                        {lang === 'fa' ? 'پلتفرم هوشمند کلیسای ایرانیان' : 'AI-Powered Church Platform'}
                      </p>
                    </div>

                {/* Main Heading */}
                <div className="w-full relative">
                  <h1 className="font-bold ss:text-[72px] text-[52px] text-white ss:leading-[90px] leading-[70px] tracking-tight mb-4">
                    {lang === 'fa' ? (
                      <>
                        <span className="block text-gradient">اولین پلتفرم هوشمند</span>
                        <span>تعاملی جامعه مسیحی</span>
                      </>
                    ) : (
                      <>
                        <span className="block text-gradient">First AI-Powered</span>
                        <span>Interactive Community</span>
                      </>
                    )}
                  </h1>
                </div>

                {/* Description */}
                <p className="font-normal text-dimWhite text-[18px] leading-[30.8px] max-w-[520px] mt-4 mb-8 text-justify opacity-0 animate-fade-in-delay">
                  {lang === 'fa'
                    ? 'با قدرت هوش مصنوعی Gemini، تجربه‌ای شخصی‌سازی شده برای اعضای جامعه. گفتگوی صوتی زنده، یادگیری هوشمند کتاب مقدس و ارتباطی نوین را تجربه کنید.'
                    : 'Powered by Google Gemini AI for a personalized community experience. Experience real-time voice chat, intelligent Bible study, and seamless connection.'}
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-row flex-wrap gap-4 opacity-0 animate-fade-in-delay-2">
                  <Link to="/ai-helper" className="bg-blue-gradient text-primary font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105 flex items-center">
                    {lang === 'fa' ? 'تجربه هوش مصنوعی' : 'Try AI Experience'}
                    <Sparkles className="ml-2 w-5 h-5 rtl:mr-2 rtl:ml-0" />
                  </Link>
                  <Link to="/about" className="glass-button text-white font-semibold py-4 px-8 rounded-full border border-white/20 hover:bg-white/10 transition-all duration-300 flex items-center">
                    {lang === 'fa' ? 'درباره پلتفرم' : 'Platform Features'}
                  </Link>
                  </div>
                  </div> {/* Closing Text Content div */}

                  {/* Hero Image / Slider */}
                  <div className={`flex-1 flex justify-center items-center md:my-0 my-10 relative w-full ${lang === 'fa' ? 'md:ml-10 ml-0' : 'md:mr-10 mr-0'} z-10 animate-float`}>
                    <AIImageSlider
                      autoPlayInterval={5000}
                      showNavigationButtons={false}
                      showIndicators={true}
                      className="w-full max-w-[650px] relative z-[5] rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10"
                    />

                    {/* Glow Effects */}
                    <div className="absolute z-[0] w-[50%] h-[50%] top-0 -right-20 pink__gradient opacity-60" />
                    <div className="absolute z-[1] w-[80%] h-[80%] rounded-full bottom-40 white__gradient opacity-20" />
                    <div className="absolute z-[0] w-[50%] h-[50%] right-20 bottom-20 blue__gradient opacity-60" />
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
                <Link to="/bible" className="group glass-card interactive-card-glow text-center hover:scale-105 transition-all duration-300">
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
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                      <span>{lang === 'fa' ? 'مشاهده آیه امروز' : 'Read Today\'s Verse'}</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </div>
              </div>
            </section>

            {/* AI Features Section - NEW */}
            <section className="sm:py-16 py-6 reveal-on-scroll">
              <div className="flex flex-col items-center justify-center text-center mb-10">
                 <div className="flex items-center gap-2 mb-4 px-4 py-1 rounded-full bg-blue-500/10 border border-blue-400/30">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-400 text-sm font-medium uppercase tracking-wider">Powered by Gemini AI</span>
                 </div>
                 <h2 className="font-semibold xs:text-[48px] text-[40px] text-white xs:leading-[76.8px] leading-[66.8px] mb-4 heading-glow">
                    {lang === 'fa' ? 'قابلیت‌های هوشمند' : 'AI Capabilities'}
                 </h2>
                 <p className="font-normal text-dimWhite text-[18px] leading-[30.8px] max-w-[700px]">
                    {lang === 'fa' 
                       ? 'تکنولوژی در خدمت ایمان. ما از پیشرفته‌ترین مدل‌های هوش مصنوعی گوگل برای ارائه خدمات بهتر استفاده می‌کنیم.' 
                       : 'Technology serving faith. We leverage Google\'s most advanced AI models to provide superior community services.'}
                 </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Feature 1 */}
                <div className="glass-card p-6 rounded-[20px] hover:bg-white/5 transition-all duration-300 border border-white/10 group">
                    <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center mb-4 text-blue-400 group-hover:scale-110 transition-transform">
                        <MessageCircle className="w-7 h-7" />
                    </div>
                    <h3 className="text-white font-semibold text-xl mb-3">
                        {lang === 'fa' ? 'گفتگوی زنده Gemini' : 'Gemini Live Chat'}
                    </h3>
                    <p className="text-dimWhite text-sm leading-6">
                        {lang === 'fa' 
                           ? 'با دستیار هوشمند صوتی ما صحبت کنید. سوالات خود را بپرسید و پاسخ‌های دقیق دریافت کنید.' 
                           : 'Talk to our intelligent voice assistant. Ask questions and receive accurate, contextual responses.'}
                    </p>
                </div>

                {/* Feature 2 */}
                <div className="glass-card p-6 rounded-[20px] hover:bg-white/5 transition-all duration-300 border border-white/10 group">
                    <div className="w-14 h-14 rounded-full bg-purple-500/20 flex items-center justify-center mb-4 text-purple-400 group-hover:scale-110 transition-transform">
                        <Music className="w-7 h-7" />
                    </div>
                    <h3 className="text-white font-semibold text-xl mb-3">
                        {lang === 'fa' ? 'هماهنگ‌سازی هوشمند' : 'Smart Sync'}
                    </h3>
                    <p className="text-dimWhite text-sm leading-6">
                        {lang === 'fa' 
                           ? 'تحلیل دقیق فایل‌های صوتی برای هماهنگی متن و صدا با دقت میلی‌ثانیه برای تجربه بهتر.' 
                           : 'Precise analysis of audio files for millisecond-accurate text-audio synchronization.'}
                    </p>
                </div>

                {/* Feature 3 */}
                <div className="glass-card p-6 rounded-[20px] hover:bg-white/5 transition-all duration-300 border border-white/10 group">
                    <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mb-4 text-green-400 group-hover:scale-110 transition-transform">
                        <Book className="w-7 h-7" />
                    </div>
                    <h3 className="text-white font-semibold text-xl mb-3">
                        {lang === 'fa' ? 'مطالعه تعاملی' : 'Interactive Study'}
                    </h3>
                    <p className="text-dimWhite text-sm leading-6">
                        {lang === 'fa' 
                           ? 'تبدیل متن به گفتار با کیفیت بالا و تولید محتوای آموزشی متناسب با نیاز شما.' 
                           : 'High-quality Text-to-Speech and personalized educational content generation suited to your needs.'}
                    </p>
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
                <div className="gallery-item aspect-video bg-gray-900 rounded-xl overflow-hidden cursor-pointer relative group">
                  <img
                    src="/images/Church_interior_worship_space_70ed9ac2.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover blur-sm scale-110 opacity-50"
                    aria-hidden="true"
                  />
                  <img
                    src="/images/Church_interior_worship_space_70ed9ac2.png"
                    alt="Church Interior"
                    className="relative w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                    <Sparkles className="w-12 h-12 text-white animate-pulse" />
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 text-white text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                    <p className="font-semibold text-lg">{lang === 'fa' ? 'فضای داخلی کلیسا' : 'Church Interior'}</p>
                  </div>
                </div>
                <div className="gallery-item aspect-video bg-gray-900 rounded-xl overflow-hidden cursor-pointer relative group">
                  <img
                    src="/images/Church_community_gathering_a97f90e1.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover blur-sm scale-110 opacity-50"
                    aria-hidden="true"
                  />
                  <img
                    src="/images/Church_community_gathering_a97f90e1.png"
                    alt="Worship Area"
                    className="relative w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                    <Sparkles className="w-12 h-12 text-white animate-pulse" />
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 text-white text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                    <p className="font-semibold text-lg">{lang === 'fa' ? 'محل پرستش' : 'Worship Area'}</p>
                  </div>
                </div>
                <div className="gallery-item aspect-video bg-gray-900 rounded-xl overflow-hidden cursor-pointer relative group">
                  <img
                    src="/images/Persian_Christian_choir_singing_bfe3adf8.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover blur-sm scale-110 opacity-50"
                    aria-hidden="true"
                  />
                  <img
                    src="/images/Persian_Christian_choir_singing_bfe3adf8.png"
                    alt="Pulpit View"
                    className="relative w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                    <Sparkles className="w-12 h-12 text-white animate-pulse" />
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 text-white text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                    <p className="font-semibold text-lg">{lang === 'fa' ? 'نمای منبر' : 'Pulpit View'}</p>
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
                <div className="w-full h-80 rounded-xl overflow-hidden">
                  <AIImageSlider
                    autoPlayInterval={8000}
                    showNavigationButtons={true}
                    showIndicators={true}
                    className="w-full h-full"
                  />
                </div>
              </div>
              <div className="flex-1 flex justify-center items-start flex-col">
                <h2 className="font-semibold xs:text-[48px] text-[40px] text-white xs:leading-[76.8px] leading-[66.8px] w-full">{t('aboutTitle')}</h2>
                <p className="font-normal text-dimWhite text-[18px] leading-[30.8px] max-w-[470px] mt-5">{t('aboutParagraph')}</p>
                <Button styles="mt-10" text={t('aboutButton')} to="/about" />
              </div>
            </section>

            {/* Latest Sermon & Interactive Prayer Section */}
            <section className="flex md:flex-row flex-col sm:py-16 py-6 reveal-on-scroll gap-10">
              
              {/* Latest Sermon Player */}
              <div className="flex-[1.5] w-full glass-card p-8 rounded-2xl relative overflow-hidden group border border-white/10 hover:border-white/30 transition-all duration-500">
                <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                
                <h2 className="font-semibold xs:text-[40px] text-[32px] text-white leading-tight mb-2">
                    {lang === 'fa' ? 'آخرین موعظه' : 'Latest Sermon'}
                </h2>
                <p className="text-dimWhite mb-8">{lang === 'fa' ? 'گوش دادن به پیام این هفته' : 'Listen to this week\'s message'}</p>
                
                <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="w-full md:w-1/3 aspect-square rounded-xl overflow-hidden relative shadow-lg">
                        <img src="/images/Persian_Christian_choir_singing_bfe3adf8.png" alt="Sermon thumbnail" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link to="/sermons" className="bg-secondary text-primary rounded-full p-4 transform hover:scale-110 transition-transform shadow-[0_0_20px_rgba(0,246,255,0.5)]">
                                <Play className="w-6 h-6 fill-primary" />
                            </Link>
                        </div>
                    </div>
                    
                    <div className="flex-1 w-full flex flex-col justify-center">
                        <h3 className="text-white text-2xl font-semibold mb-2">{lang === 'fa' ? 'امید در روزهای سخت' : 'Hope in Hard Times'}</h3>
                        <p className="text-secondary text-sm font-medium mb-4">Pastor Sam • 12 Oct 2025</p>
                        <p className="text-dimWhite text-sm line-clamp-3 mb-6">
                            {lang === 'fa' 
                                ? 'در این موعظه بررسی می‌کنیم که چگونه ایمان ما می‌تواند در طوفان‌های زندگی لنگری محکم باشد...' 
                                : 'In this message we explore how our faith can be a strong anchor during the storms of life...'}
                        </p>
                        
                        <div className="flex gap-4">
                            <Link to="/sermons" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full transition-colors border border-white/10 text-sm font-medium">
                                <Play className="w-4 h-4" />
                                {lang === 'fa' ? 'پخش کامل' : 'Play Full Series'}
                            </Link>
                        </div>
                    </div>
                </div>
              </div>

              {/* Interactive Prayer Snippet */}
              <div className="flex-1 w-full glass-card p-8 rounded-2xl border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl"></div>
                
                <div className="flex items-center gap-3 mb-6 relative z-10">
                    <Heart className="w-8 h-8 text-pink-500 animate-pulse" />
                    <h3 className="font-semibold text-[24px] text-white">
                        {lang === 'fa' ? 'دیوار دعا' : 'Prayer Wall'}
                    </h3>
                </div>
                
                <div className="space-y-4 relative z-10">
                    <div className="bg-white/5 p-4 rounded-xl hover:bg-white/10 transition-colors border border-white/5 relative group">
                        <p className="text-dimWhite text-sm mb-3">"{lang === 'fa' ? 'لطفاً برای سلامتی مادرم که در بیمارستان بستری است دعا کنید.' : 'Please pray for my mother\'s health, she is currently in the hospital.'}"</p>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Sara M. • 2h ago</span>
                            <button className="text-xs bg-pink-500/20 text-pink-300 hover:bg-pink-500/40 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1">
                                <Heart className="w-3 h-3" /> {lang === 'fa' ? 'آمین (۱۴)' : 'Pray (14)'}
                            </button>
                        </div>
                    </div>
                    
                    <div className="bg-white/5 p-4 rounded-xl hover:bg-white/10 transition-colors border border-white/5 relative group">
                        <p className="text-dimWhite text-sm mb-3">"{lang === 'fa' ? 'دعا برای آرامش و صلح در خاورمیانه و خانواده‌هایی که آسیب دیده‌اند.' : 'Praying for peace in the Middle East and for the families affected.'}"</p>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Reza K. • 5h ago</span>
                            <button className="text-xs bg-pink-500/20 text-pink-300 hover:bg-pink-500/40 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1">
                                <Heart className="w-3 h-3" /> {lang === 'fa' ? 'آمین (۸۹)' : 'Pray (89)'}
                            </button>
                        </div>
                    </div>
                </div>
                
                <Link to="/prayer-requests" className="block text-center text-sm text-secondary hover:text-white mt-6 transition-colors">
                    {lang === 'fa' ? 'مشاهده همه و ارسال درخواست ->' : 'View all & Submit Request ->'}
                </Link>
              </div>

            </section>

            {/* Testimonials Section */}
            <section className="sm:py-16 py-6 flex justify-center items-center flex-col relative reveal-on-scroll">
              <div className="absolute z-0 w-[60%] h-[60%] -right-[50%] rtl:-left-[50%] rounded-full blue__gradient" />
              <div className="w-full flex justify-between items-center md:flex-row flex-col sm:mb-16 mb-6 relative z-[1]">
                <h2 className="font-semibold xs:text-[48px] text-[40px] text-white xs:leading-[76.8px] leading-[66.8px] w-full">{t('testimonialsTitle')}</h2>
                <div className="w-full md:mt-0 mt-6">
                  <p className={`font-normal text-dimWhite text-[18px] leading-[30.8px] max-w-[450px] ${lang === 'fa' ? 'text-right' : 'text-left'}`}>{t('testimonialsParagraph')}</p>
                </div>
              </div>
              <div className="flex flex-wrap sm:justify-start justify-center w-full feedback-container relative z-[1]">
                <FeedbackCard delay={1} content={t('testimonial1Text')} name={t('testimonial1Name')} title={t('testimonial1Role')} img={DEFAULT_AVATAR_URL} />
                <FeedbackCard delay={2} content={t('testimonial2Text')} name={t('testimonial2Name')} title={t('testimonial2Role')} img={DEFAULT_AVATAR_URL} />
                <FeedbackCard delay={3} content={t('testimonial3Text')} name={t('testimonial3Name')} title={t('testimonial3Role')} img={DEFAULT_AVATAR_URL} />
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