import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
    try {
        const adminSupabase = await createAdminClient();
        const body = await request.json();
        
        const { sessionId } = body;
        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
        }

        // 1. Fetch session and media info
        const { data: session, error: sessionError } = await adminSupabase
            .from('church_sessions')
            .select('*, media_library!inner(*)')
            .eq('id', sessionId)
            .single();

        if (sessionError || !session) {
            throw new Error('Session not found: ' + (sessionError?.message || ''));
        }

        if (session.status === 'published') {
            return NextResponse.json({ error: 'Session is already published' }, { status: 400 });
        }

        const telegramMessageId = session.media_library.telegram_message_id;
        if (!telegramMessageId) {
            throw new Error('No Telegram Message ID found for the session recording');
        }

        // 2. Format Caption from Metadata
        const metadata: any[] = session.metadata || [];
        let caption = `🎙 **${session.title || 'فایل صوتی جلسه'}**\n`;
        caption += `📅 ${new Date(session.session_date).toLocaleDateString('fa-IR')}\n\n`;

        const songs = metadata.filter(m => m.type === 'song');
        const scriptures = metadata.filter(m => m.type === 'scripture');

        if (songs.length > 0) {
            caption += `🎵 **سرودهای پرستشی:**\n`;
            songs.forEach((s, idx) => {
                caption += `${idx + 1}. ${s.title} ${s.details ? `(${s.details})` : ''}\n`;
            });
            caption += `\n`;
        }

        if (scriptures.length > 0) {
            caption += `📖 **آیات خوانده شده:**\n`;
            scriptures.forEach((s) => {
                caption += `- ${s.title} ${s.details ? `(${s.details})` : ''}\n`;
            });
        }

        caption += `\n⛪️ کلیسای ایرانیان واشنگتن دی‌سی`;

        // 3. Use Telegram Bot API to copy message to Public Channel
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const fromChatId = process.env.TELEGRAM_STORAGE_CHANNEL_ID;
        const publicChannelId = process.env.TELEGRAM_PUBLIC_CHANNEL_ID;

        if (!botToken || !fromChatId || !publicChannelId) {
            throw new Error('Telegram Bot configuration is missing');
        }

        const response = await fetch(`https://api.telegram.org/bot${botToken}/copyMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: publicChannelId,
                from_chat_id: fromChatId,
                message_id: telegramMessageId,
                caption: caption,
                parse_mode: 'Markdown'
            })
        });

        const tgResult = await response.json();
        if (!tgResult.ok) {
            throw new Error('Telegram API error: ' + tgResult.description);
        }

        const publicMessageId = tgResult.result.message_id;

        // 4. Update session status
        const { error: updateError } = await adminSupabase
            .from('church_sessions')
            .update({
                status: 'published',
                telegram_public_message_id: publicMessageId
            })
            .eq('id', sessionId);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, publicMessageId });
    } catch (error: any) {
        console.error('Error publishing session:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
