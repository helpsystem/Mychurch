
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';

interface Props {
    onFinished: () => void;
}

const LoadingScreen: React.FC<Props> = ({ onFinished }) => {
    const { t, lang } = useLanguage();
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState(0);

    const loadingSteps = [
        { 
            en: "Welcome to Iranian Christian Church of Washington D.C. - A place of faith, fellowship, and worship", 
            fa: "به کلیسای مسیحیان ایرانی واشنگتن دی سی خوش آمدید - مکانی از ایمان، رفاقت و پرستش" 
        },
        { 
            en: "Our mission is to serve God and connect hearts through Persian culture and Christian faith", 
            fa: "ماموریت ما خدمت به خدا و اتصال دل‌ها از طریق فرهنگ ایرانی و ایمان مسیحی است" 
        },
        { 
            en: "Join us for Bible study, worship songs, prayer meetings, and community events", 
            fa: "به ما بپیوندید برای مطالعه کتاب مقدس، سرودهای پرستش، جلسات دعا و رویدادهای اجتماعی" 
        },
        { 
            en: "Experience God's love in both English and Persian - All are welcome in our spiritual family", 
            fa: "عشق خدا را به زبان انگلیسی و فارسی تجربه کنید - همه در خانواده روحانی ما خوش آمدند" 
        },
        { 
            en: "Loading complete - Ready to worship and connect with your church community!", 
            fa: "بارگذاری تکمیل شد - آماده برای عبادت و ارتباط با اجتماع کلیساتان!" 
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 1; // Slower progress for more reading time
            });
        }, 100); // Slower interval

        const stepInterval = setInterval(() => {
            setCurrentStep(prev => (prev + 1) % loadingSteps.length);
        }, 2000); // Increased to 2 seconds for better readability

        return () => {
            clearInterval(interval);
            clearInterval(stepInterval);
        };
    }, []);

    return (
        <div className="loading-container relative overflow-hidden">
            {/* Background Animation */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-20 left-20 w-32 h-32 bg-secondary rounded-full animate-pulse"></div>
                <div className="absolute bottom-20 right-20 w-24 h-24 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-4 border-secondary/30 rounded-full animate-spin"></div>
            </div>

            <div className="loading-box w-auto relative flex justify-center flex-col p-4 z-10">
                {/* Logo Animation */}
                <div className="flex justify-center mb-8">
                    <div className="relative">
                        <div className="w-20 h-20 bg-gradient-to-r from-secondary to-blue-400 rounded-full flex items-center justify-center animate-pulse">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <path d="M12 5v14" />
                                <path d="M7 9h10" />
                            </svg>
                        </div>
                        <div className="absolute -inset-1 bg-gradient-to-r from-secondary to-blue-400 rounded-full blur-lg opacity-30 animate-pulse"></div>
                    </div>
                </div>

                <div className="title w-full relative flex items-center justify-center h-[60px] mb-4">
                    <span className="block"></span>
                    <h1 className="text-center text-3xl font-bold bg-gradient-to-r from-white to-secondary bg-clip-text text-transparent">
                        {t('loadingTitle')}
                    </h1>
                </div>

                <div className="role w-full relative flex items-center justify-center min-h-[80px] mb-6 px-4">
                    <span className="block"></span>
                    <p className="text-center text-base leading-relaxed max-w-2xl mx-auto font-medium" 
                       dir={lang === 'fa' ? 'rtl' : 'ltr'}>
                        {loadingSteps[currentStep][lang]}
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="w-80 max-w-full mx-auto mb-4">
                    <div className="flex justify-between text-xs text-dimWhite mb-2">
                        <span>0%</span>
                        <span>{Math.round(progress)}%</span>
                        <span>100%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-secondary to-blue-400 rounded-full transition-all duration-100 ease-out relative"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-pulse"></div>
                        </div>
                    </div>
                </div>

                {/* Loading Dots */}
                <div className="flex justify-center space-x-2">
                    <div className="w-3 h-3 bg-secondary rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-3 h-3 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
