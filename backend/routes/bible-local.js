/**
 * Bible Local Content API - Serves downloaded Bible files
 */

const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

// Path to downloaded Bible data
const BIBLE_DATA_DIR = path.join(__dirname, '../bible_data');

/**
 * GET /api/bible-local/content/:translation/:book/:chapter
 * Serves chapter text from local JSON files
 */
router.get('/content/:translation/:book/:chapter', async (req, res) => {
    try {
        const { translation, book, chapter } = req.params;

        const filePath = path.join(
            BIBLE_DATA_DIR,
            'text',
            translation.toUpperCase(),
            book.toUpperCase(),
            `${chapter}.json`
        );

        const fileContent = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(fileContent);

        res.json({
            success: true,
            ...data,
            audioUrl: `/api/bible-local/audio/${translation}/${book}/${chapter}`
        });

    } catch (error) {
        console.error('Bible content error:', error.message);
        res.status(404).json({
            success: false,
            error: 'Chapter not found',
            message: error.message
        });
    }
});

/**
 * GET /api/bible-local/audio/:translation/:book/:chapter
 * Streams MP3 audio with range support
 */
router.get('/audio/:translation/:book/:chapter', async (req, res) => {
    try {
        const { translation, book, chapter } = req.params;

        const audioPath = path.join(
            BIBLE_DATA_DIR,
            'audio',
            translation.toUpperCase(),
            book.toUpperCase(),
            `${chapter}.mp3`
        );

        const stat = await fs.stat(audioPath);
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
            const chunkSize = (end - start) + 1;

            const readStream = require('fs').createReadStream(audioPath, { start, end });

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${stat.size}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': 'audio/mpeg',
            });

            readStream.pipe(res);
        } else {
            res.writeHead(200, {
                'Content-Length': stat.size,
                'Content-Type': 'audio/mpeg',
            });

            require('fs').createReadStream(audioPath).pipe(res);
        }

    } catch (error) {
        console.error('Audio stream error:', error.message);
        res.status(404).json({ success: false, error: 'Audio not found' });
    }
});

module.exports = router;
