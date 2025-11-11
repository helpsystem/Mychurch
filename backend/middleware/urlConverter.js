/**
 * Middleware to convert HiDrive URLs to proxy URLs
 * Converts database URLs from HiDrive WebDAV to backend proxy endpoints
 */

/**
 * Convert HiDrive WebDAV URL to backend proxy URL
 * @param {string} url - Original URL from database
 * @returns {string} - Proxy URL
 */
function convertToProxyURL(url) {
  if (!url) return url;

  // If already a proxy URL, return as-is
  if (url.startsWith('/api/hidrive/stream/')) {
    return url;
  }

  // If it's a local path, convert to proxy
  if (url.startsWith('/worship/') || url.startsWith('/sermons/') || url.startsWith('/events/')) {
    return `/api/hidrive/stream${url}`;
  }

  // If it's a HiDrive WebDAV URL, extract path and convert
  if (url.includes('hidrive.ionos.com')) {
    // Extract path after /mychurch/
    const match = url.match(/\/mychurch\/(.+)$/);
    if (match) {
      return `/api/hidrive/stream/${match[1]}`;
    }
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
