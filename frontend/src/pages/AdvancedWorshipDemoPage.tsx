import React, { useState, useEffect } from 'react';
import { SmartWorshipPlayer } from '../components/worship/SmartWorshipPlayer';
import { SystemTimingV2 } from '../types/worship-sync';
import { Loader2 } from 'lucide-react';

const AdvancedWorshipDemoPage: React.FC = () => {
    const [timingData, setTimingData] = useState<SystemTimingV2 | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Song 335 Config
    const songId = 335;
    const audioUrl = '/worship/audio/kalameh/1 Aramiye delhaayee.mp3'; // Fixed path
    const timingUrl = '/worship/data/timings/song_335_timing.json';

    useEffect(() => {
        const loadData = async () => {
            try {
                console.log('🔍 Loading timing data from:', timingUrl);
                // Determine base URL if needed, or relative
                const response = await fetch(timingUrl);
                if (!response.ok) throw new Error('Failed to load timing file');
                const data = await response.json();
                console.log('✅ Timing data loaded successfully:', data);
                setTimingData(data);
            } catch (err) {
                console.error("❌ Error loading demo data:", err);
                setError("Failed to load song data. Please ensure 'song_335_timing.json' exists.");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // For demo purposes, we can verify audio exists or just let the player handle it
    // The player will try to load audioSrc

    return (
        <div className="min-h-screen bg-slate-900 pt-24 px-4 pb-12">
            <div className="max-w-5xl mx-auto space-y-8">
                <header className="text-center space-y-4">
                    <h1 className="text-4xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-indigo-500">
                        نمایشگر هوشمند سرودهای پرستشی
                    </h1>
                    <p className="text-slate-400">دموی زنده سرود ۳۳۵: آرامی دلهایی</p>
                </header>

                {loading && (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-teal-500" />
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-200 text-center">
                        {error}
                    </div>
                )}

                {timingData && (
                    <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                        <SmartWorshipPlayer
                            timingData={timingData}
                            audioSrc={audioUrl}
                            title="آرامی دلهایی - رویا نجارنژاد"
                            backgroundImage="/images/worship/worship-bg-1.jpg" // Ensure this image exists or fallback works
                        />
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-300 text-sm">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <h3 className="font-bold text-white mb-2">هماهنگی دقیق (۰.۰۱ ثانیه)</h3>
                        <p>تکنولوژی جدید ما کلمات را با دقت صدم ثانیه با صدا هماهنگ می‌کند.</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <h3 className="font-bold text-white mb-2">ترجمه Finglish زنده</h3>
                        <p>همزمان با متن فارسی، متن فینگلیش نمایش داده می‌شود تا همه بتوانند پرستش کنند.</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <h3 className="font-bold text-white mb-2">تجربه سینمایی</h3>
                        <p>انیمیشن‌های نرم و حالت تمام صفحه برای استفاده در کلیسا و پخش زنده.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvancedWorshipDemoPage;
