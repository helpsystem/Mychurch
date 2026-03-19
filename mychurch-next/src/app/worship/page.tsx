import React from "react";
import WorshipArchive from "@/components/worship/WorshipArchive";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { getWorshipSongs } from "@/actions/worship";

export const metadata = {
    title: "Worship Center | MyChurch",
    description: "Browse and experience worship songs, chords, and live lyrics.",
};

export const dynamic = "force-dynamic";

export default async function WorshipPage() {
    // Fetch live songs from PostgreSQL
    const songs = await getWorshipSongs();

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            <PublicHeader />
            {/* Background Decor */}
            <div className="absolute top-0 inset-x-0 h-[50vh] overflow-hidden -z-10 pointer-events-none">
                <div className="absolute -top-[50%] right-[10%] w-[50%] h-[100%] rounded-full bg-purple-500/10 blur-[120px]" />
            </div>

            <WorshipArchive initialSongs={songs} />
        </div>
    );
}
