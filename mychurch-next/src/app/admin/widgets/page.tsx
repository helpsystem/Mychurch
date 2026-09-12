import React from 'react';
import { getWidgets } from '@/actions/widgets';
import { requireRole } from '@/utils/rbac';
import WidgetsAdminView from './WidgetsAdminView';

export const metadata = {
    title: "مدیریت اکوسیستم ویجت‌ها | MyChurch Admin",
    description: "مدیریت، پیکربندی دو زبانه و فعال/غیرفعال‌سازی ابزارهای لایو وب‌سایت کلیسا",
};

export const dynamic = "force-dynamic";

export default async function WidgetsAdminPage() {
    // Enforce RBAC - Only Admins and Leaders can manage global widgets
    await requireRole(['Admin', 'Leader']);

    const widgets = await getWidgets();

    return <WidgetsAdminView widgets={widgets} />;
}
