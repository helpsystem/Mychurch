const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..', '..');
const BIBLE_DATA_DIR = path.join(PROJECT_ROOT, 'bible_data');

/**
 * GET /api/bible-local/content/:translation/:book/:chapter
 * Returns text and timestamps (if available)
 */
router.get('/content/:translation/:book/:chapter', (req, res) => {
    try {
        const { translation, book, chapter } = req.params;

        // Paths
        const textPath = path.join(BIBLE_DATA_DIR, 'text', translation, book, `${chapter}.json`);
        // Use timestamps path
        const timestampPath = path.join(BIBLE_DATA_DIR, 'timestamps', translation, book, `${chapter}.json`);

        // Check text file
        if (!fs.existsSync(textPath)) {
            return res.status(404).json({ success: false, error: 'Chapter text not found' });
        }

        // Read Text
        const textContent = JSON.parse(fs.readFileSync(textPath, 'utf8'));

        // Read Timestamps (if exists)
        let timestampData = null;
        if (fs.existsSync(timestampPath)) {
            try {
                timestampData = JSON.parse(fs.readFileSync(timestampPath, 'utf8'));
            } catch (e) {
                console.error('Error reading timestamp file:', e);
            }
        }

        // Merge Data
        // If timestamps exist, we can enrich the verses
        const verses = textContent.verses.map(v => {
            const verseNum = v.verse;
            let verseTime = null;

            if (timestampData && timestampData.verses) {
                const tsVerse = timestampData.verses.find(TV => TV.verse === verseNum);
                if (tsVerse) {
                    verseTime = {
                        start: tsVerse.start,
                        end: tsVerse.end,
                        words: tsVerse.words
                    };
                }
            }

            return {
                ...v,
                timing: verseTime
            };
        });

        // Construct Audio URL (Assuming served statically or valid URL)
        // audio/{translation}/{book}/{chapter}.mp3
        // We need a route for audio too!
        const audioUrl = `/api/bible-local/audio/${translation}/${book}/${chapter}.mp3`;

        res.json({
            success: true,
            book: textContent.book,
            chapter: textContent.chapter,
            translation: translation,
            verses: verses,
            audioUrl: audioUrl,
            intro: timestampData?.intro || null
        });

    } catch (error) {
        console.error('Error in bible-local:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

/**
 * GET /api/bible-local/audio/:translation/:book/:chapter.mp3
 * Serves audio file
 */
router.get('/audio/:translation/:book/:chapter.mp3', (req, res) => {
    try {
        const { translation, book, chapter } = req.params;
        const audioPath = path.join(BIBLE_DATA_DIR, 'audio', translation, book, `${chapter}.mp3`);

        if (fs.existsSync(audioPath)) {
            res.sendFile(audioPath);
        } else {
            res.status(404).send('Audio not found');
        }
    } catch (error) {
        console.error('Error serving audio:', error);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
