/**
 * Middleware to convert HiDrive URLs to proxy URLs
 * Converts database URLs from HiDrive WebDAV to backend proxy endpoints
 */

/**
 * Convert HiDrive WebDAV URL to backend proxy URL
 * @param {string} url - Original URL from database
 * @returns {string} - Backend proxy URL with authentication
 */
function convertToProxyURL(url) {
  if (!url) return url;

  // IMPORTANT: Convert proxy URLs BACK to local paths for local files
  // Database may have stored URLs with /api/hidrive/stream/ prefix (with possible typos)
  // For local files (worship/audio, etc.) they should be served directly by Vite
  
  // Use regex to handle typos in database: strream, streaam, etc.
  const hidriveProxyPattern = /^\/a{1,2}pi\/hidrive\/str{1,2}e{1,2}a{1,2}m\//i;
  if (hidriveProxyPattern.test(url)) {
    // Extract path after the hidrive proxy prefix
    const localPath = url.replace(hidriveProxyPattern, '/');
    // Handle double slashes and typos in path
    const cleanPath = localPath.replace(/\/+/g, '/');
    return cleanPath;
  }

  // If it's a full WebDAV URL, check if it's for local files
  if (url.startsWith('https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/')) {
    const path = url.replace('https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/', '');
    
    // For worship audio files, they are stored locally in public/worship/audio
    // Return local path instead of proxy URL
    if (path.startsWith('worship/audio/')) {
      return `/${path}`;
    }
    
    // For other HiDrive files, use the proxy
    return `/api/hidrive/stream/${path}`;
  }

  // Local paths starting with / should NOT be converted to proxy
  // They are served directly by Vite dev server or static hosting
  // Keep local paths as-is: /worship/, /sermons/, /events/, /bible/
  
  // Return original URL - let Vite/static server handle local files
  return url;
}

/**
 * Middleware to convert worship song URLs in response
 */
function convertWorshipSongURLs(req, res, next) {
  const originalJson = res.json;

  res.json = function(data) {
    if (Array.isArray(data)) {
      // Convert array of songs
      data = data.map(song => {
        if (song.audioUrl || song.audiourl) {
          const urlField = song.audioUrl ? 'audioUrl' : 'audiourl';
          song[urlField] = convertToProxyURL(song[urlField]);
        }
        return song;
      });
    } else if (data && typeof data === 'object') {
      // Convert single song
      if (data.audioUrl || data.audiourl) {
        const urlField = data.audioUrl ? 'audioUrl' : 'audiourl';
        data[urlField] = convertToProxyURL(data[urlField]);
      }
    }

    return originalJson.call(this, data);
  };

  next();
}

module.exports = {
  convertToProxyURL,
  convertWorshipSongURLs
};
