/**
 * Songs API Routes
 * Handles Persian Christian songs from Kalameh archive
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Load mock data
const MOCK_DATA_PATH = path.join(__dirname, '../../scripts/kalameh-extractor/export/songs_index.json');
let mockSongs = null;

function loadMockData() {
  try {
    if (!mockSongs && fs.existsSync(MOCK_DATA_PATH)) {
      console.log('Loading mock data from:', MOCK_DATA_PATH);
      const data = JSON.parse(fs.readFileSync(MOCK_DATA_PATH, 'utf-8'));
      mockSongs = [];
      Object.values(data.data).forEach(letterSongs => {
        mockSongs.push(...letterSongs);
      });
      console.log(`✅ Loaded ${mockSongs.length} mock songs`);
    }
    return mockSongs || [];
  } catch (error) {
    console.error('Error loading mock data:', error.message);
    return [];
  }
}

// Try Supabase if available, otherwise use mock
// TEMPORARILY DISABLED: Supabase JS client causing crashes
/*
const { createClient } = require('@supabase/supabase-js');
let supabase = null;

if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
}
*/
let supabase = null; // Force mock mode

/**
 * GET /api/songs
 * Get all songs with optional filters
 */
router.get('/', async (req, res) => {
  try {
    const { letter, category, search, limit = 100, offset = 0 } = req.query;
    let useMock = true;

    // Try Supabase if available
    if (supabase) {
      try {
        let query = supabase
          .from('songs')
          .select('*', { count: 'exact' })
          .eq('is_published', true)
          .order('title_fa', { ascending: true })
          .range(offset, offset + limit - 1);

        if (letter) query = query.eq('letter', letter);
        if (category) query = query.eq('category', category);
        if (search) {
          query = query.or(`title_fa.ilike.%${search}%,title_en.ilike.%${search}%,artist.ilike.%${search}%`);
        }

        const { data: songs, error, count } = await query;
        
        // If no error, use database
        if (!error) {
          return res.json({
            success: true,
            songs,
            total: count,
            limit: parseInt(limit),
            offset: parseInt(offset),
            source: 'database'
          });
        }
      } catch (dbError) {
        console.log('Database not available, using mock data:', dbError.message);
      }
    }

    // Use mock data (fallback or default)
    let songs = loadMockData();
    
    if (letter) {
      songs = songs.filter(s => s.letter === letter);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      songs = songs.filter(s => 
        s.title_fa.includes(search) ||
        s.title_en?.toLowerCase().includes(searchLower) ||
        s.artist?.includes(search)
      );
    }

    const total = songs.length;
    const start = parseInt(offset);
    const end = start + parseInt(limit);
    songs = songs.slice(start, end);

    res.json({
      success: true,
      songs,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      source: 'mock'
    });
  } catch (error) {
    console.error('Error fetching songs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/songs/:slug
 * Get single song by slug
 */
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    let song;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('songs')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .single();

        if (!error && data) {
          song = data;
        }
      } catch (dbError) {
        console.log('Database error, using mock data:', dbError.message);
      }
    }
    
    if (!song) {
      song = loadMockData().find(s => s.slug === slug);
    }

    if (!song) {
      return res.status(404).json({
        success: false,
        error: 'Song not found'
      });
    }

    res.json({
      success: true,
      song,
      source: supabase ? 'database' : 'mock'
    });
  } catch (error) {
    console.error('Error fetching song:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/songs/:slug/play
 * Increment play count
 */
router.post('/:slug/play', async (req, res) => {
  try {
    const { slug } = req.params;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .rpc('increment_song_play_count', { song_slug: slug });

        if (error) {
          console.log('Play count increment failed, continuing...', error.message);
        }
      } catch (dbError) {
        console.log('Mock mode: Play count increment skipped for:', slug);
      }
    } else {
      console.log('Mock mode: Play count increment skipped for:', slug);
    }

    res.json({
      success: true,
      message: 'Play count incremented',
      source: supabase ? 'database' : 'mock'
    });
  } catch (error) {
    console.error('Error incrementing play count:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/songs/by-letter/:letter
 * Get songs by Persian letter
 */
router.get('/by-letter/:letter', async (req, res) => {
  try {
    const { letter } = req.params;
    const { limit = 100, offset = 0 } = req.query;
    let songs, count;

    if (supabase) {
      try {
        const { data, error, count: totalCount } = await supabase
          .from('songs')
          .select('*', { count: 'exact' })
          .eq('letter', letter)
          .eq('is_published', true)
          .order('title_fa', { ascending: true })
          .range(offset, offset + limit - 1);

        if (!error) {
          songs = data;
          count = totalCount;
        }
      } catch (dbError) {
        console.log('Database error, using mock data:', dbError.message);
      }
    }
    
    if (!songs) {
      const allSongs = loadMockData().filter(s => s.letter === letter);
      allSongs.sort((a, b) => a.title_fa.localeCompare(b.title_fa, 'fa'));
      count = allSongs.length;
      songs = allSongs.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
    }

    res.json({
      success: true,
      letter,
      songs,
      total: count,
      source: supabase ? 'database' : 'mock'
    });
  } catch (error) {
    console.error('Error fetching songs by letter:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/songs/letters/count
 * Get count of songs per letter
 */
router.get('/letters/count', async (req, res) => {
  try {
    let songs;
    
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('songs')
          .select('letter')
          .eq('is_published', true);
        
        if (!error) {
          songs = data;
        }
      } catch (dbError) {
        console.log('Database error, using mock data:', dbError.message);
      }
    }
    
    if (!songs) {
      songs = loadMockData();
    }

    // Count songs per letter
    const counts = {};
    songs.forEach(song => {
      counts[song.letter] = (counts[song.letter] || 0) + 1;
    });

    res.json({
      success: true,
      counts,
      source: supabase ? 'database' : 'mock'
    });
  } catch (error) {
    console.error('Error fetching letter counts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/songs/featured
 * Get featured songs
 */
router.get('/featured', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    let songs;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('songs')
          .select('*')
          .eq('is_published', true)
          .eq('featured', true)
          .order('play_count', { ascending: false })
          .limit(limit);

        if (!error) {
          songs = data;
        }
      } catch (dbError) {
        console.log('Database error, using mock data:', dbError.message);
      }
    }
    
    if (!songs) {
      const allSongs = loadMockData();
      songs = allSongs.slice(0, parseInt(limit));
    }

    res.json({
      success: true,
      songs,
      source: supabase ? 'database' : 'mock'
    });
  } catch (error) {
    console.error('Error fetching featured songs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/songs/search
 * Advanced search with full-text search
 */
router.get('/search', async (req, res) => {
  try {
    const { q, letter, category, limit = 50 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    let songs;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .rpc('search_songs', {
            search_query: q,
            search_letter: letter || null,
            search_category: category || null,
            limit_count: parseInt(limit)
          });

        if (!error) {
          songs = data;
        }
      } catch (dbError) {
        console.log('Database error, using mock data:', dbError.message);
      }
    }
    
    if (!songs) {
      const searchLower = q.toLowerCase();
      songs = loadMockData().filter(song => {
        const matchesQuery = 
          song.title_fa.includes(searchLower) ||
          song.title_en.toLowerCase().includes(searchLower) ||
          (song.artist && song.artist.includes(searchLower)) ||
          (song.lyrics_fa && song.lyrics_fa.includes(searchLower)) ||
          (song.lyrics_en && song.lyrics_en.toLowerCase().includes(searchLower));
        
        const matchesLetter = !letter || song.letter === letter;
        const matchesCategory = !category || song.category === category;
        
        return matchesQuery && matchesLetter && matchesCategory;
      }).slice(0, parseInt(limit));
    }

    res.json({
      success: true,
      query: q,
      songs,
      total: songs.length,
      source: supabase ? 'database' : 'mock'
    });
  } catch (error) {
    console.error('Error searching songs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/songs/:slug/tts-sync
 * Get TTS sync data for word highlighting
 */
router.get('/:slug/tts-sync', async (req, res) => {
  try {
    const { slug } = req.params;
    const { language = 'fa' } = req.query;

    if (supabase) {
      try {
        // First get song ID
        const { data: song, error: songError } = await supabase
          .from('songs')
          .select('id')
          .eq('slug', slug)
          .single();

        if (!songError && song) {
          // Get TTS sync data
          const { data: ttsSync, error } = await supabase
            .from('song_tts_sync')
            .select('sync_data')
            .eq('song_id', song.id)
            .eq('language', language)
            .single();

          if (!error && ttsSync) {
            return res.json({
              success: true,
              song_slug: slug,
              language,
              source: 'database',
              ...ttsSync.sync_data
            });
          }
        }
      } catch (dbError) {
        console.log('TTS sync not available:', dbError.message);
      }
    }

    // Mock mode or no TTS data: TTS sync not available
    return res.status(404).json({
      success: false,
      error: 'TTS sync data not available',
      source: 'mock'
    });
  } catch (error) {
    console.error('Error fetching TTS sync:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
