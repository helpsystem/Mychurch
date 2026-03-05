export interface WorshipSong {
    id: string;
    title: { fa: string; en?: string };
    artist?: string;
    youtubeId?: string;
    audioUrl?: string;
    lyrics?: { fa?: string; en?: string };
}

export const WORSHIP_SONGS: WorshipSong[] = [
    {
        id: "1",
        title: { fa: "عیسی نام تو", en: "Jesus Your Name" },
        artist: "پرستندگان ایرانی",
        youtubeId: "dQw4w9WgXcQ",
        audioUrl: "/audio/sample1.mp3",
        lyrics: { fa: "عیسی نام تو زیباست\nآرامش بخش جانهاست" }
    },
    {
        id: "2",
        title: { fa: "قدوس قدوس", en: "Holy Holy" },
        artist: "گروه پرستش",
        audioUrl: "/audio/sample2.mp3"
    },
    {
        id: "3",
        title: { fa: "ایمان دارم", en: "I Believe" },
        artist: "کلیسای ایرانیان"
    },
    {
        id: "4",
        title: { fa: "شبان من", en: "My Shepherd" },
        artist: "پرستندگان",
        youtubeId: "abc123xyz"
    }
];

export function getWorshipSongs(): WorshipSong[] {
    return WORSHIP_SONGS;
}
