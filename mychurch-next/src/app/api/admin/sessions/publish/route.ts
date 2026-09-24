import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import { buildSessionTelegramCaption } from '@/lib/session-caption';
import { addBusinessDays } from '@/lib/business-days';
import type { PostgrestError } from '@supabase/supabase-js';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

        // Idempotency guard: a public message id already recorded means this session was
        // already posted — never re-post, even if `status` somehow fell out of sync (e.g. the
        // DB write below failed after Telegram had already accepted the post on a prior attempt).
        if (session.telegram_public_message_id) {
            return NextResponse.json({
                success: true,
                publicMessageId: session.telegram_public_message_id,
                alreadyPublished: true,
            });
        }

        const telegramMessageId = session.media_library.telegram_message_id;
        const telegramUploadConfirmed = Boolean(session.media_library.telegram_file_id);
        if (!telegramMessageId || !telegramUploadConfirmed) {
            throw new Error('No confirmed Telegram storage upload found for this session recording yet');
        }

        // 2. Format a readable, attractive HTML caption with a direct listen/download link.
        // HTML is used (not legacy Markdown) so a song/scripture title containing *, _, or [
        // can never break the whole message — Telegram's HTML mode only needs & < > escaped.
        const caption = buildSessionTelegramCaption({
            title: session.title,
            sessionDate: session.session_date,
            metadata: session.metadata,
            mediaLibraryId: session.media_library.id,
        });

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
                parse_mode: 'HTML'
            })
        });

        const tgResult = await response.json();
        if (!tgResult.ok) {
            throw new Error('Telegram API error: ' + tgResult.description);
        }

        const publicMessageId = tgResult.result.message_id;
        const publishedAt = new Date();
        // The local disk cache copy gets cleaned up 2 business days after this, once this
        // publish is durably recorded — see src/scripts/cron_cleanup_session_recordings.ts.
        const localDeleteEligibleAt = addBusinessDays(publishedAt, 2);

        // 4. Persist the result. The Telegram post has already happened at this point, so this
        // write is retried a few times before giving up — losing it would otherwise leave a
        // publicly-posted session that this route still thinks is unpublished, risking a
        // duplicate post on retry (which the idempotency guard above only prevents once this
        // write actually lands).
        let updateError: PostgrestError | null = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
            const { error } = await adminSupabase
                .from('church_sessions')
                .update({
                    status: 'published',
                    telegram_public_message_id: publicMessageId,
                    published_at: publishedAt.toISOString(),
                })
                .eq('id', sessionId);
            updateError = error;
            if (!error) break;
            console.error(`[Publish Session] DB update attempt ${attempt} failed:`, error);
            if (attempt < 3) await sleep(1000 * attempt);
        }

        if (updateError) {
            // Telegram already has the post; surface the id so an admin can reconcile manually
            // rather than silently losing track of a live public post.
            return NextResponse.json({
                error: `Published to Telegram (message ${publicMessageId}) but failed to save that to the database after 3 attempts: ${updateError.message}. Do not click Publish again — it would re-post. Contact an admin to fix the record manually.`,
                publicMessageId,
            }, { status: 500 });
        }

        return NextResponse.json({ success: true, publicMessageId, localDeleteEligibleAt: localDeleteEligibleAt.toISOString() });
    } catch (error: any) {
        console.error('Error publishing session:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
