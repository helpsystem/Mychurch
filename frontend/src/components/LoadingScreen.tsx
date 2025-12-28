
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import './LoadingScreen.css';

interface Props {
    onFinished: () => void;
}

const LoadingScreen: React.FC<Props> = ({ onFinished }) => {
    const { t, lang } = useLanguage();
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState(0);

    // 📱 Allow tap/click to skip loading
    const handleSkip = () => {
        sessionStorage.setItem('app_loaded', 'true');
        onFinished();
    };

    const loadingSteps = [
        { 
            en: "✝ Welcome to Iranian Christian Church of D.C. - Where Faith Meets Fellowship", 
            fa: "✝ به کلیسای مسیحیان ایرانی واشنگتن دی سی خوش آمدید - جایی که ایمان با رفاقت ملاقات می‌کند" 
        },
        { 
            en: "🙏 Serving God and Connecting Hearts Through Persian Culture & Christian Faith", 
            fa: "🙏 خدمت به خدا و اتصال دل‌ها از طریق فرهنگ ایرانی و ایمان مسیحی" 
        },
        { 
            en: "📖 Join Us for Bible Study, Worship, Prayer Meetings & Community Events", 
            fa: "📖 به ما بپیوندید برای مطالعه کتاب مقدس، پرستش، دعا و رویدادهای اجتماعی" 
        },
        { 
            en: "❤️ Experience God's Love in English & Persian - All Are Welcome!", 
            fa: "❤️ عشق خدا را به زبان انگلیسی و فارسی تجربه کنید - همه خوش آمدند!" 
        },
        { 
            en: "🌟 Ready to Worship and Connect with Your Church Community!", 
            fa: "🌟 آماده برای عبادت و ارتباط با اجتماع کلیسای شما!" 
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(() => onFinished(), 300); // 🚀 کاهش از 800 به 300
                    return 100;
                }
                return prev + 3; // 🚀 سریع‌تر: 3% در هر مرحله (قبلاً 1.5%)
            });
        }, 50); // 🚀 هر 50 میلی‌ثانیه (قبلاً 60)

        const stepInterval = setInterval(() => {
            setCurrentStep(prev => (prev + 1) % loadingSteps.length);
        }, 2000); // 🚀 2 ثانیه برای هر پیام (قبلاً 3)

        return () => {
            clearInterval(interval);
            clearInterval(stepInterval);
        };
    }, [onFinished, loadingSteps.length]);

    return (
        <div className="loading-container-modern" onClick={handleSkip} role="button" aria-label="Tap to skip loading">
            {/* 📱 Tap anywhere to skip */}
            <div className="absolute top-6 right-6 text-white/60 text-sm animate-pulse z-20">
                {lang === 'fa' ? '👆 بزنید برای رد شدن' : '👆 Tap to skip'}
            </div>
            {/* Animated Background */}
            <div className="loading-bg-animation">
                <div className="loading-circle loading-circle-1"></div>
                <div className="loading-circle loading-circle-2"></div>
                <div className="loading-circle loading-circle-3"></div>
                <div className="loading-particle"></div>
                <div className="loading-particle" style={{ animationDelay: '0.5s' }}></div>
                <div className="loading-particle" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* Main Content */}
            <div className="loading-content">
                {/* Jesus Christ Cross Logo with Glow */}
                <div className="loading-logo-container">
                    <div className="loading-cross-glow"></div>
                    <div className="loading-cross">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" className="cross-svg">
                            <defs>
                                <linearGradient id="crossGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" style={{ stopColor: '#60a5fa', stopOpacity: 1 }} />
                                    <stop offset="50%" style={{ stopColor: '#a855f7', stopOpacity: 1 }} />
                                    <stop offset="100%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
                                </linearGradient>
                            </defs>
                            <path d="M12 2v20" stroke="url(#crossGradient)" strokeWidth="3" strokeLinecap="round" />
                            <path d="M5 9h14" stroke="url(#crossGradient)" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                    </div>
                    <div className="loading-ring loading-ring-1"></div>
                    <div className="loading-ring loading-ring-2"></div>
                    <div className="loading-ring loading-ring-3"></div>
                </div>

                {/* Title */}
                <h1 className="loading-title">
                    <span className="loading-title-text">{lang === 'fa' ? 'عیسی مسیح' : 'Jesus Christ'}</span>
                </h1>

                {/* Subtitle */}
                <p className="loading-subtitle">{t('loadingTitle')}</p>

                {/* Message */}
                <div className="loading-message" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
                    <p className="loading-step-text">{loadingSteps[currentStep][lang]}</p>
                </div>

                {/* Progress Bar */}
                <div className="loading-progress-container">
                    <div className="loading-progress-labels">
                        <span>0%</span>
                        <span className="loading-progress-current">{Math.round(progress)}%</span>
                        <span>100%</span>
                    </div>
                    <div className="loading-progress-bar">
                        <div className="loading-progress-fill" style={{ width: `${progress}%` }}>
                            <div className="loading-progress-shine"></div>
                        </div>
                        <div className="loading-progress-glow" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>

                {/* Loading Dots */}
                <div className="loading-dots">
                    <div className="loading-dot"></div>
                    <div className="loading-dot" style={{ animationDelay: '0.2s' }}></div>
                    <div className="loading-dot" style={{ animationDelay: '0.4s' }}></div>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
