import { query } from "@/lib/db";
import { notFound } from "next/navigation";
import SongTimingEditor from "../SongTimingEditor";

export const dynamic = "force-dynamic";

export default async function SongTimingPage({ params }: { params: { id: string } }) {
    const { rows } = await query(
        "SELECT id, title_fa, artist, lyrics_fa, youtube_id, audio_url, timepoints FROM church_worship_songs WHERE id = $1",
        [params.id]
    );

    const song = rows[0];

    if (!song) {
        notFound();
    }

    return (
        <SongTimingEditor
            songId={song.id}
            songTitleFa={song.title_fa}
            songArtist={song.artist}
            lyricsFa={song.lyrics_fa}
            youtubeId={song.youtube_id}
            audioUrl={song.audio_url}
            existingTimepoints={song.timepoints || []}
        />
    );
}
