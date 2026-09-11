import { NextRequest, NextResponse } from "next/server";
import { dispatchRoleNotification, RoleType } from "@/services/notificationService";
import { requireRole } from "@/utils/rbac";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        await requireRole(["Admin"]);

        const body = await req.json().catch(() => ({}));
        const targetRole = (body.targetRole || "Admin") as RoleType;
        const testType = body.testType || "prayer"; // 'prayer' | 'security' | 'custom'

        let title = body.title;
        let summary = body.summary;
        let actionUrl = body.actionUrl || "/admin/prayers";
        let actionText = body.actionText || "بررسی در پنل مدیریت";
        let metadata = body.metadata || {};

        if (!title) {
            if (testType === "prayer") {
                title = "🕊️ [تست سامانه] درخواست دعای جدید جهت بررسی";
                summary = "این یک پیام آزمایشی جهت راستی‌آزمایی اتصال نوتیفیکیشن تلگرام و ایمیل برای رده شبانی و مدیریت است. درخواست دعا با موفقیت شبیه‌سازی شد.";
                metadata = {
                    "نوع پیام": "تست آزمایشی اعلان",
                    "نقش هدف": targetRole,
                    "فرستنده": "سامانه هوشمند کلیسا",
                    "زمان ارسال": new Date().toLocaleString("fa-IR")
                };
            } else if (testType === "security") {
                title = "🛡️ [تست امنیت] هشدار امنیتی و لاگ حسابرسی";
                summary = "این یک پیام آزمایشی امنیتی است که برای بررسی دریافت هشدارهای مدیریتی در تلگرام و ایمیل ارسال شده است.";
                actionUrl = "/admin/audit-logs";
                actionText = "مشاهده لاگ‌های امنیتی";
                metadata = {
                    "سطح پیام": "فوری / تست",
                    "نقش هدف": targetRole,
                    "آی‌پی": req.headers.get("x-forwarded-for") || "127.0.0.1"
                };
            } else {
                title = `🔔 اعلان تستی برای نقش ${targetRole}`;
                summary = body.message || "تست ارسال نوتیفیکیشن تلگرام و ایمیل کلیسا.";
            }
        }

        const roles: RoleType[] = targetRole === ("all" as any) 
            ? ["Admin", "Leader", "Operator"] 
            : [targetRole];

        const result = await dispatchRoleNotification({
            event: "system_alert",
            title,
            summary,
            targetRoles: roles,
            metadata,
            actionUrl,
            actionText
        });

        return NextResponse.json({
            message: "نتیجه ارسال اعلان",
            ...result
        });

    } catch (error: any) {
        console.error("[Notifications Test API] Error:", error);
        return NextResponse.json({ error: error.message || "خطای ناشناخته" }, { status: 500 });
    }
}
