import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
    try {
        const adminSupabase = await createAdminClient();
        const body = await request.json();
        
        const { title, mediaLibraryId, metadata } = body;
        
        if (!title || !mediaLibraryId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await adminSupabase
            .from('church_sessions')
            .insert({
                title,
                media_library_id: mediaLibraryId,
                metadata,
                status: 'pending_approval'
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error saving session:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
