import { query } from "@/lib/db";
import { notFound } from "next/navigation";
import SongTimingEditor from "../SongTimingEditor";

export const dynamic = "force-dynamic";

export default async function SongTimingPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const { rows } = await query(
        "SELECT id, title_fa, title_en, artist, lyrics_fa, lyrics_en, youtube_id, audio_url, timepoints, timing_data, category FROM church_worship_songs WHERE id = $1",
        [resolvedParams.id]
    );

    const song = rows[0];

    if (!song) {
        notFound();
    }

    return (
        <SongTimingEditor
            songId={song.id}
            songTitleFa={song.title_fa}
            songTitleEn={song.title_en}
            songArtist={song.artist}
            lyricsFa={song.lyrics_fa}
            lyricsEn={song.lyrics_en}
            youtubeId={song.youtube_id}
            audioUrl={song.audio_url}
            existingTimepoints={song.timepoints || []}
            timingData={song.timing_data}
            category={song.category}
        />
    );
}
