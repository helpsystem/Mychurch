/**
 * PowerPoint Generator for Worship Songs
 * Generates professional PPTX presentations from song lyrics
 */

import pptxgen from 'pptxgenjs';

export interface SongPresentationOptions {
    title: string;
    artist?: string;
    lyrics: string;
    showChords?: boolean;
    lang?: 'fa' | 'en';
    churchName?: string;
    churchLogo?: string;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    linesPerSlide?: number;
}

// Helper to strip chord notations from lyrics
const stripChords = (text: string): string => {
    return text.replace(/\[([A-G][#b]?m?\d?[\/]?[A-G]?[#b]?m?\d?)\]/g, '');
};

// Helper to extract chords from a line
const extractChords = (text: string): string[] => {
    const matches = text.match(/\[([A-G][#b]?m?\d?[\/]?[A-G]?[#b]?m?\d?)\]/g);
    return matches ? matches.map(m => m.replace(/[\[\]]/g, '')) : [];
};

// Split lyrics into logical stanzas/verses
const splitIntoStanzas = (lyrics: string): string[][] => {
    const lines = lyrics.split('\n');
    const stanzas: string[][] = [];
    let currentStanza: string[] = [];

    for (const line of lines) {
        const trimmedLine = line.trim();

        // Skip empty lines but use them as stanza delimiters
        if (!trimmedLine) {
            if (currentStanza.length > 0) {
                stanzas.push(currentStanza);
                currentStanza = [];
            }
            continue;
        }

        // Skip chord-only lines and verse markers
        const isChordOnly = /^[A-G#bm\/\s\d\[\]]+$/.test(trimmedLine);
        const isMarker = /^(V\d+|Chorus\d*|Bridge|Intro|Outro|Verse\s*\d*)$/i.test(trimmedLine);

        if (!isChordOnly && !isMarker) {
            currentStanza.push(trimmedLine);
        }
    }

    // Don't forget the last stanza
    if (currentStanza.length > 0) {
        stanzas.push(currentStanza);
    }

    return stanzas;
};

/**
 * Generate a PowerPoint presentation from song lyrics
 */
export const generateSongPPTX = async (options: SongPresentationOptions): Promise<Blob> => {
    const {
        title,
        artist,
        lyrics,
        showChords = false,
        lang = 'fa',
        churchName = 'Iranian Christian Church of D.C.',
        backgroundColor = '#1e1b4b', // Deep purple
        textColor = '#ffffff',
        accentColor = '#a855f7', // Purple
        linesPerSlide = 4,
    } = options;

    const isRtl = lang === 'fa';
    const pptx = new pptxgen();

    // Set presentation properties
    pptx.author = churchName;
    pptx.title = title;
    pptx.subject = `${title} - ${artist || 'Worship Song'}`;
    pptx.layout = 'LAYOUT_16x9';

    // Slide master with church branding
    pptx.defineSlideMaster({
        title: 'WORSHIP_MASTER',
        background: { color: backgroundColor },
        objects: [
            // Footer with church name
            {
                text: {
                    text: churchName,
                    options: {
                        x: 0.5,
                        y: 6.8,
                        w: 9,
                        h: 0.4,
                        fontSize: 12,
                        color: '#9ca3af',
                        align: isRtl ? 'right' : 'left',
                        fontFace: isRtl ? 'Vazir' : 'Arial',
                    },
                },
            },
        ],
    });

    // Title slide
    const titleSlide = pptx.addSlide({ masterName: 'WORSHIP_MASTER' });

    // Main title
    titleSlide.addText(title, {
        x: 0.5,
        y: 2.5,
        w: 9,
        h: 1.5,
        fontSize: 48,
        color: textColor,
        align: 'center',
        fontFace: isRtl ? 'Vazir' : 'Arial',
        bold: true,
    });

    // Artist name
    if (artist) {
        titleSlide.addText(artist, {
            x: 0.5,
            y: 4,
            w: 9,
            h: 0.8,
            fontSize: 24,
            color: accentColor,
            align: 'center',
            fontFace: isRtl ? 'Vazir' : 'Arial',
        });
    }

    // Decorative line
    titleSlide.addShape('rect', {
        x: 3,
        y: 4.8,
        w: 4,
        h: 0.05,
        fill: { color: accentColor },
    });

    // Process lyrics
    const cleanLyrics = showChords ? lyrics : stripChords(lyrics);
    const stanzas = splitIntoStanzas(cleanLyrics);

    // Create slides for each stanza (or group of lines)
    stanzas.forEach((stanza, stanzaIndex) => {
        // If stanza is too long, split into multiple slides
        for (let i = 0; i < stanza.length; i += linesPerSlide) {
            const slideLines = stanza.slice(i, i + linesPerSlide);
            const slide = pptx.addSlide({ masterName: 'WORSHIP_MASTER' });

            // Content
            const content = slideLines.join('\n');
            slide.addText(content, {
                x: 0.5,
                y: 1.5,
                w: 9,
                h: 4.5,
                fontSize: 36,
                color: textColor,
                align: 'center',
                valign: 'middle',
                fontFace: isRtl ? 'Vazir' : 'Arial',
                lineSpacing: 48,
                rtlMode: isRtl,
            });

            // If showing chords, extract and display them
            if (showChords) {
                const allChords = slideLines.flatMap(extractChords);
                if (allChords.length > 0) {
                    slide.addText(`🎸 ${allChords.join(' - ')}`, {
                        x: 0.5,
                        y: 6.2,
                        w: 9,
                        h: 0.5,
                        fontSize: 16,
                        color: '#fbbf24', // Amber for chords
                        align: 'center',
                        fontFace: 'Arial',
                    });
                }
            }

            // Slide number
            slide.addText(`${stanzaIndex + 1}`, {
                x: 9,
                y: 6.8,
                w: 0.5,
                h: 0.4,
                fontSize: 12,
                color: '#6b7280',
                align: 'right',
            });
        }
    });

    // Closing slide
    const closingSlide = pptx.addSlide({ masterName: 'WORSHIP_MASTER' });
    closingSlide.addText(isRtl ? 'سپاس از حضور شما 🙏' : 'Thank You 🙏', {
        x: 0.5,
        y: 3,
        w: 9,
        h: 1,
        fontSize: 40,
        color: textColor,
        align: 'center',
        fontFace: isRtl ? 'Vazir' : 'Arial',
        bold: true,
    });

    closingSlide.addText(churchName, {
        x: 0.5,
        y: 4.3,
        w: 9,
        h: 0.6,
        fontSize: 20,
        color: accentColor,
        align: 'center',
        fontFace: isRtl ? 'Vazir' : 'Arial',
    });

    // Generate the PPTX file as blob
    const blob = await pptx.write({ outputType: 'blob' }) as Blob;
    return blob;
};

/**
 * Download a PPTX presentation
 */
export const downloadPPTX = async (options: SongPresentationOptions): Promise<void> => {
    const blob = await generateSongPPTX(options);

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${options.title.replace(/[\/\\:*?"<>|]/g, '_')}.pptx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
