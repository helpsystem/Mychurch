/**
 * Storage Utilities - Helper functions برای کار با Supabase Storage
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';

/**
 * Storage Buckets
 */
export const StorageBuckets = {
  WORSHIP_AUDIO: 'worship-audio',
  BIBLE_AUDIO: 'bible-audio',
  SERMONS: 'sermons',
  IMAGES: 'images',
  DOCUMENTS: 'documents',
  VIDEOS: 'videos'
} as const;

/**
 * بدست آوردن URL عمومی فایل
 */
export function getStorageUrl(bucket: string, path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * بدست آوردن URL ستایش
 */
export function getWorshipAudioUrl(filename: string): string {
  return getStorageUrl(StorageBuckets.WORSHIP_AUDIO, `audio/${filename}`);
}

/**
 * بدست آوردن URL صوت کتاب مقدس
 */
export function getBibleAudioUrl(bookKey: string, chapter: number): string {
  return getStorageUrl(StorageBuckets.BIBLE_AUDIO, `audio/${bookKey}_${chapter}.mp3`);
}

/**
 * بدست آوردن URL تایمینگ کتاب مقدس
 */
export function getBibleTimingUrl(bookKey: string, chapter: number): string {
  return getStorageUrl(StorageBuckets.BIBLE_AUDIO, `timings/${bookKey}_${chapter}_timing.json`);
}

/**
 * بدست آوردن URL تصویر
 */
export function getImageUrl(path: string): string {
  return getStorageUrl(StorageBuckets.IMAGES, path);
}

/**
 * بدست آوردن URL موعظه
 */
export function getSermonUrl(filename: string, type: 'audio' | 'video' = 'audio'): string {
  return getStorageUrl(StorageBuckets.SERMONS, `${type}/${filename}`);
}

/**
 * بدست آوردن URL PDF
 */
export function getDocumentUrl(path: string): string {
  return getStorageUrl(StorageBuckets.DOCUMENTS, path);
}

/**
 * تبدیل URL قدیمی به URL جدید storage
 */
export function migrateUrl(oldUrl: string): string {
  if (!oldUrl) return '';
  
  // اگر قبلا migrate شده، برگردون
  if (oldUrl.includes('supabase.co/storage')) {
    return oldUrl;
  }

  // Worship audio
  if (oldUrl.includes('/worship/audio/')) {
    const filename = oldUrl.split('/worship/audio/').pop() || '';
    return getWorshipAudioUrl(filename);
  }

  // Bible audio
  if (oldUrl.includes('/bible/audio/')) {
    const filename = oldUrl.split('/bible/audio/').pop() || '';
    return getStorageUrl(StorageBuckets.BIBLE_AUDIO, `audio/${filename}`);
  }

  // Bible timings
  if (oldUrl.includes('/bible/data/timings/')) {
    const filename = oldUrl.split('/bible/data/timings/').pop() || '';
    return getStorageUrl(StorageBuckets.BIBLE_AUDIO, `timings/${filename}`);
  }

  // Sermons
  if (oldUrl.includes('/sermons/')) {
    const path = oldUrl.split('/sermons/').pop() || '';
    return getStorageUrl(StorageBuckets.SERMONS, path);
  }

  // Images
  if (oldUrl.includes('/images/')) {
    const path = oldUrl.split('/images/').pop() || '';
    return getStorageUrl(StorageBuckets.IMAGES, path);
  }

  // اگر هیچکدوم نبود، همون قدیمی رو برگردون
  return oldUrl;
}

/**
 * چک کردن اینکه URL از storage هست یا local
 */
export function isStorageUrl(url: string): boolean {
  return url.includes('supabase.co/storage') || url.includes('/storage/v1/object/');
}

/**
 * آپلود فایل به storage
 */
export async function uploadToStorage(
  file: File,
  bucket: string,
  path: string,
  token: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);
    formData.append('path', path);

    const response = await fetch('/api/storage/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (!data.success) {
      return { success: false, error: data.message };
    }

    return {
      success: true,
      url: data.file.url
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * حذف فایل از storage
 */
export async function deleteFromStorage(
  bucket: string,
  path: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/storage/delete/${bucket}/${path}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!data.success) {
      return { success: false, error: data.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    };
  }
}

/**
 * لیست فایل‌های یک bucket
 */
export async function listStorageFiles(
  bucket: string,
  folder: string = '',
  token: string
): Promise<{ success: boolean; files?: any[]; error?: string }> {
  try {
    const url = folder
      ? `/api/storage/list/${bucket}?folder=${encodeURIComponent(folder)}`
      : `/api/storage/list/${bucket}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!data.success) {
      return { success: false, error: data.message };
    }

    return {
      success: true,
      files: data.files
    };
  } catch (error) {
    console.error('List error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'List failed'
    };
  }
}

/**
 * Preload audio برای playback سریع‌تر
 */
export function preloadAudio(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.addEventListener('canplaythrough', () => resolve(), { once: true });
    audio.addEventListener('error', () => reject(new Error('Failed to preload')), { once: true });
    audio.src = url;
    audio.load();
  });
}

/**
 * Check اینکه فایل در storage موجود هست یا نه
 */
export async function checkFileExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * دانلود فایل از storage
 */
export async function downloadFile(url: string, filename: string): Promise<void> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(objectUrl);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
}

/**
 * فرمت کردن سایز فایل
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * بدست آوردن extension فایل
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * چک کردن نوع فایل
 */
export function isAudioFile(filename: string): boolean {
  const audioExts = ['mp3', 'm4a', 'wav', 'ogg', 'flac'];
  return audioExts.includes(getFileExtension(filename));
}

export function isVideoFile(filename: string): boolean {
  const videoExts = ['mp4', 'webm', 'mov', 'avi'];
  return videoExts.includes(getFileExtension(filename));
}

export function isImageFile(filename: string): boolean {
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  return imageExts.includes(getFileExtension(filename));
}

export function isDocumentFile(filename: string): boolean {
  const docExts = ['pdf', 'doc', 'docx', 'txt'];
  return docExts.includes(getFileExtension(filename));
}
