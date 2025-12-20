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

        // CHECK AUDIO EXISTENCE
        const primaryAudioPath = path.join(
            BIBLE_DATA_DIR,
            'audio',
            translation.toUpperCase(),
            book.toUpperCase(),
            `${chapter}.mp3`
        );

        let audioUrl = null;

        try {
            await fs.access(primaryAudioPath);
            // file exists
            audioUrl = `/api/bible-local/audio/${translation}/${book}/${chapter}`;
        } catch (e) {
            // Primary audio missing, check fallback (MOJDEH) if Persian
            const isPersian = ['TPV', 'QADIM', 'NM', 'PCB'].includes(translation.toUpperCase());
            if (isPersian) {
                const fallbackPath = path.join(BIBLE_DATA_DIR, 'audio', 'MOJDEH', book.toUpperCase(), `${chapter}.mp3`);
                try {
                    await fs.access(fallbackPath);
                    // Fallback exists!
                    // Note: We still point to the original URL structure, but the /audio endpoint (which we fixed)
                    // will handle serving the fallback file content.
                    // HOWEVER, for the frontend to know "it exists", we return true here.
                    // Actually, if we return the same URL, the frontend will try to play it.
                    // The /audio endpoint handles the logic.
                    // So we just need to know if *eventually* it will work.
                    audioUrl = `/api/bible-local/audio/${translation}/${book}/${chapter}`;
                } catch (e2) {
                    // No fallback either
                    audioUrl = null;
                }
            }
        }

        data.audio = audioUrl;

        res.json({
            success: true,
            ...data,
            audioUrl: audioUrl,
            hasAudio: !!audioUrl // Explicit flag for frontend
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
        // Fallback Logic for Persian Translations
        const { translation, book, chapter } = req.params;
        const isPersian = ['TPV', 'QADIM', 'NM', 'PCB'].includes(translation.toUpperCase());

        if (error.code === 'ENOENT' && isPersian && translation.toUpperCase() !== 'MOJDEH') {
            try {
                // Try serving MOJDEH audio as fallback
                const fallbackPath = path.join(
                    BIBLE_DATA_DIR,
                    'audio',
                    'MOJDEH', // Fallback translation
                    book.toUpperCase(),
                    `${chapter}.mp3`
                );

                const stat = await fs.stat(fallbackPath);

                // Serve the fallback file
                const range = req.headers.range;
                if (range) {
                    const parts = range.replace(/bytes=/, '').split('-');
                    const start = parseInt(parts[0], 10);
                    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
                    const chunkSize = (end - start) + 1;

                    const readStream = require('fs').createReadStream(fallbackPath, { start, end });
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
                    require('fs').createReadStream(fallbackPath).pipe(res);
                }
                return; // Succesfully served fallback

            } catch (fallbackError) {
                console.error('Audio fallback failed:', fallbackError.message);
            }
        }

        console.error('Audio stream error:', error.message);
        res.status(404).json({ success: false, error: 'Audio not found' });
    }
});

module.exports = router;
