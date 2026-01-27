/**
 * Song Version Management Types
 * سیستم چند نسخه‌ای برای سرودها
 */

// فایل صوتی
export interface AudioFile {
    id: string;
    url: string;
    name: string;
    isDefault: boolean;
    duration?: number; // مدت زمان به ثانیه
    addedAt?: string;
}

// تایمینگ کلمه
export interface TimingWord {
    word: string;
    start_time: number;
    end_time: number;
}

// خط تایمینگ
export interface TimingLine {
    type?: 'verse' | 'chorus' | 'bridge' | 'tag';
    content: string;
    words: TimingWord[];
    finglish?: string;
    english?: string;
}

// متادیتای تایمینگ
export interface TimingMetadata {
    songId: number;
    title?: string;
    duration?: number;
    wordCount?: number;
    lineCount?: number;
    recordedDate?: string;
}

// داده تایمینگ کامل
export interface TimingData {
    metadata: TimingMetadata;
    words: TimingWord[];
    lines: TimingLine[];
}

// متون سرود
export interface SongLyrics {
    fa: string;        // متن فارسی خالص
    finglish?: string; // فینگلیش
    en?: string;       // انگلیسی
}

// نسخه سرود
export interface SongVersion {
    id: string;                    // مثل: v1_2026-01-20_server
    name: string;                  // نام نسخه
    createdAt: string;             // ISO date string
    updatedAt?: string;            // آخرین ویرایش
    source: 'server' | 'local';    // منبع ذخیره‌سازی
    author?: string;               // سازنده

    // وضعیت حذف
    isDeleted: boolean;
    deletedAt?: string | null;     // تاریخ حذف (برای سطل زباله)

    // فایل‌های صوتی
    audioFiles: AudioFile[];

    // متون
    lyrics: SongLyrics;
    lyricsWithChords?: string;     // متن با آکورد

    // تایمینگ
    timing?: TimingData;
}

// اطلاعات پایه سرود
export interface SongMetadata {
    id: number;
    title: { fa: string; en?: string };
    artist?: string;
    composer?: string;
    chord?: string;
    mode?: string;
    category?: string;
    tags?: string[];
    youtubeId?: string;
    slug?: string;
    dateAdded?: string;
}

// سرود کامل با نسخه‌ها
export interface SongWithVersions {
    metadata: SongMetadata;
    versions: SongVersion[];
    defaultVersionId?: string;     // نسخه پیش‌فرض برای پخش
}

// فیلتر برای لیست نسخه‌ها
export interface VersionFilter {
    source?: 'server' | 'local' | 'all';
    includeDeleted?: boolean;
    sortBy?: 'createdAt' | 'name' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
}

// نتیجه ذخیره
export interface SaveVersionResult {
    success: boolean;
    versionId?: string;
    error?: string;
}

// آیتم سطل زباله
export interface TrashItem {
    songId: number;
    songTitle: string;
    version: SongVersion;
    daysRemaining: number; // روزهای باقیمانده تا حذف کامل
}

// تنظیمات سطل زباله
export const TRASH_RETENTION_DAYS = 30;

// کلید localStorage
export const LOCAL_VERSIONS_KEY = 'worship_song_versions';
export const LOCAL_TRASH_KEY = 'worship_song_trash';
