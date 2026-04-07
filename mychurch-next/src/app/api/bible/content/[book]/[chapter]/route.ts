import { NextResponse } from 'next/server';
import { dbAll, dbGet } from '@/lib/bibleDb';

export const dynamic = 'force-dynamic';

const BOOK_KEY_TO_USFM: Record<string, string> = {
    Genesis: 'GEN', Exodus: 'EXO', Leviticus: 'LEV', Numbers: 'NUM', Deuteronomy: 'DEU',
    Joshua: 'JOS', Judges: 'JDG', Ruth: 'RUT', '1Samuel': '1SA', '2Samuel': '2SA',
    '1Kings': '1KI', '2Kings': '2KI', '1Chronicles': '1CH', '2Chronicles': '2CH', Ezra: 'EZR',
    Nehemiah: 'NEH', Esther: 'EST', Job: 'JOB', Psalms: 'PSA', Proverbs: 'PRO',
    Ecclesiastes: 'ECC', SongOfSongs: 'SNG', Isaiah: 'ISA', Jeremiah: 'JER', Lamentations: 'LAM',
    Ezekiel: 'EZK', Daniel: 'DAN', Hosea: 'HOS', Joel: 'JOL', Amos: 'AMO', Obadiah: 'OBA',
    Jonah: 'JON', Micah: 'MIC', Nahum: 'NAM', Habakkuk: 'HAB', Zephaniah: 'ZEP',
    Haggai: 'HAG', Zechariah: 'ZEC', Malachi: 'MAL', Matthew: 'MAT', Mark: 'MRK',
    Luke: 'LUK', John: 'JHN', Acts: 'ACT', Romans: 'ROM', '1Corinthians': '1CO',
    '2Corinthians': '2CO', Galatians: 'GAL', Ephesians: 'EPH', Philippians: 'PHP',
    Colossians: 'COL', '1Thessalonians': '1TH', '2Thessalonians': '2TH', '1Timothy': '1TI',
    '2Timothy': '2TI', Titus: 'TIT', Philemon: 'PHM', Hebrews: 'HEB', James: 'JAS',
    '1Peter': '1PE', '2Peter': '2PE', '1John': '1JN', '2John': '2JN', '3John': '3JN',
    Jude: 'JUD', Revelation: 'REV',
};

function normalizeBookId(input: string): string {
    const raw = (input || '').trim();
    if (!raw) return 'GEN';

    const mapped = BOOK_KEY_TO_USFM[raw];
    if (mapped) return mapped;

    const upper = raw.toUpperCase();
    if (/^[1-3]?[A-Z]{2,3}$/.test(upper)) return upper;

    return 'GEN';
}

async function resolveVersion(preferredAbbrs: string[]) {
    for (const abbr of preferredAbbrs) {
        const row = await dbGet<{ version_id: number; abbr: string }>(
            'SELECT version_id, abbr FROM versions WHERE UPPER(abbr) = UPPER(?) LIMIT 1',
            [abbr]
        );
        if (row) return row;
    }
    return undefined;
}

function mapFaCandidates(value: string) {
    const key = value.toLowerCase();
    if (key === 'qadim') return ['POV-FAS', 'PES', 'TPV'];
    if (key === 'tafsiri' || key === 'tpv') return ['TPV', 'مژده', 'nmv'];
    if (key === 'wp') return ['PCB', 'TPV', 'nmv'];
    return ['مژده', 'TPV', 'nmv', 'PCB', 'POV-FAS'];
}

function mapEnCandidates(value: string) {
    const key = value.toLowerCase();
    if (key === 'niv') return ['NIV', 'KJV', 'BSB'];
    if (key === 'bsb') return ['BSB', 'KJV', 'NIV'];
    return ['KJV', 'BSB', 'NIV'];
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ book: string; chapter: string }> }
) {
    try {
        const resolvedParams = await params;
        const { book, chapter } = resolvedParams;
        const chapterNum = parseInt(chapter, 10);
        const url = new URL(request.url);
        const faTranslation = (url.searchParams.get('faTranslation') || 'mojdeh').toLowerCase();
        const enTranslation = (url.searchParams.get('enTranslation') || 'kjv').toLowerCase();
        const bookId = normalizeBookId(book);

        if (isNaN(chapterNum)) {
            return NextResponse.json({ success: false, error: 'Invalid chapter number' }, { status: 400 });
        }

        const [faVersion, enVersion] = await Promise.all([
            resolveVersion(mapFaCandidates(faTranslation)),
            resolveVersion(mapEnCandidates(enTranslation)),
        ]);

        if (!faVersion || !enVersion) {
            return NextResponse.json({ success: false, error: 'Requested translation not found' }, { status: 404 });
        }

        const [faRows, enRows] = await Promise.all([
            dbAll<{ verse_num: number; text: string }>(
                `SELECT verse_num, text FROM verses
                 WHERE version_id = ? AND book_id = ? AND chapter_num = ?
                 ORDER BY verse_num ASC`,
                [faVersion.version_id, bookId, chapterNum]
            ),
            dbAll<{ verse_num: number; text: string }>(
                `SELECT verse_num, text FROM verses
                 WHERE version_id = ? AND book_id = ? AND chapter_num = ?
                 ORDER BY verse_num ASC`,
                [enVersion.version_id, bookId, chapterNum]
            ),
        ]);

        if (!faRows.length && !enRows.length) {
            return NextResponse.json({ success: false, error: 'Chapter not found' }, { status: 404 });
        }

        const maxVerse = Math.max(
            ...faRows.map((v) => v.verse_num),
            ...enRows.map((v) => v.verse_num),
            0
        );

        const faVerses: string[] = new Array(maxVerse).fill('');
        const enVerses: string[] = new Array(maxVerse).fill('');

        faRows.forEach((v) => {
            if (v.verse_num > 0) faVerses[v.verse_num - 1] = v.text || '';
        });
        enRows.forEach((v) => {
            if (v.verse_num > 0) enVerses[v.verse_num - 1] = v.text || '';
        });

        const availableFaRows = await dbAll<{ abbr: string }>(
            `SELECT DISTINCT v.abbr FROM versions v
             JOIN verses s ON s.version_id = v.version_id
             WHERE v.language IN ('فارسی', 'fa', 'Persian')
             ORDER BY v.abbr ASC`
        );
        const availableEnRows = await dbAll<{ abbr: string }>(
            `SELECT DISTINCT v.abbr FROM versions v
             JOIN verses s ON s.version_id = v.version_id
             WHERE v.language IN ('English', 'en')
             ORDER BY v.abbr ASC`
        );

        const bookMeta = await dbGet<{ book_name_en: string; book_name_fa: string }>(
            `SELECT book_name_en, book_name_fa FROM books
             WHERE version_id = ? AND book_id = ? LIMIT 1`,
            [enVersion.version_id, bookId]
        );

        return NextResponse.json({
            success: true,
            selected: {
                faTranslation,
                enTranslation,
                faVersion: faVersion.abbr,
                enVersion: enVersion.abbr,
                availableFa: availableFaRows.map((row) => row.abbr),
                availableEn: availableEnRows.map((row) => row.abbr),
                bookId,
                bookNameEn: bookMeta?.book_name_en || bookId,
                bookNameFa: bookMeta?.book_name_fa || bookId,
            },
            verses: {
                fa: faVerses,
                en: enVerses
            }
        });

    } catch (error) {
        console.error('Error in /api/bible/content:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
