"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { SlideTemplate, SessionTemplate, Slide } from "@/types/broadcast";
import { requireRole } from "@/utils/rbac";

// ═══════════════════════════════════════════════════════════════════════════
// DATABASE SCHEMA SETUP
// ═══════════════════════════════════════════════════════════════════════════

async function ensureTemplatesSchema(): Promise<void> {
    // Slide Templates Table
    await query(`
        CREATE TABLE IF NOT EXISTS slide_templates (
            id VARCHAR(255) PRIMARY KEY,
            name_fa VARCHAR(255) NOT NULL,
            name_en VARCHAR(255) NOT NULL,
            description_fa TEXT,
            description_en TEXT,
            slide_type VARCHAR(50) NOT NULL,
            content JSONB NOT NULL,
            thumbnail TEXT,
            tags TEXT[],
            category VARCHAR(50),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `);

    // Session Templates Table
    await query(`
        CREATE TABLE IF NOT EXISTS session_templates (
            id VARCHAR(255) PRIMARY KEY,
            name_fa VARCHAR(255) NOT NULL,
            name_en VARCHAR(255) NOT NULL,
            description_fa TEXT,
            description_en TEXT,
            slides JSONB NOT NULL DEFAULT '[]',
            thumbnail TEXT,
            tags TEXT[],
            category VARCHAR(50),
            slide_count INT DEFAULT 0,
            is_public BOOLEAN DEFAULT FALSE,
            is_favorite BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `);
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE TEMPLATE OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Save a single slide as a template
 */
export async function saveSlideAsTemplate(
    slide: Slide,
    templateName: { fa: string; en: string },
    category: string,
    description?: { fa: string; en: string },
    tags?: string[]
): Promise<SlideTemplate> {
    await ensureTemplatesSchema();
    
    const template: SlideTemplate = {
        id: crypto.randomUUID(),
        name: templateName,
        description,
        slideType: slide.type,
        content: slide.content,
        tags: tags || [],
        category: category as any,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    await query(
        `INSERT INTO slide_templates 
         (id, name_fa, name_en, description_fa, description_en, slide_type, content, tags, category, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
            template.id,
            template.name.fa,
            template.name.en,
            template.description?.fa || '',
            template.description?.en || '',
            template.slideType,
            JSON.stringify(template.content),
            JSON.stringify(tags || []),
            category,
            template.createdAt,
            template.updatedAt
        ]
    );

    revalidatePath('/admin/broadcast');
    return template;
}

/**
 * Get all slide templates
 */
export async function getSlideTemplates(category?: string): Promise<SlideTemplate[]> {
    await ensureTemplatesSchema();

    let sql = `SELECT * FROM slide_templates ORDER BY created_at DESC`;
    const params: any[] = [];

    if (category) {
        sql = `SELECT * FROM slide_templates WHERE category = $1 ORDER BY created_at DESC`;
        params.push(category);
    }

    const result = await query(sql, params);

    return result.rows.map((row: any) => ({
        id: row.id,
        name: { fa: row.name_fa, en: row.name_en },
        description: { fa: row.description_fa, en: row.description_en },
        slideType: row.slide_type,
        content: row.content,
        thumbnail: row.thumbnail,
        tags: row.tags || [],
        category: row.category,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    }));
}

/**
 * Delete a slide template
 */
export async function deleteSlideTemplate(templateId: string): Promise<void> {
    await query(`DELETE FROM slide_templates WHERE id = $1`, [templateId]);
    revalidatePath('/admin/broadcast');
}

// ═══════════════════════════════════════════════════════════════════════════
// SESSION TEMPLATE OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Save presentation/session as a template
 */
export async function saveSessionAsTemplate(
    slides: Slide[],
    templateName: { fa: string; en: string },
    category: string,
    description?: { fa: string; en: string },
    tags?: string[],
    isPublic: boolean = false
): Promise<SessionTemplate> {
    await ensureTemplatesSchema();

    const template: SessionTemplate = {
        id: crypto.randomUUID(),
        name: templateName,
        description,
        slides: slides,
        tags: tags || [],
        category: category as any,
        slideCount: slides.length,
        isPublic: isPublic,
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    await query(
        `INSERT INTO session_templates 
         (id, name_fa, name_en, description_fa, description_en, slides, tags, category, slide_count, is_public, is_favorite, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
            template.id,
            template.name.fa,
            template.name.en,
            template.description?.fa || '',
            template.description?.en || '',
            JSON.stringify(slides),
            JSON.stringify(tags || []),
            category,
            slides.length,
            isPublic,
            false,
            template.createdAt,
            template.updatedAt
        ]
    );

    revalidatePath('/admin/broadcast');
    return template;
}

/**
 * Get all session templates
 */
export async function getSessionTemplates(category?: string): Promise<SessionTemplate[]> {
    await ensureTemplatesSchema();

    let sql = `SELECT * FROM session_templates ORDER BY created_at DESC`;
    const params: any[] = [];

    if (category) {
        sql = `SELECT * FROM session_templates WHERE category = $1 ORDER BY created_at DESC`;
        params.push(category);
    }

    const result = await query(sql, params);

    return result.rows.map((row: any) => ({
        id: row.id,
        name: { fa: row.name_fa, en: row.name_en },
        description: { fa: row.description_fa, en: row.description_en },
        slides: row.slides,
        thumbnail: row.thumbnail,
        tags: row.tags || [],
        category: row.category,
        slideCount: row.slide_count,
        isPublic: row.is_public,
        isFavorite: row.is_favorite,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    }));
}

/**
 * Toggle favorite status
 */
export async function toggleFavoriteTemplate(templateId: string): Promise<void> {
    await query(
        `UPDATE session_templates SET is_favorite = NOT is_favorite WHERE id = $1`,
        [templateId]
    );
    revalidatePath('/admin/broadcast');
}

/**
 * Delete a session template
 */
export async function deleteSessionTemplate(templateId: string): Promise<void> {
    await query(`DELETE FROM session_templates WHERE id = $1`, [templateId]);
    revalidatePath('/admin/broadcast');
}

/**
 * Search templates
 */
export async function searchTemplates(searchTerm: string): Promise<{ slides: SlideTemplate[]; sessions: SessionTemplate[] }> {
    await ensureTemplatesSchema();

    const searchPattern = `%${searchTerm}%`;

    const slidesResult = await query(
        `SELECT * FROM slide_templates 
         WHERE name_fa ILIKE $1 OR name_en ILIKE $1 OR description_fa ILIKE $1 OR description_en ILIKE $1
         ORDER BY created_at DESC`,
        [searchPattern]
    );

    const sessionsResult = await query(
        `SELECT * FROM session_templates 
         WHERE name_fa ILIKE $1 OR name_en ILIKE $1 OR description_fa ILIKE $1 OR description_en ILIKE $1
         ORDER BY created_at DESC`,
        [searchPattern]
    );

    return {
        slides: slidesResult.rows.map((row: any) => ({
            id: row.id,
            name: { fa: row.name_fa, en: row.name_en },
            description: { fa: row.description_fa, en: row.description_en },
            slideType: row.slide_type,
            content: row.content,
            tags: row.tags || [],
            category: row.category,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        })),
        sessions: sessionsResult.rows.map((row: any) => ({
            id: row.id,
            name: { fa: row.name_fa, en: row.name_en },
            description: { fa: row.description_fa, en: row.description_en },
            slides: row.slides,
            tags: row.tags || [],
            category: row.category,
            slideCount: row.slide_count,
            isPublic: row.is_public,
            isFavorite: row.is_favorite,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        })),
    };
}
