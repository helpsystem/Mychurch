/**
 * Encodes audio/media URLs to properly handle Persian/Farsi characters.
 * This fixes 404 errors for files with non-ASCII names.
 * 
 * @param url - The URL to encode
 * @returns Properly encoded URL
 */
export function encodeAudioUrl(url: string): string {
    if (!url) return '';

    // If already encoded (contains %), return as-is
    if (url.includes('%')) return url;

    // Handle full URLs (http:// or https://)
    if (url.startsWith('http://') || url.startsWith('https://')) {
        try {
            const urlObj = new URL(url);
            // Encode each path segment separately
            const encodedPath = urlObj.pathname
                .split('/')
                .map(segment => segment ? encodeURIComponent(decodeURIComponent(segment)) : segment)
                .join('/');
            return `${urlObj.origin}${encodedPath}${urlObj.search}`;
        } catch {
            return url;
        }
    }

    // Handle local paths (starting with /)
    if (url.startsWith('/')) {
        return url
            .split('/')
            .map(segment => segment ? encodeURIComponent(segment) : segment)
            .join('/');
    }

    // Return as-is for other cases
    return url;
}

/**
 * Decodes an encoded URL back to readable form
 * @param url - The encoded URL
 * @returns Decoded URL
 */
export function decodeAudioUrl(url: string): string {
    if (!url) return '';
    try {
        return decodeURIComponent(url);
    } catch {
        return url;
    }
}
