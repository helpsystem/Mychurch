import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import BibleModeSelector, { BibleMode } from '../components/BibleModeSelector';
import UnifiedBibleReader from '../components/UnifiedBibleReader';
import BibleKaraokeMode from '../components/BibleKaraokeMode';
import BibleImmersiveMode from '../components/BibleImmersiveMode';

const BibleUnifiedPage: React.FC = () => {
    const { lang } = useLanguage();
    const [mode, setMode] = useState<BibleMode>('read');

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            {/* Top Navigation Bar */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                            {lang === 'fa' ? 'کتاب مقدس' : 'Holy Bible'}
                        </h1>

                        <BibleModeSelector currentMode={mode} onModeChange={setMode} />
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                {mode === 'read' && (
                    <div className="animate-fadeIn">
                        <UnifiedBibleReader />
                    </div>
                )}

                {mode === 'listen' && (
                    <div className="animate-fadeIn">
                        <BibleKaraokeMode />
                    </div>
                )}

                {mode === 'immersive' && (
                    <div className="animate-fadeIn">
                        <BibleImmersiveMode />
                    </div>
                )}
            </div>
        </div>
    );
};

export default BibleUnifiedPage;
