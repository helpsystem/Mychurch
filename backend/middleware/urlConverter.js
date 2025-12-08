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

  // If already a proxy URL, return as-is
  if (url.startsWith('/api/hidrive/stream/')) {
    return url;
  }

  // If it's a full WebDAV URL, convert to proxy
  if (url.startsWith('https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/')) {
    const path = url.replace('https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/', '');
    return `/api/hidrive/stream/${path}`;
  }

  // If it's a local path starting with /, convert to proxy
  if (url.startsWith('/worship/') || url.startsWith('/sermons/') || url.startsWith('/events/') || url.startsWith('/bible/')) {
    const path = url.startsWith('/') ? url.substring(1) : url;
    return `/api/hidrive/stream/${path}`;
  }

  // Return original if no conversion needed
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
