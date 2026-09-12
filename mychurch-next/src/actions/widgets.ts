"use server";

import { query } from "@/lib/db";
import { createAdminClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { hasAdminRoleOrPermission } from "@/lib/access-control";

export interface DashboardWidget {
    id: string;
    name: string;
    name_fa: string;
    name_en: string;
    description: string;
    description_fa: string;
    description_en: string;
    is_active: boolean;
    icon: string;
    color: string;
    config?: Record<string, any>;
}

export type Widget = DashboardWidget;

const CANONICAL_WIDGET_METADATA: Record<string, { nameFa: string; nameEn: string; descFa: string; descEn: string }> = {
    w_verse_donation: {
        nameFa: "آیه روز و هدیه شکرگزاری",
        nameEn: "Verse of the Day & Voluntary Giving",
        descFa: "نمایش هوشمندانه آیه روز کلام خدا (چرخش خودکار ۳۶۵ روزه دو زبانه) به همراه دعوت محبت‌آمیز به هدیه اختیاری و پیام برکت.",
        descEn: "Smart daily scripture modal (automatic 365-day bilingual rotation) with gentle voluntary giving invitation and blessing notes."
    },
    w_global_popup: {
        nameFa: "پاپ‌آپ اطلاعیه سراسری کلیسا",
        nameEn: "Global Announcement Modal",
        descFa: "پاپ‌آپ اعلان رویدادهای مهم، اعیاد، تبریک‌ها، ویدیوها و پیام‌های اضطراری کلیسا با پشتیبانی کامل دو زبانه و افکت ذرات.",
        descEn: "Modal popup for church events, holidays, video messages, and announcements with full bilingual support and particle effects."
    },
    w_watermark: {
        nameFa: "واترمارک و برندینگ سراسری",
        nameEn: "Global Watermark Branding",
        descFa: "تنظیم لوگوی شفاف، شفافیت، اندازه و موقعیت واترمارک رسمی کلیسا در پس‌زمینه صفحات وب‌سایت.",
        descEn: "Configure official church transparent logo, opacity, sizing, and position overlay across website pages."
    },
    w_ai_avatar: {
        nameFa: "مولد آواتار مسیحی هوش مصنوعی",
        nameEn: "AI Christian Avatar Generator",
        descFa: "امکان ساخت تصاویر پرتره و نمایه ایمانی با هوش مصنوعی برای اعضای کلیسا در صفحه پروفایل کاربری.",
        descEn: "Enable church members to generate Christian faith portraits and profile avatars using AI technology."
    },
    w_audio_sync: {
        nameFa: "همگام‌ساز صوتی و متن سرودها",
        nameEn: "Audio-Lyrics Sync Pro",
        descFa: "پخش‌کننده پیشرفته صوت سرودهای پرستشی با پیمایش هماهنگ خط به خط (کارائوکه) و تنظیمات پخش خودکار.",
        descEn: "Advanced worship audio playback with synchronized karaoke-style lyrics and autoplay settings."
    },
    w_bible: {
        nameFa: "موتور جستجوی کلام خدا",
        nameEn: "Unified Scripture Search Pro",
        descFa: "جستجوی پیشرفته چندزبانه آیات کتاب مقدس با قابلیت ارجاع متقابل و مقایسه موازی ترجمه‌های فارسی و انگلیسی.",
        descEn: "Advanced multilingual Bible search engine with cross-references and parallel translation compare mode."
    },
    w_cal: {
        nameFa: "تقویم هوشمند کلیسای ایرانیان",
        nameEn: "Persian Smart Church Calendar",
        descFa: "تقویم تلفیقی شمسی و میلادی جهت نمایش جلسات، برنامه‌های هفتگی و رویدادهای آینده کلیسا.",
        descEn: "Integrated Jalali & Gregorian church calendar displaying weekly services, classes, and upcoming events."
    },
    w_qr: {
        nameFa: "استودیوی QR کد ارتباطی",
        nameEn: "Pro QR-Code Connect Studio",
        descFa: "تولید کدهای QR دینامیک برای هدایا، کانال تلگرام، اینستاگرام، پخش زنده و فرم ارتباطی کلیسا.",
        descEn: "Generate dynamic landing QR cards for online giving, Telegram channel, live stream, and connection forms."
    }
};

async function canManageWidgets(): Promise<boolean> {
    return hasAdminRoleOrPermission(["canManageWidgets"]);
}

function enrichWidget(r: any): DashboardWidget {
    const meta = CANONICAL_WIDGET_METADATA[r.id];
    return {
        id: r.id,
        name: r.name,
        name_fa: r.name_fa || meta?.nameFa || r.name,
        name_en: r.name_en || meta?.nameEn || r.name,
        description: r.description,
        description_fa: r.description_fa || meta?.descFa || r.description,
        description_en: r.description_en || meta?.descEn || r.description,
        is_active: Boolean(r.is_active),
        icon: r.icon || "LayoutTemplate",
        color: r.color || "text-primary",
        config: r.config || {},
    };
}

export async function getWidgets(): Promise<DashboardWidget[]> {
    try {
        try {
            const supabase = await createAdminClient();
            const { data, error } = await supabase.from('widgets').select('*').order('name', { ascending: true });
            if (!error && data) return data.map(enrichWidget);
        } catch {
            // fallback
        }
        const { rows } = await query('SELECT * FROM widgets ORDER BY id ASC');
        return rows.map(enrichWidget);
    } catch (error) {
        console.error('[Action] Error fetching widgets:', error);
        return [];
    }
}

export async function toggleWidget(id: string, currentStatus: boolean): Promise<{ success: boolean; error?: string }> {
    if (!(await canManageWidgets())) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        try {
            const supabase = await createAdminClient();
            const { error } = await supabase.from('widgets').update({ is_active: !currentStatus, updated_at: new Date().toISOString() }).eq('id', id);
            if (!error) {
                revalidatePath('/', 'layout');
                revalidatePath('/admin/widgets');
                return { success: true };
            }
        } catch {
            // fallback
        }
        await query('UPDATE widgets SET is_active = $1, updated_at = NOW() WHERE id = $2', [!currentStatus, id]);

        revalidatePath('/', 'layout');
        revalidatePath('/admin/widgets');

        return { success: true };
    } catch (error) {
        console.error('[Action] Error toggling widget:', error);
        return { success: false, error: 'Failed to update widget status' };
    }
}

export async function getWatermarkConfig(): Promise<any> {
    try {
        try {
            const supabase = await createAdminClient();
            const { data, error } = await supabase.from('widgets').select('config').eq('id', 'w_watermark').maybeSingle();
            if (!error && data) return data.config || {};
        } catch {
            // fallback
        }
        const { rows } = await query("SELECT config FROM widgets WHERE id = 'w_watermark'");
        return rows[0]?.config || {};
    } catch (error) {
        console.error('[Action] Error fetching watermark config:', error);
        return {};
    }
}

export async function getGlobalPopupData(): Promise<{ isActive: boolean, config: any }> {
    try {
        try {
            const supabase = await createAdminClient();
            const { data, error } = await supabase.from('widgets').select('is_active, config').eq('id', 'w_global_popup').maybeSingle();
            if (!error && data) {
                return {
                    isActive: !!data.is_active,
                    config: data.config || {}
                };
            }
        } catch {
            // fallback
        }
        const { rows } = await query("SELECT is_active, config FROM widgets WHERE id = 'w_global_popup'");
        return {
            isActive: rows[0]?.is_active || false,
            config: rows[0]?.config || {}
        };
    } catch (error) {
        console.error('[Action] Error fetching global popup data:', error);
        return { isActive: false, config: {} };
    }
}

export async function updateWidgetConfig(id: string, config: any): Promise<boolean> {
    if (!(await canManageWidgets())) {
        return false;
    }

    try {
        try {
            const supabase = await createAdminClient();
            const { error } = await supabase.from('widgets').update({ config, updated_at: new Date().toISOString() }).eq('id', id);
            if (!error) {
                revalidatePath('/', 'layout');
                revalidatePath('/admin/widgets');
                return true;
            }
        } catch {
            // fallback
        }
        await query('UPDATE widgets SET config = $1, updated_at = NOW() WHERE id = $2', [config, id]);

        revalidatePath('/', 'layout');
        revalidatePath('/admin/widgets');

        return true;
    } catch (error) {
        console.error('[Action] Error updating widget config:', error);
        return false;
    }
}
