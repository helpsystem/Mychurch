"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { BroadcastSession } from "@/types/broadcast";
import { requireRole } from "@/utils/rbac";

async function ensureBroadcastAccess() {
    await requireRole(["Admin", "Leader", "Operator"]);
}

// Fallback in-memory storage for offline testing
let mockPresentations: BroadcastSession[] = [];
let schemaEnsurePromise: Promise<void> | null = null;

async function ensurePresentationsSchema(): Promise<void> {
    // Keep compatibility with older schema versions (session_date/slides)
    // while supporting the newer fields (date/slides_json/host_name/status).
    await query(`
        CREATE TABLE IF NOT EXISTS presentations (
            id VARCHAR(255) PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            date TIMESTAMP WITH TIME ZONE,
            host_name VARCHAR(255),
            slides_json JSONB NOT NULL DEFAULT '[]',
            status VARCHAR(50) NOT NULL DEFAULT 'draft',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `);

    await query(`ALTER TABLE presentations ADD COLUMN IF NOT EXISTS date TIMESTAMP WITH TIME ZONE;`);
    await query(`ALTER TABLE presentations ADD COLUMN IF NOT EXISTS host_name VARCHAR(255);`);
    await query(`ALTER TABLE presentations ADD COLUMN IF NOT EXISTS slides_json JSONB DEFAULT '[]'::jsonb;`);
    await query(`ALTER TABLE presentations ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft';`);

    // Backfill from legacy columns if they exist.
    await query(`
        UPDATE presentations
        SET date = COALESCE(date, created_at, NOW())
        WHERE date IS NULL;
    `);

    await query(`
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'presentations' AND column_name = 'session_date'
            ) THEN
                UPDATE presentations
                SET date = COALESCE(date, session_date::timestamptz, created_at, NOW())
                WHERE date IS NULL;
            END IF;

            IF EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'presentations' AND column_name = 'slides'
            ) THEN
                UPDATE presentations
                SET slides_json = COALESCE(slides_json, slides, '[]'::jsonb)
                WHERE slides_json IS NULL OR slides_json = 'null'::jsonb;
            END IF;
        END
        $$;
    `);

    await query(`UPDATE presentations SET status = COALESCE(NULLIF(status, ''), 'draft');`);
}

function ensurePresentationsSchemaOnce(): Promise<void> {
    if (!schemaEnsurePromise) {
        schemaEnsurePromise = ensurePresentationsSchema().catch((error) => {
            schemaEnsurePromise = null;
            throw error;
        });
    }

    return schemaEnsurePromise;
}

function rowToSession(row: any): BroadcastSession {
    const rawDate = row.date ?? row.session_date ?? row.created_at ?? new Date().toISOString();
    const rawSlides = row.slides_json ?? row.slides ?? [];

    return {
        id: row.id,
        title: row.title,
        date: new Date(rawDate),
        hostName: row.host_name,
        slides: Array.isArray(rawSlides) ? rawSlides : [],
        status: (row.status || 'draft') as BroadcastSession['status'],
    };
}

function normalizeSession(input: BroadcastSession): BroadcastSession {
    const normalizedDate = input.date instanceof Date ? input.date : new Date(input.date);
    const safeStatus = ['draft', 'ready', 'live', 'ended'].includes(input.status)
        ? input.status
        : 'draft';

    return {
        ...input,
        title: (input.title || '').trim().slice(0, 255),
        hostName: input.hostName?.trim().slice(0, 255),
        date: normalizedDate,
        slides: Array.isArray(input.slides) ? input.slides : [],
        status: safeStatus,
    };
}

export async function getPresentations(): Promise<BroadcastSession[]> {
    await ensureBroadcastAccess();

    try {
        const { rows } = await query(`
            SELECT *
            FROM presentations
            ORDER BY COALESCE(date, created_at, NOW()) DESC, created_at DESC
        `);
        
        return rows.map(rowToSession);
    } catch (error) {
        console.error('[Action] Database unreachable, falling back to mock presentations.');
        return [...mockPresentations].sort((a, b) => b.date.getTime() - a.date.getTime());
    }
}

export async function getPresentationById(id: string): Promise<BroadcastSession | null> {
    await ensureBroadcastAccess();

    try {
        const { rows } = await query('SELECT * FROM presentations WHERE id = $1', [id]);
        if (rows.length === 0) return null;
        
        return rowToSession(rows[0]);
    } catch (error) {
        console.error('[Action] Database unreachable, fallback to mock fetch.');
        return mockPresentations.find(p => p.id === id) || null;
    }
}

export async function savePresentation(session: BroadcastSession): Promise<{ success: boolean; serverSaved: boolean; fallbackSaved?: boolean; error?: string }> {
    await ensureBroadcastAccess();

    const safeSession = normalizeSession(session);
    if (!safeSession.id || !safeSession.title) {
        return { success: false, serverSaved: false, error: "Invalid presentation payload" };
    }

    try {
        await ensurePresentationsSchemaOnce();

        await query(`
            INSERT INTO presentations (id, title, date, host_name, slides_json, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (id) DO UPDATE 
            SET title = EXCLUDED.title,
                date = EXCLUDED.date,
                host_name = EXCLUDED.host_name,
                slides_json = EXCLUDED.slides_json,
                status = EXCLUDED.status;
        `, [
            safeSession.id,
            safeSession.title,
            safeSession.date.toISOString(),
            safeSession.hostName || null,
            JSON.stringify(safeSession.slides),
            safeSession.status
        ]);

        const verify = await query(
            'SELECT id, status, slides_json FROM presentations WHERE id = $1 LIMIT 1',
            [safeSession.id]
        );

        if (verify.rows.length === 0) {
            return { success: false, serverSaved: false, error: 'ذخیره تایید نشد. رکورد در سرور یافت نشد.' };
        }

        const persisted = verify.rows[0];
        const slidesArray = Array.isArray(persisted.slides_json)
            ? persisted.slides_json
            : JSON.parse(persisted.slides_json || '[]');
        const persistedSlideCount = slidesArray.length;
        if (persisted.status !== safeSession.status || persistedSlideCount !== safeSession.slides.length) {
            return { success: false, serverSaved: false, error: 'ذخیره ناقص بود. لطفا دوباره ذخیره کنید.' };
        }
        
        revalidatePath('/admin/presentations');
        revalidatePath('/broadcast');
        
        // Also save to mock array
        const index = mockPresentations.findIndex(p => p.id === safeSession.id);
        if (index > -1) mockPresentations[index] = safeSession;
        else mockPresentations.push(safeSession);

        return { success: true, serverSaved: true };
    } catch (error) {
        console.error('[Action] Failed to save presentation in DB, fallback to mock:', error);
        return {
            success: false,
            serverSaved: false,
            error: 'ذخیره روی سرور انجام نشد. لطفا چند ثانیه بعد دوباره تلاش کنید.'
        };
    }
}

export async function deletePresentation(id: string): Promise<{ success: boolean; error?: string }> {
    await ensureBroadcastAccess();

    if (!id || id.length > 255) {
        return { success: false, error: "Invalid presentation id" };
    }

    try {
        await query('DELETE FROM presentations WHERE id = $1', [id]);
        revalidatePath('/admin/presentations');
        mockPresentations = mockPresentations.filter(p => p.id !== id);
        return { success: true };
    } catch (error) {
        console.error('[Action] Failed to delete presentation:', error);
        return { success: false, error: 'Failed to delete presentation.' };
    }
}
