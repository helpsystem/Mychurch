import { NextResponse } from 'next/server';
import { Slide, SlideType, PrayerRequest } from '@/types/broadcast';

// Comprehensive bilingual Bible book mapping
const BIBLE_BOOKS_MAP: Record<string, { fa: string; en: string }> = {
    genesis: { fa: "پیدایش", en: "Genesis" },
    exodus: { fa: "خروج", en: "Exodus" },
    leviticus: { fa: "لاویان", en: "Leviticus" },
    numbers: { fa: "اعداد", en: "Numbers" },
    deuteronomy: { fa: "تثنیه", en: "Deuteronomy" },
    joshua: { fa: "یوشع", en: "Joshua" },
    judges: { fa: "داوران", en: "Judges" },
    ruth: { fa: "روت", en: "Ruth" },
    "1samuel": { fa: "اول سموئیل", en: "1 Samuel" },
    "2samuel": { fa: "دوم سموئیل", en: "2 Samuel" },
    "1kings": { fa: "اول پادشاهان", en: "1 Kings" },
    "2kings": { fa: "دوم پادشاهان", en: "2 Kings" },
    "1chronicles": { fa: "اول تواریخ", en: "1 Chronicles" },
    "2chronicles": { fa: "دوم تواریخ", en: "2 Chronicles" },
    ezra: { fa: "عزرا", en: "Ezra" },
    nehemiah: { fa: "نحمیا", en: "Nehemiah" },
    esther: { fa: "استر", en: "Esther" },
    job: { fa: "ایوب", en: "Job" },
    psalms: { fa: "مزامیر", en: "Psalms" },
    psalm: { fa: "مزمور", en: "Psalm" },
    proverbs: { fa: "امثال", en: "Proverbs" },
    ecclesiastes: { fa: "جامعه", en: "Ecclesiastes" },
    songofsongs: { fa: "غزل غزلها", en: "Song of Songs" },
    isaiah: { fa: "اشعیا", en: "Isaiah" },
    jeremiah: { fa: "ارمیا", en: "Jeremiah" },
    lamentations: { fa: "مراثی", en: "Lamentations" },
    ezekiel: { fa: "حزقیال", en: "Ezekiel" },
    daniel: { fa: "دانیال", en: "Daniel" },
    hosea: { fa: "هوشع", en: "Hosea" },
    joel: { fa: "یوئیل", en: "Joel" },
    amos: { fa: "عاموس", en: "Amos" },
    obadiah: { fa: "عوبدیا", en: "Obadiah" },
    jonah: { fa: "یونس", en: "Jonah" },
    micah: { fa: "میکاه", en: "Micah" },
    nahum: { fa: "ناحوم", en: "Nahum" },
    habakkuk: { fa: "حبقوق", en: "Habakkuk" },
    zephaniah: { fa: "صفنیا", en: "Zephaniah" },
    haggai: { fa: "حجی", en: "Haggai" },
    zechariah: { fa: "زکریا", en: "Zechariah" },
    malachi: { fa: "ملاکی", en: "Malachi" },
    matthew: { fa: "متی", en: "Matthew" },
    mark: { fa: "مرقس", en: "Mark" },
    luke: { fa: "لوقا", en: "Luke" },
    john: { fa: "یوحنا", en: "John" },
    acts: { fa: "اعمال رسولان", en: "Acts" },
    romans: { fa: "رومیان", en: "Romans" },
    "1corinthians": { fa: "اول قرنتیان", en: "1 Corinthians" },
    "2corinthians": { fa: "دوم قرنتیان", en: "2 Corinthians" },
    galatians: { fa: "غلاطیان", en: "Galatians" },
    ephesians: { fa: "افسسیان", en: "Ephesians" },
    philippians: { fa: "فیلیپیان", en: "Philippians" },
    colossians: { fa: "کولسیان", en: "Colossians" },
    "1thessalonians": { fa: "اول تسالونیکیان", en: "1 Thessalonians" },
    "2thessalonians": { fa: "دوم تسالونیکیان", en: "2 Thessalonians" },
    "1timothy": { fa: "اول تیموتائوس", en: "1 Timothy" },
    "2timothy": { fa: "دوم تیموتائوس", en: "2 Timothy" },
    titus: { fa: "تیطس", en: "Titus" },
    philemon: { fa: "فلیمون", en: "Philemon" },
    hebrews: { fa: "عبرانیان", en: "Hebrews" },
    james: { fa: "یعقوب", en: "James" },
    "1peter": { fa: "اول پطرس", en: "1 Peter" },
    "2peter": { fa: "دوم پطرس", en: "2 Peter" },
    "1john": { fa: "اول یوحنا", en: "1 John" },
    "2john": { fa: "دوم یوحنا", en: "2 John" },
    "3john": { fa: "سوم یوحنا", en: "3 John" },
    jude: { fa: "یهودا", en: "Jude" },
    revelation: { fa: "مکاشفه", en: "Revelation" }
};

function resolveBookNames(rawBook: string): { fa: string; en: string } {
    if (!rawBook) return { fa: "", en: "" };
    const clean = rawBook.trim().toLowerCase().replace(/\s+/g, "");

    if (BIBLE_BOOKS_MAP[clean]) {
        return BIBLE_BOOKS_MAP[clean];
    }

    for (const val of Object.values(BIBLE_BOOKS_MAP)) {
        if (
            val.fa.includes(rawBook.trim()) ||
            rawBook.trim().includes(val.fa) ||
            val.en.toLowerCase() === rawBook.trim().toLowerCase()
        ) {
            return val;
        }
    }

    return { fa: rawBook.trim(), en: rawBook.trim() };
}

function escapeHtml(text: string): string {
    if (!text) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function cleanText(text: any): string {
    if (!text) return "";
    return String(text).trim();
}

function stripHtml(html: string): string {
    if (!html) return "";
    return html
        .replace(/<br\s*[\/]?>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<\/div>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .trim();
}

interface AudioPayload {
    buffer?: Buffer;
    filename: string;
    mimeType: string;
    telegramFileId?: string;
    title: string;
    performer: string;
}

/**
 * Resolves an audio file from local disk, VPS storage, or internal proxy
 */
async function resolveAudioData(
    audioSource?: string,
    telegramFileId?: string,
    title = 'سرود پرستشی',
    performer = 'کلیسای ایرانیان واشنگتن دی‌سی'
): Promise<AudioPayload | null> {
    if (telegramFileId) {
        return {
            filename: 'worship-song.mp3',
            mimeType: 'audio/mpeg',
            telegramFileId,
            title,
            performer
        };
    }

    if (!audioSource) return null;

    try {
        const { existsSync } = await import('fs');
        const { readFile, readdir } = await import('fs/promises');
        const { join, basename } = await import('path');

        if (audioSource.startsWith('/worship/') || audioSource.startsWith('/audio/') || audioSource.startsWith('worship/')) {
            const cleanPath = decodeURIComponent(audioSource.replace(/^\/+/, ''));
            const filename = basename(cleanPath) || 'worship-song.mp3';
            const mimeType = filename.endsWith('.m4a') ? 'audio/mp4' : 'audio/mpeg';

            // Candidates on disk (works in local dev and on production VPS)
            const diskCandidates = [
                join(process.cwd(), 'public', cleanPath),
                join(process.cwd(), cleanPath),
                join('/root/mychurch-v2/mychurch-next/public', cleanPath),
                join('/var/www/storage', cleanPath.replace(/^worship\//, '')),
                join('/var/www/storage', cleanPath)
            ];

            for (const cand of diskCandidates) {
                if (existsSync(cand)) {
                    const buffer = await readFile(cand);
                    return { buffer, filename, mimeType, title, performer };
                }
            }

            // Fuzzy match in kalameh directory for Persian unicode differences (NFC vs NFD)
            const dirCandidates = [
                join(process.cwd(), 'public', 'worship', 'audio', 'kalameh'),
                '/root/mychurch-v2/mychurch-next/public/worship/audio/kalameh',
                '/var/www/storage/worship/audio/kalameh',
                '/var/www/storage/audio/kalameh'
            ];

            for (const dir of dirCandidates) {
                if (existsSync(dir)) {
                    const files = await readdir(dir);
                    const matched = files.find(f =>
                        f.normalize('NFC').toLowerCase() === filename.normalize('NFC').toLowerCase() ||
                        f.normalize('NFD').toLowerCase() === filename.normalize('NFD').toLowerCase()
                    );
                    if (matched) {
                        const buffer = await readFile(join(dir, matched));
                        return { buffer, filename: matched, mimeType, title, performer };
                    }
                }
            }

            // Fallback: internal audio proxy
            const internalBase = process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000';
            const fetchUrl = `${internalBase}/api/worship-audio?url=${encodeURIComponent(audioSource)}`;
            const res = await fetch(fetchUrl);
            if (res.ok) {
                const arrayBuf = await res.arrayBuffer();
                return {
                    buffer: Buffer.from(arrayBuf),
                    filename,
                    mimeType: res.headers.get('content-type') || mimeType,
                    title,
                    performer
                };
            }
        } else if (audioSource.startsWith('http')) {
            const res = await fetch(audioSource);
            if (res.ok) {
                const arrayBuf = await res.arrayBuffer();
                const urlObj = new URL(audioSource);
                const filename = basename(urlObj.pathname) || 'worship-song.mp3';
                return {
                    buffer: Buffer.from(arrayBuf),
                    filename,
                    mimeType: res.headers.get('content-type') || 'audio/mpeg',
                    title,
                    performer
                };
            }
        }
    } catch (err) {
        console.warn('[Telegram Export] Audio resolution error:', err);
    }

    return null;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            presentationId,
            slides = [] as Slide[],
            selectedSlideIndices,
        } = body;

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const channelId = process.env.TELEGRAM_PUBLIC_CHANNEL_ID || '-1003905361426';
        const requestedChatId = body.chatId || body.targetChatId;
        const groupId = process.env.TELEGRAM_PUBLIC_GROUP_ID;

        // Build list of target chat IDs to deliver to
        const targets: { id: string; name: string }[] = [];
        if (requestedChatId) {
            targets.push({ id: String(requestedChatId), name: 'چت درخواستی | Requested Chat' });
        } else {
            if (channelId) {
                targets.push({ id: String(channelId), name: 'کانال رسمی کلیسا (@iranianchurchdc)' });
            }
            if (groupId && groupId !== channelId && !targets.some(t => t.id === String(groupId))) {
                targets.push({ id: String(groupId), name: 'گروه کلیسا | Church Group' });
            }
        }

        if (!botToken || targets.length === 0) {
            return NextResponse.json({
                error: 'تنظیمات تلگرام (TELEGRAM_BOT_TOKEN یا TELEGRAM_PUBLIC_CHANNEL_ID) در سرور یافت نشد.'
            }, { status: 500 });
        }

        // Filter slides if specific indices were selected
        const selectedIndicesSet = Array.isArray(selectedSlideIndices) && selectedSlideIndices.length > 0
            ? new Set<number>(selectedSlideIndices)
            : null;

        const slidesToProcess: { slide: Slide; originalIndex: number }[] = [];
        slides.forEach((slide: Slide, idx: number) => {
            if (!slide || !slide.content) return;
            if (selectedIndicesSet === null || selectedIndicesSet.has(idx)) {
                slidesToProcess.push({ slide, originalIndex: idx });
            }
        });

        if (slidesToProcess.length === 0) {
            return NextResponse.json({
                error: 'هیچ اسلایدی برای ارسال انتخاب نشده است.'
            }, { status: 400 });
        }

        // Query Supabase for enriched worship songs database
        const songDbMap = new Map<string, any>();
        try {
            const { createAdminClient } = await import('@/utils/supabase/server');
            const supabase = await createAdminClient();
            const { data: dbSongs } = await supabase
                .from('church_worship_songs')
                .select('id, title_fa, title_en, artist, youtube_id, audio_url, telegram_file_id, lyrics_fa, lyrics_en, chords');

            if (dbSongs && Array.isArray(dbSongs)) {
                dbSongs.forEach((song: any) => {
                    if (song.id) songDbMap.set(String(song.id).toLowerCase(), song);
                    if (song.title_fa) songDbMap.set(song.title_fa.trim().toLowerCase(), song);
                    if (song.title_en) songDbMap.set(song.title_en.trim().toLowerCase(), song);
                });
            }
        } catch (dbErr) {
            console.warn('[Telegram Export] Failed to fetch worship songs from DB:', dbErr);
        }

        // Sleek, minimal footer across all slide messages (no visual noise)
        const churchFooter = `\n───\n⛪️ <a href="https://www.iranianchurchdc.com">کلیسای ایرانیان واشنگتن دی‌سی</a> | @iranianchurchdc`;

        interface PreparedSlideMessage {
            slideIndex: number;
            type: string;
            text: string;
            audioData?: AudioPayload | null;
        }

        const preparedMessages: PreparedSlideMessage[] = [];

        for (const { slide, originalIndex } of slidesToProcess) {
            const slideNum = originalIndex + 1;

            if (slide.type === SlideType.SCRIPTURE) {
                const content = slide.content as any;
                let refTitle = "";
                let refEn = "";
                const faVerses: string[] = [];
                const enVerses: string[] = [];

                if (Array.isArray(content.pages) && content.pages.length > 0) {
                    content.pages.forEach((page: any) => {
                        const rawBook = page.bookName?.fa || page.book || page.bookName?.en || '';
                        const bookNames = resolveBookNames(rawBook);
                        const bFa = page.bookName?.fa || bookNames.fa;
                        const bEn = page.bookName?.en || bookNames.en;
                        const chapter = page.chapter || '';
                        const versesLabel = page.verses || (Array.isArray(page.verseNumbers) ? page.verseNumbers.join(', ') : '');

                        if (!refTitle && bFa) {
                            refTitle = `${bFa} ${chapter}${versesLabel ? `:${versesLabel}` : ''}`.trim();
                            refEn = bEn ? `${bEn} ${chapter}${versesLabel ? `:${versesLabel}` : ''}`.trim() : '';
                        }

                        const isFaPrimary = page.primaryLanguage !== 'en';
                        const primaryList = Array.isArray(page.textPrimary) ? page.textPrimary : (page.textPrimary ? [page.textPrimary] : []);
                        const secondaryList = Array.isArray(page.textSecondary) ? page.textSecondary : (page.textSecondary ? [page.textSecondary] : []);
                        const verseNumbers = Array.isArray(page.verseNumbers) ? page.verseNumbers : [];

                        const textFaList = isFaPrimary ? primaryList : secondaryList;
                        const textEnList = isFaPrimary ? secondaryList : primaryList;

                        if (textFaList.length > 0) {
                            textFaList.forEach((tFa: string, vIdx: number) => {
                                const vNum = verseNumbers[vIdx] !== undefined ? verseNumbers[vIdx] : (vIdx + 1);
                                const cFa = cleanText(tFa);
                                if (cFa) faVerses.push(`<b>${vNum}</b> ${escapeHtml(cFa)}`);

                                const cEn = cleanText(textEnList[vIdx]);
                                if (cEn) enVerses.push(`${vNum} ${escapeHtml(cEn)}`);
                            });
                        } else if (page.textFa || page.text) {
                            const cFa = cleanText(page.textFa || page.text);
                            if (cFa) faVerses.push(escapeHtml(cFa));
                            const cEn = cleanText(page.textEn);
                            if (cEn) enVerses.push(escapeHtml(cEn));
                        }
                    });
                } else if (Array.isArray(content.verses)) {
                    content.verses.forEach((v: any, vIdx: number) => {
                        const rawBook = v.book || v.bookEn || '';
                        const bookNames = resolveBookNames(rawBook);
                        if (!refTitle) {
                            refTitle = `${bookNames.fa || v.book} ${v.chapter || ''}${v.verse ? `:${v.verse}` : ''}`.trim();
                            refEn = `${bookNames.en || v.bookEn} ${v.chapter || ''}${v.verse ? `:${v.verse}` : ''}`.trim();
                        }
                        const vNum = v.verse || (vIdx + 1);
                        const cFa = cleanText(v.text || v.textFa || '');
                        if (cFa) faVerses.push(`<b>${vNum}</b> ${escapeHtml(cFa)}`);

                        const cEn = cleanText(v.textEn || '');
                        if (cEn) enVerses.push(`${vNum} ${escapeHtml(cEn)}`);
                    });
                }

                // Dignified, continuous biblical paragraph without repetitive flags or line breaks
                let text = `📖 <b>${escapeHtml(refTitle || 'کلام خدا')}</b>`;
                if (refEn && refEn !== refTitle) {
                    text += `\n<i>${escapeHtml(refEn)}</i>`;
                }
                text += `\n───\n\n`;

                if (faVerses.length > 0) {
                    text += `«${faVerses.join(' ')}»\n\n`;
                }
                if (enVerses.length > 0) {
                    text += `🇬🇧 <b>English:</b>\n<i>"${enVerses.join(' ')}"</i>\n\n`;
                }
                text += churchFooter;

                preparedMessages.push({
                    slideIndex: slideNum,
                    type: 'scripture',
                    text
                });
            } else if (slide.type === SlideType.LYRICS) {
                const content = slide.content as any;
                const rawTitle = content.title || content.titleFa || content.titleEn || `سرود پرستشی ${slideNum}`;
                const songId = content.songId ? String(content.songId).toLowerCase() : undefined;

                let matchedDbSong: any = null;
                if (songId && songDbMap.has(songId)) {
                    matchedDbSong = songDbMap.get(songId);
                } else if (songDbMap.has(rawTitle.trim().toLowerCase())) {
                    matchedDbSong = songDbMap.get(rawTitle.trim().toLowerCase());
                }

                const titleFa = matchedDbSong?.title_fa || content.titleFa || rawTitle;
                const titleEn = matchedDbSong?.title_en || content.titleEn || (content.title !== titleFa ? content.title : undefined);
                const artist = matchedDbSong?.artist || content.artist;
                const rawYoutube = matchedDbSong?.youtube_id || content.youtubeId;
                let youtubeUrl: string | undefined = undefined;
                if (rawYoutube) {
                    youtubeUrl = rawYoutube.startsWith('http') ? rawYoutube : `https://youtu.be/${rawYoutube.trim()}`;
                }
                const audioSource = matchedDbSong?.audio_url || content.audioUrl;
                const tgFileId = matchedDbSong?.telegram_file_id || content.telegramFileId;
                const chords = matchedDbSong?.chords || content.chords;

                let linesFa: string[] = [];
                if (Array.isArray(content.lines) && content.lines.length > 0) {
                    linesFa = content.lines.map((l: any) => cleanText(typeof l === 'string' ? l : (l.text || l.farsi || ''))).filter(Boolean);
                } else if (matchedDbSong?.lyrics_fa) {
                    linesFa = matchedDbSong.lyrics_fa.split('\n').map((l: string) => cleanText(l)).filter(Boolean);
                }

                let linesEn: string[] = [];
                if (Array.isArray(content.lyricsEnLines) && content.lyricsEnLines.length > 0) {
                    linesEn = content.lyricsEnLines.map((l: any) => cleanText(String(l))).filter(Boolean);
                } else if (matchedDbSong?.lyrics_en) {
                    linesEn = matchedDbSong.lyrics_en.split('\n').map((l: string) => cleanText(l)).filter(Boolean);
                }

                let text = `🎵 <b>${escapeHtml(titleFa)}</b>`;
                if (titleEn && titleEn !== titleFa) {
                    text += ` | <i>${escapeHtml(titleEn)}</i>`;
                }
                text += `\n`;

                if (artist) text += `👤 <i>${escapeHtml(artist)}</i>\n`;
                if (youtubeUrl) text += `▶️ <a href="${youtubeUrl}">مشاهده در یوتیوب</a>\n`;
                if (chords) text += `🎼 گام / آکورد: <code>${escapeHtml(chords)}</code>\n`;
                text += `───\n\n`;

                if (linesFa.length > 0) {
                    text += `${linesFa.map(l => escapeHtml(l)).join('\n')}\n\n`;
                }
                if (linesEn.length > 0) {
                    text += `<i>${linesEn.map(l => escapeHtml(l)).join('\n')}</i>\n\n`;
                }

                text += churchFooter;

                // Resolve audio buffer or telegram file id
                const audioData = await resolveAudioData(
                    audioSource,
                    tgFileId,
                    titleEn ? `${titleFa} (${titleEn})` : titleFa,
                    artist || 'کلیسای ایرانیان واشنگتن دی‌سی'
                );

                preparedMessages.push({
                    slideIndex: slideNum,
                    type: 'lyrics',
                    text,
                    audioData
                });
            } else if (slide.type === SlideType.LORDS_PRAYER) {
                let text = `🙏 <b>دعای ربانی | The Lord's Prayer</b>\n`;
                text += `───\n\n`;
                text += `«ای پدر ما که در آسمانی، نام تو مقدّس باد. ملکوت تو بیاید. ارادهٔ تو چنانکه در آسمان است، بر زمین نیز کرده شود. نان کفاف ما را امروز به ما بده. و قرض‌های ما را ببخش، چنانکه ما نیز قرضداران خود را می‌بخشیم. و ما را در آزمایش میاور، بلکه از شریر رهایی ده. زیرا ملکوت و قوّت و جلال تا ابدالآباد از آن توست. آمین.»\n\n`;
                text += `🇬🇧 <b>English:</b>\n`;
                text += `<i>"Our Father, who art in heaven, hallowed be thy name; thy kingdom come; thy will be done; on earth as it is in heaven. Give us this day our daily bread. And forgive us our debts, as we forgive our debtors. And lead us not into temptation, but deliver us from evil. For thine is the kingdom, the power and the glory, forever and ever. Amen."</i>\n`;
                text += churchFooter;

                preparedMessages.push({
                    slideIndex: slideNum,
                    type: 'prayer',
                    text
                });
            } else if (slide.type === SlideType.ANNOUNCEMENT) {
                const content = slide.content as any;
                let text = `📢 <b>اطلاعیه کلیسا | Church Announcement</b>\n`;
                text += `<b>${escapeHtml(cleanText(content.title || 'اطلاعیه'))}</b>\n`;
                text += `───\n\n`;
                if (content.eventDate) text += `📅 <b>تاریخ:</b> ${escapeHtml(content.eventDate)}\n`;
                if (content.content) text += `${escapeHtml(cleanText(content.content))}\n`;
                if (content.link) text += `\n🔗 <a href="${content.link}">اطلاعات بیشتر و ثبت‌نام</a>\n`;
                text += churchFooter;

                preparedMessages.push({
                    slideIndex: slideNum,
                    type: 'announcement',
                    text
                });
            } else if (slide.type === SlideType.PRAYER) {
                const content = slide.content as any;
                let text = `🤍 <b>درخواست دعا | Prayer Request</b>\n`;
                text += `<b>${escapeHtml(cleanText(content.userName || content.title || 'ایماندار'))}</b>\n`;
                text += `───\n\n`;
                if (content.content) text += `${escapeHtml(cleanText(content.content))}\n`;
                text += churchFooter;

                preparedMessages.push({
                    slideIndex: slideNum,
                    type: 'prayer',
                    text
                });
            } else if (slide.type === SlideType.MEDIA) {
                const content = slide.content as any;
                let text = `🎬 <b>رسانه جلسه | Presentation Media</b>\n`;
                text += `<b>${escapeHtml(cleanText(content.title || 'رسانه'))}</b>\n`;
                text += `───\n\n`;
                if (content.url) text += `🔗 <a href="${content.url}">مشاهده رسانه</a>\n`;
                text += churchFooter;

                preparedMessages.push({
                    slideIndex: slideNum,
                    type: 'media',
                    text
                });
            } else {
                const content = slide.content as any;
                const cText = stripHtml(content.htmlContent || content.content || '');
                let text = `📝 <b>یادداشت جلسه | Service Note</b>\n`;
                if (content.title) text += `<b>${escapeHtml(cleanText(content.title))}</b>\n`;
                text += `───\n\n`;
                if (cText) text += `${escapeHtml(cText)}\n`;
                text += churchFooter;

                preparedMessages.push({
                    slideIndex: slideNum,
                    type: 'generic',
                    text
                });
            }
        }

        // Send each slide message individually to all targets
        const deliveryResults: { target: string; messagesSent: number; audioTracksSent: number; success: boolean; error?: string }[] = [];

        for (const target of targets) {
            try {
                let messagesSent = 0;
                let audioTracksSent = 0;

                for (const pMsg of preparedMessages) {
                    // 1. Send clean slide text message
                    const msgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: target.id,
                            text: pMsg.text,
                            parse_mode: 'HTML',
                            disable_web_page_preview: true
                        })
                    });

                    const msgData = await msgRes.json();
                    if (msgData.ok) {
                        messagesSent++;
                    } else {
                        console.warn(`[Telegram Export] Slide ${pMsg.slideIndex} send error:`, msgData.description);
                    }

                    // 2. If worship song has audio data, send the actual MP3 via sendAudio
                    if (pMsg.audioData) {
                        try {
                            const aData = pMsg.audioData;
                            const audioCaption = `🎵 <b>${escapeHtml(aData.title)}</b>\n` +
                                (aData.performer ? `👤 ${escapeHtml(aData.performer)}\n` : '') +
                                `⛪️ کلیسای ایرانیان واشنگتن دی‌سی | @iranianchurchdc`;

                            let audioSentSuccess = false;

                            if (aData.telegramFileId) {
                                // Fast send by Telegram file ID
                                const audioRes = await fetch(`https://api.telegram.org/bot${botToken}/sendAudio`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        chat_id: target.id,
                                        audio: aData.telegramFileId,
                                        title: aData.title,
                                        performer: aData.performer,
                                        caption: audioCaption,
                                        parse_mode: 'HTML'
                                    })
                                });
                                const resJson = await audioRes.json();
                                if (resJson.ok) audioSentSuccess = true;
                            } else if (aData.buffer) {
                                // Multipart/form-data upload of the audio buffer
                                const formData = new FormData();
                                formData.append('chat_id', target.id);
                                const audioBlob = new Blob([new Uint8Array(aData.buffer)], { type: aData.mimeType || 'audio/mpeg' });
                                formData.append('audio', audioBlob, aData.filename || 'worship-song.mp3');
                                formData.append('title', aData.title);
                                formData.append('performer', aData.performer);
                                formData.append('caption', audioCaption);
                                formData.append('parse_mode', 'HTML');

                                const audioRes = await fetch(`https://api.telegram.org/bot${botToken}/sendAudio`, {
                                    method: 'POST',
                                    body: formData
                                });
                                const resJson = await audioRes.json();
                                if (resJson.ok) {
                                    audioSentSuccess = true;
                                } else {
                                    console.warn('[Telegram Export] FormData sendAudio error:', resJson.description);
                                }
                            }

                            if (audioSentSuccess) {
                                audioTracksSent++;
                            }
                        } catch (aErr) {
                            console.warn(`[Telegram Export] Audio send exception:`, aErr);
                        }
                    }

                    // Gentle delay between slides to prevent Telegram rate limits
                    if (preparedMessages.length > 1) {
                        await new Promise(r => setTimeout(r, 450));
                    }
                }

                deliveryResults.push({
                    target: target.id,
                    messagesSent,
                    audioTracksSent,
                    success: messagesSent > 0
                });

            } catch (targetErr: any) {
                console.error(`[Telegram Export] Delivery to ${target.id} failed:`, targetErr);
                deliveryResults.push({
                    target: target.id,
                    messagesSent: 0,
                    audioTracksSent: 0,
                    success: false,
                    error: targetErr.message
                });
            }
        }

        const successfulDeliveries = deliveryResults.filter(d => d.success);
        if (successfulDeliveries.length === 0) {
            const firstError = deliveryResults[0]?.error || 'ارسال به تلگرام با خطا مواجه شد.';
            throw new Error(`خطای ارسال تلگرام: ${firstError}`);
        }

        // Update presentation metadata in Database
        try {
            const { createAdminClient } = await import('@/utils/supabase/server');
            const supabase = await createAdminClient();

            if (presentationId) {
                const { data: existing } = await supabase
                    .from('presentations')
                    .select('metadata')
                    .eq('id', presentationId)
                    .maybeSingle();

                const prevMetadata = existing?.metadata || {};
                const exportHistory = Array.isArray(prevMetadata.telegramExports)
                    ? prevMetadata.telegramExports
                    : [];

                const newExportEntry = {
                    exportedAt: new Date().toISOString(),
                    targets: successfulDeliveries.map(s => s.target),
                    slidesCount: slidesToProcess.length,
                    deliveries: deliveryResults
                };

                await supabase
                    .from('presentations')
                    .update({
                        metadata: {
                            ...prevMetadata,
                            lastExportedToTelegram: new Date().toISOString(),
                            telegramExports: [newExportEntry, ...exportHistory.slice(0, 19)]
                        }
                    })
                    .eq('id', presentationId);
            }
        } catch (dbErr) {
            console.warn('[Telegram Export] DB update note:', dbErr);
        }

        return NextResponse.json({
            success: true,
            slidesSent: preparedMessages.length,
            audioTracksSent: deliveryResults.reduce((acc, d) => acc + d.audioTracksSent, 0),
            deliveries: deliveryResults
        });

    } catch (error: any) {
        console.error('Error sending slides to Telegram:', error);
        return NextResponse.json({
            error: error.message || 'خطا در ارسال به تلگرام'
        }, { status: 500 });
    }
}
