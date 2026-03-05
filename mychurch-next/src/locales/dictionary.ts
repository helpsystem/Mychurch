export const dictionaries = {
    en: {
        // Navigation
        home: "Home",
        bible: "Bible",
        worship: "Worship Center",
        sermons: "Sermons",
        broadcast: "Broadcast Console",

        // Home Page
        heroTitle: "Global Online Platform",
        heroSubtitle: "A space for worship, learning, and growing together in faith.",
        quickAccess: "Quick Access",
        statsMembers: "Active Members",
        statsCountries: "Countries",
        statsGroups: "Small Groups",
        dailyVerseTitle: "Daily Verse",
        dailyVerseText: "God is spirit, and his worshipers must worship in the Spirit and in truth.",
        dailyVerseRef: "John 4:24",
        readMore: "Read More",

        // Broadcast Console
        broadcastConsole: "BROADCAST CONSOLE",
        pro: "PRO",
        onAir: "On Air",
        offline: "Offline",
        openProjectorView: "Open Projector View",
        scenes: "SCENES",
        lowerThirds: "Lower Thirds",
        mainCam: "Main Cam",
        media: "Media",
        edit: "EDIT",
        transition: "TRANSITION",
        lyrics: "LYRICS",
        slide: "Slide",
        backgroundMode: "Background Mode",
        transparent: "Transparent (NDI/Key)",
        solidColor: "Solid Color",
        dynamicVideo: "Dynamic Video",
        animationSpeed: "Animation Speed",
        lowerThirdTheme: "Lower Third Theme",
        modern: "Modern",
        classic: "Classic",
        preview: "PREVIEW",
        program: "PROGRAM",
        goLive: "GO LIVE",
        endStream: "END STREAM",
        slideBuilder: "SLIDE BUILDER",
        saveAll: "Save All",
        properties: "PROPERTIES",

        // Worship Archive
        worshipTitle: "Worship Team Center",
        worshipDesc: "Access the complete archive of worship songs, chords, and live text (karaoke) for church presentation.",
        searchPlaceholder: "Search song or artist...",
        all: "All",
        notFoundTitle: "No song found",
        notFoundDesc: "Try searching with different keywords.",
        liveText: "Live Text",
        play: "Play",
        youtube: "YouTube",
        presentation: "Presentation",

        // Bible Reader
        nextChapter: "Next Chapter",
        prevChapter: "Prev Chapter",
        audioPlayback: "Audio Playback"
    },
    fa: {
        // Navigation
        home: "خانه",
        bible: "کتاب مقدس",
        worship: "تیم پرستش",
        sermons: "مواعظ",
        broadcast: "کنسول پخش",

        // Home Page
        heroTitle: "پلتفرم آنلاین جهانی",
        heroSubtitle: "فضایی برای پرستش، یادگیری، و رشد مشترک در ایمان.",
        quickAccess: "دسترسی سریع",
        statsMembers: "عضو فعال",
        statsCountries: "کشور",
        statsGroups: "گروه کوچک",
        dailyVerseTitle: "آیه روز",
        dailyVerseText: "خدا روح است و هر که او را می‌پرستد، باید به روح و راستی بپرستد.",
        dailyVerseRef: "یوحنا ۴:۲۴",
        readMore: "بیشتر بخوانید",

        // Broadcast Console
        broadcastConsole: "کنسول پخش",
        pro: "حرفه‌ای",
        onAir: "در حال پخش",
        offline: "آفلاین",
        openProjectorView: "باز کردن صفحه پروژکتور",
        scenes: "صحنه‌ها",
        lowerThirds: "زیرنویس‌ها",
        mainCam: "دوربین اصلی",
        media: "رسانه",
        edit: "ویرایش",
        transition: "انتقال",
        lyrics: "متن سرود",
        slide: "اسلاید",
        backgroundMode: "حالت پس‌زمینه",
        transparent: "شفاف (NDI)",
        solidColor: "رنگ ثابت",
        dynamicVideo: "ویدیو پویا",
        animationSpeed: "سرعت انیمیشن",
        lowerThirdTheme: "قالب زیرنویس",
        modern: "مدرن",
        classic: "کلاسیک",
        preview: "پیش‌نمایش",
        program: "پخش زنده",
        goLive: "شروع پخش",
        endStream: "پایان پخش",
        slideBuilder: "اسلاید ساز",
        saveAll: "ذخیره همه",
        properties: "تنظیمات",

        // Worship Archive
        worshipTitle: "مرکز تیم پرستش",
        worshipDesc: "دسترسی به آرشیو کامل سرودهای پرستشی، آکوردها، و حالت متن زنده (کارائوکه) برای پخش در کلیسا.",
        searchPlaceholder: "جستجوی سرود یا خواننده...",
        all: "همه",
        notFoundTitle: "سرودی یافت نشد",
        notFoundDesc: "با کلمات دیگر جستجو کنید.",
        liveText: "متن زنده",
        play: "پخش",
        youtube: "یوتیوب",
        presentation: "ارائه",

        // Bible Reader
        nextChapter: "فصل بعدی",
        prevChapter: "فصل قبلی",
        audioPlayback: "پخش صوتی"
    }
};

export type Dictionary = typeof dictionaries.en;
export type Language = keyof typeof dictionaries;
