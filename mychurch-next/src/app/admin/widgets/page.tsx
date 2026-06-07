// src/app/admin/widgets/page.tsx
import React from 'react';
import { getWidgets, toggleWidget } from '@/actions/widgets';
import { requireRole } from '@/utils/rbac';
import { ShieldAlert, BookOpen, Music, Calendar, QrCode, LayoutTemplate, Settings2, Heart } from 'lucide-react';
import { WidgetToggleCard } from './WidgetToggleCard'; // Client Component wrapper for the toggle

// Map string icon names from DB to Lucide React components
const iconMap: Record<string, any> = {
    BookOpen: BookOpen,
    Music: Music,
    Calendar: Calendar,
    QrCode: QrCode,
    LayoutTemplate: LayoutTemplate,
    Heart: Heart,
};

export default async function WidgetsAdminPage() {
    // Enforce RBAC - Only Admins can manage global widgets
    await requireRole(['Admin', 'Leader']);

    const widgets = await getWidgets();

    return (
        <div className="flex-1 p-4 md:p-8 font-vazirmatn bg-background h-screen overflow-y-auto">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                <Settings2 className="w-5 h-5" />
                            </div>
                            <h1 className="text-3xl font-black text-foreground" dir="rtl">اکوسیستم ویجت‌ها</h1>
                        </div>
                        <p className="text-muted-foreground font-medium mt-2 md:mt-0 md:pr-14 text-sm md:text-base leading-relaxed" dir="rtl">
                            مدیریت و پیکربندی ابزارهای یکپارچه سیستم. ویجت‌های غیرفعال از دید عموم مخفی می‌شوند.
                        </p>
                    </div>
                </div>

                {/* Warning Banner */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 md:p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center" dir="rtl">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-amber-500 mb-1">دسترسی محدود (Admin/Leader)</h3>
                        <p className="text-amber-500/80 text-sm leading-relaxed font-medium">
                            تغییر وضعیت ویجت‌ها مستقیماً بر روی وب‌سایت عمومی و قابلیت‌های کنسول پخش تاثیر می‌گذارد. لطفاً با دقت تغییرات را اعمال کنید.
                        </p>
                    </div>
                </div>

                {/* Widgets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" dir="rtl">
                    {widgets.map((widget) => {
                        const IconComponent = iconMap[widget.icon] || Settings2;
                        return (
                            <WidgetToggleCard
                                key={widget.id}
                                widget={widget}
                                icon={<IconComponent className={`w-8 h-8 ${widget.color}`} />}
                            />
                        );
                    })}

                    {widgets.length === 0 && (
                        <div className="col-span-full py-12 text-center text-muted-foreground bg-secondary/20 rounded-2xl border border-white/5">
                            هیچ ویجتی یافت نشد. دیتابیس را بررسی کنید.
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
