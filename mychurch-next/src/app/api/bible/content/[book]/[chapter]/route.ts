import { NextResponse } from 'next/server';
import { fetchChapterData } from '@/actions/bible';

export const dynamic = 'force-dynamic';

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

        if (isNaN(chapterNum)) {
            return NextResponse.json({ success: false, error: 'Invalid chapter number' }, { status: 400 });
        }

        const data = await fetchChapterData(book, chapterNum);

        if (!data) {
            return NextResponse.json({ success: false, error: 'Chapter not found' }, { status: 404 });
        }

        // dataService.ts expects data.verses.fa and data.verses.en to be arrays of strings
        // where index 0 is verse 1.
        const maxVerse = data.verses.reduce((max, v) => Math.max(max, v.number), 0);

        const faVerses: string[] = new Array(maxVerse).fill('');
        const enVerses: string[] = new Array(maxVerse).fill('');

        const pickFa = (v: any) => {
            if (faTranslation === 'qadim') return v.fa_qadim || v.fa || '';
            if (faTranslation === 'tafsiri' || faTranslation === 'tpv') return v.fa_tpv || v.fa || '';
            if (faTranslation === 'wp') return v.fa_wp || v.fa || '';
            return v.fa_mojdeh || v.fa || '';
        };

        data.verses.forEach((v: any) => {
            // Arrays are 0-indexed, verse numbers are 1-indexed
            if (v.number > 0) {
                faVerses[v.number - 1] = pickFa(v);
                enVerses[v.number - 1] = v.en || '';
            }
        });

        return NextResponse.json({
            success: true,
            selected: {
                faTranslation,
                enTranslation,
                availableFa: ['mojdeh', 'qadim', 'tafsiri', 'wp'],
                availableEn: ['kjv']
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
