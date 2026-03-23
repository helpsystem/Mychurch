const { pool } = require('../db-postgres');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const fetch = require('node-fetch');

// Configuration
const KALAMEH_ROOT = path.join(__dirname, '../../Project/My Web Sites/Bible/www.kalameh.com');
const OUTPUT_DIR = path.join(__dirname, '../../public/worship');

/**
 * Worship Scraper Service
 * Handles syncing songs from the Kalameh archive/website
 */
class WorshipScraperService {
  
  /**
   * Main Sync Function
   */
  async syncWithArchive() {
    console.log('🚀 Starting Worship Sync with Archive...');
    const stats = { found: 0, updated: 0, new: 0, errors: 0 };

    try {
      // 1. Find all song archive HTML files
      const htmlFiles = this._findHTMLFiles(KALAMEH_ROOT).filter(f => 
        path.basename(f).startsWith('song-archive') && f.endsWith('.html')
      );

      console.log(`📂 Found ${htmlFiles.length} archive files.`);

      for (const file of htmlFiles) {
        const extractedSongs = this._parseHTMLFile(file);
        
        for (const songData of extractedSongs) {
          stats.found++;
          const result = await this._upsertSong(songData);
          if (result === 'new') stats.new++;
          else if (result === 'updated') stats.updated++;
          else if (result === 'error') stats.errors++;
        }
      }

      // 2. Mark older "New" songs as not new (Archive logic)
      await pool.query("UPDATE worship_songs SET is_new = FALSE WHERE created_at < NOW() - INTERVAL '14 days'");

      console.log('✅ Sync Summary:', stats);
      return stats;

    } catch (err) {
      console.error('❌ Sync failed:', err);
      throw err;
    }
  }

  /**
   * Parse a single HTML file into song objects
   */
  _parseHTMLFile(filePath) {
    const songs = [];
    try {
      const html = fs.readFileSync(filePath, 'utf8');
      const $ = cheerio.load(html);
      
      $('.views-accordion-songs_and_video-page-header').each((i, el) => {
        const $header = $(el);
        const $content = $header.next('.ui-accordion-content');
        
        const title = $header.find('.song_title').text().trim();
        if (!title) return;

        songs.push({
          title: title,
          artist: $header.find('.song_author').text().trim() || 'Unknown',
          mp3: $content.find('a[href*=".mp3"]').first().attr('href'),
          pdf: $content.find('a[href*=".pdf"]').first().attr('href'),
          youtube: $content.find('a[href*="youtube.com"]').first().attr('href')
        });
      });
    } catch (e) {
      console.error('Error parsing file:', filePath, e.message);
    }
    return songs;
  }

  /**
   * Find HTML files recursively
   */
  _findHTMLFiles(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return [];
    
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      file = path.resolve(dir, file);
      const stat = fs.statSync(file);
      if (stat && stat.isDirectory()) {
         results = results.concat(this._findHTMLFiles(file));
      } else {
         if (file.endsWith('.html')) results.push(file);
      }
    });
    return results;
  }

  /**
   * Save or Update song in database
   */
  async _upsertSong(song) {
    try {
      // Check for existing song by title (Fuzzy or exact)
      const existing = await pool.query(
        "SELECT id FROM worship_songs WHERE title_fa = $1 OR title_en = $1", 
        [song.title]
      );

      if (existing.rowCount > 0) {
        // Update existing (Only if missing data)
        await pool.query(
          "UPDATE worship_songs SET artist = COALESCE(artist, $1), youtube_id = COALESCE(youtube_id, $2) WHERE id = $3",
          [song.artist, this._extractYoutubeId(song.youtube), existing.rows[0].id]
        );
        return 'updated';
      } else {
        // Insert new
        await pool.query(
          `INSERT INTO worship_songs (title_fa, artist, youtube_id, is_new, processing_status) 
           VALUES ($1, $2, $3, TRUE, 'pending')`,
          [song.title, song.artist, this._extractYoutubeId(song.youtube)]
        );
        return 'new';
      }
    } catch (err) {
      return 'error';
    }
  }

  _extractYoutubeId(url) {
    if (!url) return null;
    const match = url.match(/[?&]v=([^&#]+)/) || url.match(/embed\/([^&#]+)/) || url.match(/be\/([^&#]+)/);
    return match ? match[1] : null;
  }
}

module.exports = new WorshipScraperService();
