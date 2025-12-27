/**
 * Precision Timing Routes
 * API endpoints for admin/moderator to generate and manage worship song timings
 */

const express = require('express');
const router = express.Router();
const PrecisionTimingService = require('../services/precisionTimingService');

let timingService = null;

// Lazy initialization
function getTimingService() {
    if (!timingService) {
        try {
            timingService = new PrecisionTimingService();
        } catch (error) {
            console.error('Failed to initialize PrecisionTimingService:', error.message);
            throw error;
        }
    }
    return timingService;
}

/**
 * POST /api/timing/generate
 * Generate precise timing for a worship song
 * Body: { songId, audioUrl, lyrics }
 */
router.post('/generate', async (req, res) => {
    try {
        const { songId, audioUrl, lyrics } = req.body;

        if (!songId || !audioUrl || !lyrics) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: songId, audioUrl, lyrics'
            });
        }

        console.log(`📝 Received timing generation request for song ${songId}`);

        const service = getTimingService();
        const result = await service.generatePreciseTiming({
            songId,
            audioUrl,
            lyrics
        });

        if (result.success) {
            res.json({
                success: true,
                message: `Timing generated for song ${songId}`,
                timing: result.timing,
                outputPath: result.outputPath
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }

    } catch (error) {
        console.error('Timing generation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/timing/estimate
 * Generate estimated timing using OpenRouter (text-based, no audio needed)
 * Body: { songId, lyrics, durationSeconds }
 */
router.post('/estimate', async (req, res) => {
    try {
        const { songId, lyrics, durationSeconds = 180 } = req.body;

        if (!songId || !lyrics) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: songId, lyrics'
            });
        }

        console.log(`📝 Received timing estimation request for song ${songId}`);

        // Use OpenRouter timing service
        const OpenRouterTimingService = require('../services/openRouterTimingService');
        const orService = new OpenRouterTimingService();

        const result = await orService.generateEstimatedTiming({
            songId,
            lyrics,
            durationSeconds
        });

        if (result.success) {
            res.json({
                success: true,
                message: `Estimated timing generated for song ${songId}`,
                timing: result.timing,
                outputPath: result.outputPath
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }

    } catch (error) {
        console.error('Timing estimation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/timing/:songId
 * Get existing timing for a song
 */
router.get('/:songId', async (req, res) => {
    try {
        const { songId } = req.params;

        const service = getTimingService();
        const timing = service.getExistingTiming(songId);

        if (timing) {
            res.json({
                success: true,
                songId,
                timing
            });
        } else {
            res.status(404).json({
                success: false,
                error: `No timing found for song ${songId}`
            });
        }

    } catch (error) {
        console.error('Get timing error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/timing/list/all
 * List all songs that have timing files
 */
router.get('/list/all', async (req, res) => {
    try {
        const service = getTimingService();
        const songIds = service.listTimingFiles();

        res.json({
            success: true,
            count: songIds.length,
            songIds
        });

    } catch (error) {
        console.error('List timing error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/timing/batch
 * Generate timing for multiple songs (batch processing)
 * Body: { songs: [{ songId, audioUrl, lyrics }] }
 */
router.post('/batch', async (req, res) => {
    try {
        const { songs } = req.body;

        if (!songs || !Array.isArray(songs) || songs.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Missing or invalid songs array'
            });
        }

        // Limit batch size
        const maxBatch = 5;
        if (songs.length > maxBatch) {
            return res.status(400).json({
                success: false,
                error: `Batch size exceeds limit (max: ${maxBatch})`
            });
        }

        console.log(`📝 Received batch timing request for ${songs.length} songs`);

        const service = getTimingService();
        const results = [];

        for (const song of songs) {
            if (!song.songId || !song.audioUrl || !song.lyrics) {
                results.push({
                    songId: song.songId || 'unknown',
                    success: false,
                    error: 'Missing required fields'
                });
                continue;
            }

            const result = await service.generatePreciseTiming(song);
            results.push({
                songId: song.songId,
                success: result.success,
                error: result.error || null
            });

            // Small delay between songs to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        const successCount = results.filter(r => r.success).length;

        res.json({
            success: true,
            message: `Processed ${songs.length} songs, ${successCount} successful`,
            results
        });

    } catch (error) {
        console.error('Batch timing error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
