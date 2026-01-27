/**
 * Song Version Manager Service
 * مدیریت نسخه‌های سرود - ذخیره، بازیابی، حذف
 */

import {
    SongVersion,
    SongWithVersions,
    SongMetadata,
    AudioFile,
    SongLyrics,
    TimingData,
    VersionFilter,
    SaveVersionResult,
    TrashItem,
    TRASH_RETENTION_DAYS,
    LOCAL_VERSIONS_KEY,
    LOCAL_TRASH_KEY
} from '../types/song-version';

class SongVersionManager {
    private static instance: SongVersionManager;

    private constructor() { }

    static getInstance(): SongVersionManager {
        if (!SongVersionManager.instance) {
            SongVersionManager.instance = new SongVersionManager();
        }
        return SongVersionManager.instance;
    }

    // ==================== Local Storage Operations ====================

    /**
     * دریافت همه نسخه‌های local
     */
    getLocalVersions(): Record<number, SongVersion[]> {
        try {
            const stored = localStorage.getItem(LOCAL_VERSIONS_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Error reading local versions:', error);
            return {};
        }
    }

    /**
     * ذخیره نسخه‌های local
     */
    private saveLocalVersions(versions: Record<number, SongVersion[]>): void {
        try {
            localStorage.setItem(LOCAL_VERSIONS_KEY, JSON.stringify(versions));
        } catch (error) {
            console.error('Error saving local versions:', error);
        }
    }

    /**
     * دریافت آیتم‌های سطل زباله
     */
    getTrashItems(): TrashItem[] {
        try {
            const stored = localStorage.getItem(LOCAL_TRASH_KEY);
            const items: TrashItem[] = stored ? JSON.parse(stored) : [];

            // محاسبه روزهای باقیمانده
            return items.map(item => ({
                ...item,
                daysRemaining: this.calculateDaysRemaining(item.version.deletedAt)
            })).filter(item => item.daysRemaining > 0);
        } catch (error) {
            console.error('Error reading trash items:', error);
            return [];
        }
    }

    /**
     * ذخیره سطل زباله
     */
    private saveTrashItems(items: TrashItem[]): void {
        try {
            localStorage.setItem(LOCAL_TRASH_KEY, JSON.stringify(items));
        } catch (error) {
            console.error('Error saving trash items:', error);
        }
    }

    /**
     * محاسبه روزهای باقیمانده تا حذف
     */
    private calculateDaysRemaining(deletedAt?: string | null): number {
        if (!deletedAt) return TRASH_RETENTION_DAYS;
        const deleted = new Date(deletedAt);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - deleted.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(0, TRASH_RETENTION_DAYS - diffDays);
    }

    // ==================== Version Management ====================

    /**
     * تولید ID یکتا برای نسخه جدید
     */
    generateVersionId(source: 'server' | 'local' = 'local'): string {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.getTime().toString(36);
        return `v_${dateStr}_${source}_${timeStr}`;
    }

    /**
     * دریافت نسخه‌های یک سرود
     */
    async getSongVersions(
        songId: number,
        serverVersions: SongVersion[] = [],
        filter?: VersionFilter
    ): Promise<SongVersion[]> {
        // دریافت نسخه‌های local
        const localData = this.getLocalVersions();
        const localVersions = localData[songId] || [];

        // ادغام نسخه‌ها
        let allVersions = [...serverVersions, ...localVersions];

        // اعمال فیلتر
        if (filter) {
            // فیلتر منبع
            if (filter.source && filter.source !== 'all') {
                allVersions = allVersions.filter(v => v.source === filter.source);
            }

            // فیلتر حذف‌شده‌ها
            if (!filter.includeDeleted) {
                allVersions = allVersions.filter(v => !v.isDeleted);
            }

            // مرتب‌سازی
            if (filter.sortBy) {
                allVersions.sort((a, b) => {
                    const aVal = a[filter.sortBy!] || '';
                    const bVal = b[filter.sortBy!] || '';
                    const comparison = String(aVal).localeCompare(String(bVal));
                    return filter.sortOrder === 'asc' ? comparison : -comparison;
                });
            }
        } else {
            // مرتب‌سازی پیش‌فرض بر اساس تاریخ (جدیدترین اول)
            allVersions.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        }

        return allVersions;
    }

    /**
     * ذخیره نسخه جدید
     */
    saveVersion(
        songId: number,
        songTitle: string,
        versionData: Partial<SongVersion>
    ): SaveVersionResult {
        try {
            const now = new Date().toISOString();
            const versionId = versionData.id || this.generateVersionId('local');

            const newVersion: SongVersion = {
                id: versionId,
                name: versionData.name || `نسخه ${now.split('T')[0]}`,
                createdAt: now,
                updatedAt: now,
                source: 'local',
                author: versionData.author || 'کاربر',
                isDeleted: false,
                deletedAt: null,
                audioFiles: versionData.audioFiles || [],
                lyrics: versionData.lyrics || { fa: '' },
                lyricsWithChords: versionData.lyricsWithChords,
                timing: versionData.timing
            };

            // ذخیره در localStorage
            const localData = this.getLocalVersions();
            if (!localData[songId]) {
                localData[songId] = [];
            }

            // بررسی آیا نسخه موجود است (ویرایش)
            const existingIndex = localData[songId].findIndex(v => v.id === versionId);
            if (existingIndex >= 0) {
                localData[songId][existingIndex] = {
                    ...localData[songId][existingIndex],
                    ...newVersion,
                    createdAt: localData[songId][existingIndex].createdAt // حفظ تاریخ ایجاد اصلی
                };
            } else {
                localData[songId].push(newVersion);
            }

            this.saveLocalVersions(localData);

            console.log(`✅ Version saved: ${versionId} for song ${songId}`);
            return { success: true, versionId };
        } catch (error) {
            console.error('Error saving version:', error);
            return { success: false, error: String(error) };
        }
    }

    /**
     * حذف نسخه (انتقال به سطل زباله)
     */
    deleteVersion(songId: number, songTitle: string, versionId: string): boolean {
        try {
            const localData = this.getLocalVersions();
            const versions = localData[songId] || [];
            const versionIndex = versions.findIndex(v => v.id === versionId);

            if (versionIndex < 0) {
                console.warn(`Version ${versionId} not found`);
                return false;
            }

            // انتقال به سطل زباله
            const version = versions[versionIndex];
            const now = new Date().toISOString();
            version.isDeleted = true;
            version.deletedAt = now;

            // افزودن به سطل زباله
            const trash = this.getTrashItems();
            trash.push({
                songId,
                songTitle,
                version,
                daysRemaining: TRASH_RETENTION_DAYS
            });
            this.saveTrashItems(trash);

            // حذف از لیست اصلی
            localData[songId] = versions.filter(v => v.id !== versionId);
            this.saveLocalVersions(localData);

            console.log(`🗑️ Version ${versionId} moved to trash`);
            return true;
        } catch (error) {
            console.error('Error deleting version:', error);
            return false;
        }
    }

    /**
     * بازیابی از سطل زباله
     */
    restoreVersion(versionId: string): boolean {
        try {
            const trash = this.getTrashItems();
            const itemIndex = trash.findIndex(item => item.version.id === versionId);

            if (itemIndex < 0) {
                console.warn(`Trash item ${versionId} not found`);
                return false;
            }

            const item = trash[itemIndex];
            const version = { ...item.version, isDeleted: false, deletedAt: null };

            // بازگرداندن به نسخه‌ها
            const localData = this.getLocalVersions();
            if (!localData[item.songId]) {
                localData[item.songId] = [];
            }
            localData[item.songId].push(version);
            this.saveLocalVersions(localData);

            // حذف از سطل زباله
            trash.splice(itemIndex, 1);
            this.saveTrashItems(trash);

            console.log(`♻️ Version ${versionId} restored from trash`);
            return true;
        } catch (error) {
            console.error('Error restoring version:', error);
            return false;
        }
    }

    /**
     * حذف کامل از سطل زباله (فقط ادمین)
     */
    permanentlyDeleteVersion(versionId: string): boolean {
        try {
            const trash = this.getTrashItems();
            const newTrash = trash.filter(item => item.version.id !== versionId);
            this.saveTrashItems(newTrash);
            console.log(`💀 Version ${versionId} permanently deleted`);
            return true;
        } catch (error) {
            console.error('Error permanently deleting version:', error);
            return false;
        }
    }

    /**
     * پاکسازی خودکار سطل زباله (آیتم‌های بیش از 30 روز)
     */
    cleanupTrash(): number {
        const trash = this.getTrashItems();
        const validItems = trash.filter(item => item.daysRemaining > 0);
        const deletedCount = trash.length - validItems.length;

        if (deletedCount > 0) {
            this.saveTrashItems(validItems);
            console.log(`🧹 Cleaned up ${deletedCount} expired trash items`);
        }

        return deletedCount;
    }

    // ==================== Audio File Management ====================

    /**
     * افزودن فایل صوتی به نسخه
     */
    addAudioFile(
        songId: number,
        versionId: string,
        audioFile: Omit<AudioFile, 'id'>
    ): boolean {
        try {
            const localData = this.getLocalVersions();
            const versions = localData[songId] || [];
            const version = versions.find(v => v.id === versionId);

            if (!version) {
                console.warn(`Version ${versionId} not found`);
                return false;
            }

            const newAudio: AudioFile = {
                ...audioFile,
                id: `audio_${Date.now()}`,
                addedAt: new Date().toISOString()
            };

            // اگر پیش‌فرض است، سایرین را غیرفعال کن
            if (newAudio.isDefault) {
                version.audioFiles.forEach(a => a.isDefault = false);
            }

            version.audioFiles.push(newAudio);
            version.updatedAt = new Date().toISOString();

            this.saveLocalVersions(localData);
            return true;
        } catch (error) {
            console.error('Error adding audio file:', error);
            return false;
        }
    }

    /**
     * تنظیم فایل صوتی پیش‌فرض
     */
    setDefaultAudio(songId: number, versionId: string, audioId: string): boolean {
        try {
            const localData = this.getLocalVersions();
            const versions = localData[songId] || [];
            const version = versions.find(v => v.id === versionId);

            if (!version) return false;

            version.audioFiles.forEach(a => {
                a.isDefault = a.id === audioId;
            });
            version.updatedAt = new Date().toISOString();

            this.saveLocalVersions(localData);
            return true;
        } catch (error) {
            console.error('Error setting default audio:', error);
            return false;
        }
    }

    /**
     * حذف فایل صوتی
     */
    removeAudioFile(songId: number, versionId: string, audioId: string): boolean {
        try {
            const localData = this.getLocalVersions();
            const versions = localData[songId] || [];
            const version = versions.find(v => v.id === versionId);

            if (!version) return false;

            version.audioFiles = version.audioFiles.filter(a => a.id !== audioId);
            version.updatedAt = new Date().toISOString();

            this.saveLocalVersions(localData);
            return true;
        } catch (error) {
            console.error('Error removing audio file:', error);
            return false;
        }
    }

    // ==================== Export ====================

    /**
     * خروجی JSON برای آپلود به سرور
     */
    exportVersionsForUpload(songId: number): string {
        const localData = this.getLocalVersions();
        const versions = localData[songId] || [];
        return JSON.stringify(versions, null, 2);
    }

    /**
     * خروجی همه نسخه‌های local
     */
    exportAllLocalVersions(): string {
        return JSON.stringify(this.getLocalVersions(), null, 2);
    }
}

// Singleton export
export const songVersionManager = SongVersionManager.getInstance();
export default songVersionManager;
