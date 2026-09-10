import React from 'react';
import { getTrashedItems } from '@/actions/trash';
import TrashClient from './TrashClient';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export const metadata = {
    title: 'زباله‌دان و بازیابی اطلاعات | پنل مدیریت',
};

export default async function TrashPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const adminSupabase = await createAdminClient();
    const { data: userData } = await adminSupabase
        .from('users')
        .select('role, permissions')
        .eq('email', user.email)
        .single();

    const isAdminOrLeader = userData?.role === 'Admin' || userData?.role === 'Leader' || userData?.role === 'Manager';
    const canManageMedia = userData?.permissions?.canManageMedia;

    if (!isAdminOrLeader && !canManageMedia) {
        redirect('/unauthorized');
    }

    const initialItems = await getTrashedItems('all');
    const isAdmin = userData?.role === 'Admin';

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-black font-[Vazirmatn] text-white">زباله‌دان و بازیابی اطلاعات (Recycle Bin)</h1>
                <p className="text-sm text-muted-foreground font-[Vazirmatn]">
                    مدیریت فایل‌ها و آیتم‌های حذف‌شده موقت، بازگردانی آنی و تائید حذف قطعی توسط ادمین ارشد
                </p>
            </div>

            <TrashClient
                initialItems={initialItems}
                isAdmin={isAdmin}
            />
        </div>
    );
}
