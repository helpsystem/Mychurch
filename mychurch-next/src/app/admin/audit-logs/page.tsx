import React from 'react';
import { getAuditLogs, getAuditStats } from '@/actions/audit';
import AuditLogsClient from './AuditLogsClient';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export const metadata = {
    title: 'لاگ فعالیت‌های سیستم | پنل مدیریت',
};

export default async function AuditLogsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const adminSupabase = await createAdminClient();
    const { data: userData } = await adminSupabase
        .from('users')
        .select('role, permissions')
        .eq('email', user.email)
        .single();

    const allowed = userData?.role === 'Admin' || userData?.role === 'Leader' || userData?.permissions?.canManageUsers;
    if (!allowed) {
        redirect('/unauthorized');
    }

    const [{ logs, totalCount }, stats] = await Promise.all([
        getAuditLogs({ page: 1, limit: 30 }),
        getAuditStats()
    ]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-black font-[Vazirmatn] text-white">لاگ عملکرد و فعالیت‌های کاربران (Audit Logs)</h1>
                <p className="text-sm text-muted-foreground font-[Vazirmatn]">
                    نظارت شفاف بر تمامی عملیات‌های آپلود، ویرایش، حذف، ارسال به تلگرام و دسترسی‌های کاربران با ثبت هویت دقیق
                </p>
            </div>

            <AuditLogsClient
                initialLogs={logs}
                totalCount={totalCount}
                initialStats={stats}
            />
        </div>
    );
}
