import { NextResponse } from 'next/server';
import { Slide, SlideType, PrayerRequest } from '@/types/broadcast';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            presentationId,
            title = 'جلسه کلیسا',
            date = new Date().toISOString(),
            slides = [] as Slide[],
            prayerRequests = [] as PrayerRequest[],
            customNotes = ''
        } = body;

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const targetChatId = process.env.TELEGRAM_PUBLIC_GROUP_ID || process.env.TELEGRAM_PUBLIC_CHANNEL_ID;

        if (!botToken || !targetChatId) {
            return NextResponse.json({
                error: 'تنظیمات تلگرام (TELEGRAM_BOT_TOKEN یا TELEGRAM_PUBLIC_GROUP_ID) در سرور یافت نشد.'
            }, { status: 500 });
        }

        // Format Date to Persian locale
        let formattedDate = "";
        try {
            formattedDate = new Date(date).toLocaleDateString('fa-IR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            });
        } catch {
            formattedDate = String(date);
        }

        // Extract and organize presentation content
        const scriptureList: { ref: string; textFa: string; textEn?: string }[] = [];
        const worshipSongList: { title: string; lines: string[] }[] = [];
        const announcementList: { title: string; content: string; eventDate?: string }[] = [];
        const prayerList: { name: string; content: string }[] = [];

        // 1. Process Slides
        slides.forEach((slide: Slide, idx: number) => {
            if (!slide || !slide.content) return;

            if (slide.type === SlideType.SCRIPTURE) {
                const content = slide.content as any;
                if (Array.isArray(content.pages)) {
                    content.pages.forEach((p: any) => {
                        const ref = p.primaryLanguage === 'fa' 
                            ? `${p.bookFa || p.book || ''} ${p.chapter || ''}:${p.verseNumber || ''}`
                            : `${p.bookEn || p.book || ''} ${p.chapter || ''}:${p.verseNumber || ''}`;
                        scriptureList.push({
                            ref: ref.trim() || `آیه ${idx + 1}`,
                            textFa: p.textFa || p.text || '',
                            textEn: p.textEn
                        });
                    });
                } else if (Array.isArray(content.verses)) {
                    content.verses.forEach((v: any) => {
                        scriptureList.push({
                            ref: `${v.book || ''} ${v.chapter || ''}:${v.verse || ''}`.trim(),
                            textFa: v.text || v.textFa || '',
                            textEn: v.textEn
                        });
                    });
                }
            } else if (slide.type === SlideType.LYRICS) {
                const content = slide.content as any;
                const title = content.title || content.titleFa || content.titleEn || `سرود ${idx + 1}`;
                const rawLines = Array.isArray(content.lines) 
                    ? content.lines.map((l: any) => l.farsi || l.text || '').filter(Boolean)
                    : [];
                worshipSongList.push({
                    title,
                    lines: rawLines
                });
            } else if (slide.type === SlideType.ANNOUNCEMENT) {
                const content = slide.content as any;
                announcementList.push({
                    title: content.title || 'اطلاعیه',
                    content: content.content || '',
                    eventDate: content.eventDate
                });
            } else if (slide.type === SlideType.PRAYER) {
                const content = slide.content as any;
                prayerList.push({
                    name: content.userName || content.title || 'ایماندار',
                    content: content.content || ''
                });
            }
        });

        // 2. Add extra prayer requests passed from session ticker
        prayerRequests.forEach((p: PrayerRequest) => {
            const name = p.name || p.user_name || p.title || 'ایماندار';
            if (p.content && !prayerList.some(item => item.content === p.content)) {
                prayerList.push({
                    name,
                    content: p.content
                });
            }
        });

        // 3. Build Full Plain-Text Summary (for File export)
        let fullFileContent = `====================================================\n`;
        fullFileContent += `  کلیسای ایرانیان واشنگتن دی‌سی (Iranian Christian Church DC)\n`;
        fullFileContent += `  خلاصه و محتوای کامل پرزنتیشن جلسه\n`;
        fullFileContent += `====================================================\n\n`;
        fullFileContent += `📋 عنوان جلسه: ${title}\n`;
        fullFileContent += `📅 تاریخ برگزاری: ${formattedDate}\n`;
        fullFileContent += `🔢 تعداد کل اسلایدها: ${slides.length}\n`;
        if (customNotes) {
            fullFileContent += `📝 یادداشت‌های کشیش / مجری: ${customNotes}\n`;
        }
        fullFileContent += `\n----------------------------------------------------\n`;

        if (scriptureList.length > 0) {
            fullFileContent += `\n📖 آیات کلام خدا (کتاب‌مقدس):\n\n`;
            scriptureList.forEach((s, idx) => {
                fullFileContent += `[${idx + 1}] ${s.ref}\n`;
                if (s.textFa) fullFileContent += `  فارسی: ${s.textFa}\n`;
                if (s.textEn) fullFileContent += `  English: ${s.textEn}\n`;
                fullFileContent += `\n`;
            });
        }

        if (worshipSongList.length > 0) {
            fullFileContent += `\n🎵 سرودهای پرستشی خوانده شده:\n\n`;
            worshipSongList.forEach((song, idx) => {
                fullFileContent += `[${idx + 1}] ${song.title}\n`;
                if (song.lines.length > 0) {
                    song.lines.forEach((line) => {
                        fullFileContent += `    ${line}\n`;
                    });
                }
                fullFileContent += `\n`;
            });
        }

        if (prayerList.length > 0) {
            fullFileContent += `\n🙏 درخواست‌های دعای مطرح‌شده در جلسه:\n\n`;
            prayerList.forEach((p, idx) => {
                fullFileContent += `  ${idx + 1}. [${p.name}]: ${p.content}\n`;
            });
            fullFileContent += `\n`;
        }

        if (announcementList.length > 0) {
            fullFileContent += `\n📢 اطلاعیه‌ها:\n\n`;
            announcementList.forEach((a, idx) => {
                fullFileContent += `  ${idx + 1}. ${a.title}${a.eventDate ? ` (تاریخ: ${a.eventDate})` : ''}\n`;
                if (a.content) fullFileContent += `     ${a.content}\n`;
            });
            fullFileContent += `\n`;
        }

        fullFileContent += `\n----------------------------------------------------\n`;
        fullFileContent += `ارتباط با کلیسا:\n`;
        fullFileContent += `📞 تماس صوتی: +1 (605) 313-9689 (کد: 1036379#)\n`;
        fullFileContent += `🌐 وب‌سایت: www.iranianchurchdc.com\n`;

        // 4. Build Telegram HTML Message (Within 4096 character limit)
        let telegramHtml = `⛪️ <b>کلیسای ایرانیان واشنگتن دی‌سی</b>\n`;
        telegramHtml += `📋 <b>خلاصه و محتوای جلسه:</b> ${escapeHtml(title)}\n`;
        telegramHtml += `📅 <b>تاریخ:</b> ${escapeHtml(formattedDate)}\n\n`;

        if (scriptureList.length > 0) {
            telegramHtml += `📖 <b>آیات کلام خدا:</b>\n`;
            scriptureList.slice(0, 6).forEach((s) => {
                telegramHtml += `• <b>${escapeHtml(s.ref)}</b>: ${escapeHtml(truncate(s.textFa, 90))}\n`;
            });
            if (scriptureList.length > 6) {
                telegramHtml += `<i>و ${scriptureList.length - 6} آیه دیگر در فایل ضمیمه...</i>\n`;
            }
            telegramHtml += `\n`;
        }

        if (worshipSongList.length > 0) {
            telegramHtml += `🎵 <b>سرودهای پرستشی:</b>\n`;
            worshipSongList.slice(0, 8).forEach((song, idx) => {
                telegramHtml += `${idx + 1}. <b>${escapeHtml(song.title)}</b>\n`;
            });
            telegramHtml += `\n`;
        }

        if (prayerList.length > 0) {
            telegramHtml += `🙏 <b>درخواست‌های دعا:</b>\n`;
            prayerList.slice(0, 10).forEach((p) => {
                telegramHtml += `• <b>${escapeHtml(p.name)}:</b> ${escapeHtml(truncate(p.content, 90))}\n`;
            });
            if (prayerList.length > 10) {
                telegramHtml += `<i>و ${prayerList.length - 10} درخواست دیگر در فایل ضمیمه...</i>\n`;
            }
            telegramHtml += `\n`;
        }

        if (announcementList.length > 0) {
            telegramHtml += `📢 <b>اطلاعیه‌ها:</b>\n`;
            announcementList.slice(0, 4).forEach((a) => {
                telegramHtml += `• <b>${escapeHtml(a.title)}</b>: ${escapeHtml(truncate(a.content, 80))}\n`;
            });
            telegramHtml += `\n`;
        }

        telegramHtml += `📁 <i>فایل متنی کامل پرزنتیشن با تمامی جزئیات و متن سرودها پیوست شد.</i>\n\n`;
        telegramHtml += `🌐 <a href="https://www.iranianchurchdc.com">www.iranianchurchdc.com</a>`;

        // 5. Send Telegram Text Message
        const msgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: targetChatId,
                text: telegramHtml,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            })
        });

        const msgData = await msgRes.json();
        if (!msgData.ok) {
            console.error('Telegram sendMessage error:', msgData);
            throw new Error(`خطای تلگرام: ${msgData.description || 'نامشخص'}`);
        }

        const messageId = msgData.result?.message_id;

        // 6. Send File Attachment via sendDocument
        const fileName = `Presentation_${title.replace(/[\/\\:*?"<>| ]+/g, '_')}.txt`;
        const blob = new Blob([fullFileContent], { type: 'text/plain;charset=utf-8' });
        const formData = new FormData();
        formData.append('chat_id', targetChatId);
        formData.append('document', blob, fileName);
        formData.append('caption', `📄 فایل متنی کامل جلسه: ${title}`);
        if (messageId) {
            formData.append('reply_to_message_id', String(messageId));
        }

        const docRes = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
            method: 'POST',
            body: formData
        });

        const docData = await docRes.json();
        console.log('Telegram sendDocument status:', docData.ok);

        // 7. Register and verify export record in Database
        let registeredInDb = false;
        try {
            const { createAdminClient } = await import('@/utils/supabase/server');
            const supabase = await createAdminClient();

            if (presentationId) {
                const { data: existing } = await supabase
                    .from('presentations')
                    .select('metadata')
                    .eq('id', presentationId)
                    .maybeSingle();

                const existingMeta = (existing?.metadata && typeof existing.metadata === 'object') ? existing.metadata : {};
                const updatedMeta = {
                    ...existingMeta,
                    telegram_export: {
                        exported_at: new Date().toISOString(),
                        message_id: messageId,
                        document_message_id: docData.result?.message_id,
                        chat_id: targetChatId,
                        title
                    }
                };

                const { error: updateError } = await supabase
                    .from('presentations')
                    .update({
                        metadata: updatedMeta,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', presentationId);

                if (!updateError) {
                    registeredInDb = true;
                } else {
                    console.warn('[Telegram Export] Failed to update presentation metadata:', updateError);
                }
            }
        } catch (dbErr) {
            console.warn('[Telegram Export] Database record update error:', dbErr);
        }

        try {
            const { logUserActivity } = await import('@/actions/audit');
            await logUserActivity({
                action: 'EXPORT_TELEGRAM',
                resourceType: 'presentation',
                resourceId: presentationId || 'session',
                details: {
                    title,
                    messageId,
                    targetChatId
                }
            });
        } catch (e) {
            console.warn('[Telegram Export] Failed to log activity:', e);
        }

        return NextResponse.json({
            success: true,
            messageId,
            documentMessageId: docData.result?.message_id,
            chatId: targetChatId,
            registeredInDatabase: registeredInDb
        });

    } catch (error: any) {
        console.error('Error sending presentation to Telegram:', error);
        return NextResponse.json({
            error: error.message || 'خطا در ارسال به تلگرام'
        }, { status: 500 });
    }
}


function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function truncate(text: string, maxLen: number): string {
    if (!text) return "";
    if (text.length <= maxLen) return text;
    return text.substring(0, maxLen) + "...";
}
