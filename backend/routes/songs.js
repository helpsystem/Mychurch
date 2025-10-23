/**
 * Songs API Routes
 * Handles Persian Christian songs from Kalameh archive
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * GET /api/songs
 * Get all songs with optional filters
 */
router.get('/', async (req, res) => {
  try {
    const { letter, category, search, limit = 100, offset = 0 } = req.query;

    let query = supabase
      .from('songs')
      .select('*', { count: 'exact' })
      .eq('is_published', true)
      .order('title_fa', { ascending: true })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (letter) {
      query = query.eq('letter', letter);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`title_fa.ilike.%${search}%,title_en.ilike.%${search}%,artist_fa.ilike.%${search}%`);
    }

    const { data: songs, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      songs,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
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

    const { data: song, error } = await supabase
      .from('songs')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error) throw error;

    if (!song) {
      return res.status(404).json({
        success: false,
        error: 'Song not found'
      });
    }

    res.json({
      success: true,
      song
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

    const { data, error } = await supabase
      .rpc('increment_song_play_count', { song_slug: slug });

    if (error) throw error;

    res.json({
      success: true,
      message: 'Play count incremented'
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

    const { data: songs, error, count } = await supabase
      .from('songs')
      .select('*', { count: 'exact' })
      .eq('letter', letter)
      .eq('is_published', true)
      .order('title_fa', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      letter,
      songs,
      total: count
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
    const { data: songs, error } = await supabase
      .from('songs')
      .select('letter')
      .eq('is_published', true);

    if (error) throw error;

    // Count songs per letter
    const counts = {};
    songs.forEach(song => {
      counts[song.letter] = (counts[song.letter] || 0) + 1;
    });

    res.json({
      success: true,
      counts
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

    const { data: songs, error } = await supabase
      .from('songs')
      .select('*')
      .eq('is_published', true)
      .eq('featured', true)
      .order('play_count', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({
      success: true,
      songs
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

    const { data: songs, error } = await supabase
      .rpc('search_songs', {
        search_query: q,
        search_letter: letter || null,
        search_category: category || null,
        limit_count: parseInt(limit)
      });

    if (error) throw error;

    res.json({
      success: true,
      query: q,
      songs,
      total: songs.length
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

    // First get song ID
    const { data: song, error: songError } = await supabase
      .from('songs')
      .select('id')
      .eq('slug', slug)
      .single();

    if (songError) throw songError;

    // Get TTS sync data
    const { data: ttsSync, error } = await supabase
      .from('song_tts_sync')
      .select('sync_data')
      .eq('song_id', song.id)
      .eq('language', language)
      .single();

    if (error || !ttsSync) {
      return res.status(404).json({
        success: false,
        error: 'TTS sync data not found'
      });
    }

    res.json({
      success: true,
      song_slug: slug,
      language,
      ...ttsSync.sync_data
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
