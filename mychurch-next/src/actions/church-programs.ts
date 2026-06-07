"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/utils/rbac";
import { ChurchProgramCategory, ChurchProgram } from "@/types/church-programs";

// ─────────────────────────────────────────────────────────────────────────────
// Schema Auto-Migration
// ─────────────────────────────────────────────────────────────────────────────

async function ensureSchema(): Promise<void> {
    // Categories table
    await query(`
        CREATE TABLE IF NOT EXISTS program_categories (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name_fa VARCHAR(255) NOT NULL,
            name_en VARCHAR(255) NOT NULL DEFAULT '',
            icon VARCHAR(50) NOT NULL DEFAULT '📅',
            color VARCHAR(20) NOT NULL DEFAULT '#6366f1',
            sort_order INT NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    `);

    // Programs table
    await query(`
        CREATE TABLE IF NOT EXISTS church_programs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            category_id UUID NOT NULL REFERENCES program_categories(id) ON DELETE CASCADE,
            title_fa VARCHAR(500) NOT NULL,
            title_en VARCHAR(500) NOT NULL DEFAULT '',
            organizer_fa VARCHAR(255) NOT NULL DEFAULT '',
            organizer_en VARCHAR(255) NOT NULL DEFAULT '',
            description_fa TEXT,
            description_en TEXT,
            event_date DATE NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME,
            location_fa VARCHAR(255),
            location_en VARCHAR(255),
            presentation_id VARCHAR(255),
            is_public BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    `);

    // Seed default categories if none exist
    const existing = await query("SELECT COUNT(*) AS cnt FROM program_categories");
    const count = parseInt(existing.rows[0]?.cnt ?? "0", 10);
    if (count === 0) {
        await query(`
            INSERT INTO program_categories (name_fa, name_en, icon, color, sort_order) VALUES
            ('جلسه یکشنبه صبح', 'Sunday Morning', '🕍', '#6366f1', 0),
            ('سه‌شنبه شب', 'Tuesday Night', '📖', '#8b5cf6', 1),
            ('پنجشنبه شب', 'Thursday Night', '🎵', '#06b6d4', 2),
            ('جلسه جوانان', 'Youth Night', '✨', '#f59e0b', 3),
            ('جلسه دعا', 'Prayer Meeting', '🙏', '#10b981', 4)
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

// ─────────────────────────────────────────────────────────────────────────────
// Categories CRUD
// ─────────────────────────────────────────────────────────────────────────────

export async function getCategories(): Promise<ChurchProgramCategory[]> {
    await requireRole(["Admin", "Leader", "Operator"]);
    await ensureSchemaOnce();

    const { rows } = await query(`
        SELECT id, name_fa, name_en, icon, color, sort_order, created_at
        FROM program_categories
        ORDER BY sort_order ASC, created_at ASC
    `);

    return rows.map((r) => ({
        id: r.id,
        name_fa: r.name_fa,
        name_en: r.name_en,
        icon: r.icon,
        color: r.color,
        sort_order: r.sort_order,
        created_at: r.created_at?.toISOString?.() ?? "",
    }));
}

export async function saveCategory(cat: Partial<ChurchProgramCategory> & { name_fa: string }): Promise<{ success: boolean; id?: string; error?: string }> {
    await requireRole(["Admin"]);
    await ensureSchemaOnce();

    try {
        if (cat.id) {
            // Update existing
            await query(`
                UPDATE program_categories
                SET name_fa = $1, name_en = $2, icon = $3, color = $4, sort_order = $5
                WHERE id = $6
            `, [cat.name_fa, cat.name_en ?? "", cat.icon ?? "📅", cat.color ?? "#6366f1", cat.sort_order ?? 0, cat.id]);
            revalidatePath("/admin/presentations");
            return { success: true, id: cat.id };
        } else {
            // Insert new
            const { rows } = await query(`
                INSERT INTO program_categories (name_fa, name_en, icon, color, sort_order)
                VALUES ($1, $2, $3, $4, COALESCE($5, (SELECT COALESCE(MAX(sort_order)+1, 0) FROM program_categories)))
                RETURNING id
            `, [cat.name_fa, cat.name_en ?? "", cat.icon ?? "📅", cat.color ?? "#6366f1", cat.sort_order ?? null]);
            revalidatePath("/admin/presentations");
            return { success: true, id: rows[0]?.id };
        }
    } catch (err: any) {
        console.error("[church-programs] saveCategory error:", err);
        return { success: false, error: err.message };
    }
}

export async function deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
    await requireRole(["Admin"]);

    try {
        const existing = await query("SELECT COUNT(*) AS cnt FROM church_programs WHERE category_id = $1", [id]);
        const count = parseInt(existing.rows[0]?.cnt ?? "0", 10);
        if (count > 0) {
            return { success: false, error: `این دسته‌بندی دارای ${count} برنامه است. ابتدا برنامه‌ها را حذف کنید.` };
        }
        await query("DELETE FROM program_categories WHERE id = $1", [id]);
        revalidatePath("/admin/presentations");
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Programs CRUD
// ─────────────────────────────────────────────────────────────────────────────

function rowToProgram(row: any): ChurchProgram {
    return {
        id: row.id,
        category_id: row.category_id,
        title_fa: row.title_fa,
        title_en: row.title_en ?? "",
        organizer_fa: row.organizer_fa ?? "",
        organizer_en: row.organizer_en ?? "",
        description_fa: row.description_fa ?? "",
        description_en: row.description_en ?? "",
        event_date: row.event_date instanceof Date
            ? row.event_date.toISOString().split("T")[0]
            : String(row.event_date).split("T")[0],
        start_time: row.start_time ?? "",
        end_time: row.end_time ?? undefined,
        location_fa: row.location_fa ?? "",
        location_en: row.location_en ?? "",
        presentation_id: row.presentation_id ?? null,
        is_public: row.is_public ?? true,
        created_at: row.created_at?.toISOString?.() ?? "",
        category: row.category_id ? {
            id: row.cat_id ?? row.category_id,
            name_fa: row.cat_name_fa ?? "",
            name_en: row.cat_name_en ?? "",
            icon: row.cat_icon ?? "📅",
            color: row.cat_color ?? "#6366f1",
            sort_order: row.cat_sort_order ?? 0,
        } : undefined,
    };
}

export async function getPrograms(filters?: { category_id?: string; date?: string }): Promise<ChurchProgram[]> {
    await requireRole(["Admin", "Leader", "Operator"]);
    await ensureSchemaOnce();

    let whereClause = "WHERE 1=1";
    const params: any[] = [];

    if (filters?.category_id) {
        params.push(filters.category_id);
        whereClause += ` AND p.category_id = $${params.length}`;
    }
    if (filters?.date) {
        params.push(filters.date);
        whereClause += ` AND p.event_date = $${params.length}`;
    }

    const { rows } = await query(`
        SELECT
            p.*,
            c.id AS cat_id, c.name_fa AS cat_name_fa, c.name_en AS cat_name_en,
            c.icon AS cat_icon, c.color AS cat_color, c.sort_order AS cat_sort_order
        FROM church_programs p
        LEFT JOIN program_categories c ON c.id = p.category_id
        ${whereClause}
        ORDER BY p.event_date DESC, p.start_time ASC
    `, params);

    return rows.map(rowToProgram);
}

export async function saveProgram(program: Omit<ChurchProgram, "category"> & { id?: string }): Promise<{ success: boolean; id?: string; error?: string }> {
    await requireRole(["Admin", "Leader"]);
    await ensureSchemaOnce();

    try {
        if (program.id) {
            await query(`
                UPDATE church_programs SET
                    category_id = $1,
                    title_fa = $2,
                    title_en = $3,
                    organizer_fa = $4,
                    organizer_en = $5,
                    description_fa = $6,
                    description_en = $7,
                    event_date = $8,
                    start_time = $9,
                    end_time = $10,
                    location_fa = $11,
                    location_en = $12,
                    presentation_id = $13,
                    is_public = $14
                WHERE id = $15
            `, [
                program.category_id,
                program.title_fa,
                program.title_en ?? "",
                program.organizer_fa ?? "",
                program.organizer_en ?? "",
                program.description_fa ?? null,
                program.description_en ?? null,
                program.event_date,
                program.start_time,
                program.end_time ?? null,
                program.location_fa ?? null,
                program.location_en ?? null,
                program.presentation_id ?? null,
                program.is_public ?? true,
                program.id,
            ]);
            revalidatePath("/admin/presentations");
            revalidatePath("/schedule");
            return { success: true, id: program.id };
        } else {
            const { rows } = await query(`
                INSERT INTO church_programs
                    (category_id, title_fa, title_en, organizer_fa, organizer_en,
                     description_fa, description_en, event_date, start_time, end_time,
                     location_fa, location_en, presentation_id, is_public)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
                RETURNING id
            `, [
                program.category_id,
                program.title_fa,
                program.title_en ?? "",
                program.organizer_fa ?? "",
                program.organizer_en ?? "",
                program.description_fa ?? null,
                program.description_en ?? null,
                program.event_date,
                program.start_time,
                program.end_time ?? null,
                program.location_fa ?? null,
                program.location_en ?? null,
                program.presentation_id ?? null,
                program.is_public ?? true,
            ]);
            revalidatePath("/admin/presentations");
            revalidatePath("/schedule");
            return { success: true, id: rows[0]?.id };
        }
    } catch (err: any) {
        console.error("[church-programs] saveProgram error:", err);
        return { success: false, error: err.message };
    }
}

export async function deleteProgram(id: string): Promise<{ success: boolean; error?: string }> {
    await requireRole(["Admin", "Leader"]);
    try {
        await query("DELETE FROM church_programs WHERE id = $1", [id]);
        revalidatePath("/admin/presentations");
        revalidatePath("/schedule");
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public (no-auth) access for /schedule page
// ─────────────────────────────────────────────────────────────────────────────

export async function getPublicSchedule(date?: string): Promise<ChurchProgram[]> {
    // No auth required — public endpoint
    try {
        await ensureSchemaOnce();

        let whereClause = "WHERE p.is_public = TRUE";
        const params: any[] = [];

        if (date) {
            params.push(date);
            whereClause += ` AND p.event_date = $${params.length}`;
        } else {
            // Default: show next 14 days
            whereClause += " AND p.event_date >= CURRENT_DATE AND p.event_date <= CURRENT_DATE + INTERVAL '14 days'";
        }

        const { rows } = await query(`
            SELECT
                p.*,
                c.id AS cat_id, c.name_fa AS cat_name_fa, c.name_en AS cat_name_en,
                c.icon AS cat_icon, c.color AS cat_color, c.sort_order AS cat_sort_order
            FROM church_programs p
            LEFT JOIN program_categories c ON c.id = p.category_id
            ${whereClause}
            ORDER BY p.event_date ASC, p.start_time ASC
        `, params);

        return rows.map(rowToProgram);
    } catch (err) {
        console.error("[church-programs] getPublicSchedule error:", err);
        return [];
    }
}

export async function getPublicCategories(): Promise<ChurchProgramCategory[]> {
    // No auth required — for the public /schedule page
    try {
        await ensureSchemaOnce();
        const { rows } = await query(`
            SELECT id, name_fa, name_en, icon, color, sort_order
            FROM program_categories
            ORDER BY sort_order ASC, created_at ASC
        `);
        return rows.map((r) => ({
            id: r.id,
            name_fa: r.name_fa,
            name_en: r.name_en,
            icon: r.icon,
            color: r.color,
            sort_order: r.sort_order,
            created_at: "",
        }));
    } catch (err) {
        console.error("[church-programs] getPublicCategories error:", err);
        return [];
    }
}
