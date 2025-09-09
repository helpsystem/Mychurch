// Local Media Management System
export interface MediaFile {
  id: string;
  name: string;
  type: 'audio' | 'video' | 'pdf' | 'powerpoint' | 'image';
  path: string;
  size?: number;
  duration?: number;
  uploadDate: string;
  metadata?: {
    title?: string;
    artist?: string;
    album?: string;
    description?: string;
  };
}

export interface LocalSong {
  id: number;
  title: { en: string; fa: string };
  artist: string;
  key: string;
  mode: 'Major' | 'Minor';
  localAudioPath?: string;
  localVideoPath?: string;
  localLyricsVideoPath?: string;
  localPowerpointPath?: string;
  localPdfPath?: string;
  duration?: string;
  size?: string;
}

// Sample local songs data with local file paths
export const localSongs: LocalSong[] = [
  {
    id: 1,
    title: { en: 'Amazing Grace', fa: 'فیض شگفت‌انگیز' },
    artist: 'مجموعه سرودهای مسیحی',
    key: 'G',
    mode: 'Major',
    localAudioPath: '/assets/audio/amazing-grace.mp3',
    localVideoPath: '/assets/video/amazing-grace.mp4',
    localPowerpointPath: '/assets/presentations/amazing-grace.pptx',
    localPdfPath: '/assets/documents/amazing-grace-lyrics.pdf',
    duration: '4:32',
    size: '6.2 MB'
  },
  {
    id: 2,
    title: { en: 'How Great Thou Art', fa: 'چه بزرگ هستی' },
    artist: 'کلیسای مسیحیان ایرانی',
    key: 'C',
    mode: 'Major',
    localAudioPath: '/assets/audio/how-great-thou-art.mp3',
    localVideoPath: '/assets/video/how-great-thou-art.mp4',
    localLyricsVideoPath: '/assets/video/how-great-thou-art-lyrics.mp4',
    localPowerpointPath: '/assets/presentations/how-great-thou-art.pptx',
    duration: '3:45',
    size: '5.8 MB'
  },
  {
    id: 3,
    title: { en: 'Holy, Holy, Holy', fa: 'قدوس، قدوس، قدوس' },
    artist: 'گروه سرود کلیسا',
    key: 'D',
    mode: 'Major',
    localAudioPath: '/assets/audio/holy-holy-holy.mp3',
    localVideoPath: '/assets/video/holy-holy-holy.mp4',
    localPowerpointPath: '/assets/presentations/holy-holy-holy.pptx',
    localPdfPath: '/assets/documents/holy-holy-holy-chords.pdf',
    duration: '5:12',
    size: '7.1 MB'
  },
  {
    id: 4,
    title: { en: 'In Christ Alone', fa: 'تنها در مسیح' },
    artist: 'سینا مسیحا',
    key: 'A',
    mode: 'Major',
    localAudioPath: '/assets/audio/in-christ-alone.mp3',
    localVideoPath: '/assets/video/in-christ-alone.mp4',
    localLyricsVideoPath: '/assets/video/in-christ-alone-lyrics.mp4',
    localPowerpointPath: '/assets/presentations/in-christ-alone.pptx',
    duration: '4:18',
    size: '6.5 MB'
  },
  {
    id: 5,
    title: { en: 'Great Is Thy Faithfulness', fa: 'وفاداری تو عظیم است' },
    artist: 'آراد طفلان',
    key: 'F',
    mode: 'Major',
    localAudioPath: '/assets/audio/great-is-thy-faithfulness.mp3',
    localVideoPath: '/assets/video/great-is-thy-faithfulness.mp4',
    localPowerpointPath: '/assets/presentations/great-is-thy-faithfulness.pptx',
    localPdfPath: '/assets/documents/great-is-thy-faithfulness-sheet.pdf',
    duration: '4:56',
    size: '6.8 MB'
  }
];

export const getLocalMediaUrl = (path: string): string => {
  // In production, this would handle proper URL construction
  // For now, we'll use the public path directly
  return path;
};

export const checkFileExists = async (path: string): Promise<boolean> => {
  try {
    const response = await fetch(path, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

export const getFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Byte';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

// Audio file extensions
export const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
export const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov'];
export const documentExtensions = ['.pdf', '.doc', '.docx'];
export const presentationExtensions = ['.ppt', '.pptx', '.odp'];

export const getFileType = (filename: string): MediaFile['type'] => {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  
  if (audioExtensions.includes(ext)) return 'audio';
  if (videoExtensions.includes(ext)) return 'video';
  if (documentExtensions.includes(ext)) return 'pdf';
  if (presentationExtensions.includes(ext)) return 'powerpoint';
  
  return 'image'; // default fallback
};