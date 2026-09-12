"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { hasAdminRoleOrPermission } from "@/lib/access-control";
import { ChurchWeeklyProgram } from "@/types/weekly-programs";

// ─────────────────────────────────────────────────────────────────────────────
// Schema Auto-Migration & Seeding
// ─────────────────────────────────────────────────────────────────────────────

async function ensureSchema(): Promise<void> {
    await query(`
        CREATE TABLE IF NOT EXISTS church_weekly_programs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            day_of_week VARCHAR(50) NOT NULL,
            day_name_fa VARCHAR(100) NOT NULL,
            day_name_en VARCHAR(100) NOT NULL DEFAULT '',
            title_fa VARCHAR(255) NOT NULL,
            title_en VARCHAR(255) NOT NULL DEFAULT '',
            category_fa VARCHAR(100) NOT NULL DEFAULT 'کلاس درس کتاب مقدس',
            category_en VARCHAR(100) NOT NULL DEFAULT 'Bible Study',
            main_teacher_fa VARCHAR(255) NOT NULL DEFAULT 'با قدرت و رهبر و معلم اصلی: روح‌القدس',
            main_teacher_en VARCHAR(255) NOT NULL DEFAULT 'Lead & Main Teacher: Holy Spirit',
            assistant_fa VARCHAR(255) NOT NULL DEFAULT '',
            assistant_en VARCHAR(255) NOT NULL DEFAULT '',
            time_fa VARCHAR(255) NOT NULL,
            time_en VARCHAR(255) NOT NULL DEFAULT '',
            start_time TIME,
            end_time TIME,
            location_fa VARCHAR(255) NOT NULL DEFAULT 'آنلاین (پخش زنده و تعاملی)',
            location_en VARCHAR(255) NOT NULL DEFAULT 'Online (Live & Interactive)',
            description_fa TEXT NOT NULL DEFAULT '',
            description_en TEXT NOT NULL DEFAULT '',
            icon VARCHAR(50) NOT NULL DEFAULT 'BookOpen',
            color VARCHAR(50) NOT NULL DEFAULT '#8b5cf6',
            badge_fa VARCHAR(100) NOT NULL DEFAULT '',
            badge_en VARCHAR(100) NOT NULL DEFAULT '',
            action_url VARCHAR(255) NOT NULL DEFAULT '/broadcast/view',
            action_text_fa VARCHAR(100) NOT NULL DEFAULT 'ورود به جلسه',
            action_text_en VARCHAR(100) NOT NULL DEFAULT 'Join Session',
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            sort_order INT NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    `);

    // Check if initial programs exist
    const { rows } = await query("SELECT COUNT(*) AS cnt FROM church_weekly_programs");
    const count = parseInt(rows[0]?.cnt ?? "0", 10);
    if (count === 0) {
        await query(`
            INSERT INTO church_weekly_programs (
                day_of_week, day_name_fa, day_name_en,
                title_fa, title_en,
                category_fa, category_en,
                main_teacher_fa, main_teacher_en,
                assistant_fa, assistant_en,
                time_fa, time_en,
                location_fa, location_en,
                description_fa, description_en,
                icon, color, badge_fa, badge_en,
                action_url, action_text_fa, action_text_en,
                is_active, sort_order
            ) VALUES
            (
                'sunday', 'یکشنبه‌ها', 'Sundays',
                'جلسه و عبادت یکشنبه‌ها', 'Sunday Worship & Service',
                'جلسه عمومی و عبادت', 'Worship Service',
                'شبانی و موعظه کلام: کشیش جواد', 'Pastoral Teaching: Pastor Javad',
                'با همراهی تیم پرستش و خدمتگزاران کلیسا', 'With Church Worship & Ministry Team',
                'ساعت ۱۱:۰۰ صبح به وقت واشنگتن دی‌سی (EST)', '11:00 AM Washington D.C. Time (EST)',
                'حضوری در واشنگتن دی‌سی و پخش زنده همزمان', 'In-Person (Washington D.C.) & Live Broadcast',
                'مشارکت پربرکت ایمانداران، سرودهای پرستشی، موعظه کلام زنده خدا و دعای شفاعتی.',
                'Fellowship of believers, worship songs, living word sermon and intercessory prayer.',
                'Church', '#6366f1', 'جلسه اصلی کلیسا', 'Main Service',
                '/broadcast/view', 'پخش زنده یکشنبه', 'Live Broadcast',
                TRUE, 0
            ),
            (
                'tuesday', 'سه‌شنبه شب‌ها', 'Tuesday Nights',
                'کلاس درس کتاب مقدس', 'Tuesday Night Bible Study',
                'تدریس کتاب مقدس', 'Bible Study',
                'با قدرت و رهبر و معلم اصلی: روح‌القدس', 'Lead & Main Teacher: The Holy Spirit',
                'با کمک خواهر اعظم', 'Assisted by Sister Azam',
                'ساعت ۸:۰۰ تا ۹:۰۰ شب به وقت واشنگتن دی‌سی (EST)', '8:00 PM – 9:00 PM Washington D.C. Time (EST)',
                'آنلاین (پخش زنده و مشارکت صمیمانه)', 'Online (Live Broadcast & Fellowship)',
                'تعلیم کلام خدا با قدرت روح‌القدس، بررسی تفسیری آیات و گفتگوی ایمانی هفتگی.',
                'Teaching God\'s Word through the power of the Holy Spirit, verse-by-verse study and weekly fellowship.',
                'BookOpen', '#8b5cf6', 'کلاس هفتگی کلام', 'Weekly Bible Class',
                '/broadcast/view', 'ورود به کلاس', 'Join Class',
                TRUE, 1
            ),
            (
                'wednesday', 'چهارشنبه شب‌ها', 'Wednesday Nights',
                'کلاس درس کتاب مقدس', 'Wednesday Night Bible Study',
                'تدریس کتاب مقدس', 'Bible Study',
                'با قدرت و رهبر و معلم اصلی: روح‌القدس', 'Lead & Main Teacher: The Holy Spirit',
                'با کمک کشیش جواد', 'Assisted by Pastor Javad',
                'ساعت ۸:۰۰ تا ۹:۰۰ شب به وقت واشنگتن دی‌سی (EST)', '8:00 PM – 9:00 PM Washington D.C. Time (EST)',
                'آنلاین (پخش زنده و بررسی عمیق کلام)', 'Online (Live Broadcast & In-depth Study)',
                'مطالعه عمیق فصول کتاب مقدس، تعالیم شبانی و تقویت بنیادهای الهیاتی ایمانداران.',
                'In-depth study of Scripture chapters, pastoral teachings, and strengthening theological foundations.',
                'BookOpen', '#06b6d4', 'کلاس شبانی کلام', 'Pastoral Study',
                '/broadcast/view', 'ورود به کلاس', 'Join Class',
                TRUE, 2
            ),
            (
                'thursday', 'پنجشنبه شب‌ها', 'Thursday Nights',
                'کلاس درس کتاب مقدس', 'Thursday Night Bible Study',
                'تدریس کتاب مقدس', 'Bible Study',
                'با قدرت و رهبر و معلم اصلی: روح‌القدس', 'Lead & Main Teacher: The Holy Spirit',
                'با کمک خواهر نازی', 'Assisted by Sister Nazi',
                'ساعت ۸:۰۰ تا ۹:۰۰ شب به وقت واشنگتن دی‌سی (EST)', '8:00 PM – 9:00 PM Washington D.C. Time (EST)',
                'آنلاین (پخش تعاملی و پرسش و پاسخ)', 'Online (Interactive & Q&A Session)',
                'جلسه تعاملی بررسی کتاب مقدس با روح‌القدس، پرسش و پاسخ‌های ایمانی و دعای مشترک.',
                'Interactive Bible exploration with the Holy Spirit, faith questions & answers, and corporate prayer.',
                'BookOpen', '#ec4899', 'کلاس تعاملی کلام', 'Interactive Study',
                '/broadcast/view', 'ورود به کلاس', 'Join Class',
                TRUE, 3
            ),
            (
                'flexible', 'جلسات بانوان', 'Women\'s Fellowship',
                'برنامه و خدمت خواهران (بانوان)', 'Women\'s Ministry & Fellowship',
                'خدمت بانوان', 'Women\'s Ministry',
                'با هدایت روح‌القدس و خدمتگزاران بانوان کلیسا', 'Led by the Holy Spirit & Church Women Leaders',
                'شورای خواهران کلیسا', 'Sisters Ministry Board',
                'جلسات ویژه هفتگی / ماهانه (به وقت واشنگتن دی‌سی)', 'Weekly / Monthly Gatherings (Washington D.C. Time)',
                'آنلاین و حضوری', 'Online & In-Person',
                'رشد روحانی، دعا و شفاعت برای خانواده‌ها، مشارکت صمیمانه و توانمندسازی بانوان در ایمان مسیحی.',
                'Spiritual growth, prayer for families, warm fellowship and empowering women in the Christian faith.',
                'Heart', '#f59e0b', 'خدمت بانوان', 'Women\'s Ministry',
                '/contact', 'اطلاعات برنامه بانوان', 'Learn More',
                TRUE, 4
            );
        `);
    }
}

let schemaReady: Promise<void> | null = null;
function ensureSchemaOnce(): Promise<void> {
    if (!schemaReady) {
        schemaReady = ensureSchema().catch((err) => {
            schemaReady = null;
            throw err;
        });
    }
    return schemaReady;
}

function mapRow(r: any): ChurchWeeklyProgram {
    return {
        id: r.id,
        day_of_week: r.day_of_week,
        day_name_fa: r.day_name_fa,
        day_name_en: r.day_name_en || "",
        title_fa: r.title_fa,
        title_en: r.title_en || "",
        category_fa: r.category_fa,
        category_en: r.category_en || "",
        main_teacher_fa: r.main_teacher_fa,
        main_teacher_en: r.main_teacher_en || "",
        assistant_fa: r.assistant_fa || "",
        assistant_en: r.assistant_en || "",
        time_fa: r.time_fa,
        time_en: r.time_en || "",
        start_time: r.start_time || undefined,
        end_time: r.end_time || undefined,
        location_fa: r.location_fa,
        location_en: r.location_en || "",
        description_fa: r.description_fa || "",
        description_en: r.description_en || "",
        icon: r.icon || "BookOpen",
        color: r.color || "#8b5cf6",
        badge_fa: r.badge_fa || "",
        badge_en: r.badge_en || "",
        action_url: r.action_url || "/broadcast/view",
        action_text_fa: r.action_text_fa || "ورود به جلسه",
        action_text_en: r.action_text_en || "Join Session",
        is_active: Boolean(r.is_active),
        sort_order: Number(r.sort_order) || 0,
        created_at: r.created_at?.toISOString?.() ?? "",
        updated_at: r.updated_at?.toISOString?.() ?? "",
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public Read Action (Homepage & /schedule)
// ─────────────────────────────────────────────────────────────────────────────

export async function getActiveWeeklyPrograms(): Promise<ChurchWeeklyProgram[]> {
    try {
        await ensureSchemaOnce();
        const { rows } = await query(`
            SELECT * FROM church_weekly_programs
            WHERE is_active = TRUE
            ORDER BY sort_order ASC, created_at ASC
        `);
        return rows.map(mapRow);
    } catch (err) {
        console.error("[weekly-programs] getActiveWeeklyPrograms error:", err);
        return [];
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Actions (Add, Edit, Delete, Toggle)
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllWeeklyProgramsAdmin(): Promise<ChurchWeeklyProgram[]> {
    const authorized = await hasAdminRoleOrPermission(["canManageWidgets"]);
    if (!authorized) {
        return [];
    }

    try {
        await ensureSchemaOnce();
        const { rows } = await query(`
            SELECT * FROM church_weekly_programs
            ORDER BY sort_order ASC, created_at ASC
        `);
        return rows.map(mapRow);
    } catch (err) {
        console.error("[weekly-programs] getAllWeeklyProgramsAdmin error:", err);
        return [];
    }
}

export async function saveWeeklyProgram(
    program: Partial<ChurchWeeklyProgram> & { title_fa: string; day_name_fa: string; time_fa: string }
): Promise<{ success: boolean; id?: string; error?: string }> {
    const authorized = await hasAdminRoleOrPermission(["canManageWidgets"]);
    if (!authorized) {
        return { success: false, error: "دسترسی غیرمجاز" };
    }

    try {
        await ensureSchemaOnce();

        if (program.id) {
            // Update
            await query(`
                UPDATE church_weekly_programs SET
                    day_of_week = $1,
                    day_name_fa = $2,
                    day_name_en = $3,
                    title_fa = $4,
                    title_en = $5,
                    category_fa = $6,
                    category_en = $7,
                    main_teacher_fa = $8,
                    main_teacher_en = $9,
                    assistant_fa = $10,
                    assistant_en = $11,
                    time_fa = $12,
                    time_en = $13,
                    location_fa = $14,
                    location_en = $15,
                    description_fa = $16,
                    description_en = $17,
                    icon = $18,
                    color = $19,
                    badge_fa = $20,
                    badge_en = $21,
                    action_url = $22,
                    action_text_fa = $23,
                    action_text_en = $24,
                    is_active = $25,
                    sort_order = $26,
                    updated_at = NOW()
                WHERE id = $27
            `, [
                program.day_of_week || "flexible",
                program.day_name_fa,
                program.day_name_en || "",
                program.title_fa,
                program.title_en || "",
                program.category_fa || "کلاس درس کتاب مقدس",
                program.category_en || "Bible Study",
                program.main_teacher_fa || "با قدرت و رهبر و معلم اصلی: روح‌القدس",
                program.main_teacher_en || "Lead & Main Teacher: Holy Spirit",
                program.assistant_fa || "",
                program.assistant_en || "",
                program.time_fa,
                program.time_en || "",
                program.location_fa || "آنلاین",
                program.location_en || "Online",
                program.description_fa || "",
                program.description_en || "",
                program.icon || "BookOpen",
                program.color || "#8b5cf6",
                program.badge_fa || "",
                program.badge_en || "",
                program.action_url || "/broadcast/view",
                program.action_text_fa || "ورود به جلسه",
                program.action_text_en || "Join Session",
                program.is_active !== undefined ? program.is_active : true,
                program.sort_order ?? 0,
                program.id,
            ]);

            revalidatePath("/", "layout");
            revalidatePath("/schedule");
            revalidatePath("/admin/schedule");
            revalidatePath("/admin/widgets");
            return { success: true, id: program.id };
        } else {
            // Insert
            const { rows } = await query(`
                INSERT INTO church_weekly_programs (
                    day_of_week, day_name_fa, day_name_en,
                    title_fa, title_en,
                    category_fa, category_en,
                    main_teacher_fa, main_teacher_en,
                    assistant_fa, assistant_en,
                    time_fa, time_en,
                    location_fa, location_en,
                    description_fa, description_en,
                    icon, color, badge_fa, badge_en,
                    action_url, action_text_fa, action_text_en,
                    is_active, sort_order
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
                    $21, $22, $23, $24, $25, $26
                ) RETURNING id
            `, [
                program.day_of_week || "flexible",
                program.day_name_fa,
                program.day_name_en || "",
                program.title_fa,
                program.title_en || "",
                program.category_fa || "کلاس درس کتاب مقدس",
                program.category_en || "Bible Study",
                program.main_teacher_fa || "با قدرت و رهبر و معلم اصلی: روح‌القدس",
                program.main_teacher_en || "Lead & Main Teacher: Holy Spirit",
                program.assistant_fa || "",
                program.assistant_en || "",
                program.time_fa,
                program.time_en || "",
                program.location_fa || "آنلاین",
                program.location_en || "Online",
                program.description_fa || "",
                program.description_en || "",
                program.icon || "BookOpen",
                program.color || "#8b5cf6",
                program.badge_fa || "",
                program.badge_en || "",
                program.action_url || "/broadcast/view",
                program.action_text_fa || "ورود به جلسه",
                program.action_text_en || "Join Session",
                program.is_active !== undefined ? program.is_active : true,
                program.sort_order ?? 0,
            ]);

            revalidatePath("/", "layout");
            revalidatePath("/schedule");
            revalidatePath("/admin/schedule");
            revalidatePath("/admin/widgets");
            return { success: true, id: rows[0]?.id };
        }
    } catch (err: any) {
        console.error("[weekly-programs] saveWeeklyProgram error:", err);
        return { success: false, error: err.message || "خطا در ذخیره برنامه هفتگی" };
    }
}

export async function toggleWeeklyProgramActive(id: string, currentStatus: boolean): Promise<{ success: boolean; error?: string }> {
    const authorized = await hasAdminRoleOrPermission(["canManageWidgets"]);
    if (!authorized) {
        return { success: false, error: "دسترسی غیرمجاز" };
    }

    try {
        await ensureSchemaOnce();
        await query(
            "UPDATE church_weekly_programs SET is_active = $1, updated_at = NOW() WHERE id = $2",
            [!currentStatus, id]
        );

        revalidatePath("/", "layout");
        revalidatePath("/schedule");
        revalidatePath("/admin/schedule");
        revalidatePath("/admin/widgets");
        return { success: true };
    } catch (err: any) {
        console.error("[weekly-programs] toggleWeeklyProgramActive error:", err);
        return { success: false, error: err.message };
    }
}

export async function deleteWeeklyProgram(id: string): Promise<{ success: boolean; error?: string }> {
    const authorized = await hasAdminRoleOrPermission(["canManageWidgets"]);
    if (!authorized) {
        return { success: false, error: "دسترسی غیرمجاز" };
    }

    try {
        await ensureSchemaOnce();
        await query("DELETE FROM church_weekly_programs WHERE id = $1", [id]);

        revalidatePath("/", "layout");
        revalidatePath("/schedule");
        revalidatePath("/admin/schedule");
        revalidatePath("/admin/widgets");
        return { success: true };
    } catch (err: any) {
        console.error("[weekly-programs] deleteWeeklyProgram error:", err);
        return { success: false, error: err.message };
    }
}
