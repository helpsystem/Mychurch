import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

function extractYoutubeId(urlOrId: string): string | null {
    if (!urlOrId) return null;
    const trimmed = urlOrId.trim();

    // Direct 11-char ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
        return trimmed;
    }

    // Standard YouTube URL formats
    const match = trimmed.match(
        /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/i
    );
    return match ? match[1] : null;
}

// Clean common noise phrases from Iranian YouTube titles
function cleanSongTitle(rawTitle: string): { title_fa: string; title_en: string } {
    let clean = rawTitle;

    // Remove emojis and special characters
    clean = clean.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, " ");

    // Remove common Persian & English YouTube boilerplate phrases
    const noisePatterns = [
        /سرود\s*پرستشی\s*جدید/gi,
        /سرود\s*پرستشی/gi,
        /سرود\s*روحانی/gi,
        /سرود\s*مسیحی/gi,
        /مسیحی\s*فارسی/gi,
        /کلیسای\s*فارسی/gi,
        /persian\s*christian\s*worship(\s*song)?/gi,
        /persian\s*worship(\s*song)?/gi,
        /christian\s*worship(\s*song)?/gi,
        /worship\s*song/gi,
        /official\s*(music\s*)?video/gi,
        /ویدیو\s*موزیک/gi,
        /موزیک\s*ویدیو/gi,
        /آهنگ\s*پرستشی/gi,
        /ترانه\s*پرستشی/gi,
        /با\s*زیرنویس/gi,
        /همراه\s*با\s*متن/gi,
        /متن\s*سرود/gi
    ];

    for (const pattern of noisePatterns) {
        clean = clean.replace(pattern, " ");
    }

    // Clean brackets, quotes and excessive punctuation
    clean = clean.replace(/[«»""''„“]/g, " ");
    clean = clean.replace(/[[\]()]/g, " ");

    // Split if separator exists (like - or / or |)
    const separators = /[-/|–—:]/;
    let faPart = "";
    let enPart = "";

    if (separators.test(clean)) {
        const parts = clean.split(separators).map(p => p.trim()).filter(Boolean);
        // Identify which part is Persian and which part is Latin/English
        const persianRegex = /[\u0600-\u06FF]/;
        const latinRegex = /[a-zA-Z]/;

        const faSegments: string[] = [];
        const enSegments: string[] = [];

        for (const p of parts) {
            if (persianRegex.test(p)) {
                faSegments.push(p);
            } else if (latinRegex.test(p)) {
                enSegments.push(p);
            }
        }

        faPart = faSegments.join(" - ");
        enPart = enSegments.join(" - ");
    }

    if (!faPart) {
        faPart = clean;
    }

    // Tidy up extra spaces
    faPart = faPart.replace(/\s+/g, " ").trim();
    enPart = enPart.replace(/\s+/g, " ").trim();

    return {
        title_fa: faPart || rawTitle.trim(),
        title_en: enPart
    };
}

// Clean YouTube video description to extract potential lyrics text
function cleanDescriptionLyrics(rawDescription: string): string {
    if (!rawDescription) return "";

    const lines = rawDescription.split("\n");
    const cleanedLines: string[] = [];
    let skipRemaining = false;

    for (const rawLine of lines) {
        const line = rawLine.trim();

        // Skip social links, bank details, donation info, hashtags
        if (
            line.startsWith("#") ||
            line.includes("t.me/") ||
            line.includes("instagram.com") ||
            line.includes("facebook.com") ||
            line.includes("youtube.com") ||
            line.includes("paypal.me") ||
            line.includes("IBAN:") ||
            line.includes("Bank :") ||
            line.includes("http://") ||
            line.includes("https://") ||
            line.includes("حمایت مالی") ||
            line.includes("اهدا کنید")
        ) {
            continue;
        }

        // Check if description has promo footer
        if (line.includes("کانال یوتیوب ما را دنبال کنید") || line.includes("از کانال تلگرام")) {
            continue;
        }

        cleanedLines.push(rawLine);
    }

    return cleanedLines.join("\n").trim();
}

export async function POST(req: Request) {
    try {
        // ===== Security Check: Admin/Leader/Operator Role Required =====
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { data: userRecord } = await supabase
            .from('users')
            .select('role')
            .eq('email', user.email)
            .single();
        if (!userRecord || !['Admin', 'Leader', 'Operator'].includes(userRecord.role)) {
            return NextResponse.json({ error: "Forbidden: Admin/Leader/Operator access required" }, { status: 403 });
        }
        // ===== End Security Check =====

        const body = await req.json();
        const { url, enhanceWithAi } = body;

        if (!url || typeof url !== "string") {
            return NextResponse.json({ error: "آدرس لینک یوتیوب الزامی است." }, { status: 400 });
        }

        const videoId = extractYoutubeId(url);
        if (!videoId) {
            return NextResponse.json({ error: "شناسه ویدیو یوتیوب نامعتبر است." }, { status: 400 });
        }

        // 1. Fetch YouTube oEmbed for reliable metadata
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        let rawTitle = "";
        let authorName = "";
        let authorUrl = "";
        let oembedThumbnail = "";

        try {
            const oembedRes = await fetch(oembedUrl);
            if (oembedRes.ok) {
                const oembedData = await oembedRes.json();
                rawTitle = oembedData.title || "";
                authorName = oembedData.author_name || "";
                authorUrl = oembedData.author_url || "";
                oembedThumbnail = oembedData.thumbnail_url || "";
            }
        } catch (oembedErr) {
            console.warn("[ExtractYouTube] oEmbed fetch warning:", oembedErr);
        }

        // 2. Fetch watch page HTML to get description and credits
        let description = "";
        let pageTitle = "";

        try {
            const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept-Language": "fa,en;q=0.9"
                }
            });

            if (pageRes.ok) {
                const html = await pageRes.text();

                // Extract shortDescription from ytInitialPlayerResponse
                const descIndex = html.indexOf('"shortDescription":"');
                if (descIndex !== -1) {
                    const start = descIndex + '"shortDescription":"'.length;
                    let end = start;
                    while (end < html.length) {
                        if (html[end] === '"' && html[end - 1] !== "\\") break;
                        end++;
                    }
                    const rawDesc = html.substring(start, end);
                    try {
                        description = JSON.parse(`"${rawDesc}"`);
                    } catch (e) {
                        description = rawDesc.replace(/\\n/g, "\n").replace(/\\"/g, '"');
                    }
                }

                // Fallback title from title tag if oEmbed failed
                if (!rawTitle) {
                    const titleMatch = html.match(/<title>(.*?)<\/title>/);
                    if (titleMatch) {
                        pageTitle = titleMatch[1].replace(/\s*-\s*YouTube$/, "").trim();
                    }
                }
            }
        } catch (pageErr) {
            console.warn("[ExtractYouTube] Page HTML fetch warning:", pageErr);
        }

        const effectiveTitle = rawTitle || pageTitle || `سرود پرستشی (${videoId})`;
        const { title_fa, title_en } = cleanSongTitle(effectiveTitle);

        // Detect artist / writer from description or channel
        let artist = authorName.replace(/^SALIB VA NOOR-?/i, "").trim();
        if (description) {
            const poetMatch = description.match(/(?:سراینده|شاعر|خواننده|اجرا|آهنگساز)[:\s]+([^\n\r,،]+)/);
            if (poetMatch && poetMatch[1]) {
                const credit = poetMatch[1].trim();
                if (credit && !artist.includes(credit)) {
                    artist = artist ? `${credit} (${artist})` : credit;
                }
            }
        }

        // Cleaned lyrics from description
        const potentialLyrics = cleanDescriptionLyrics(description);

        // High quality thumbnails
        const maxresThumbnail = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
        const hqThumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        const primaryThumbnail = oembedThumbnail || maxresThumbnail;

        // Auto-detect category
        let category = "پرستش";
        const combinedText = `${effectiveTitle} ${description}`;
        if (combinedText.includes("مزمور") || combinedText.includes("Psalm")) {
            category = "مزامیر";
        } else if (combinedText.includes("شکرگزاری") || combinedText.includes("حمد")) {
            category = "شکرگزاری";
        } else if (combinedText.includes("صلیب") || combinedText.includes("خون عیسی") || combinedText.includes("قیام")) {
            category = "صلیب و قیام";
        } else if (combinedText.includes("نجات") || combinedText.includes("فیض") || combinedText.includes("توبه")) {
            category = "فیض و نجات";
        } else if (combinedText.includes("روح القدس")) {
            category = "روح‌القدس";
        } else if (combinedText.includes("آرامش") || combinedText.includes("تسلی") || combinedText.includes("تشنگی")) {
            category = "تسلی و آرامش";
        }

        // Optional AI enhancement if requested and key is present
        let aiEnhanced: any = null;
        if (enhanceWithAi && potentialLyrics) {
            const nvidiaKey = process.env.NVIDIA_API_KEY;
            if (nvidiaKey) {
                try {
                    const aiPrompt = `You are an expert Iranian Christian worship leader. Given the following video title and extracted text:
Title: ${effectiveTitle}
Text:
${potentialLyrics}

Return a clean JSON object with:
- "title_fa": The clean Persian song title
- "title_en": The English or Finglish title
- "artist": The singer or church/ministry name
- "lyrics_fa": Clean Persian lyrics formatted into verses/choruses (no chords or noise)
- "lyrics_finglish": Finglish transliteration
- "lyrics_en": Poetic English translation
- "category": Appropriate category (e.g. "پرستش", "مزامیر", "شکرگزاری", "صلیب و قیام", "فیض و نجات")

Only output valid JSON with no markdown wrapping.`;

                    const aiRes = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${nvidiaKey}`
                        },
                        body: JSON.stringify({
                            model: "z-ai/glm-5.3-flash",
                            messages: [{ role: "user", content: aiPrompt }],
                            temperature: 0.2,
                            max_tokens: 2500
                        })
                    });

                    if (aiRes.ok) {
                        const aiData = await aiRes.json();
                        const rawAiContent = aiData.choices?.[0]?.message?.content || "";
                        const jsonClean = rawAiContent.replace(/```json/g, "").replace(/```/g, "").trim();
                        aiEnhanced = JSON.parse(jsonClean);
                    }
                } catch (aiErr) {
                    console.warn("[ExtractYouTube] AI enhancement error:", aiErr);
                }
            }
        }

        return NextResponse.json({
            success: true,
            videoId,
            youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
            thumbnailUrl: primaryThumbnail,
            thumbnails: {
                maxres: maxresThumbnail,
                hq: hqThumbnail,
                default: oembedThumbnail
            },
            rawTitle: effectiveTitle,
            title_fa: aiEnhanced?.title_fa || title_fa,
            title_en: aiEnhanced?.title_en || title_en,
            artist: aiEnhanced?.artist || artist,
            authorName,
            authorUrl,
            category: aiEnhanced?.category || category,
            description,
            lyrics_fa: aiEnhanced?.lyrics_fa || potentialLyrics,
            lyrics_finglish: aiEnhanced?.lyrics_finglish || "",
            lyrics_en: aiEnhanced?.lyrics_en || "",
            chords: aiEnhanced?.chords || ""
        });
    } catch (err: any) {
        console.error("[ExtractYouTube] Route error:", err);
        return NextResponse.json({ error: err.message || "خطای سرور در استخراج اطلاعات یوتیوب" }, { status: 500 });
    }
}
