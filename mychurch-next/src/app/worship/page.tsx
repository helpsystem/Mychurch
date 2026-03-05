import React from "react";
import WorshipArchive from "@/components/worship/WorshipArchive";
import { getWorshipSongs } from "@/data/worshipSongs";

export const metadata = {
    title: "Worship Center | MyChurch",
    description: "Browse and experience worship songs, chords, and live lyrics.",
};

export default function WorshipPage() {
    // Server-side fetching of songs
    const songs = getWorshipSongs();

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 inset-x-0 h-[50vh] overflow-hidden -z-10 pointer-events-none">
                <div className="absolute -top-[50%] right-[10%] w-[50%] h-[100%] rounded-full bg-purple-500/10 blur-[120px]" />
            </div>

            <WorshipArchive initialSongs={songs} />
        </div>
    );
}
