/**
 * Version Selector Component
 * کامپوننت انتخاب نسخه سرود
 */

import React, { useState, useMemo } from 'react';
import {
    Layers,
    Clock,
    Cloud,
    HardDrive,
    Music,
    Edit3,
    Trash2,
    RotateCcw,
    ChevronDown,
    ChevronUp,
    Star,
    Check
} from 'lucide-react';
import { SongVersion, AudioFile } from '../../types/song-version';
import { useLanguage } from '../../context/LanguageContext';

interface VersionSelectorProps {
    versions: SongVersion[];
    selectedVersionId?: string;
    onSelectVersion: (version: SongVersion) => void;
    onEditVersion?: (version: SongVersion) => void;
    onDeleteVersion?: (versionId: string) => void;
    compact?: boolean;
}

const VersionSelector: React.FC<VersionSelectorProps> = ({
    versions,
    selectedVersionId,
    onSelectVersion,
    onEditVersion,
    onDeleteVersion,
    compact = false
}) => {
    const { lang } = useLanguage();
    const [isExpanded, setIsExpanded] = useState(false);

    // نسخه‌های مرتب‌شده (جدیدترین اول)
    const sortedVersions = useMemo(() => {
        return [...versions]
            .filter(v => !v.isDeleted)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [versions]);

    const selectedVersion = sortedVersions.find(v => v.id === selectedVersionId) || sortedVersions[0];

    // فرمت تاریخ
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return lang === 'fa'
            ? date.toLocaleDateString('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' })
            : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    // آیکون منبع
    const SourceIcon = ({ source }: { source: 'server' | 'local' }) => (
        source === 'server'
            ? <Cloud size={14} className="text-blue-400" />
            : <HardDrive size={14} className="text-green-400" />
    );

    // تعداد فایل‌های صوتی
    const getAudioCount = (version: SongVersion) => version.audioFiles?.length || 0;

    if (sortedVersions.length === 0) {
        return (
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <p className="text-gray-500">
                    {lang === 'fa' ? 'هیچ نسخه‌ای موجود نیست' : 'No versions available'}
                </p>
            </div>
        );
    }

    // حالت فشرده (فقط dropdown)
    if (compact) {
        return (
            <div className="relative">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white hover:border-purple-500 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Layers size={16} className="text-purple-400" />
                        <span className="truncate">{selectedVersion?.name}</span>
                        <SourceIcon source={selectedVersion?.source || 'local'} />
                    </div>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {isExpanded && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                        {sortedVersions.map(version => (
                            <button
                                key={version.id}
                                onClick={() => {
                                    onSelectVersion(version);
                                    setIsExpanded(false);
                                }}
                                className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-700 transition-colors ${version.id === selectedVersionId ? 'bg-purple-900/30' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    {version.id === selectedVersionId && (
                                        <Check size={14} className="text-green-400" />
                                    )}
                                    <span className="text-white">{version.name}</span>
                                    <SourceIcon source={version.source} />
                                </div>
                                <span className="text-gray-500 text-xs">{formatDate(version.createdAt)}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // حالت کامل (لیست کارت‌ها)
    return (
        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <Layers size={20} className="text-purple-400" />
                    {lang === 'fa' ? 'نسخه‌های موجود' : 'Available Versions'}
                    <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                        {sortedVersions.length}
                    </span>
                </h4>
            </div>

            {/* Version List */}
            <div className="space-y-2 max-h-80 overflow-y-auto">
                {sortedVersions.map(version => (
                    <div
                        key={version.id}
                        onClick={() => onSelectVersion(version)}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${version.id === selectedVersionId
                            ? 'bg-purple-600/30 border-2 border-purple-500'
                            : 'bg-gray-800/50 border border-gray-600 hover:border-gray-500'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            {/* Info */}
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    {/* Radio button */}
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${version.id === selectedVersionId
                                        ? 'border-purple-500 bg-purple-500'
                                        : 'border-gray-500'
                                        }`}>
                                        {version.id === selectedVersionId && (
                                            <div className="w-2 h-2 bg-white rounded-full" />
                                        )}
                                    </div>

                                    {/* Name */}
                                    <span className="font-medium text-white">{version.name}</span>

                                    {/* Source badge */}
                                    <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${version.source === 'server'
                                        ? 'bg-blue-900/50 text-blue-300'
                                        : 'bg-green-900/50 text-green-300'
                                        }`}>
                                        <SourceIcon source={version.source} />
                                        {version.source === 'server' ? 'سرور' : 'محلی'}
                                    </span>
                                </div>

                                {/* Meta info */}
                                <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <Clock size={12} />
                                        {formatDate(version.createdAt)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Music size={12} />
                                        {getAudioCount(version)} {lang === 'fa' ? 'فایل صوتی' : 'audio files'}
                                    </span>
                                    {version.author && (
                                        <span>
                                            {lang === 'fa' ? 'توسط' : 'by'} {version.author}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 ml-2">
                                {onEditVersion && version.source === 'local' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEditVersion(version);
                                        }}
                                        className="p-1.5 rounded-lg bg-gray-700 hover:bg-blue-600 text-gray-300 hover:text-white transition-colors"
                                        title={lang === 'fa' ? 'ویرایش' : 'Edit'}
                                    >
                                        <Edit3 size={14} />
                                    </button>
                                )}
                                {onDeleteVersion && version.source === 'local' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteVersion(version.id);
                                        }}
                                        className="p-1.5 rounded-lg bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white transition-colors"
                                        title={lang === 'fa' ? 'حذف' : 'Delete'}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VersionSelector;
