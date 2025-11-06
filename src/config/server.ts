/**
 * Server Configuration
 * Central config for production server URLs
 */

// Environment detection
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Server URLs
const PRODUCTION_SERVER = 'https://195.250.25.185';
const LOCAL_SERVER = '';

// Base URL for static files
export const SERVER_BASE_URL = isProduction ? PRODUCTION_SERVER : LOCAL_SERVER;

/**
 * Get full URL for a public asset
 * @param path - Path relative to public folder (e.g., '/images/logo.png')
 * @returns Full URL (production or local)
 */
export function getPublicUrl(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  if (isProduction) {
    return `${SERVER_BASE_URL}/${cleanPath}`;
  }
  
  // In development, use local paths
  return `/${cleanPath}`;
}

/**
 * Get audio file URL
 * @param bookCode - Bible book code (e.g., 'GEN', 'EPH')
 * @param chapter - Chapter number
 * @param source - Audio source type (edge-tts, youversion, etc.)
 * @param lang - Language code (fa, en)
 */
export function getAudioUrl(
  bookCode: string,
  chapter: number,
  source: 'edge-tts' | 'youversion' | 'auto-generated' = 'edge-tts',
  lang: 'fa' | 'en' = 'fa'
): string {
  const path = `audio/bible/${source}/${bookCode}/${chapter}.mp3`;
  return getPublicUrl(path);
}

/**
 * Get image URL
 * @param filename - Image filename in public/images/
 */
export function getImageUrl(filename: string): string {
  return getPublicUrl(`images/${filename}`);
}

/**
 * Get worship song URL
 * @param path - Path relative to worship folder
 */
export function getWorshipUrl(path: string): string {
  return getPublicUrl(`worship/${path}`);
}

/**
 * Get document URL
 * @param filename - Document filename in public/documents/
 */
export function getDocumentUrl(filename: string): string {
  return getPublicUrl(`documents/${filename}`);
}

/**
 * Get data file URL (JSON, etc.)
 * @param path - Path relative to data folder
 */
export function getDataUrl(path: string): string {
  return getPublicUrl(`data/${path}`);
}

// Export config object
export const ServerConfig = {
  isDevelopment,
  isProduction,
  baseUrl: SERVER_BASE_URL,
  getPublicUrl,
  getAudioUrl,
  getImageUrl,
  getWorshipUrl,
  getDocumentUrl,
  getDataUrl,
};

export default ServerConfig;
