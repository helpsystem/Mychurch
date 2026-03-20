import { NextResponse } from 'next/server';
import { getWorshipSongs } from '@/actions/worship';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const songs = await getWorshipSongs();
        return NextResponse.json(songs);
    } catch (error) {
        console.error('Error in /api/worship-songs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
