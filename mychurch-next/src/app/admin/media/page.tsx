import React from 'react';
import { listMediaFiles } from '@/actions/media';
import MediaClient from './MediaClient';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Media Library | Admin',
};

export default async function MediaAdminPage() {
    // Enforce Granular RBAC Permissions
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const adminSupabase = await createAdminClient();
    const { data: userData } = await adminSupabase
        .from('users')
        .select('role, permissions')
        .eq('email', user.email)
        .single();

    const isAdminOrLeader = userData?.role === 'Admin' || userData?.role === 'Leader';
    const canManageMedia = userData?.permissions?.canManageMedia;

    if (!isAdminOrLeader && !canManageMedia) {
        redirect('/unauthorized');
    }

    const initialFiles = await listMediaFiles();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold font-[Vazirmatn] text-white">کتابخانه مدیا (Media Library)</h1>
            </div>

            <MediaClient initialFiles={initialFiles} />
        </div>
    );
}
