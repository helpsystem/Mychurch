import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import SongTimingEditor from "../SongTimingEditor";

export const dynamic = "force-dynamic";

export default async function SongTimingPage({ params }: { params: { id: string } }) {
    const supabase = await createClient();

    const { data: song, error } = await supabase
        .from("worship_songs")
        .select("id, title_fa, artist, lyrics_fa, youtube_id, timepoints")
        .eq("id", params.id)
        .single();

    if (error || !song) {
        notFound();
    }

    return (
        <SongTimingEditor
            songId={params.id}
            songTitleFa={song.title_fa}
            songArtist={song.artist}
            lyricsFa={song.lyrics_fa}
            youtubeId={song.youtube_id}
            existingTimepoints={song.timepoints || []}
        />
    );
}
