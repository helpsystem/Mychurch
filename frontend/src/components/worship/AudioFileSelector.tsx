/**
 * Audio File Selector Component
 * کامپوننت انتخاب فایل صوتی از لیست
 */

import React, { useState } from 'react';
import {
    Music,
    Star,
    StarOff,
    Play,
    Trash2,
    Plus,
    Check,
    Volume2
} from 'lucide-react';
import { AudioFile } from '../../types/song-version';
import { useLanguage } from '../../context/LanguageContext';

interface AudioFileSelectorProps {
    audioFiles: AudioFile[];
    selectedAudioId?: string;
    onSelectAudio: (audio: AudioFile) => void;
    onSetDefault?: (audioId: string) => void;
    onRemoveAudio?: (audioId: string) => void;
    onAddAudio?: () => void;
    editable?: boolean;
}

const AudioFileSelector: React.FC<AudioFileSelectorProps> = ({
    audioFiles,
    selectedAudioId,
    onSelectAudio,
    onSetDefault,
    onRemoveAudio,
    onAddAudio,
    editable = false
}) => {
    const { lang } = useLanguage();
    const [playingId, setPlayingId] = useState<string | null>(null);

    // فایل پیش‌فرض
    const defaultAudio = audioFiles.find(a => a.isDefault) || audioFiles[0];
    const selectedAudio = audioFiles.find(a => a.id === selectedAudioId) || defaultAudio;

    // پیش‌نمایش صدا (3 ثانیه)
    const previewAudio = (audio: AudioFile) => {
        const audioElement = new Audio(audio.url);
        audioElement.play();
        setPlayingId(audio.id);

        setTimeout(() => {
            audioElement.pause();
            audioElement.currentTime = 0;
            setPlayingId(null);
        }, 3000);
    };

    // فرمت مدت زمان
    const formatDuration = (seconds?: number) => {
        if (!seconds) return '';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (audioFiles.length === 0) {
        return (
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <Music size={24} className="text-gray-500 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">
                    {lang === 'fa' ? 'فایل صوتی موجود نیست' : 'No audio files'}
                </p>
                {editable && onAddAudio && (
                    <button
                        onClick={onAddAudio}
                        className="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm flex items-center gap-2 mx-auto"
                    >
                        <Plus size={16} />
                        {lang === 'fa' ? 'افزودن فایل' : 'Add File'}
                    </button>
                )}
            </div>
        );
    }

    // اگر فقط یک فایل داریم
    if (audioFiles.length === 1 && !editable) {
        return (
            <div className="bg-gray-800/50 rounded-lg p-3 flex items-center gap-3">
                <Music size={20} className="text-purple-400" />
                <div className="flex-1">
                    <span className="text-white text-sm">{audioFiles[0].name || 'فایل صوتی'}</span>
                    {audioFiles[0].duration && (
                        <span className="text-gray-500 text-xs ml-2">
                            {formatDuration(audioFiles[0].duration)}
                        </span>
                    )}
                </div>
                <button
                    onClick={() => previewAudio(audioFiles[0])}
                    className="p-2 rounded-lg bg-gray-700 hover:bg-purple-600 text-white transition-colors"
                >
                    {playingId === audioFiles[0].id ? (
                        <Volume2 size={16} className="animate-pulse" />
                    ) : (
                        <Play size={16} />
                    )}
                </button>
            </div>
        );
    }

    return (
        <div className="bg-gray-800/50 rounded-lg p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <Music size={16} className="text-purple-400" />
                    {lang === 'fa' ? 'فایل‌های صوتی' : 'Audio Files'}
                    <span className="text-xs bg-gray-600 px-2 py-0.5 rounded">
                        {audioFiles.length}
                    </span>
                </h5>
                {editable && onAddAudio && (
                    <button
                        onClick={onAddAudio}
                        className="text-xs px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded flex items-center gap-1"
                    >
                        <Plus size={12} />
                        {lang === 'fa' ? 'افزودن' : 'Add'}
                    </button>
                )}
            </div>

            {/* Audio List */}
            <div className="space-y-2">
                {audioFiles.map(audio => (
                    <div
                        key={audio.id}
                        onClick={() => onSelectAudio(audio)}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${audio.id === selectedAudioId
                            ? 'bg-purple-600/30 border border-purple-500'
                            : 'bg-gray-700/50 hover:bg-gray-700 border border-transparent'
                            }`}
                    >
                        {/* Selection indicator */}
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${audio.id === selectedAudioId
                            ? 'border-purple-500 bg-purple-500'
                            : 'border-gray-500'
                            }`}>
                            {audio.id === selectedAudioId && (
                                <Check size={10} className="text-white" />
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-white text-sm truncate">{audio.name}</span>
                                {audio.isDefault && (
                                    <Star size={12} className="text-yellow-400 flex-shrink-0" fill="currentColor" />
                                )}
                            </div>
                            {audio.duration && (
                                <span className="text-gray-500 text-xs">
                                    {formatDuration(audio.duration)}
                                </span>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                            {/* Preview */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    previewAudio(audio);
                                }}
                                className={`p-1.5 rounded ${playingId === audio.id
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                                    }`}
                                title={lang === 'fa' ? 'پیش‌نمایش' : 'Preview'}
                            >
                                {playingId === audio.id ? (
                                    <Volume2 size={14} className="animate-pulse" />
                                ) : (
                                    <Play size={14} />
                                )}
                            </button>

                            {/* Set Default */}
                            {editable && onSetDefault && !audio.isDefault && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSetDefault(audio.id);
                                    }}
                                    className="p-1.5 rounded bg-gray-600 hover:bg-yellow-600 text-gray-300 hover:text-white"
                                    title={lang === 'fa' ? 'تنظیم به عنوان پیش‌فرض' : 'Set as default'}
                                >
                                    <StarOff size={14} />
                                </button>
                            )}

                            {/* Remove */}
                            {editable && onRemoveAudio && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveAudio(audio.id);
                                    }}
                                    className="p-1.5 rounded bg-gray-600 hover:bg-red-600 text-gray-300 hover:text-white"
                                    title={lang === 'fa' ? 'حذف' : 'Remove'}
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AudioFileSelector;
