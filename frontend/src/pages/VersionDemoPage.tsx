/**
 * Version Demo Page
 * صفحه نمایشی سیستم چند نسخه‌ای - تست با سرود آرامی دلهایی
 */

import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    Music,
    Save,
    Plus,
    Trash2,
    FileText,
    Check,
    Play,
    Clock,
    Settings
} from 'lucide-react';
import VersionSelector from '../components/worship/VersionSelector';
import AudioFileSelector from '../components/worship/AudioFileSelector';
import { SongVersion, AudioFile, SongLyrics } from '../types/song-version';
import songVersionManager from '../services/SongVersionManager';
import { useLanguage } from '../context/LanguageContext';

// داده‌های نمونه سرود آرامی دلهایی
const SAMPLE_SONG = {
    id: 335,
    title: { fa: 'آرامی دلهایی', en: 'Aramiye Delha' },
    artist: 'روزبه نجارنژاد'
};

import FullscreenKaraokePlayer from '../components/FullscreenKaraokePlayer';

// نسخه‌های نمونه سرور
const SERVER_VERSIONS: SongVersion[] = [
    {
        id: 'v_google_ai',
        name: '🤖 نسخه هوش مصنوعی گوگل',
        createdAt: new Date().toISOString(),
        source: 'local',
        author: 'Google Cloud AI',
        isDeleted: false,
        deletedAt: null,
        audioFiles: [
            {
                id: 'audio_orig',
                url: '/worship/audio/kalameh/1 Aramiye delhaayee.mp3',
                name: 'نسخه اصلی',
                isDefault: true
            }
        ],
        lyrics: {
            fa: 'آرامی دلهایی\nسازنده دریاها\nروشنی خورشیدی ، زیبایی رویاها\nاز تو امنیت دارم ، در کشمکش طوفان\nمن قایق پوسیده ، تو رهبر این سکان',
            finglish: 'Aramiye delhaayi\nSazande ye daryaha\nRoshani ye khorshidi, zibaayi royaha\nAz to amniyat daaram, dar keshmaesh toofan\nMan ghayegh poosideh, to rahbar in sokaan',
        }
    },
    {
        id: 'v1_2025-01-20_server',
        name: 'نسخه اصلی کلامه',
        createdAt: '2025-01-20T10:00:00Z',
        source: 'server',
        author: 'کلامه',
        isDeleted: false,
        deletedAt: null,
        audioFiles: [
            {
                id: 'audio_orig',
                url: '/worship/audio/kalameh/1 Aramiye delhaayee.mp3',
                name: 'نسخه اصلی',
                isDefault: true
            }
        ],
        lyrics: {
            fa: 'آرامــی دلــهــایــی\nســـازنــده‌ی دریــاهـا\nروشنی خورشیدی ، زیبایی رویاها\nاز تو امنیت دارم ، در کشمکش طوفان\nمن قایق پوسیده ، تو رهبر این سکان',
            finglish: 'Aramiye delhaayi\nSazande ye daryaha\nRoshani ye khorshidi, zibaayi royaha\nAz to amniyat daaram, dar keshmaesh toofan\nMan ghayegh poosideh, to rahbar in sokaan',
            en: 'You are the calm of hearts\nCreator of the seas\nSunshine brightness, beauty of dreams\nI have safety in you, in the storm\'s struggle\nI am a worn-out boat, you are the leader of this helm'
        },
        lyricsWithChords: 'آر[D]امــی دلــهــایــی[Bm]\nســـازنــده‌ی دریــاهـ[G]ـا\nروشنی خورشید[A]ی ، زیبایی رویاهـ[D]ـا'
    },
    {
        id: 'v2_2025-01-22_server',
        name: 'نسخه کلیسای تهران',
        createdAt: '2025-01-22T15:30:00Z',
        source: 'server',
        author: 'کلیسای تهران',
        isDeleted: false,
        deletedAt: null,
        audioFiles: [
            {
                id: 'audio_tehran1',
                url: '/worship/audio/kalameh/1 Aramiye delhaayee.mp3',
                name: 'اجرای استودیو',
                isDefault: true
            },
            {
                id: 'audio_tehran2',
                url: '/worship/audio/kalameh/1 Aramiye delhaayee.mp3',
                name: 'اجرای زنده',
                isDefault: false
            }
        ],
        lyrics: {
            fa: 'آرامــی دلــهــایــی\nســـازنــده‌ی دریــاهـا',
            finglish: 'Aramiye delhaayi\nSazande ye daryaha'
        }
    }
];

const VersionDemoPage: React.FC = () => {
    const { lang } = useLanguage();
    const [versions, setVersions] = useState<SongVersion[]>([]);
    const [selectedVersion, setSelectedVersion] = useState<SongVersion | null>(null);
    const [selectedAudio, setSelectedAudio] = useState<AudioFile | null>(null);
    const [showEditor, setShowEditor] = useState(false);
    const [showPlayer, setShowPlayer] = useState(false);

    // وضعیت ادیتور
    const [editName, setEditName] = useState('');
    const [editLyricsFa, setEditLyricsFa] = useState('');
    const [editLyricsFinglish, setEditLyricsFinglish] = useState('');
    const [editLyricsEn, setEditLyricsEn] = useState('');
    const [editLyricsWithChords, setEditLyricsWithChords] = useState('');

    // بارگذاری نسخه‌ها
    useEffect(() => {
        loadVersions();
    }, []);

    const loadVersions = async () => {
        const allVersions = await songVersionManager.getSongVersions(
            SAMPLE_SONG.id,
            SERVER_VERSIONS
        );
        setVersions(allVersions);
        if (allVersions.length > 0 && !selectedVersion) {
            setSelectedVersion(allVersions[0]);
            const defaultAudio = allVersions[0].audioFiles.find(a => a.isDefault);
            setSelectedAudio(defaultAudio || allVersions[0].audioFiles[0]);
        }
    };

    // انتخاب نسخه
    const handleSelectVersion = (version: SongVersion) => {
        setSelectedVersion(version);
        const defaultAudio = version.audioFiles.find(a => a.isDefault);
        setSelectedAudio(defaultAudio || version.audioFiles[0]);
    };

    // ویرایش نسخه
    const handleEditVersion = (version: SongVersion) => {
        setEditName(`کپی از ${version.name}`);
        setEditLyricsFa(version.lyrics.fa);
        setEditLyricsFinglish(version.lyrics.finglish || '');
        setEditLyricsEn(version.lyrics.en || '');
        setEditLyricsWithChords(version.lyricsWithChords || '');
        setShowEditor(true);
    };

    // ذخیره نسخه جدید
    const handleSaveNewVersion = () => {
        const result = songVersionManager.saveVersion(
            SAMPLE_SONG.id,
            SAMPLE_SONG.title.fa,
            {
                name: editName || `نسخه ${new Date().toLocaleDateString('fa-IR')}`,
                lyrics: {
                    fa: editLyricsFa,
                    finglish: editLyricsFinglish,
                    en: editLyricsEn
                },
                lyricsWithChords: editLyricsWithChords,
                audioFiles: selectedVersion?.audioFiles || []
            }
        );

        if (result.success) {
            alert(lang === 'fa' ? '✅ نسخه جدید ذخیره شد!' : '✅ New version saved!');
            setShowEditor(false);
            loadVersions();
        } else {
            alert(lang === 'fa' ? '❌ خطا در ذخیره' : '❌ Error saving');
        }
    };

    // حذف نسخه
    const handleDeleteVersion = (versionId: string) => {
        if (confirm(lang === 'fa' ? 'آیا مطمئن هستید؟ نسخه به سطل زباله منتقل می‌شود.' : 'Are you sure? Version will be moved to trash.')) {
            songVersionManager.deleteVersion(SAMPLE_SONG.id, SAMPLE_SONG.title.fa, versionId);
            loadVersions();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 text-white">
            {/* Header */}
            <div className="bg-gray-900/80 border-b border-gray-700 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => window.history.back()}
                            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold">{SAMPLE_SONG.title.fa}</h1>
                            <p className="text-gray-400 text-sm">{SAMPLE_SONG.artist}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowEditor(true)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2"
                    >
                        <Plus size={18} />
                        {lang === 'fa' ? 'نسخه جدید' : 'New Version'}
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Version Selector */}
                    <div className="lg:col-span-1 space-y-6">
                        <VersionSelector
                            versions={versions}
                            selectedVersionId={selectedVersion?.id}
                            onSelectVersion={handleSelectVersion}
                            onEditVersion={handleEditVersion}
                            onDeleteVersion={handleDeleteVersion}
                        />

                        {/* Audio Selector */}
                        {selectedVersion && (
                            <AudioFileSelector
                                audioFiles={selectedVersion.audioFiles}
                                selectedAudioId={selectedAudio?.id}
                                onSelectAudio={setSelectedAudio}
                                editable={selectedVersion.source === 'local'}
                            />
                        )}
                    </div>

                    {/* Right: Content Preview */}
                    <div className="lg:col-span-2 space-y-6">
                        {selectedVersion ? (
                            <>
                                {/* Version Info */}
                                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-bold flex items-center gap-2">
                                            <FileText size={20} className="text-purple-400" />
                                            {selectedVersion.name}
                                        </h3>
                                        <span className={`px-3 py-1 rounded-full text-sm ${selectedVersion.source === 'server'
                                            ? 'bg-blue-900/50 text-blue-300'
                                            : 'bg-green-900/50 text-green-300'
                                            }`}>
                                            {selectedVersion.source === 'server' ? '☁️ سرور' : '💾 محلی'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Clock size={14} />
                                            {new Date(selectedVersion.createdAt).toLocaleDateString('fa-IR')}
                                        </span>
                                        {selectedVersion.author && (
                                            <span>توسط {selectedVersion.author}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Lyrics Preview - 4 Sections */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Persian */}
                                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                                        <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                                            🇮🇷 متن فارسی
                                        </h4>
                                        <div className="text-white whitespace-pre-wrap text-sm leading-relaxed" dir="rtl">
                                            {selectedVersion.lyrics.fa || '(خالی)'}
                                        </div>
                                    </div>

                                    {/* Finglish */}
                                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                                        <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                                            🔤 فینگلیش
                                        </h4>
                                        <div className="text-purple-300 whitespace-pre-wrap text-sm leading-relaxed font-mono">
                                            {selectedVersion.lyrics.finglish || '(خالی)'}
                                        </div>
                                    </div>

                                    {/* English */}
                                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                                        <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                                            🌐 انگلیسی
                                        </h4>
                                        <div className="text-teal-300 whitespace-pre-wrap text-sm leading-relaxed">
                                            {selectedVersion.lyrics.en || '(خالی)'}
                                        </div>
                                    </div>

                                    {/* With Chords */}
                                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                                        <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                                            🎸 با آکورد
                                        </h4>
                                        <div className="text-orange-300 whitespace-pre-wrap text-sm leading-relaxed font-mono" dir="rtl">
                                            {selectedVersion.lyricsWithChords || '(خالی)'}
                                        </div>
                                    </div>
                                </div>

                                {/* Play Buttons */}
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => {
                                            if (selectedAudio) {
                                                const audio = new Audio(selectedAudio.url);
                                                audio.play();
                                            }
                                        }}
                                        className="flex-1 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-lg flex items-center justify-center gap-3"
                                    >
                                        <Music size={24} />
                                        {lang === 'fa' ? 'فقط پخش صدا' : 'Play Audio Only'}
                                    </button>

                                    <button
                                        onClick={() => setShowPlayer(true)}
                                        className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-purple-900/50"
                                    >
                                        <Play size={24} />
                                        {lang === 'fa' ? 'اجرای کاروکه (متن هماهنگ)' : 'Start Karaoke Mode'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="bg-gray-800/50 rounded-xl p-12 text-center">
                                <Music size={48} className="text-gray-500 mx-auto mb-4" />
                                <p className="text-gray-500">
                                    {lang === 'fa' ? 'یک نسخه انتخاب کنید' : 'Select a version'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Editor Modal */}
            {showEditor && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold">
                                {lang === 'fa' ? '✏️ ایجاد نسخه جدید' : '✏️ Create New Version'}
                            </h2>
                            <button
                                onClick={() => setShowEditor(false)}
                                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Version Name */}
                            <div>
                                <label className="block text-gray-300 mb-2 font-medium">
                                    {lang === 'fa' ? 'نام نسخه' : 'Version Name'}
                                </label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                                    placeholder={lang === 'fa' ? 'مثال: نسخه کلیسای من' : 'Example: My church version'}
                                />
                            </div>

                            {/* 4 Textareas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-300 mb-2 font-medium">🇮🇷 متن فارسی</label>
                                    <textarea
                                        value={editLyricsFa}
                                        onChange={(e) => setEditLyricsFa(e.target.value)}
                                        rows={8}
                                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none resize-none"
                                        dir="rtl"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-300 mb-2 font-medium">🔤 فینگلیش</label>
                                    <textarea
                                        value={editLyricsFinglish}
                                        onChange={(e) => setEditLyricsFinglish(e.target.value)}
                                        rows={8}
                                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white font-mono focus:border-purple-500 focus:outline-none resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-300 mb-2 font-medium">🌐 انگلیسی</label>
                                    <textarea
                                        value={editLyricsEn}
                                        onChange={(e) => setEditLyricsEn(e.target.value)}
                                        rows={8}
                                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-300 mb-2 font-medium">🎸 با آکورد</label>
                                    <textarea
                                        value={editLyricsWithChords}
                                        onChange={(e) => setEditLyricsWithChords(e.target.value)}
                                        rows={8}
                                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white font-mono focus:border-orange-500 focus:outline-none resize-none"
                                        dir="rtl"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-4">
                                <button
                                    onClick={() => setShowEditor(false)}
                                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg"
                                >
                                    {lang === 'fa' ? 'لغو' : 'Cancel'}
                                </button>
                                <button
                                    onClick={handleSaveNewVersion}
                                    className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2"
                                >
                                    <Save size={18} />
                                    {lang === 'fa' ? 'ذخیره نسخه جدید' : 'Save New Version'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Fullscreen Player */}
            {showPlayer && selectedVersion && (
                <FullscreenKaraokePlayer
                    songId={selectedVersion.id === 'v_google_ai' ? '335_AUTO' : SAMPLE_SONG.id} // Hack to load AI timing
                    title={selectedVersion.id === 'v_google_ai' ? 'آرامی دلهایی (تایمینگ AI)' : SAMPLE_SONG.title.fa}
                    artist={SAMPLE_SONG.artist}
                    audioUrl={selectedAudio?.url}
                    lyrics={selectedVersion.lyrics.fa}
                    originalLyricsWithChords={selectedVersion.lyricsWithChords}
                    onClose={() => setShowPlayer(false)}
                    lang={lang === 'fa' ? 'fa' : 'en'}
                />
            )}
        </div>
    );
};

export default VersionDemoPage;
