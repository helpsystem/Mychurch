const https = require('https');

const API_KEY = process.env.YOUVERSION_API_KEY || 'mQSt6AbhCy2oUMbqw7AXWdjtpBEgErqZxrjgvG5AmaExT834';
const BASE_URL = 'https://api-dev.youversion.com';

/**
 * Make an API request to YouVersion
 */
function apiGet(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${endpoint}`;
    const options = {
      headers: {
        'X-YouVersion-App-Key': API_KEY,
        'Accept': 'application/json',
      }
    };
    
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`JSON parse error from YouVersion: ${data.substring(0, 200)}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode} from YouVersion: ${data.substring(0, 300)}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Get passage text for a specific book and chapter
 * Default english version is BSB (Berean Standard Bible, ID: 3034)
 */
async function getChapterText(bookCode, chapterNum, versionId = 3034) {
  try {
    const reference = `${bookCode}.${chapterNum}`;
    const response = await apiGet(`/v1/bibles/${versionId}/passages/${reference}?format=json`);
    
    if (response && response.content) {
      // The API returns the raw text natively but sometimes it may be HTML or pure text.
      // We need to parse verses if format=json returns a structured format or just text.
      
      // If we just get text, let's format it. The JSON format from YouVersion /passages often provides HTML. 
      // But we requested JSON format. Let's see what we can do if it's text.
      // Ideally we would extract verses. Youversion API returns `verses` array if we ask correctly?
      // Wait, standard YouVersion API passage format=json returns content (HTML).
      
      return response;
    }
    return null;
  } catch (error) {
    console.error('Youversion API error:', error.message);
    return null;
  }
}

/**
 * Fetch verses specifically from YouVersion, parsed.
 */
async function getChapterVerses(bookCode, chapterNum, versionId = 3034) {
  try {
    // YouVersion /passages/{ref} returns paragraphs/html.
    // Instead of using /passages, if we can find verses endpoint:
    // Actually, getting plain text might be easier.
    const reference = `${bookCode}.${chapterNum}`;
    // Let's try getting text format
    const response = await apiGet(`/v1/bibles/${versionId}/passages/${reference}?format=text`);
    
    if (response && response.content) {
      // Split by verse numbers? The text usually comes bare, or with "1 In the beginning..."
      // Basic extraction if it contains numbers.
      const text = response.content.trim();
      const verseRegex = /(?:^|\s)(\d+)\s+(.+?)(?=(?:\s\d+\s+)|$)/gs;
      const matches = [...text.matchAll(verseRegex)];
      
      if (matches.length > 0) {
        return matches.map(match => ({
          verse_number: parseInt(match[1]),
          text: match[2].trim()
        }));
      } else {
        // Fallback: Just return as one big verse 1
        return [{ verse_number: 1, text }];
      }
    }
    return [];
  } catch (error) {
    console.error(`YouVersion verse fetch failed for ${bookCode} ${chapterNum}:`, error.message);
    return [];
  }
}

module.exports = {
  getChapterText,
  getChapterVerses,
  apiGet
};
