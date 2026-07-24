import React from 'react';
import { createAdminClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import SessionsClient from './SessionsClient';

export const metadata = {
    title: 'Recorded Sessions | Admin',
};

export default async function SessionsAdminPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const adminSupabase = await createAdminClient();
    const { data: userData } = await adminSupabase
        .from('users')
        .select('role')
        .eq('email', user.email)
        .single();

    if (userData?.role !== 'Admin') {
        redirect('/unauthorized');
    }

    // Fetch sessions
    const { data: sessions, error } = await adminSupabase
        .from('church_sessions')
        .select('*, media_library(*)')
        .order('session_date', { ascending: false });

    if (error) {
        console.error('Error fetching sessions:', error);
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold font-[Vazirmatn] text-white">مدیریت جلسات ضبط شده (Sessions)</h1>
            </div>

            <SessionsClient initialSessions={sessions || []} />
        </div>
    );
}
