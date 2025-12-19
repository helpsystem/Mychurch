import React, { useEffect, useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const LivePage: React.FC = () => {
    const { t } = useLanguage();
    const [liveSermon, setLiveSermon] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLiveSermon = async () => {
            const { data } = await supabase
                .from('sermons')
                .select('*')
                .eq('is_live', true)
                .single();

            setLiveSermon(data);
            setLoading(false);
        };

        fetchLiveSermon();

        // Realtime subscription? Maybe overkill for now, but nice.
        const channel = supabase
            .channel('public:sermons')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sermons' }, fetchLiveSermon)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Fallback if no live sermon
    const videoId = liveSermon?.youtube_id || "nQWFzMvCfLE";
    const isLive = !!liveSermon;

    return (
        <div className="sm:px-16 px-6 sm:py-12 py-4 max-w-5xl mx-auto">
            <div className="text-center mb-8">
                <h1 className="font-semibold text-4xl md:text-5xl text-white mb-2 text-gradient">
                    {isLive ? t('liveStreamTitle') : 'Online Services'}
                </h1>
                <p className="font-normal text-dimWhite text-lg max-w-2xl mx-auto">
                    {isLive ? liveSermon.title : t('liveStreamDescription')}
                </p>
            </div>

            <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-800 feature-card relative">
                <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=${isLive ? 1 : 0}&rel=0&showinfo=0&iv_load_policy=3&modestbranding=1`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                ></iframe>
                {isLive && (
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse flex items-center gap-2">
                        <span className="w-2 h-2 bg-white rounded-full"></span>
                        LIVE
                    </div>
                )}
            </div>

            <div className="mt-8 text-center bg-black-gradient p-6 rounded-2xl">
                <div className="flex items-center justify-center gap-3 text-lg text-dimWhite">
                    {isLive ? (
                        <>
                            <span className="text-red-500 font-bold">● Streaming Now</span>
                            <span>- {liveSermon.preacher}</span>
                        </>
                    ) : (
                        <>
                            <span className="relative flex h-3 w-3">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-gray-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-500"></span>
                            </span>
                            <span>{t('streamOffline')}</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LivePage;