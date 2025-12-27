import React from 'react';
import { BookOpen, Headphones, Box, Layout } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

export type BibleMode = 'read' | 'listen' | 'immersive';

interface BibleModeSelectorProps {
    currentMode: BibleMode;
    onModeChange: (mode: BibleMode) => void;
}

const BibleModeSelector: React.FC<BibleModeSelectorProps> = ({ currentMode, onModeChange }) => {
    const { lang } = useLanguage();

    const modes = [
        {
            id: 'read',
            label: lang === 'fa' ? 'مطالعه' : 'Read',
            icon: BookOpen,
            description: lang === 'fa' ? 'متن دوزبانه و تفسیر' : 'Bilingual text & study'
        },
        {
            id: 'listen',
            label: lang === 'fa' ? 'شنیداری' : 'Listen',
            icon: Headphones,
            description: lang === 'fa' ? 'همخوانی و صوت' : 'Synchronized & Audio'
        },
        {
            id: 'immersive',
            label: lang === 'fa' ? 'سه‌بعدی' : 'Immersive',
            icon: Box,
            description: lang === 'fa' ? 'کتاب ورق‌زن' : '3D Flipbook'
        }
    ] as const;

    return (
        <div className="flex flex-wrap justify-center gap-4 p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg">
            {modes.map((mode) => {
                const isActive = currentMode === mode.id;
                const Icon = mode.icon;

                return (
                    <button
                        key={mode.id}
                        onClick={() => onModeChange(mode.id as BibleMode)}
                        className={`
              relative flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-300
              ${isActive
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md scale-105'
                                : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-blue-600 border border-gray-200'}
            `}
                    >
                        <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
                        <div className="text-left rtl:text-right">
                            <div className={`font-bold text-sm ${isActive ? 'text-white' : 'text-gray-800'}`}>
                                {mode.label}
                            </div>
                            <div className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
                                {mode.description}
                            </div>
                        </div>
                        {isActive && (
                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full shadow-[0_0_8px_2px_rgba(59,130,246,0.5)]" />
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default BibleModeSelector;
