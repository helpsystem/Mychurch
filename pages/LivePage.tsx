import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { Tv } from 'lucide-react';

const LivePage: React.FC = () => {
    const { t } = useLanguage();
    
    // Placeholder YouTube video ID for the live stream or last service
    const videoId = "nQWFzMvCfLE";

    return (
        <div className="sm:px-16 px-6 sm:py-12 py-4 max-w-5xl mx-auto">
            <div className="text-center mb-8">
                <h1 className="font-semibold text-4xl md:text-5xl text-white mb-2 text-gradient">
                    {t('liveStreamTitle')}
                </h1>
                <p className="font-normal text-dimWhite text-lg max-w-2xl mx-auto">
                    {t('liveStreamDescription')}
                </p>
            </div>

            <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-800 feature-card">
                 <iframe 
                    width="100%" 
                    height="100%" 
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&showinfo=0&iv_load_policy=3&modestbranding=1`}
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowFullScreen
                ></iframe>
            </div>

            <div className="mt-8 text-center bg-black-gradient p-6 rounded-2xl">
                 <div className="flex items-center justify-center gap-3 text-lg text-dimWhite">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <span>{t('streamOffline')}</span>
                 </div>
            </div>
        </div>
    );
};

export default LivePage;